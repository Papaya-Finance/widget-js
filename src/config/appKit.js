import {
  mainnet,
  bsc,
  polygon,
  avalanche,
  arbitrum,
} from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const projectId =
  (typeof window !== "undefined" && window.REOWN_PROJECT_ID) ||
  import.meta.env.REOWN_PROJECT_ID ||
  "b56e18d47c72ab683b10814fe9495694";

if (!projectId) {
  throw new Error("REOWN_PROJECT_ID is not set");
}

export const networks = [mainnet, bsc, polygon, avalanche, arbitrum];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#000000",
  },
});
