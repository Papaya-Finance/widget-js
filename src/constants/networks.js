export const networks = [
  {
    name: "Polygon",
    provider:
      "https://polygon-mainnet.nodereal.io/v1/7f14d2882c7e4f9397c846ddbd6f79e3",
    isMainnet: true,
    tokens: [
      {
        name: "USDC",
        ercAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        papayaAddress: "0xb8fD71A4d29e2138056b2a309f97b96ec2A8EeD7",
        tokenDecimals: 1000000,
        startBlockNumber: "0x377D398",
      },
      {
        name: "USDT",
        ercAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        papayaAddress: "0xD3B79811fFb55708A4fe848D0b131030a347887C",
        tokenDecimals: 1000000,
        startBlockNumber: "0x377D3BE",
      },
    ],
    nativeToken: "POL",
    chainId: 137,
    defaultConfirmations: 6,
  },
  {
    name: "Binance Smart Chain",
    provider:
      "https://bsc-mainnet.nodereal.io/v1/a1bccec11936475a9c70b39efa227fea",
    isMainnet: true,
    tokens: [
      {
        name: "USDC",
        ercAddress: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
        papayaAddress: "0xD3B79811fFb55708A4fe848D0b131030a347887C",
        tokenDecimals: 1000000000000000000,
        startBlockNumber: "0x25CB519",
      },
      {
        name: "USDT",
        ercAddress: "0x55d398326f99059fF775485246999027B3197955",
        papayaAddress: "0xB9BE933e8a17dc0d9bf69aFE9E91C54330CF6dF4",
        tokenDecimals: 1000000000000000000,
        startBlockNumber: "0x25CB551",
      },
    ],
    nativeToken: "BNB",
    chainId: 56,
    defaultConfirmations: 2,
  },
];
