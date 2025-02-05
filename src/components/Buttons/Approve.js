// src/components/Buttons/Approve.js

import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { getReadableErrorMessage } from "../../utils";
import GreenTickIcon from "../../assets/others/green-tick.svg";

/**
 * Factory function to create an Approve form.
 *
 * @param {Object} options - Configuration options.
 * @param {number} options.chainId - The chain id.
 * @param {boolean} options.needsApproval - Whether approval is needed.
 * @param {bigint} options.approvalAmount - The amount to approve.
 * @param {Object} options.abi - The ABI of the token contract.
 * @param {string} options.tokenContractAddress - The token contract address.
 * @param {string} options.papayaAddress - The Papaya contract address.
 * @param {function} [options.onSuccess] - Callback on successful transaction.
 * @param {function} [options.onError] - Callback on error, receives (title, description).
 *
 * @returns {HTMLElement} - The form element containing the Approve button.
 */
function createApproveButton({
  chainId,
  needsApproval,
  approvalAmount,
  abi,
  tokenContractAddress,
  papayaAddress,
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
  button.className = "approve-button";

  // Function to render/update the button's inner content
  function renderButtonContent() {
    // Clear previous content
    button.innerHTML = "";

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
      // Show standard button content
      const text = document.createElement("p");
      text.className = "button-text";
      text.textContent = "Approve";
      button.appendChild(text);

      // If confirmed (or if approval is no longer needed), show the success icon.
      if (isConfirmed || !needsApproval) {
        const img = document.createElement("img");
        img.src = GreenTickIcon;
        img.alt = "Approve Successful";
        img.className = "image-green-tick";
        button.appendChild(img);
      }
    }
  }

  // Initial render of the button content
  renderButtonContent();

  // Function to update UI state (disabled state and re-render content)
  function updateUI() {
    if (!needsApproval || isProcessing || isPending) {
      button.disabled = true;
      button.classList.add("disabled");
    } else {
      button.disabled = false;
      button.classList.remove("disabled");
    }
    renderButtonContent();
  }

  // Submit handler for the form
  async function submit(e) {
    e.preventDefault();
    if (!needsApproval) return; // if no approval is needed, do nothing

    isProcessing = true;
    updateUI();

    try {
      // Use the writeContract action from @wagmi/core
      const tx = await writeContract({
        abi,
        address: tokenContractAddress,
        functionName: "approve",
        args: [papayaAddress, approvalAmount],
        chainId,
      });

      // Wait for the transaction receipt (you may adjust parameters as needed)
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
        onError("Failed to approve", getReadableErrorMessage(error));
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

export { createApproveButton };
