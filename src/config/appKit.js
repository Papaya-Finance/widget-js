import {
  mainnet,
  bsc,
  polygon,
  avalanche,
  arbitrum,
} from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const reownProjectId =
  (typeof window !== "undefined" && window.REOWN_PROJECT_ID) ||
  import.meta.env.REOWN_PROJECT_ID;

if (!reownProjectId) {
  throw new Error("REOWN_PROJECT_ID is not set");
}

export const papayaProjectId =
  (typeof window !== "undefined" && window.PAPAYA_PROJECT_ID) ||
  import.meta.env.PAPAYA_PROJECT_ID;

if (!papayaProjectId) {
  throw new Error("PAPAYA_PROJECT_ID is not set");
}

let availableNetworks;
if (window.NETWORKS_LIST) {
  try {
    const networkNames = JSON.parse(window.NETWORKS_LIST);
    const networkMap = {
      mainnet,
      bsc,
      polygon,
      avalanche,
      arbitrum,
    };
    availableNetworks = networkNames
      .map((name) => networkMap[name.toLowerCase()])
      .filter(Boolean);

    if (availableNetworks.length === 0) {
      availableNetworks = [mainnet, bsc, polygon, avalanche, arbitrum];
    }
  } catch (e) {
    availableNetworks = [mainnet, bsc, polygon, avalanche, arbitrum];
  }
} else {
  availableNetworks = [mainnet, bsc, polygon, avalanche, arbitrum];
}

export const networks = availableNetworks;

const themeMode = window.THEME_MODE || "light";

export const wagmiAdapter = new WagmiAdapter({
  projectId: reownProjectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId: reownProjectId,
  themeMode,
  themeVariables: {
    "--w3m-accent": "#000000",
  },
});
