# Polaris 极蓝

蓝白简约 **AI 安全自托管**网页钱包。基于 [@consenlabs/tcx-wasm](https://www.npmjs.com/package/@consenlabs/tcx-wasm) 本地建库、派生与 EVM 转账签名；内置端侧 **极蓝智伴** 自然语言导航与安全预检。

## 功能

- 创建钱包：点击「随机生成助记词」→ 设置密码
- 首页：资产总览、智能 Gas 推荐、场景提示
- 智伴：自然语言查余额 / 解析转账 / Gas 建议
- 转账：安全预检 + `sign_tx` 广播（默认 Sepolia）
- 安全中心：守则 + [token-ui/security](https://github.com/consenlabs/token-ui/tree/main/security) 链接

## 本地运行

```bash
cd wallets/polaris
npm install
npm run dev
```

打开 http://127.0.0.1:5183

## 构建

```bash
npm run build
npm run build:pages   # GitHub Pages /polaris/
```

## 参考

- [token-core-monorepo](https://github.com/consenlabs/token-core-monorepo)
- [token-ui](https://github.com/consenlabs/token-ui)
