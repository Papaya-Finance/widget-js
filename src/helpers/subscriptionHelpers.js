// src/helpers/subscriptionHelpers.js

// === Imports ===
import axios from "axios";
import { networks } from "../constants/networks";
import { SubscriptionPayCycle } from "../constants/enums";
import { Abi, Address, createPublicClient, http, parseUnits } from "viem";
import * as chains from "viem/chains";
import { Papaya } from "../contracts/evm/Papaya";
import { USDT } from "../contracts/evm/USDT";
import { USDC } from "../contracts/evm/USDC";
import { PYUSD } from "../contracts/evm/PYUSD";
import { getAssets } from "../utils/index.js"; // For asset management
import { fetchGasCost, getChain } from "../utils/index.js"; // From your utils

// --- 1. Token Details Helper ---
// This function replaces useTokenDetails (without React hooks)
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

  // In this vanilla version, we assume valid details so unsupported flags are false.
  return {
    currentNetwork,
    tokenDetails,
    isUnsupportedNetwork: false,
    isUnsupportedToken: false,
  };
}

// --- 2. Contract Data Reader ---
// A stub function replacing useContractData.
// Replace this with your actual contract reading logic as needed.
export async function readContractData(
  contractAddress,
  abi,
  functionName,
  args
) {
  // For now, return null; in production, call your blockchain read function.
  return null;
}

// --- 3. Token ABI Helper ---
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

// --- 4. Network Fee Calculation ---
// This function replaces useNetworkFee by returning a Promise that resolves
// with the fee information.
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

// --- 6. Subscription Info ---
// This function replaces useSubscriptionInfo. It calls getTokenDetails and then
// (stubbed) contract reads to compute deposit, approval, and subscription conditions.
export async function getSubscriptionInfo(
  network,
  account,
  subscriptionDetails
) {
  const { tokenDetails } = getTokenDetails(network, subscriptionDetails);

  // Read contract data (using stubs here; replace with actual reads as needed)
  const papayaBalance =
    (await readContractData(tokenDetails.papayaAddress, Papaya, "balanceOf", [
      account.address,
    ])) || BigInt(0);
  const allowance =
    (await readContractData(
      tokenDetails.ercAddress,
      getTokenABI(tokenDetails.name),
      "allowance",
      [account.address, tokenDetails.papayaAddress]
    )) || BigInt(0);
  const tokenBalance =
    (await readContractData(
      tokenDetails.ercAddress,
      getTokenABI(tokenDetails.name),
      "balanceOf",
      [account.address]
    )) || BigInt(0);

  const costBigInt = parseUnits(subscriptionDetails.cost, 18);
  const needsDeposit = papayaBalance < costBigInt;
  const depositAmount =
    papayaBalance > BigInt(0)
      ? parseUnits(subscriptionDetails.cost, 6) -
        papayaBalance / parseUnits("1", 12) +
        parseUnits("0.01", 6)
      : parseUnits(subscriptionDetails.cost, 6);
  const needsApproval = allowance < depositAmount;
  const hasSufficientBalance = tokenBalance >= depositAmount;
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

// --- 7. Subscription Modal Data ---
// This function replaces useSubscriptionModal by combining asset icons and subscription info.
export async function getSubscriptionModalData(
  network,
  account,
  subscriptionDetails
) {
  const nativeTokenIdMap = {
    137: "polygon",
    56: "bnb",
    43114: "avalanche",
    8453: "base",
    42161: "arbitrum",
    1: "ethereum",
  };

  const chainName = nativeTokenIdMap[network.chainId] || "ethereum";

  const chainIcon = getAssets(chainName, "chain");
  const tokenIcon = getAssets(subscriptionDetails.token, "token");

  const subscriptionInfo = await getSubscriptionInfo(
    network,
    account,
    subscriptionDetails
  );

  // Fallback values if needed
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

  const { tokenDetails, isUnsupportedNetwork, isUnsupportedToken } =
    getTokenDetails(network, subscriptionDetails);

  if (isUnsupportedNetwork || isUnsupportedToken) {
    return {
      chainIcon: chainIcon || "",
      tokenIcon: tokenIcon || "",
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
