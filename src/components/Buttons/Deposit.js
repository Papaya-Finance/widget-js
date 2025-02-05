import {
  writeContract,
  waitForTransactionReceipt,
  simulateContract,
} from "@wagmi/core";
import { wagmiConfig } from "../../config/appKit";
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
  needsApproval,
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

  const button = document.createElement("button");
  button.className = "deposit-button";

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
      text.textContent = hasSufficientBalance
        ? "Deposit"
        : "Insufficient Balance";
      button.appendChild(text);
    }

    if (isConfirmed || !needsDeposit) {
      button.classList.add("hidden");
    } else {
      button.classList.remove("hidden");
    }
  }

  function updateUI() {
    if (needsApproval || !needsDeposit || !hasSufficientBalance || isProcessing || isPending) {
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

    if (!needsDeposit || !hasSufficientBalance) return;

    isProcessing = true;
    updateUI();

    try {
      const { request } = await simulateContract(wagmiConfig, {
        abi,
        address: papayaAddress,
        functionName: "deposit",
        args: [depositAmount, false],
        chainId,
      });

      const txHash = await writeContract(wagmiConfig, request);

      await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash,
        chainId,
      });

      isConfirmed = true;
      needsDeposit = false;
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

  button.addEventListener("click", handleClick);
  return button;
}

export { createDepositButton };
