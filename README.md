# Papaya Subscription Vanilla JS Widget SDK

The Papaya Subscription Vanilla JS Widget SDK provides an easy way to integrate Papaya subscription payments into your vanilla JavaScript or static HTML project.

---

## Features

- **Subscription Management:**  
  Simplified and secure subscription payment flows.

- **Automatic Provider Handling:**  
  No need to manually configure wallet or blockchain providers—the SDK handles it for you.

- **Multi-Network Support:**  
  Supports Ethereum, BSC, Polygon, Avalanche, Arbitrum, Base, and more.

- **Customization:**  
  Easily configure metadata, themes, and supported networks via global parameters.

- **UMD Module:**  
  Use the SDK in any environment—vanilla JS, static HTML pages, or legacy projects.

---

## Installation

Include the UMD bundle directly from unpkg in your HTML. For example, add the following `<script>` tag before your own scripts:

```html
<script src="https://www.unpkg.com/@papaya_fi/widget-js@latest/dist/umd-papaya-widget.umd.js"></script>
```

Alternatively, you can install via npm:

```bash
npm install @papaya_fi/widget-js
```

Or with yarn:

```bash
yarn add @papaya_fi/widget-js
```

---

## Prerequisites

Before integrating the Papaya Subscription Vanilla JS Widget SDK, please complete the following steps:

### 1. **Obtain Your Reown Project ID**

- Sign in to the [Reown Cloud Dashboard](https://cloud.reown.com/sign-in) and create a new project.
- Select **AppKit** as the product.
- Choose your platform (**Vanilla JS** in this case).
- Locate your **Project ID** on the dashboard.
- Ensure your app’s URL is whitelisted in the Reown dashboard (Configure Domains).

### 2. **Obtain Your Papaya Project ID**

[TODO]

---

## Configuration

The SDK uses configuration parameters passed via global variables. In your HTML, set the following variables **before** loading the UMD bundle:

- `window.REOWN_PROJECT_ID`: Your Reown Project ID.
- `window.PAPAYA_PROJECT_ID`: Your Papaya Project ID.
- `window.NETWORKS_LIST`: A JSON string of supported network names (e.g., `["mainnet", "bsc", "polygon", "avalanche", "arbitrum"]`).
- (Optional) `window.THEME_MODE`: `"light"` or `"dark"`.

For example:

```html
<script>
  window.REOWN_PROJECT_ID = "your-secret-reown-project-id";
  window.PAPAYA_PROJECT_ID = "your-papaya-project-id";
  window.NETWORKS_LIST = JSON.stringify(["mainnet", "bsc", "polygon", "avalanche", "arbitrum"]);
  window.THEME_MODE = "light";
</script>
```

---

## Usage in a Vanilla JavaScript/HTML Project

Create an HTML file that includes your SDK using the unpkg URL, sets the required globals, and then uses the widget. For example:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Papaya Subscription Vanilla JS Demo</title>
    <link rel="stylesheet" href="css/App.css" />
  </head>
  <body>
    <button id="openModalBtn">Open Subscription Modal</button>
    <!-- The custom element registered by the SDK -->
    <subscription-modal id="subModal"></subscription-modal>

    <script>
      // Set global configuration parameters before the SDK loads.
      window.REOWN_PROJECT_ID = "your-secret-reown-project-id";
      window.PAPAYA_PROJECT_ID = "your-papaya-project-id";
      window.NETWORKS_LIST = JSON.stringify(["mainnet", "bsc", "polygon", "avalanche", "arbitrum"]);
      window.THEME_MODE = "light";
    </script>

    <!-- Load the SDK from unpkg -->
    <script src="https://www.unpkg.com/@papaya_fi/widget-js@latest/dist/umd-papaya-widget.umd.js"></script>

    <script>
      console.log("Loaded Papaya Widget SDK:", window.PapayaWidget);

      document.getElementById("openModalBtn").addEventListener("click", () => {
        const modal = document.getElementById("subModal");
        // Set subscription details before opening the modal.
        modal.subscriptionDetails = {
          toAddress: "YOUR_SUBSCRIBE_TO_ADDRESS", // Replace it
          cost: "0.99", // Replace it
          token: "usdt", // Available options are: usdt, usdc, and pyusd
          payCycle: "/monthly", // Available options are: /daily, /weekly, /monthly, and /yearly
        };
        modal.setAttribute("open", "true");
      });
    </script>
  </body>
</html>
```

---

## API Reference

### SubscriptionModal

- **Properties:**
  - `open` (boolean): Controls the modal visibility.
  - `subscriptionDetails` (object): Contains `{ toAddress, cost, token, payCycle }`.
  - `onClose` (function): Callback invoked when the modal is closed.

### Configuration (Global Variables)

- `window.REOWN_PROJECT_ID`: Your unique Reown Project ID.
- `window.PAPAYA_PROJECT_ID`: Your unique Papaya Project ID.
- `window.NETWORKS_LIST`: A JSON string representing the supported network names.
- `window.THEME_MODE`: `"light"` or `"dark"` (optional).

---

## Example Use Case

When you click the **Open Subscription Modal** button:

- The `<subscription-modal>` custom element is updated with the subscription details.
- The `open` attribute is set to `"true"`, and the modal appears.
- The built‑in `<appkit-button>` inside the modal handles wallet connection automatically.
- The modal displays the subscription summary and dynamically fetches fee data.
- Once the fee data is loaded, the modal updates the displayed network fee and shows the appropriate buttons (Approve, Deposit, Subscribe).

---

## License

This SDK is licensed under the Apache License.

---

## Support

For issues or questions, please open an issue in our GitHub repository or contact support at [support@papaya.finance](mailto:support@papaya.finance).
