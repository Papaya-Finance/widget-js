import {
  writeContract,
  waitForTransactionReceipt,
  simulateContract,
} from "@wagmi/core";
import { wagmiConfig } from "../../config/appKit";
import { getReadableErrorMessage } from "../../utils";
import GreenTickIcon from "../../assets/others/green-tick.svg";

/**
 * Factory function to create an Approve button.
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
 * @returns {HTMLElement} - The button element.
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

  const button = document.createElement("button");
  button.className = "approve-button";

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
      text.textContent = "Approve";
      button.appendChild(text);
    }

    if (isConfirmed || !needsApproval) {
      const img = document.createElement("img");
      img.src = GreenTickIcon;
      img.alt = "Approve Successful";
      img.className = "image-green-tick";
      button.appendChild(img);
    }
  }

  function updateUI() {
    if (isConfirmed || !needsApproval || isProcessing || isPending) {
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

    if (!needsApproval) return;

    isProcessing = true;
    updateUI();

    try {
      const { request } = await simulateContract(wagmiConfig, {
        abi,
        address: tokenContractAddress,
        functionName: "approve",
        args: [papayaAddress, approvalAmount],
        chainId,
      });

      const txHash = await writeContract(wagmiConfig, request);

      await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash,
        chainId,
      });

      isConfirmed = true;
      needsApproval = false;
      onSuccess();
    } catch (error) {
      console.error("Error in approve transaction:", error);
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

  button.addEventListener("click", handleClick);
  return button;
}

export { createApproveButton };
