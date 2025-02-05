// src/components/Buttons/Subscribe.js

import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
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
  // Local state variables
  let isProcessing = false;
  let isPending = false;
  let isConfirmed = false;

  // Create the form element
  const form = document.createElement("form");
  form.style.width = "100%";

  // Create the button element
  const button = document.createElement("button");
  button.type = "submit";
  button.className = "subscribe-button";

  // Function to render the button content based on the state
  function renderButtonContent() {
    button.innerHTML = "";
    if (isProcessing || isPending) {
      // Show a spinner and processing text
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
      // Show normal subscribe text
      const text = document.createElement("p");
      text.className = "button-text";
      text.textContent = "Subscribe";
      button.appendChild(text);
    }
  }

  // Function to update the UI state (disable/enable button and render content)
  function updateUI() {
    if (!canSubscribe || isProcessing || isPending) {
      button.disabled = true;
      button.classList.add("disabled");
    } else {
      button.disabled = false;
      button.classList.remove("disabled");
    }
    renderButtonContent();
  }

  // Initial UI update
  updateUI();

  // Form submit handler
  async function submit(e) {
    e.preventDefault();
    if (!canSubscribe) return;

    isProcessing = true;
    updateUI();

    try {
      // Calculate the subscription rate using the provided helper.
      // The subscriptionCost is expected to be a bigint already parsed (e.g. using parseUnits)
      const subscriptionRate = calculateSubscriptionRate(
        subscriptionCost,
        subscriptionCycle
      );

      // Call the subscribe function on the Papaya contract.
      const tx = await writeContract({
        abi,
        address: papayaAddress,
        functionName: "subscribe",
        args: [toAddress, subscriptionRate, 0],
        chainId,
      });

      // Wait for the transaction receipt.
      await waitForTransactionReceipt({ hash: tx.hash });
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

  // Attach the submit event handler to the form.
  form.addEventListener("submit", submit);
  form.appendChild(button);

  return form;
}

export { createSubscribeButton };
