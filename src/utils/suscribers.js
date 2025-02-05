// src/utils/subscribers.js

import { store, updateStore } from "../store/appkitStore";

/**
 * Initializes subscribers on your AppKit instance.
 * When the account, network, or overall state changes, these subscribers update the store
 * and update the modal element (if it exists and is open).
 *
 * @param {Object} appKit - Your initialized AppKit instance.
 */
export const initializeSubscribers = (appKit) => {
  let lastAccount = null;
  let lastNetwork = null;

  // Subscribe to account changes.
  appKit.subscribeAccount((state) => {
    updateStore("accountState", state);
    const modal = document.getElementById("subModal");
    if (modal) {
      modal.account = state;
    }
  });

  // Subscribe to network changes.
  appKit.subscribeNetwork((state) => {
    updateStore("networkState", state);
    const modal = document.getElementById("subModal");
    if (modal) {
      modal.network = state;
    }
  });

  // Subscribe to overall AppKit state changes.
  appKit.subscribeState((state) => {
    updateStore("appKitState", state);
    const modal = document.getElementById("subModal");
    // Only update/render the modal if it is open.
    if (
      modal &&
      modal.getAttribute("open") === "true" &&
      typeof modal.render === "function"
    ) {
      modal.render();
    }
  });
};
