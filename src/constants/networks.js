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
        papayaAddress: "0x574DeD69a731B5e19e1dD6861D1Cc33cfE7dB45c",
        tokenDecimals: 1000000,
        startBlockNumber: "0x377D398",
      },
      {
        name: "USDT",
        ercAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        papayaAddress: "0x1c3E45F2D9Dd65ceb6a644A646337015119952ff",
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
        papayaAddress: "0x574DeD69a731B5e19e1dD6861D1Cc33cfE7dB45c",
        tokenDecimals: 1000000000000000000,
        startBlockNumber: "0x25CB519",
      },
      {
        name: "USDT",
        ercAddress: "0x55d398326f99059fF775485246999027B3197955",
        papayaAddress: "0x1c3E45F2D9Dd65ceb6a644A646337015119952ff",
        tokenDecimals: 1000000000000000000,
        startBlockNumber: "0x25CB551",
      },
    ],
    nativeToken: "BNB",
    chainId: 56,
    defaultConfirmations: 2,
  },
  {
    name: "Avalanche",
    provider:
      "https://open-platform.nodereal.io/ed86a0d6126d4b27b64e1a9e0eb0d9fc/avalanche-c/ext/bc/C/rpc",
    isMainnet: true,
    tokens: [
      {
        name: "USDC",
        ercAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        papayaAddress: "0x1c3E45F2D9Dd65ceb6a644A646337015119952ff",
        tokenDecimals: 1000000000000000000,
        startBlockNumber: "0x2C9416B",
      },
      {
        name: "USDT",
        ercAddress: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
        papayaAddress: "0x574DeD69a731B5e19e1dD6861D1Cc33cfE7dB45c",
        tokenDecimals: 1000000000000000000,
        startBlockNumber: "0x2C94010",
      },
    ],
    nativeToken: "AVAX",
    chainId: 43114,
    defaultConfirmations: 2,
  },
  {
    name: "Base",
    provider:
      "https://open-platform.nodereal.io/9e21b0f196c6428dbf4362a87a198758/base",
    isMainnet: true,
    tokens: [
      {
        name: "USDC",
        ercAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        papayaAddress: "0x574DeD69a731B5e19e1dD6861D1Cc33cfE7dB45c",
        tokenDecimals: 1000000,
        startBlockNumber: "0xF1818D",
      },
    ],
    nativeToken: "ETH",
    chainId: 8453,
    defaultConfirmations: 1,
  },
  {
    name: "ArbitrumOne",
    provider: "https://arb1.arbitrum.io/rpc",
    isMainnet: true,
    tokens: [
      {
        name: "USDC",
        ercAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        papayaAddress: "0x574DeD69a731B5e19e1dD6861D1Cc33cfE7dB45c",
        tokenDecimals: 1000000,
        startBlockNumber: "0xD3C97DA",
      },
      {
        name: "USDT",
        ercAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        papayaAddress: "0x1c3E45F2D9Dd65ceb6a644A646337015119952ff",
        tokenDecimals: 1000000,
        startBlockNumber: "0xD3C9A0E",
      },
    ],
    nativeToken: "ETH",
    chainId: 42161,
    defaultConfirmations: 1,
  },
  {
    name: "Ethereum",
    provider:
      "https://eth-mainnet.nodereal.io/v1/dc0cef7107574ca88e424ec44c4bfff6",
    isMainnet: true,
    tokens: [
      {
        name: "USDC",
        ercAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        papayaAddress: "0x1c3E45F2D9Dd65ceb6a644A646337015119952ff",
        tokenDecimals: 1000000,
        startBlockNumber: "0x132C577",
      },
      {
        name: "USDT",
        ercAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        papayaAddress: "0xb8fD71A4d29e2138056b2a309f97b96ec2A8EeD7",
        tokenDecimals: 1000000,
        startBlockNumber: "0x132C582",
      },
    ],
    nativeToken: "ETH",
    chainId: 1,
    defaultConfirmations: 2,
  },
];
