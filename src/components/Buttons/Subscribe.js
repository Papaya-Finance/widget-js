import {
  writeContract,
  waitForTransactionReceipt,
  simulateContract,
} from "@wagmi/core";
import { papayaProjectId, wagmiConfig } from "../../config/appKit";
import {
  getReadableErrorMessage,
  calculateSubscriptionRate,
} from "../../utils";
import { encodeFunctionData } from "viem";

/**
 * Factory function to create a combined Deposit & Subscribe button form.
 *
 * Options:
 * - chainId: number (chain id)
 * - needsDeposit: boolean (if a deposit is required)
 * - canSubscribe: boolean (if the subscription can proceed)
 * - abi: the ABI of the Papaya contract
 * - toAddress: subscription destination address
 * - subscriptionCost: bigint (the cost in 18-decimal units)
 * - subscriptionCycle: string or number (pay cycle)
 * - papayaAddress: string (Papaya contract address)
 * - depositAmount: bigint (the deposit shortfall in token units; 6 decimals)
 * - onSuccess: callback when transaction confirms
 * - onError: callback on error, receives (title, description)
 *
 * @returns {HTMLElement} The button element.
 */
function createSubscribeButton({
  chainId,
  needsDeposit,
  canSubscribe,
  abi,
  toAddress,
  subscriptionCost,
  subscriptionCycle,
  papayaAddress,
  depositAmount,
  onSuccess = () => {},
  onError = () => {},
}) {
  // Internal state variables
  let isProcessing = false;
  let isPending = false;
  let isConfirmed = false;

  const button = document.createElement("button");
  button.className = "subscribe-button";

  function renderButtonContent() {
    button.innerHTML = "";
    if (isProcessing || isPending) {
      const spinnerContainer = document.createElement("div");
      spinnerContainer.className = "spinner-container";

      const spinner = document.createElement("div");
      spinner.className = "spinner";

      const text = document.createElement("p");
      text.className = "button-text";
      text.textContent = "Processing...";

      spinnerContainer.appendChild(spinner);
      spinnerContainer.appendChild(text);
      button.appendChild(spinnerContainer);
    } else {
      const text = document.createElement("p");
      text.className = "button-text";
      text.textContent = needsDeposit ? "Deposit & Subscribe" : "Subscribe";
      button.appendChild(text);
    }

    // Disable if transaction is confirmed or subscription cannot proceed
    if (isConfirmed || !canSubscribe) {
      button.disabled = true;
      button.classList.add("disabled");
    } else {
      button.disabled = false;
      button.classList.remove("disabled");
    }
  }

  function updateUI() {
    renderButtonContent();
  }

  updateUI();

  async function handleClick(e) {
    e.preventDefault();
    if (!canSubscribe) return;

    isProcessing = true;
    updateUI();

    try {
      // Calculate subscription rate using your helper (cost in 18 decimals and pay cycle)
      const subscriptionRate = calculateSubscriptionRate(
        subscriptionCost,
        subscriptionCycle
      );

      if (needsDeposit) {
        const depositCallData = encodeFunctionData({
          abi,
          functionName: "deposit",
          args: [depositAmount, false],
        });

        const subscribeCallData = encodeFunctionData({
          abi,
          functionName: "subscribe",
          args: [
            toAddress,
            subscriptionRate,
            papayaProjectId == undefined ? BigInt(0) : BigInt(papayaProjectId),
          ],
        });

        const combinedCalls = [depositCallData, subscribeCallData];

        const txHash = await writeContract(wagmiConfig, {
          abi,
          address: papayaAddress,
          functionName: "multicall",
          args: [combinedCalls],
          chainId,
        });

        await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId });
      } else {
        // Only subscribe branch
        const { request } = await simulateContract(wagmiConfig, {
          abi,
          address: papayaAddress,
          functionName: "subscribe",
          args: [
            toAddress,
            subscriptionRate,
            papayaProjectId == undefined ? BigInt(0) : BigInt(papayaProjectId),
          ],
          chainId,
        });

        const txHash = await writeContract(wagmiConfig, request);

        await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId });
      }

      isConfirmed = true;
      onSuccess();
    } catch (error) {
      if (
        !(
          error &&
          error.message &&
          error.message.includes("User rejected the request")
        )
      ) {
        onError("Failed to subscribe", getReadableErrorMessage(error));
      }
    } finally {
      isProcessing = false;
      isPending = false;
      updateUI();
    }
  }

  button.addEventListener("click", handleClick);
  return button;
}

export { createSubscribeButton };
