export { SubscriptionModal } from "./components/SubscriptionModal";
export { createApproveButton } from "./components/Buttons/Approve";
export { createDepositButton } from "./components/Buttons/Deposit";
export { createSubscribeButton } from "./components/Buttons/Subscribe";

import { appKit, wagmiAdapter } from "./config/appKit";
import { store } from "./store/appkitStore";
import { updateTheme, updateButtonVisibility } from "./utils/dom";
import { initializeSubscribers } from "./utils/suscribers";

// Initialize subscribers
initializeSubscribers(appKit);

// Initial check
updateButtonVisibility(appKit.getIsConnectedState());

// Button event listeners
document
  .getElementById("open-connect-modal")
  ?.addEventListener("click", () => appKit.open());

document.getElementById("disconnect")?.addEventListener("click", () => {
  appKit.disconnect();
});

// Set initial theme
updateTheme(store.themeState.themeMode);

// Expose the API so that external scripts can access it via window.MyWagmiApp
export { appKit, wagmiAdapter };
