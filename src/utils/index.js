// === Imports ===
import { networks } from "../constants/networks";
import axios from "axios";
// Chain Icons
import EthereumIcon from "../assets/chains/ethereum.svg";
import BnbIcon from "../assets/chains/bnb.svg";
import PolygonIcon from "../assets/chains/polygon.svg";
import AvalancheIcon from "../assets/chains/avalanche.svg";
import ArbitrumIcon from "../assets/chains/arbitrum.svg";
import BaseIcon from "../assets/chains/base.svg";
// Token Icons
import UsdtIcon from "../assets/tokens/usdt.svg";
import UsdcIcon from "../assets/tokens/usdc.svg";
import PyusdIcon from "../assets/tokens/pyusd.svg";
import { SubscriptionPayCycle } from "../constants/enums";
import { Chain, parseUnits } from "viem";
import * as chains from "viem/chains";

// === Chain Icons Map ===
const chainIcons = {
  polygon: PolygonIcon,
  bnb: BnbIcon,
  avalanche: AvalancheIcon,
  base: BaseIcon,
  arbitrum: ArbitrumIcon,
  ethereum: EthereumIcon,
};

// === Token Icons Map ===
const tokenIcons = {
  usdt: UsdtIcon,
  usdc: UsdcIcon,
  pyusd: PyusdIcon,
};

// === Formatting Utilities ===

/**
 * Format token amounts to a fixed decimal place.
 * @param {number} amount
 * @param {number} [decimals=2]
 * @returns {string}
 */
export const formatTokenAmount = (amount, decimals = 2) => {
  return amount.toFixed(decimals);
};

/**
 * Format a price in USD.
 * @param {number} price
 * @returns {string}
 */
export const formatPrice = (price) => {
  return `$${price.toFixed(2)}`;
};

/**
 * Format a network fee with a native token.
 * @param {number} fee
 * @param {string} nativeToken
 * @returns {string}
 */
export const formatNetworkFee = (fee, nativeToken) => {
  return `${fee.toFixed(6)} ${nativeToken}`;
};

// === Asset Management ===

/**
 * Get the icon for a chain or token.
 * @param {string} key - The chain or token name.
 * @param {"chain"|"token"} type - Type of asset.
 * @returns {string} Icon path or empty string if not found.
 */
export const getAssets = (key, type) => {
  const lowerKey = key.toLowerCase();
  if (type === "chain") {
    return chainIcons[lowerKey] || "";
  } else if (type === "token") {
    return tokenIcons[lowerKey] || "";
  }
  console.error(`Invalid asset type: ${type}`);
  return "";
};

// === API Utilities ===

/**
 * Fetch the price of a native token from CoinGecko.
 * @param {string} tokenId
 * @returns {Promise<number>}
 */
export const fetchTokenPrice = async (tokenId) => {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`;
    const response = await axios.get(url);

    if (response.data[tokenId] && response.data[tokenId].usd) {
      return response.data[tokenId].usd;
    } else {
      throw new Error(`Failed to fetch price for token: ${tokenId}`);
    }
  } catch (error) {
    console.error(`Error fetching token price for ${tokenId}:`, error);
    return 0; // Return 0 as fallback
  }
};

/**
 * Fetches the current gas price for a given chain from Infura's Gas API.
 * @param {number} chainId The chain ID of the network.
 * @returns {Promise<{ gasPrice: string; nativeToken: string }|null>}
 */
export const fetchNetworkFee = async (chainId) => {
  const network = networks.find((n) => n.chainId === chainId);
  if (!network) {
    console.warn(`Unsupported chain ID: ${chainId}, defaulting to Ethereum`);
    return {
      gasPrice: "0",
      nativeToken: "ETH",
    };
  }

  try {
    const url = `https://gas.api.infura.io/v3/9f3e336d09da4444bb0a109b6dc57009/networks/${chainId}/suggestedGasFees`;
    const { data } = await axios.get(url);

    // Extract the medium gas fee estimate
    const mediumGasPrice = data?.medium?.suggestedMaxFeePerGas;
    if (!mediumGasPrice) {
      console.warn("No medium gas price available");
      return null;
    }

    return {
      gasPrice: mediumGasPrice, // Returns Gwei directly
      nativeToken: network.nativeToken,
    };
  } catch (error) {
    console.error("Error fetching gas price from Infura:", error);
    return {
      gasPrice: "0",
      nativeToken: network.nativeToken,
    };
  }
};

const gasCostCache = {};

/**
 * Calculates the gas cost for a specific function execution.
 * @param {number} chainId The chain ID of the network.
 * @param {bigint} estimatedGas The estimated gas units for the function execution.
 * @param {number} [cacheDurationMs=60000] Cache duration in ms.
 * @returns {Promise<{ fee: string; usdValue: string }|null>}
 */
export const fetchGasCost = async (
  chainId,
  estimatedGas,
  cacheDurationMs = 60000
) => {
  try {
    const networkFee = await fetchNetworkFee(chainId);
    if (!networkFee) {
      throw new Error("Failed to fetch gas price");
    }

    const { gasPrice, nativeToken } = networkFee;
    if (gasPrice === "0") {
      return { fee: `0.000000000000 ${nativeToken}`, usdValue: "($0.00)" };
    }

    const gasPriceInWei = parseUnits(gasPrice, 9);
    const gasCostInNativeToken = estimatedGas * gasPriceInWei;
    const gasCostInNativeTokenAsNumber = Number(gasCostInNativeToken) / 1e18;

    const fee = `${gasCostInNativeTokenAsNumber.toFixed(12)} ${nativeToken}`;

    const now = Date.now();
    let usdValue = gasCostCache[chainId]?.usdValue || "($0.00)";

    if (
      !gasCostCache[chainId] ||
      now - gasCostCache[chainId].timestamp > cacheDurationMs
    ) {
      const nativeTokenIdMap = {
        137: "matic-network",
        43114: "avalanche-2",
        8453: "ethereum",
        42161: "ethereum",
        1: "ethereum",
      };

      const tokenId = nativeTokenIdMap[chainId] || "ethereum";
      if (!tokenId) {
        throw new Error(`Token ID not found for chain ID: ${chainId}`);
      }

      const rawNativeTokenPrice = await fetchTokenPrice(tokenId);
      const nativeTokenPriceInWei = parseUnits(
        rawNativeTokenPrice.toString(),
        18
      );
      const gasCostInUsdBigInt =
        (gasCostInNativeToken * nativeTokenPriceInWei) / BigInt(1e18);
      const gasCostInUsd = Number(gasCostInUsdBigInt) / 1e18;

      usdValue = `(~$${gasCostInUsd.toFixed(2)})`;

      gasCostCache[chainId] = { usdValue, timestamp: now };
    }

    return { fee, usdValue };
  } catch (error) {
    console.error("Error calculating gas cost:", error);
    return { fee: "0.000000000000 ETH", usdValue: "($0.00)" };
  }
};

/**
 * Returns the Papaya contract address for a specific chain.
 * @param {number} chainId The chain ID of the connected blockchain network.
 * @returns {string|null} Papaya contract address or null if not found.
 */
export const getPapayaAddress = (chainId) => {
  const network = networks.find((n) => n.chainId === chainId);
  if (!network) {
    console.error(`Unsupported chain ID: ${chainId}`);
    return null;
  }
  const papayaAddress =
    network.tokens && network.tokens[0] && network.tokens[0].papayaAddress;
  if (!papayaAddress) {
    console.error(`No Papaya contract address found for chain ID: ${chainId}`);
    return null;
  }
  return papayaAddress;
};

/**
 * Calculate the subscription rate based on cost and pay cycle.
 * @param {string|bigint} subscriptionCost The cost with 18 decimals.
 * @param {SubscriptionPayCycle} payCycle The payment cycle ("/daily", "/weekly", "/monthly", "/yearly").
 * @returns {bigint} The calculated subscription rate.
 */
export const calculateSubscriptionRate = (subscriptionCost, payCycle) => {
  const cost = BigInt(subscriptionCost);
  const timeDurations = {
    "/daily": BigInt(24 * 60 * 60),
    "/weekly": BigInt(7 * 24 * 60 * 60),
    "/monthly": BigInt(30 * 24 * 60 * 60),
    "/yearly": BigInt(365 * 24 * 60 * 60),
  };
  return cost / timeDurations[payCycle];
};

/**
 * Returns a Chain object for a given chainId.
 * @param {number} chainId
 * @returns {Chain} The chain from viem/chains.
 */
export const getChain = (chainId) => {
  const chain = Object.values(chains).find((c) => c.id === chainId);
  if (!chain) {
    console.warn(`Chain with id ${chainId} not found, defaulting to Ethereum`);
    return chains.mainnet;
  }
  return chain;
};

/**
 * Returns a human-readable error message from an error object.
 * @param {any} error
 * @returns {string} A human-readable error message.
 */
export const getReadableErrorMessage = (error) => {
  if (!error || typeof error !== "object") {
    return "An unknown error occurred.";
  }

  if (error.message?.includes("User rejected the request")) {
    return "The transaction was rejected by the user.";
  }

  if (error.message?.includes("insufficient funds")) {
    return "The account has insufficient funds to complete this transaction.";
  }

  if (error.message?.includes("gas required exceeds allowance")) {
    return "The transaction requires more gas than allowed.";
  }

  if (error.message?.includes("execution reverted")) {
    return "The transaction was reverted by the contract. Check the input or contract state.";
  }

  if (error.message?.includes("network error")) {
    return "A network error occurred. Please check your internet connection.";
  }

  if (error.message?.includes("chain mismatch")) {
    return "You are connected to the wrong network. Please switch to the correct chain.";
  }

  if (error.message?.includes("invalid address")) {
    return "An invalid address was provided. Please check the input.";
  }

  if (error.message?.includes("unsupported ABI")) {
    return "The provided ABI is not supported.";
  }

  if (error.message?.includes("provider error")) {
    return "An error occurred with the wallet provider. Please try again.";
  }

  if (error.message?.includes("contract not deployed")) {
    return "The contract is not deployed on the selected network.";
  }

  if (error.message?.includes("max nonce")) {
    return "The nonce for the transaction exceeds the allowed limit.";
  }

  if (error.message?.includes("invalid signature")) {
    return "The transaction signature is invalid. Please try signing again.";
  }

  if (error.message?.includes("timeout")) {
    return "The transaction request timed out. Please try again.";
  }

  if (error.message?.includes("failed to fetch")) {
    return "Failed to connect to the blockchain. Please check your network and try again.";
  }

  if (error.message?.includes("call exception")) {
    return "A call exception occurred. The contract may not support the called function.";
  }

  if (error.message?.includes("unknown error")) {
    return "An unknown error occurred. Please try again later.";
  }

  return "An error occurred during the transaction. Please check the details and try again.";
};
