// src/components/Buttons/Deposit.js

import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { getReadableErrorMessage } from "../../utils";

/**
 * Factory function to create a Deposit button form.
 *
 * @param {Object} options - Configuration options.
 * @param {number} options.chainId - The chain id.
 * @param {boolean} options.needsDeposit - Whether a deposit is needed.
 * @param {bigint} options.depositAmount - The amount to deposit.
 * @param {Object} options.abi - The ABI of the Papaya contract.
 * @param {string} options.papayaAddress - The Papaya contract address.
 * @param {boolean} options.hasSufficientBalance - Whether the user has enough balance.
 * @param {function} [options.onSuccess] - Callback on successful deposit.
 * @param {function} [options.onError] - Callback on error, receives (title, description).
 *
 * @returns {HTMLElement} - The form element containing the Deposit button.
 */
function createDepositButton({
  chainId,
  needsDeposit,
  depositAmount,
  abi,
  papayaAddress,
  hasSufficientBalance,
  onSuccess = () => {},
  onError = () => {},
}) {
  // Internal state variables
  let isProcessing = false;
  let isPending = false;
  let isConfirmed = false;

  // Create the form element
  const form = document.createElement("form");
  form.style.width = "100%";

  // Create the button element
  const button = document.createElement("button");
  button.type = "submit";
  button.className = "deposit-button";

  // Function to render/update the button content
  function renderButtonContent() {
    button.innerHTML = ""; // clear previous content

    if (isProcessing || isPending) {
      // Show spinner container
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
      // Show standard button text
      const text = document.createElement("p");
      text.className = "button-text";
      // If user has sufficient balance, show "Deposit"; otherwise show "Insufficient Balance"
      text.textContent = hasSufficientBalance
        ? "Deposit"
        : "Insufficient Balance";
      button.appendChild(text);
    }
  }

  // Function to update UI state (disabled state and re-render content)
  function updateUI() {
    if (!needsDeposit || !hasSufficientBalance || isProcessing || isPending) {
      button.disabled = true;
      button.classList.add("disabled");
    } else {
      button.disabled = false;
      button.classList.remove("disabled");
    }
    renderButtonContent();
  }

  // Initial render of button content
  updateUI();

  // Submit handler for the deposit form
  async function submit(e) {
    e.preventDefault();
    if (!needsDeposit || !hasSufficientBalance) return;

    isProcessing = true;
    updateUI();

    try {
      // Call writeContract for the "deposit" function.
      const tx = await writeContract({
        abi,
        address: papayaAddress,
        functionName: "deposit",
        args: [depositAmount, false],
        chainId,
      });

      // Wait for transaction confirmation
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
        onError("Failed to deposit", getReadableErrorMessage(error));
      }
    } finally {
      isProcessing = false;
      isPending = false;
      updateUI();
    }
  }

  // Attach the submit event handler to the form
  form.addEventListener("submit", submit);

  // Append the button to the form
  form.appendChild(button);

  return form;
}

export { createDepositButton };
