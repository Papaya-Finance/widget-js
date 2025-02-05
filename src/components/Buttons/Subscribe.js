// src/components/Buttons/Subscribe.js

import {
  writeContract,
  waitForTransactionReceipt,
  simulateContract,
} from "@wagmi/core";
import { wagmiConfig } from "../../config/appKit";
import {
  getReadableErrorMessage,
  calculateSubscriptionRate,
} from "../../utils";

/**
 * Factory function to create a Subscribe button form.
 *
 * @param {Object} options - Configuration options.
 * @param {number} options.chainId - The chain id.
 * @param {boolean} options.needsDeposit - Whether deposit is needed (affects UI).
 * @param {boolean} options.canSubscribe - Whether the subscription can proceed.
 * @param {Object} options.abi - The ABI of the Papaya contract.
 * @param {string} options.toAddress - The destination address for the subscription.
 * @param {bigint} options.subscriptionCost - The subscription cost (in units parsed via parseUnits).
 * @param {string|number} options.subscriptionCycle - The subscription pay cycle.
 * @param {string} options.papayaAddress - The Papaya contract address.
 * @param {function} [options.onSuccess] - Callback invoked upon successful subscription.
 * @param {function} [options.onError] - Callback invoked upon error; receives (title, description).
 *
 * @returns {HTMLElement} - The form element containing the Subscribe button.
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
      text.textContent = "Subscribe";
      button.appendChild(text);
    }

    if (isConfirmed || !canSubscribe) {
      button.disabled = true;
      button.classList.add("disabled");
    } else {
      button.classList.remove("hidden");
    }

    if (needsDeposit) {
      button.classList.add("hidden");
    } else {
      button.classList.remove("hidden");
    }
  }

  function updateUI() {
    if (isConfirmed || !canSubscribe || isProcessing || isPending) {
      button.disabled = true;
      button.classList.add("disabled");
    } else {
      button.disabled = false;
      button.classList.remove("disabled");
    }

    renderButtonContent();
  }

  updateUI();

  async function handleClick(e) {
    e.preventDefault();

    console.log("1");

    if (!canSubscribe) return;

    console.log("2");

    isProcessing = true;
    updateUI();

    console.log("3");

    try {
      console.log("4");
      const subscriptionRate = calculateSubscriptionRate(
        subscriptionCost,
        subscriptionCycle
      );

      console.log("5");

      const { request } = await simulateContract(wagmiConfig, {
        abi,
        address: papayaAddress,
        functionName: "subscribe",
        args: [toAddress, subscriptionRate, 0],
        chainId,
      });

      console.log("6", request);

      const txHash = await writeContract(wagmiConfig, request);

      console.log("7", txHash);

      await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash,
        chainId,
      });

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
