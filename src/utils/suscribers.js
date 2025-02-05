// In src/utils/suscribers.js
import { store, updateStore } from "../store/appkitStore";

export const initializeSubscribers = (appKit) => {
  let lastAccount = null;
  appKit.subscribeAccount((state) => {
    if (!lastAccount || lastAccount.address !== state.address) {
      lastAccount = state;
      updateStore("accountState", state);
      const modal = document.getElementById("subModal");
      if (modal) {
        console.log("account changed", modal.account);
        modal.account = state;
      }
    }
  });

  let lastNetwork = null;
  appKit.subscribeNetwork((state) => {
    if (!lastNetwork || lastNetwork.chainId !== state.chainId) {
      lastNetwork = state;
      updateStore("networkState", state);
      const modal = document.getElementById("subModal");
      if (modal) {
        console.log("network changed", modal.network);
        modal.network = state;
      }
    }
  });

  appKit.subscribeState((state) => {
    updateStore("appKitState", state);
    const modal = document.getElementById("subModal");
    if (modal && typeof modal.render === "function") {
      modal.render();
    }
  });
};
