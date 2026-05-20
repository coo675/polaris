export interface WalletSession {
  address: string;
  keystoreJson: string;
  derivationPath: string;
  label: string;
}

export interface PolarisMessage {
  id: string;
  role: "user" | "polaris";
  text: string;
  ts: number;
}
