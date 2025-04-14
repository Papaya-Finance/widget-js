// === Imports ===
import { networks } from "../constants/networks";
import { createPublicClient, http, parseUnits } from "viem";
import { Papaya } from "../contracts/evm/Papaya";
import { USDT } from "../contracts/evm/USDT";
import { USDC } from "../contracts/evm/USDC";
import { calculateSubscriptionRate, getAssets } from "../utils/index.js";
import { fetchGasCost, getChain } from "../utils/index.js";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "../config/appKit.js";

export function getTokenDetails(network, subscriptionDetails) {
  const defaultNetwork = networks.find((n) => n.chainId === 137);
  if (!defaultNetwork) {
    throw new Error(
      "Default network (Polygon) is missing in the configuration."
    );
  }
  const defaultToken = defaultNetwork.tokens.find(
    (t) => t.name.toLowerCase() === "usdt"
  );
  if (!defaultToken) {
    throw new Error("Default token (USDT) is missing in the configuration.");
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
    default:
      return USDT;
  }
}

export async function getNetworkFee(open, account, chainId, functionDetails) {
  if (!open || !account || !account.address) {
    return { fee: "0.000000000000 POL", usdValue: "($0.00)" };
  }
  try {
    const chain = getChain(chainId);

    let chainPrefix = "polygon-mainnet";
    switch (chainId) {
      case 56:
        chainPrefix = "bsc-mainnet";
        break;
      case 137:
        chainPrefix = "polygon-mainnet";
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
      return { fee: "0.000000000000 POL", usdValue: "($0.00)" };
    }

    const gasCost = await fetchGasCost(chainId, estimatedGas);
    return gasCost;
  } catch (error) {
    console.error("Error fetching network fee:", error);
    return { fee: "0.000000000000 POL", usdValue: "($0.00)" };
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

  // Convert subscription cost (human-readable, e.g. "0.99") to token units (6 decimals)
  const subscriptionCostTokenUnits = parseUnits(subscriptionDetails.cost, 6);
  // Convert that cost to 18 decimals (multiply by 1e12)
  const subscriptionCost18 = subscriptionCostTokenUnits * BigInt(1e12);

  // Calculate the subscription rate (in 18 decimals per second)
  const subscriptionRate18 = calculateSubscriptionRate(
    subscriptionCost18,
    subscriptionDetails.payCycle
  );

  // Define the safe liquidation period (2 days in seconds)
  const SAFE_LIQUIDATION_PERIOD_SECONDS = BigInt(172800);
  // Compute the safety buffer (in 18 decimals) covering the safe liquidation period
  const safetyBuffer18 = subscriptionRate18 * SAFE_LIQUIDATION_PERIOD_SECONDS;
  // Total required deposit in 18 decimals = subscription cost + safety buffer
  const requiredDeposit18 = subscriptionCost18 + safetyBuffer18;
  // Convert the required deposit into token units (6 decimals)
  const requiredDepositTokenUnits = requiredDeposit18 / BigInt(1e12);

  // Determine if a deposit is needed.
  // Note: papayaBalance is in 18 decimals.
  const needsDeposit = papayaBalance < requiredDeposit18;

  // Calculate how much deposit is missing in token units (6 decimals).
  // Convert existing Papaya balance (18 decimals) to token units by dividing by 1e12
  const currentDepositTokenUnits =
    papayaBalance > BigInt(0) ? papayaBalance / parseUnits("1", 12) : BigInt(0);
  const depositShortfallTokenUnits =
    currentDepositTokenUnits >= requiredDepositTokenUnits
      ? BigInt(0)
      : requiredDepositTokenUnits - currentDepositTokenUnits;

  // Determine if approval is needed (allowance is in token units)
  const needsApproval =
    allowance == null || allowance < depositShortfallTokenUnits;

  // Determine if the user can subscribe:
  // - If no deposit is needed: Papaya balance (18 decimals) must be at least the required deposit.
  // - If deposit is needed: the user's token balance (6 decimals) must cover the deposit shortfall.
  const canSubscribe =
    (!needsDeposit && papayaBalance >= requiredDeposit18) ||
    (needsDeposit &&
      tokenBalance != null &&
      tokenBalance >= depositShortfallTokenUnits);

  return {
    papayaBalance, // in 18 decimals
    allowance, // in token units (6 decimals)
    tokenBalance, // in token units (6 decimals)
    needsDeposit,
    depositAmount: depositShortfallTokenUnits, // in token units (6 decimals)
    needsApproval,
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
      chainIcon: getAssets("polygon", "chain"),
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
  };

  const chainName =
    network && nativeTokenIdMap[network.chainId]
      ? nativeTokenIdMap[network.chainId]
      : "polygon";

  const chainIcon =
    getAssets(chainName, "chain") || getAssets("polygon", "chain");
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
      chainIcon: chainIcon || getAssets("polygon", "chain"),
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
