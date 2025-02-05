// === Imports ===
import { networks } from "../constants/networks";
import { createPublicClient, http, parseUnits } from "viem";
import { Papaya } from "../contracts/evm/Papaya";
import { USDT } from "../contracts/evm/USDT";
import { USDC } from "../contracts/evm/USDC";
import { PYUSD } from "../contracts/evm/PYUSD";
import { getAssets } from "../utils/index.js";
import { fetchGasCost, getChain } from "../utils/index.js";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "../config/appKit.js";

export function getTokenDetails(network, subscriptionDetails) {
  const defaultNetwork = networks.find((n) => n.chainId === 1);
  if (!defaultNetwork) {
    throw new Error(
      "Default network (Ethereum) is missing in the configuration."
    );
  }
  const defaultToken = defaultNetwork.tokens.find(
    (t) => t.name.toLowerCase() === "usdc"
  );
  if (!defaultToken) {
    throw new Error("Default token (USDC) is missing in the configuration.");
  }
  const currentNetwork =
    networks.find((n) => n.chainId === network.chainId) || defaultNetwork;
  const tokenDetails =
    currentNetwork.tokens.find(
      (t) => t.name.toLowerCase() === subscriptionDetails.token.toLowerCase()
    ) || defaultToken;

  return {
    currentNetwork,
    tokenDetails,
    isUnsupportedNetwork: false,
    isUnsupportedToken: false,
  };
}

export async function readContractData(
  contractAddress,
  abi,
  functionName,
  args,
  chainId
) {
  try {
    const data = await readContract(wagmiConfig, {
      address: contractAddress,
      abi,
      functionName,
      args,
      chainId,
    });

    return data;
  } catch (error) {
    console.error("Error reading contract data:", error);
    return null;
  }
}

export function getTokenABI(tokenName) {
  switch (tokenName.toUpperCase()) {
    case "USDT":
      return USDT;
    case "USDC":
      return USDC;
    case "PYUSD":
      return PYUSD;
    default:
      return USDC;
  }
}

export async function getNetworkFee(open, account, chainId, functionDetails) {
  if (!open || !account || !account.address) {
    return { fee: "0.000000000000 ETH", usdValue: "($0.00)" };
  }
  try {
    const chain = getChain(chainId);

    let chainPrefix = "mainnet";
    switch (chainId) {
      case 1:
        chainPrefix = "mainnet";
        break;
      case 56:
        chainPrefix = "bsc-mainnet";
        break;
      case 137:
        chainPrefix = "polygon-mainnet";
        break;
      case 43114:
        chainPrefix = "avalanche-mainnet";
        break;
      case 8453:
        chainPrefix = "base-mainnet";
        break;
      case 42161:
        chainPrefix = "arbitrum-mainnet";
        break;
      default:
        break;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(
        `https://${chainPrefix}.infura.io/v3/9f3e336d09da4444bb0a109b6dc57009`
      ),
    });

    const estimatedGas = await publicClient.estimateContractGas({
      address: functionDetails.address,
      abi: functionDetails.abi,
      functionName: functionDetails.functionName,
      args: functionDetails.args,
      account: functionDetails.account,
    });

    if (!estimatedGas) {
      return { fee: "0.000000000000 ETH", usdValue: "($0.00)" };
    }

    const gasCost = await fetchGasCost(chainId, estimatedGas);
    return gasCost;
  } catch (error) {
    console.error("Error fetching network fee:", error);
    return { fee: "0.000000000000 ETH", usdValue: "($0.00)" };
  }
}

export async function getSubscriptionInfo(
  network,
  account,
  subscriptionDetails
) {
  const { tokenDetails } = getTokenDetails(network, subscriptionDetails);

  const papayaBalance =
    (await readContractData(
      tokenDetails.papayaAddress,
      Papaya,
      "balanceOf",
      [account.address],
      network.chainId
    )) || BigInt(0);
  const allowance =
    (await readContractData(
      tokenDetails.ercAddress,
      getTokenABI(tokenDetails.name),
      "allowance",
      [account.address, tokenDetails.papayaAddress],
      network.chainId
    )) || BigInt(0);
  const tokenBalance =
    (await readContractData(
      tokenDetails.ercAddress,
      getTokenABI(tokenDetails.name),
      "balanceOf",
      [account.address],
      network.chainId
    )) || BigInt(0);

  const costBigInt = parseUnits(subscriptionDetails.cost, 18);

  const needsDeposit = papayaBalance < costBigInt;

  const depositAmount =
    papayaBalance > BigInt(0)
      ? parseUnits(subscriptionDetails.cost, 6) -
        papayaBalance / parseUnits("1", 12)
      : parseUnits(subscriptionDetails.cost, 6);

  const needsApproval = allowance == null || allowance < depositAmount;

  const hasSufficientBalance =
    tokenBalance != null && tokenBalance >= depositAmount;

  const canSubscribe = !needsDeposit && papayaBalance >= costBigInt;

  return {
    papayaBalance,
    allowance,
    tokenBalance,
    needsDeposit,
    depositAmount,
    needsApproval,
    hasSufficientBalance,
    canSubscribe,
  };
}

export async function getSubscriptionModalData(
  network,
  account,
  subscriptionDetails
) {
  const fallbackValues = {
    papayaBalance: null,
    allowance: null,
    tokenBalance: null,
    needsDeposit: false,
    depositAmount: BigInt(0),
    needsApproval: false,
    hasSufficientBalance: false,
    canSubscribe: false,
  };

  if (!network || !account) {
    return {
      chainIcon: getAssets("ethereum", "chain"),
      tokenIcon: getAssets("usdt", "token"),
      ...fallbackValues,
      tokenDetails: null,
      isUnsupportedNetwork: false,
      isUnsupportedToken: false,
    };
  }

  const nativeTokenIdMap = {
    137: "polygon",
    56: "bnb",
    43114: "avalanche",
    8453: "base",
    42161: "arbitrum",
    1: "ethereum",
  };

  const chainName =
    network && nativeTokenIdMap[network.chainId]
      ? nativeTokenIdMap[network.chainId]
      : "ethereum";

  const chainIcon =
    getAssets(chainName, "chain") || getAssets("ethereum", "chain");
  const tokenIcon =
    getAssets(subscriptionDetails.token, "token") || getAssets("usdt", "token");

  const subscriptionInfo = await getSubscriptionInfo(
    network,
    account,
    subscriptionDetails
  );
  const { tokenDetails, isUnsupportedNetwork, isUnsupportedToken } =
    getTokenDetails(network, subscriptionDetails);

  if (isUnsupportedNetwork || isUnsupportedToken) {
    return {
      chainIcon: chainIcon || getAssets("ethereum", "chain"),
      tokenIcon: tokenIcon || getAssets("usdt", "token"),
      ...fallbackValues,
      isUnsupportedNetwork,
      isUnsupportedToken,
      tokenDetails,
    };
  }

  return {
    chainIcon,
    tokenIcon,
    ...subscriptionInfo,
    isUnsupportedNetwork: false,
    isUnsupportedToken: false,
    tokenDetails,
  };
}
