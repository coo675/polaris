import { Wallet } from "ethers";
import type { ChainNode } from "./chains";
import type { WalletSession } from "../types";
import { normalizeAddr, normalizePk } from "./utils";
import { broadcastRaw, parseAmount } from "./rpc";
import {
  ETH_PATH,
  cache_keystore,
  clear_cached_keystore,
  create_keystore,
  derive_accounts,
  export_mnemonic,
  initTcxWasm,
  sign_tx,
} from "./tcxWasm";

const SESSION_KEY = "polaris-session";
const CHAIN_KEY = "polaris-chain";
const CHAT_KEY = "polaris-chat";

export async function ensureWasm(): Promise<void> {
  await initTcxWasm();
}

export function loadSession(): WalletSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as WalletSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: WalletSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  clear_cached_keystore();
}

export function loadChainId(): string | null {
  return localStorage.getItem(CHAIN_KEY);
}

export function saveChainId(id: string): void {
  localStorage.setItem(CHAIN_KEY, id);
}

export function loadChatHistory(): string | null {
  return localStorage.getItem(CHAT_KEY);
}

export function saveChatHistory(json: string): void {
  localStorage.setItem(CHAT_KEY, json);
}

export async function generateMnemonicPhrase(): Promise<string> {
  await ensureWasm();
  const tempPass = crypto.randomUUID();
  const entropy = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const keystoreJson = create_keystore(
    JSON.stringify({ password: tempPass, entropy, network: "MAINNET" })
  );
  const { mnemonic } = JSON.parse(
    export_mnemonic(JSON.stringify({ keystoreJson, key: tempPass }))
  ) as { mnemonic: string };
  clear_cached_keystore();
  if (!mnemonic?.trim()) throw new Error("助记词生成失败");
  return mnemonic.trim();
}

async function deriveAddress(keystoreJson: string, password: string, chain: ChainNode): Promise<string> {
  await ensureWasm();
  cache_keystore(keystoreJson);
  const accounts = JSON.parse(
    derive_accounts(
      JSON.stringify({
        key: password,
        derivations: [
          {
            chain: chain.tcxChain,
            derivationPath: ETH_PATH,
            chainId: chain.chainId,
            network: chain.tcxNetwork,
          },
        ],
      })
    )
  ) as { address: string }[];
  const addr = accounts[0]?.address;
  if (!addr) throw new Error("地址派生失败");
  return addr;
}

export async function createFromMnemonic(
  password: string,
  mnemonic: string,
  chain: ChainNode,
  label = "主钱包"
): Promise<WalletSession> {
  await ensureWasm();
  const keystoreJson = create_keystore(
    JSON.stringify({ password, mnemonic: mnemonic.trim(), network: chain.tcxNetwork })
  );
  if (keystoreJson.includes('"error"')) {
    throw new Error((JSON.parse(keystoreJson) as { error?: string }).error || "创建失败");
  }
  const address = await deriveAddress(keystoreJson, password, chain);
  const session = { address, keystoreJson, derivationPath: ETH_PATH, label };
  saveSession(session);
  return session;
}

export async function importPrivateKey(
  password: string,
  privateKeyHex: string,
  _chain: ChainNode,
  label = "导入钱包"
): Promise<WalletSession> {
  const pk = normalizePk(privateKeyHex);
  const w = new Wallet(pk);
  const keystoreJson = await w.encrypt(password);
  const session = { address: w.address, keystoreJson, derivationPath: ETH_PATH, label };
  saveSession(session);
  return session;
}

export async function importKeystoreJson(
  keystoreJson: string,
  password: string,
  chain: ChainNode,
  label = "JSON 钱包"
): Promise<WalletSession> {
  JSON.parse(keystoreJson.trim());
  const address = await deriveAddress(keystoreJson.trim(), password, chain);
  const session = {
    address,
    keystoreJson: keystoreJson.trim(),
    derivationPath: ETH_PATH,
    label,
  };
  saveSession(session);
  return session;
}

export async function signTransfer(
  session: WalletSession,
  password: string,
  chain: ChainNode,
  to: string,
  amount: string,
  gasPrice: string,
  broadcast: boolean
): Promise<{ raw: string; txHash?: string }> {
  if (!chain.rpcUrl || !chain.chainId) throw new Error("当前网络不支持签名转账");
  await ensureWasm();
  cache_keystore(session.keystoreJson);
  const value = parseAmount(amount).toString();
  const nonceRes = await fetch(chain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionCount",
      params: [session.address, "pending"],
    }),
  });
  const nonceJson = (await nonceRes.json()) as { result?: string };
  const nonce = BigInt(nonceJson.result || "0").toString();
  const signed = JSON.parse(
    sign_tx(
      JSON.stringify({
        key: password,
        chain: chain.tcxChain,
        derivationPath: session.derivationPath,
        input: {
          nonce,
          gasPrice,
          gasLimit: "21000",
          to: normalizeAddr(to),
          value,
          data: "0x",
          chainId: chain.chainId,
        },
      })
    )
  ) as { signedTransaction?: string; rawTransaction?: string; signature?: string };
  const raw =
    signed.signedTransaction || signed.rawTransaction || signed.signature || "";
  if (!raw) throw new Error("签名失败");
  const tx = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!broadcast) return { raw: tx };
  return { raw: tx, txHash: await broadcastRaw(chain, tx) };
}
