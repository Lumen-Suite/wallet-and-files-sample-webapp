# Lumen Wallet & Files — Public Sample

<p align="center">
  <img src="docs/images/lumen-logo.svg" alt="Lumen" width="120" />
</p>

This is a small, friendly example application that demonstrates the **Lumen BridgePass** sign-in flow from an end-user's perspective, then lets that signed-in user browse and upload their personal files. You click "Sign in", complete the login on BridgePass (using Google or Facebook), get redirected back, and land on a dashboard with your wallet info plus two buttons: **View my files** and **Upload a file**. You do **not** need to know how to code to run it. If you can install a program from a website and edit a text file, you can have this working on your computer in about ten minutes.

> **What this is for:** Two kinds of people. (1) Developers who want to see the full Lumen end-user experience — sign-in plus personal file ops — wired together. (2) Non-coders who want to try it out without writing any code.

**What's under the hood (don't worry if these words mean nothing):** Vite + React (the part you see in the browser), Tailwind v4 (the visual styling), Express (a tiny server that runs on your own computer at port 8787), one settings file called `.env`, and one command to start everything: `npm start`. Your `LUMEN_API_SECRET` lives only on the local Express server. It never reaches the browser.

> **Note:** **OAuth** (Open Authorization) is a standard way of letting one website send you to another to log in, then come back with proof you did. That's exactly what BridgePass does here.

---

## Quickstart — 9 steps from zero to running

Follow these in order. Each step is small.

### Step 1 — Install Node.js

Node.js is the program that runs the code in this sample. Go to [nodejs.org](https://nodejs.org) and download the version labeled **"LTS"** (it stands for "Long-Term Support" — the stable one most people use). Run the installer. Click "Next" through every screen.

> **What you should see:** When the installer finishes, you can close it. Nothing visible happens on your screen — Node.js is a background tool, not an app with an icon.

### Step 2 — Get your Lumen credentials

You need two secret values from Lumen: an **API key** (a public-ish ID that says "this is my organization") and an **API secret** (a password that proves it). The full walkthrough is in [docs/GET_CREDENTIALS.md](docs/GET_CREDENTIALS.md).

> **Tip:** Keep both values in a safe place. The secret is usually only shown once.

### Step 3 — Register the callback URL on your API key

This step is the one most first-time users skip. Go back to the Lumen dashboard where you made your API key. On that same key, add this address to the list of allowed redirect URLs:

```
http://localhost:5173/callback
```

> **CRITICAL:** Without this, BridgePass will refuse the redirect at the end of login and you'll see an error page from BridgePass itself. There's no workaround on your side — Lumen has to know this URL is allowed before it sends users to it.

### Step 4 — Download this project

The easiest way: on the project's GitHub page, click the green **"Code"** button, then **"Download ZIP"**. Unzip the file into a folder you can find later (your Documents folder is fine).

If you happen to already use Git (a tool programmers use to download code), you can instead open a terminal (the black-or-white window where you type commands) and run:

```
git clone https://github.com/Bayanichain/wallet-and-files-sample-webapp.git
cd wallet-and-files-sample-webapp
```

> **What you should see:** A new folder called `wallet-and-files-sample-webapp` somewhere on your computer.

### Step 5 — Make a copy of the settings file

The project comes with a template settings file named `.env.example`. You need to make a real copy of it called `.env` (just `.env`, no `.example`).

Open a terminal inside the project folder. Then run the command for your computer:

| Your computer | What to type |
|---|---|
| Windows (PowerShell) | `Copy-Item .env.example .env` |
| macOS or Linux | `cp .env.example .env` |

> **What you should see:** A new file called `.env` appears in the folder.

### Step 6 — Fill in your secrets

Open the new `.env` file in any text editor — Notepad on Windows, TextEdit on macOS, or VS Code if you have it. You'll see lines like `LUMEN_API_KEY=...` and `LUMEN_API_SECRET=...`. Replace the placeholder text after the `=` sign with the real values you got in Step 2.

> **Heads up:** No quotes. No spaces around the `=` sign. The line should look like `LUMEN_API_KEY=abc123-def456` and nothing else.

### Step 7 — Download the project's libraries

The app needs a bunch of small helper packages (libraries). Ask Node to download them by typing this in the terminal:

```
npm install
```

> **What you should see:** A lot of text scrolling. It takes one to two minutes the first time. When it stops, you'll be back at the normal terminal prompt with no red error messages.

### Step 8 — Start the app

Now turn on the app:

```
npm start
```

> **What you should see:** Two important lines, somewhere in the colored output:
>
> - `SRV ready on 8787` (your local server is running)
> - `WEB Local: http://localhost:5173` (the website part is ready)
>
> If you see both, the app is alive.

### Step 9 — Open the sign-in page in your browser

Open Chrome (or any browser) and go to:

[http://localhost:5173](http://localhost:5173)

The sign-in page appears. Click **"Continue to BridgePass"**. Complete the login on the BridgePass page (with Google or Facebook). You'll be sent back to this app, and you'll land on the dashboard. From there you can click **View my files** to see your files, or **Upload a file** to drop a new one in. That's it — you're done.

---

## What you'll see

**Sign-in page** — a card with a short explanation and a row of checkboxes for which login methods you want to allow (Google, Facebook). Pick either or both and click **"Continue to BridgePass"**.

**BridgePass** — a separate page hosted by Lumen, where the actual login happens. You complete it like any social login.

**Dashboard** — after a successful login, you land on a card showing:

- Your wallet **address** (a long hexadecimal string starting with `0x`).
- The **account name** on the social provider you used.
- The **email** associated with that account.
- When your **session** expires.
- A **View my files** button.
- An **Upload a file** button.
- A **Sign out** button in the header.

**My Files page** — a paginated table of every file you own. Search by name, sort by various columns, page through them. Clicking a row shows the file's details.

**Upload page** — a drag-and-drop zone (or a click-to-choose-file fallback). When you drop a file, the browser computes a fingerprint, asks the local server for an upload slot, and then uploads the file directly to Azure storage with a progress bar. When it's done, you're sent back to the My Files page.

**Transactions page** — a paginated list of on-chain activity for your wallet. Outgoing transactions are shown in red with a minus sign; incoming ones are green with a plus sign.

> **Note:** A **session** is the period during which the app considers you logged in. Sessions expire on purpose, so a forgotten browser tab can't stay authenticated forever.

---

## How it works (30-second version)

```
Your browser  ->  Local Express server  ->  Lumen Wallet API
   :5173             :8787                   (Azure cloud)
                                              ^
                                              |
                Your browser  <->  BridgePass page  (for the OAuth redirect)

Your browser  ----direct PUT---->  Azure Blob Storage   (during file upload only)
                  (one-time pre-signed URL, bypassing the local server)
```

The **Express server** is a tiny program running on your own computer. Its only job is to attach your API key and secret to outgoing requests before sending them to Lumen, so those secrets never end up in the browser where someone could steal them.

**Sign-in:** When you click "Continue to BridgePass", the browser asks the Express server for a login URL. The Express server asks Lumen (with the API key+secret attached). The browser then visits BridgePass, you log in, and BridgePass redirects you back to `http://localhost:5173/callback` with a short-lived **AuthCode**. The browser hands the AuthCode to the Express server, which trades it in for a **session token**. The browser stores the token in **sessionStorage** (a per-tab storage that clears when you close the tab) and includes it on every later request.

**File uploads** are different. The upload page first asks the Express server for an upload slot. The server replies with a **SAS URL** — a one-time pre-signed link to Azure storage. The browser then **PUTs the file bytes directly to that link**, bypassing your local Express server entirely. That's deliberate: your local server is a thin proxy, and uploads can be large; routing them through the proxy would make uploads slow and waste your computer's bandwidth.

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Documentation

- [docs/SETUP.md](docs/SETUP.md) — the long, step-by-step installation guide for people who've never used a terminal before.
- [docs/GET_CREDENTIALS.md](docs/GET_CREDENTIALS.md) — where to find your Lumen API key and secret, and how to register your callback URL.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — a tour of what's in each folder, the OAuth flow, and the two-step upload.
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) — the six routes the local server provides, for the technically curious.

---

## Top 5 things that go wrong

| What you saw | What it means | How to fix it |
|---|---|---|
| `port 8787 in use` | Another program is already using that network port (a numbered "lane" on your computer). | Open `.env`, change `SERVER_PORT=8787` to something like `SERVER_PORT=8788`, save, then run `npm start` again. |
| `LUMEN_API_KEY missing` (or similar envCheck error) | You haven't filled in your secrets yet. | Re-read Step 6 above and edit `.env`. |
| BridgePass page shows "invalid redirect URL" or similar | You skipped Step 3 — `http://localhost:5173/callback` is not registered on your API key. | Open the Lumen dashboard, edit your API key, add `http://localhost:5173/callback` to the allowed redirect URLs, save. |
| After the redirect, the page says "Sign-in failed" with a `401` | Your `LUMEN_API_KEY` or `LUMEN_API_SECRET` is wrong, or there are spaces/quotes around them in `.env`. | Re-open `.env`, fix the values, save, stop the app (`Ctrl+C`), run `npm start` again. |
| File upload fails with a `*.blob.core.windows.net` CORS error | The Azure storage account behind Lumen doesn't have `http://localhost:5173` on its allowlist for `PUT` requests. This is set on Lumen's side, not yours. | Ask the Lumen team to allow `http://localhost:5173` for `PUT` on their user-files storage account. (Once they enable it, all developers running this sample benefit.) |

> **CORS** (Cross-Origin Resource Sharing) is a browser security rule that blocks websites on one address from talking to a server on a different address — unless the server explicitly allows it. The upload uses CORS twice: once on your local Express server (already configured), and once on Azure Blob Storage (configured on Lumen's side).

---

## License

MIT — see [LICENSE](LICENSE). That means: free to use, modify, and share.
