// Import modules and helper functions
import { parseUnits } from "viem";
import {
  getNetworkFee,
  getSubscriptionModalData,
  getTokenABI,
} from "../helpers/subscriptionHelpers";
import { calculateSubscriptionRate, getAssets } from "../utils";
import { Papaya } from "../contracts/evm/Papaya";
// Import button components
import { createApproveButton } from "./Buttons/Approve";
import { createDepositButton } from "./Buttons/Deposit";
import { createSubscribeButton } from "./Buttons/Subscribe";
// Import assets
import LogoIcon from "../assets/logo.svg";
import SuccessIcon from "../assets/others/success.svg";
import FailIcon from "../assets/others/fail.svg";

class SubscriptionModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Internal properties
    this._open = false;
    this._subscriptionDetails = null;
    this._account = null;
    this._network = null;
    this._onClose = () => {};

    // State variables
    this._showError = false;
    this._errorTitle = "";
    this._errorDescription = "";
    this._isSubscriptionSuccessful = false;

    // Fee state and caching
    this._networkFee = null;
    this._isFeeLoading = false;
    this._modalData = null;
    this._functionDetails = null;
    this._feeRequestId = 0;
  }

  static get observedAttributes() {
    return ["open"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "open") {
      this._open = newVal !== null && newVal !== "false";
      if (!this._open) {
        this._isSubscriptionSuccessful = false;
        this._showError = false;
        this._modalData = null;
        this.render();
      } else {
        this.render();
        if (this._subscriptionDetails && this._account && this._network) {
          this.fetchNetworkFee();
        }
      }
    }
  }

  set subscriptionDetails(details) {
    this._subscriptionDetails = details;
    if (this._open) this.render();
  }
  get subscriptionDetails() {
    return this._subscriptionDetails;
  }

  set account(newAccount) {
    this._account = newAccount;
    if (this._open) this.render();
  }
  get account() {
    return this._account;
  }

  set network(newNetwork) {
    this._network = newNetwork;
    if (this._open) {
      this.fetchNetworkFee();
      this.render();
    }
  }
  get network() {
    return this._network;
  }

  set onClose(fn) {
    this._onClose = fn;
  }
  get onClose() {
    return this._onClose;
  }

  connectedCallback() {
    this.render();
  }

  // Fetch fee data (only once per change) and cache it.
  async fetchNetworkFee() {
    if (
      !this._open ||
      !this._account ||
      !this._network ||
      !this._subscriptionDetails
    )
      return;

    this._feeRequestId++;
    const currentRequestId = this._feeRequestId;
    this._isFeeLoading = true;
    this.render();

    try {
      const modalData = await getSubscriptionModalData(
        this._network,
        this._account,
        this._subscriptionDetails
      );

      if (currentRequestId !== this._feeRequestId) return;
      this._modalData = modalData;

      const { needsDeposit, needsApproval, depositAmount, tokenDetails } =
        modalData;
      const functionName = needsApproval
        ? "approve"
        : needsDeposit
        ? "deposit"
        : "subscribe";
      const abiValue =
        functionName === "approve" ? getTokenABI(tokenDetails.name) : Papaya;
      const addr =
        functionName === "approve"
          ? tokenDetails.ercAddress
          : tokenDetails.papayaAddress;
      const args = needsApproval
        ? [
            tokenDetails.papayaAddress,
            parseUnits(this._subscriptionDetails.cost, 6),
          ]
        : needsDeposit
        ? [depositAmount, false]
        : [
            this._subscriptionDetails.toAddress,
            calculateSubscriptionRate(
              parseUnits(this._subscriptionDetails.cost, 18),
              this._subscriptionDetails.payCycle
            ),
            0,
          ];
      this._functionDetails = {
        abi: abiValue,
        address: addr,
        functionName,
        args,
        account: this._account.address,
      };

      const feeData = await getNetworkFee(
        true,
        this._account,
        this._network.chainId,
        this._functionDetails
      );
      this._networkFee = feeData;
    } catch (error) {
      console.error("Error fetching fee data:", error);
      this._networkFee = { fee: "0.000000000000 ETH", usdValue: "($0.00)" };
    } finally {
      if (currentRequestId === this._feeRequestId) {
        this._isFeeLoading = false;
        this.render();
      }
    }
  }

  // Update error state based on modal data.
  updateErrorState(modalData) {
    if (
      modalData &&
      (modalData.isUnsupportedNetwork || modalData.isUnsupportedToken)
    ) {
      this._showError = true;
      if (modalData.isUnsupportedNetwork && !modalData.isUnsupportedToken) {
        this._errorTitle = "Unsupported network";
        this._errorDescription =
          "The selected network is not supported. Please switch to a supported network.";
      } else if (
        modalData.isUnsupportedToken &&
        !modalData.isUnsupportedNetwork
      ) {
        this._errorTitle = "Unsupported token";
        this._errorDescription =
          "The selected token is not supported on this network. Please select a different token.";
      } else {
        this._errorTitle = "Unsupported network and token";
        this._errorDescription =
          "The selected network and token are not supported.";
      }
    } else {
      this._showError = false;
      this._errorTitle = "";
      this._errorDescription = "";
    }
  }

  async render() {
    if (!this._open) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    if (!this._subscriptionDetails) {
      this.shadowRoot.innerHTML = `<p style="color:red;">Missing subscription details.</p>`;
      return;
    }

    const modalData = this._modalData || {};

    const {
      chainIcon = getAssets("ethereum", "chain"),
      tokenIcon = getAssets("usdt", "token"),
      needsDeposit = false,
      depositAmount = BigInt(0),
      needsApproval = false,
      hasSufficientBalance = false,
      canSubscribe = false,
      tokenDetails = {},
    } = modalData;

    this.updateErrorState(modalData);

    const skeleton100 = `<div class="skeleton" style="width:100px;height:1em;"></div>`;
    const skeleton60 = `<div class="skeleton" style="width:60px;height:1em;"></div>`;

    const template = `
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Public Sans:wght@400;700&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Roboto Mono:wght@400&display=swap");

        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 998;
            padding-left: 20px;
            padding-right: 20px;
        }

        .modal-container {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            width: 464px;
            height: auto;
            border-radius: 24px;
            box-sizing: border-box;
            background-color: #fff;
            box-shadow: -40px 40px 80px -8px rgba(0, 0, 0, 0.24);
        }

        .modal-header {
            width: 100%;
            height: 64px;
            background-color: rgba(145, 158, 171, 0.2);
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            display: flex;
            align-items: center;
        }

        .modal-header-container {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 12px;
        }

        .close-button {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 40px;
            height: 40px;
            cursor: pointer;
        }

        .wallet-icon {
            width: 40px;
            height: 40px;
        }

        .modal-body {
            width: 100%;
        }

        .modal-body-container {
            padding-left: 12px;
            padding-right: 12px;
            padding-top: 12px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: 12px;
        }

        .summary-section {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
        }

        .summary-title {
            font-family: "Public Sans", sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: #637381;
            line-height: 24px;
            margin: 0;
        }

        .summary-detail {
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            gap: 6px;
        }

        .detail-icons {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 4px;
        }

        .chain-icon {
            width: 14px;
            height: 14px;
        }

        .token-icon {
            width: 24px;
            height: 24px;
        }

        .detail-label {
            font-family: "Public Sans", sans-serif;
            font-size: 12px;
            color: #919eab;
            margin: 0;
            line-height: 24px;
        }

        .detail-value {
            font-family: "Roboto Mono", monospace;
            font-size: 14px;
            color: #212b36;
            margin: 0;
        }

        .detail-usd-value {
            font-family: "Roboto Mono", monospace;
            font-size: 12px;
            color: #919eab;
            margin: 0;
        }

        .detail-pay-cycle {
            font-family: "Roboto Mono", monospace;
            font-size: 12px;
            color: #919eab;
            margin: 0;
        }

        .buttons-section {
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 12px;
        }

        .deposit-button,
        .approve-button,
        .subscribe-button {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 40px;
            border-radius: 16px;
            background-color: #212b35;
            color: white;
            cursor: pointer;
            gap: 8px;
            transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
        }

        .deposit-button:hover,
        .approve-button:hover,
        .subscribe-button:hover {
            background-color: #2d3742;
            color: #ffffff;
            transform: scale(1.01);
        }

        .deposit-button.disabled,
        .approve-button.disabled,
        .subscribe-button.disabled {
            background-color: #e0e5e8;
            color: #919eab;
            cursor: not-allowed;
        }

        .deposit-button:disabled:hover,
        .approve-button.disabled:hover,
        .subscribe-button.disabled:hover {
            transform: none;
        }

        .deposit-button:hover:not(.disabled),
        .approve-button:hover:not(.disabled),
        .subscribe-button:hover:not(.disabled) {
            background-color: #34434f;
            color: #ffffff;
        }

        .spinner-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #fff;
            border-top: 2px solid #28a745;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        .button-text {
            font-family: "Public Sans", sans-serif;
            font-size: 14px;
            font-weight: 700;
            -webkit-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }

        .modal-footer {
            display: flex;
            align-items: center;
            flex-direction: row;
            justify-content: center;
            width: 100%;
            height: 40px;
        }

        @keyframes scale-bounce {
            0% {
                transform: scale(0);
            }

            50% {
                transform: scale(1.2);
            }

            100% {
                transform: scale(1);
            }
        }

        .image-green-tick {
            width: 20px;
            height: 20px;
        }

        .image-green-tick.success {
            display: block;
            animation: scale-bounce 0.6s ease-in-out forwards;
        }

        .hidden {
            display: none;
        }

        .successful-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            width: 100%;
            gap: 12px;
            padding-top: 24px;
            padding-bottom: 24px;
        }

        .success-icon {
            width: 57.72px;
            height: 57.72px;
        }

        .thank-you-title {
            font-family: "Public Sans", sans-serif;
            font-size: 24px;
            line-height: 36px;
            font-weight: 700;
            color: #22C55E;
            margin: 0;
        }

        .thank-you-text {
            font-family: "Public Sans", sans-serif;
            font-size: 12px;
            color: #637381;
            margin: 0;
        }

        .thank-you-text a {
            color: #637381 !important;
        }

        .error-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            width: 100%;
            gap: 12px;
            padding-top: 24px;
            padding-bottom: 24px;
        }

        .error-icon {
            width: 57.72px;
            height: 57.72px;
        }

        .error-title {
            font-family: "Public Sans", sans-serif;
            font-size: 24px;
            line-height: 36px;
            font-weight: 700;
            color: #FF3B30;
            margin: 0;
        }

        .error-text {
            font-family: "Public Sans", sans-serif;
            font-size: 12px;
            color: #637381;
            margin: 0;
            max-width: 440px;
            overflow: hidden;
        }

        .footer-text {
            font-family: "Public Sans", sans-serif;
            font-size: 12px;
            color: #637381;
            margin-right: 8px;
        }

        .footer-logo {
            width: 58px;
            height: 12px;
            margin-top: 4px;
        }

        .underline {
            text-decoration: none;
        }

        span[aria-live="polite"]:has(> span.button-loader) {
            width: 100%;
        }

        .button-loader {
            width: 100%;
            height: 40px;
            border-radius: 16px;
        }

        .skeleton {
            background-color: #e0e5e8;
            animation: skeleton-loading 1.2s ease-in-out infinite;
            border-radius: 8px;
        }

        @keyframes skeleton-loading {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
      </style>
      <div class="modal-overlay">
        <div class="modal-container" id="modalContainer">
          <div class="modal-header">
            <div class="modal-header-container">
              <div class="wallet-section">
                <!-- Render a wallet button; here we create it dynamically -->
                ${document.createElement("appkit-button").outerHTML}
              </div>
              <div class="close-button" id="closeBtn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13.4032 11.9942L17.6976 7.7095C18.0892 7.31787 18.0892 6.68289 17.6976 6.29126C17.306 5.89962 16.671 5.89962 16.2794 6.29126L11.995 10.5859L7.71063 6.29126C7.31902 5.89962 6.68409 5.89962 6.29248 6.29126C5.90087 6.68289 5.90087 7.31787 6.29248 7.7095L10.5869 11.9942L6.29248 16.2789C6.10342 16.4664 5.99707 16.7217 5.99707 16.988C5.99707 17.2543 6.10342 17.5096 6.29248 17.6972C6.48 17.8862 6.73527 17.9926 7.00155 17.9926C7.26784 17.9926 7.52311 17.8862 7.71063 17.6972L11.995 13.4025L16.2794 17.6972C16.4669 17.8862 16.7222 17.9926 16.9885 17.9926C17.2548 17.9926 17.51 17.8862 17.6976 17.6972C17.8866 17.5096 17.993 17.2543 17.993 16.988C17.993 16.7217 17.8866 16.4664 17.6976 16.2789L13.4032 11.9942Z" fill="#212B36"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="modal-body">
            <div class="modal-body-container body-main ${
              this._showError || this._isSubscriptionSuccessful ? "hidden" : ""
            }">
              <div class="summary-section">
                <p class="summary-title">Summary</p>
                <div class="summary-detail">
                  <p class="detail-label">Subscription Cost:</p>
                  <div class="detail-icons">
                  ${
                    this._isFeeLoading
                      ? `<div class="skeleton" style="width:14px;height:14px;border-radius:4px"></div>`
                      : `<img src="${chainIcon}" alt="Chain Icon" class="chain-icon" />`
                  }
                  ${
                    this._isFeeLoading
                      ? `<div class="skeleton" style="width:24px;height:24px;border-radius:6px"></div>`
                      : `<img src="${tokenIcon}" alt="Token Icon" class="token-icon" />`
                  }
                  </div>
                  <p class="detail-value">
                    ${
                      this._isFeeLoading
                        ? skeleton60
                        : this._subscriptionDetails.cost
                    }
                  </p>
                  <p class="detail-usd-value">
                    ${
                      this._isFeeLoading
                        ? skeleton60
                        : `(~$${this._subscriptionDetails.cost})`
                    }
                  </p>
                  <p class="detail-pay-cycle">
                    ${this._subscriptionDetails.payCycle}
                  </p>
                </div>
                <div class="summary-detail">
                  <p class="detail-label">Network Fee:</p>
                  <p class="detail-value">
                    ${
                      this._isFeeLoading
                        ? skeleton100
                        : this._networkFee
                        ? this._networkFee.fee
                        : "0 ETH"
                    }
                  </p>
                  <p class="detail-usd-value">
                    ${
                      this._isFeeLoading
                        ? skeleton60
                        : this._networkFee
                        ? this._networkFee.usdValue
                        : "($0.00)"
                    }
                  </p>
                </div>
              </div>
              <div class="buttons-section" id="buttonsSection">
                <!-- Approve, Deposit, and Subscribe buttons will be inserted here -->
              </div>
            </div>
            ${
              this._showError && !this._isSubscriptionSuccessful
                ? `
            <div class="modal-body-container body-error">
              <div class="error-section">
                <img src="${FailIcon}" alt="Subscription Failed" class="fail-icon" />
                <p class="error-title">${this._errorTitle}</p>
                <p class="error-text">${this._errorDescription}</p>
              </div>
            </div>
            `
                : ""
            }
            ${
              !this._showError && this._isSubscriptionSuccessful
                ? `
            <div class="modal-body-container body-successful">
              <div class="successful-section">
                <img src="${SuccessIcon}" alt="Subscription Successful" class="success-icon" />
                <p class="thank-you-title">Thank you for your subscription!</p>
                <p class="thank-you-text">
                  Now you can manage your subscription from a convenient
                  <b><u>
                    <a target="_blank" href="${
                      account && account.address
                        ? `https://app.papaya.finance/wallet/${account.address}`
                        : "https://app.papaya.finance/"
                    }">
                      dashboard!
                    </a>
                  </u></b>
                </p>
              </div>
            </div>
            `
                : ""
            }
          </div>
          <div class="modal-footer">
            <p class="footer-text">Powered by</p>
            <a href="https://app.papaya.finance" target="_blank" rel="noopener noreferrer">
              <img src="${LogoIcon}" alt="Papaya Logo" class="footer-logo" />
            </a>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = template;

    const closeBtn = this.shadowRoot.getElementById("closeBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._open = false;
        this.removeAttribute("open");
        this._onClose();
        this.render();
      });
    }

    const buttonsSection = this.shadowRoot.getElementById("buttonsSection");
    if (buttonsSection) {
      if (this._isFeeLoading) {
        // Show skeleton loading
        buttonsSection.innerHTML = `
          <div class="skeleton" style="width:100%;height:40px;border-radius:16px"></div>
          <div class="skeleton" style="width:100%;height:40px;border-radius:16px"></div>
        `;
      } else if (this._account && this._network && this._modalData) {
        buttonsSection.innerHTML = "";

        // Create Approve button.
        const approveBtn = createApproveButton({
          chainId: this._network.chainId,
          account: this._account,
          needsApproval: this._modalData.needsApproval,
          approvalAmount: parseUnits(this._subscriptionDetails.cost, 6),
          abi: getTokenABI(tokenDetails.name),
          tokenContractAddress: tokenDetails.ercAddress,
          papayaAddress: tokenDetails.papayaAddress,
          onSuccess: () => {
            this._showError = false;
            this._errorTitle = "";
            this._errorDescription = "";
            this.render();
          },
          onError: (title, description) => {
            this._showError = true;
            this._errorTitle = title;
            this._errorDescription = description;
            this.render();
          },
        });
        buttonsSection.appendChild(approveBtn);

        // Create Deposit button.
        const depositBtn = createDepositButton({
          chainId: this._network.chainId,
          needsApproval: this._modalData.needsApproval,
          needsDeposit: this._modalData.needsDeposit,
          depositAmount: this._modalData.depositAmount,
          abi: Papaya,
          papayaAddress: tokenDetails.papayaAddress,
          hasSufficientBalance: this._modalData.hasSufficientBalance,
          onSuccess: () => {
            this._showError = false;
            this._errorTitle = "";
            this._errorDescription = "";
            this.render();
          },
          onError: (title, description) => {
            this._showError = true;
            this._errorTitle = title;
            this._errorDescription = description;
            this.render();
          },
        });
        buttonsSection.appendChild(depositBtn);

        // Create Subscribe button.
        const subscribeBtn = createSubscribeButton({
          chainId: this._network.chainId,
          needsDeposit: this._modalData.needsDeposit,
          canSubscribe: this._modalData.canSubscribe,
          abi: Papaya,
          toAddress: this._subscriptionDetails.toAddress,
          subscriptionCost: parseUnits(this._subscriptionDetails.cost, 18),
          subscriptionCycle: this._subscriptionDetails.payCycle,
          papayaAddress: tokenDetails.papayaAddress,
          onSuccess: () => {
            this._isSubscriptionSuccessful = true;
            this._showError = false;
            this._errorTitle = "";
            this._errorDescription = "";
            this.render();
          },
          onError: (title, description) => {
            this._showError = true;
            this._errorTitle = title;
            this._errorDescription = description;
            this.render();
          },
        });
        buttonsSection.appendChild(subscribeBtn);
      }
    }
  }
}

customElements.define("subscription-modal", SubscriptionModal);

export { SubscriptionModal };
