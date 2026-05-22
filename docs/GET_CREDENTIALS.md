# Getting your Lumen Dev credentials

<p align="center">
  <img src="images/lumen-logo.svg" alt="Lumen" width="100" />
</p>

To run this sample app on your own computer, you need two values from your Lumen Dev account, plus one extra setting on that same key:

- An **API key** — a public-ish ID that says "this request is from my organization".
- An **API secret** — a private password that proves it really is you.
- A registered **redirect URL** on the same API key — so BridgePass knows it's allowed to send users back to your app after login.

Think of the key and secret like a username and password, except they're used by the small Express server running on your computer (not by a human typing them at a login screen) to talk to Lumen's online services on your behalf.

> **Note:** An **API** (Application Programming Interface) is the menu of services a system offers to other software. When this sample app asks Lumen "list the logged-in user's files", it's calling Lumen's API.

---

## Step 1 — Sign in to the Lumen Dev portal

### What to do

Open your browser and go to the Lumen Dev portal. Sign in with your organization account.

> **Heads up:** If you don't have an account yet, contact the Lumen team. Dev access is invite-based during the developer preview, so it's not a self-serve sign-up.

### What to expect

You'll land on your organization's dashboard — the main page showing your wallets, files, and other modules.

---

## Step 2 — Open the API Keys section

### What to do

In the dashboard menu, navigate to **Settings** then **API Keys** (the exact path may vary slightly as the product evolves).

### What to expect

A page showing any existing API keys for your organization, with a button to create a new one.

---

## Step 3 — Create a new API key

### What to do

1. Click the **Create** (or **New API Key**) button.
2. Give the key a name you'll recognize — for example, `wallet-and-files-localhost`. The name is just a label for you; Lumen doesn't care what it says.
3. Confirm the creation.

### What to expect

A dialog appears showing **two values**: the API key and the API secret.

> **WARNING:** The secret is usually shown **only once**, right after creation. If you close the dialog without copying it, you'll have to delete the key and create a new one. There's no "show secret again" button on purpose — that's a deliberate security choice.

---

## Step 4 — Copy both values immediately

### What to do

Copy the **API key** and the **API secret** into a safe place — a password manager is ideal. A temporary text file is acceptable as long as you delete it after Step 5.

> **TIP:** Do not paste either value into chat applications, screenshots, emails, or anywhere on the public internet. Treat them like passwords.

---

## Step 5 — Paste them into your local `.env` file

### What to do

Follow [SETUP.md Step 6](SETUP.md#step-6--create-your-env-file). Open the `.env` file in a text editor and replace the placeholders:

```
LUMEN_API_KEY=paste-your-api-key-here
LUMEN_API_SECRET=paste-your-api-secret-here
```

becomes (with your real values):

```
LUMEN_API_KEY=abc123-your-real-key
LUMEN_API_SECRET=xyz789-your-real-secret
```

> **Heads up:** No quotes, no spaces around the `=` sign. Save the file when done.

---

## Step 6 — Register a redirect URL on this API key

This step is unique to apps that use BridgePass login (which is exactly what this sample does). Skipping it is the most common cause of failed sign-ins.

### What to do

1. Still in the Lumen dashboard, open the API key you just created (or its settings page).
2. Find the **Allowed redirect URLs** section (the exact label may vary slightly).
3. Add this exact value:

```
http://localhost:5173/callback
```

4. Save.

### What to expect

The URL is now in the list. BridgePass will accept it as a valid destination when sending users back to your app after they finish logging in.

> **Why this exists:** BridgePass intentionally refuses redirects to any address that isn't on the allowlist. This prevents a malicious site from tricking BridgePass into sending an authenticated user (along with their AuthCode) to an attacker-controlled domain. The allowlist is per API key, so each app gets its own list of legal landing spots.

> **Note:** If you later deploy this sample to a real domain (say, `https://my-app.example.com`), you must add `https://my-app.example.com/callback` to the same list. The dev URL can stay on the list alongside.

---

## What can each credential do?

| Credential | What it does | Where it lives |
|---|---|---|
| `LUMEN_API_KEY` | Identifies your organization to Lumen. Public-ish — think of it like an email address. | Server `.env` file only. |
| `LUMEN_API_SECRET` | Proves the request really comes from your organization. The password half. | Server `.env` file only. |
| Registered redirect URL | Tells BridgePass which addresses it may send authenticated users back to. | The Lumen dashboard, attached to your API key. |

Both the key and the secret stay on your local Express server (the small program running on your computer at port 8787). The browser side of the app **never** receives them — it only ever talks to the local server, which adds these credentials to outgoing requests before they leave your machine.

---

## If something goes wrong

| What you saw | What it means | How to fix it |
|---|---|---|
| Red banner: `401 Unauthorized` | The key or secret is wrong, has a typo, or was deleted from the Lumen dashboard. | Re-copy both values from the dashboard, paste them into `.env` (no quotes, no extra spaces), save, and restart the app with `npm start`. |
| Red banner: `403 Forbidden` | Your API key is valid, but it doesn't have permission for the WALLETS module on your organization. (BridgePass auth endpoints and user-files endpoints both live under wallets.) You may also need a personal-files quota for your end-user to upload — confirm with the Lumen team. | Contact the Lumen team and ask them to enable the **WALLETS** module on your organization, and verify the end-user has personal-files permission. |
| BridgePass shows "invalid redirect URL" | You skipped Step 6 — the callback URL isn't registered on your API key. | Add `http://localhost:5173/callback` to the redirect-URL list on this key, then try signing in again. |
| Error message: `errorMsg: API key not found` | You probably swapped the values — pasted the secret into the key slot or vice versa. | Make sure `LUMEN_API_KEY` holds the public ID and `LUMEN_API_SECRET` holds the secret. |

---

## Keep your credentials safe

> **WARNING:** A leaked API secret is like a leaked password. Anyone who has it can pretend to be your organization until you revoke the key.

A few simple rules:

- **Never commit `.env` to Git.** The included `.gitignore` already prevents this — leave it alone.
- **Never paste your secret anywhere public.** Not in chat, not in Slack, not in a screenshot, not in a support ticket. If you accidentally do, immediately delete that API key from the Lumen dashboard and create a new one.
- **For production deployments**, store the values in your hosting provider's secrets manager (Azure Key Vault, AWS Secrets Manager, Render's environment variables, etc.) — never in source control.

> **Tip:** If you ever suspect a secret has leaked, the fastest fix is to delete that API key in the dashboard. Any request using the old secret will instantly fail. Then create a new key and update `.env` (and re-register the redirect URL on the new key).
