# Architecture

<p align="center">
  <img src="images/lumen-logo.svg" alt="Lumen" width="100" />
</p>

This page explains how the sample app is put together and why each piece exists. You don't need to read this to use the app — but if you're curious how it works, or you want to extend it, this is the tour.

---

## The picture

```
+--------------------+       +----------------------+       +-----------------------+
|  Browser (5173)    |  -->  |  Express BFF (8787)  |  -->  |  Lumen Wallet API     |
|  Vite + React JSX  |       |  thin proxy          |       |  (Azure Container App)|
|  Tailwind 4        |       |  + helmet + CORS     |       |                       |
|                    |       |  + rate limit        |       |  4 auth + 2 user-file |
|  sessionStorage:   |       |  + Zod body/query    |       |  endpoints            |
|   user token       |       |  injects:            |       |                       |
|   wallet           |       |   lumen-api-key      |       |                       |
|                    |       |   lumen-api-secret   |       |                       |
+--------------------+       +----------------------+       +-----------------------+
       ^   |                                                            ^
       |   |   redirect back with ?AuthCode=                             |
       |   +-------------- BridgePass (Lumen-hosted) <-------------------+
       |                       (separate origin)
       |
       |    upload step: PUT file bytes directly with SAS URL
       +---------------------------------------------> Azure Blob Storage
                                                       (bypasses the BFF)
```

There are three boxes plus two side trips:

1. **The browser part** (the React app at `http://localhost:5173`). This is what you see and click on.
2. **The local Express server** at `http://localhost:8787`. A small program running on your computer that acts as a middleman.
3. **The Lumen Wallet API** out on the internet (hosted in Azure). The real source of authentication, wallet data, and user-file metadata.
4. **BridgePass** — a separate page hosted by Lumen where the actual login happens. The browser visits it directly during the OAuth flow.
5. **Azure Blob Storage** — the actual place file bytes are stored. The browser **PUTs uploaded files directly to a pre-signed URL** Azure provides, bypassing your local Express server.

Both halves of your local app read from a single `.env` settings file at the project root.

> **Note:** **BFF** stands for "Backend For Frontend" — a small backend server dedicated to one specific frontend. It's the polite term for "tiny middleman server".

---

## Why is there a backend server at all?

The short answer: **to keep your API secret hidden.**

Here's the long version. Vite and React projects bundle their settings (anything starting with `VITE_`) directly into the JavaScript file that gets sent to every browser. That means if we put `LUMEN_API_SECRET=...` into a `VITE_` variable, anyone visiting the site could open their browser's developer tools (F12) and copy your secret right out of the JavaScript code.

The Express server side-steps that completely. It stays on **your** machine (or, if you deploy it later, on your hosting provider's server). It holds the secret. When the React app asks for a login URL, a session token, or the user's file list, it asks the Express server. The Express server then asks Lumen — with the secret attached. Lumen replies. The Express server hands the reply back to the React app.

The browser never sees the secret. Even if someone inspects every byte of the JavaScript that runs in your browser, the secret isn't there.

---

## The BridgePass OAuth flow (the headline)

This is the first core mechanic. It's a 10-step dance that happens every time a user signs in.

1. The user opens the app and lands on `/login`. The React page asks the Express server, "give me a BridgePass login URL". This is `POST /api/auth/login-config` with a small body describing which login methods are allowed (Google, Facebook, MetaMask) and where to send the user back (the `RedirectURL` — set to `http://localhost:5173/callback`).
2. The Express server forwards that request to Lumen, with your API key and secret attached. Lumen replies with a `LoginURL` (a long https link that points at BridgePass) and a `Config` object.
3. The Express server hands that reply back to the browser.
4. The React page sets `window.location.href` to the `LoginURL`. The browser leaves your app and lands on the BridgePass page.
5. On BridgePass, the user picks a login method and completes it (Google sign-in, Facebook sign-in, or MetaMask wallet signature).
6. BridgePass verifies the result and redirects the browser back to `http://localhost:5173/callback?AuthCode=...`. The `AuthCode` is a short-lived, single-use proof that the user really did finish the login. It expires fast.
7. The React `/callback` page reads the `AuthCode` from the URL and immediately sends it to the Express server. This is `GET /api/auth/access-token` with the AuthCode in a header called `lumen-authentication-code`.
8. The Express server forwards that to Lumen. Lumen verifies the AuthCode, marks it as spent, and replies with a `Token` (the session token) plus a `Wallet` object describing the user's wallet.
9. The React app stores both `Token` and `Wallet` in **sessionStorage** — a per-tab storage in the browser that clears when you close the tab. Every later request to the Express server then includes the token in a header called `lumen-user-token`. The Express server forwards that header to Lumen upstream.
10. When the user clicks "Sign out", the React app calls `DELETE /api/auth/logout` (with the token in the header), Lumen invalidates the session, and the React app clears sessionStorage and routes back to `/login`.

> **Note:** **sessionStorage** is one of two small storages every browser provides. Its sibling is `localStorage`, which survives forever until cleared. We picked sessionStorage on purpose: a forgotten browser tab can't stay logged in indefinitely, and the "blast radius" of a stolen token is smaller — closing the tab effectively logs you out.

> **Note:** An **AuthCode** is the OAuth "authorization code" — a one-time-use token issued at the end of the user's login on BridgePass, designed to be exchanged immediately for a longer-lived session token. The exchange happens through your backend so secrets stay off the browser.

On every page reload, if there's a token in sessionStorage, the React app calls `GET /api/auth/authenticate` once to confirm the token is still valid. If Lumen says "no" (401), the app clears the session and routes back to `/login` automatically.

---

## The two-step upload

This is the second core mechanic, unique to this sample. A user file is not sent through your Express server. It goes around it.

1. **The browser computes a fingerprint.** Before uploading anything, the browser reads the file's bytes locally and runs them through a fingerprint algorithm called **MD5**. The result is a short 24-character string that uniquely identifies the file's content. Azure will verify this fingerprint on the other end. The library that does this is called `spark-md5`.
2. **The browser asks the Express server for an upload slot.** This is `POST /api/user/files?path=/`, with a JSON body containing the file's name, extension, and the MD5 fingerprint. The Express server forwards this to Lumen (with your API key, your API secret, and the user's session token).
3. **Lumen returns a one-time pre-signed URL.** Lumen reserves a spot in Azure Blob Storage and replies with three things: a **SAS URL** (a long Azure link that grants permission to upload to one specific spot, for a short time, with no further authentication), a **WorkflowID** (an ID for the background processing that will run after the upload), and the **File** metadata record.
4. **The browser uploads the file bytes directly to that SAS URL.** This is an HTTP `PUT` from the browser straight to Azure Blob Storage — your local Express server is not involved. The browser includes two important headers: `x-ms-blob-type: BlockBlob` (telling Azure what kind of blob this is) and `x-ms-blob-content-md5: <Checksum>` (the same fingerprint from step 1).
5. **Azure verifies the fingerprint and accepts the file.** If the bytes Azure received hash to the same MD5 as the header, the upload is committed. Lumen kicks off a background workflow to process the file (metadata extraction, virus scan, indexing — whatever Lumen does internally).

**Why this matters:** the file bytes never go through your Express server. Upload speed is limited only by your internet connection, not by the proxy on your computer. The local Express server stays small and fast, even if the user is uploading a 200-MB file.

> **Note:** A **SAS URL** (Shared Access Signature URL) is Azure's pattern for granting temporary, scoped permission without sharing the storage account's master key. The URL itself encodes which file, what operation (in this case `PUT`), and an expiry time. Once it expires (or once it's been used), it stops working.

> **Note:** **MD5** is a fast, well-known checksum algorithm. It is not safe for password hashing or signatures, but it's the standard choice for "does what I uploaded match what arrived" because Azure understands it natively.

---

## Folder map

```
/                          single root .env, package.json with workspaces
├── server/                Express BFF
│   ├── package.json
│   └── src/
│       ├── index.js              Express bootstrap, security middleware, route mounting
│       ├── lumenClient.js        axios instance with the api-key+secret interceptor
│       ├── middleware/
│       │   ├── envCheck.js       fails fast if .env is missing or unfilled
│       │   ├── errorHandler.js   converts upstream Lumen errors into { ok:false, status, error }
│       │   └── validateQuery.js  Zod schemas (login-config body, list query, path query, upload body) + requireUserToken
│       └── routes/
│           ├── auth.routes.js    the 4 proxied auth routes
│           ├── files.routes.js   the 2 proxied user-file routes
│           └── wallets.routes.js the proxied wallet-transactions route
└── web/                   Vite + React
    ├── vite.config.js     envDir set to '..' so it reads root .env
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx              React entry
        ├── App.jsx               router only
        ├── index.css             Tailwind + Lumen design tokens
        ├── api/client.js         axios pointed at the local BFF, with setUserToken module-level setter
        ├── context/
        │   └── AuthContext.jsx   holds { token, wallet }, hydrates from sessionStorage
        ├── lib/
        │   ├── md5.js            computeMd5Base64, stripExt, extOf — browser-side MD5 helpers
        │   └── path.js           normalize, joinPath, parentPath — path-string helpers
        ├── components/
        │   ├── Header.jsx
        │   ├── Layout.jsx
        │   ├── Spinner.jsx
        │   ├── ErrorBanner.jsx
        │   ├── EmptyState.jsx
        │   ├── Pagination.jsx
        │   ├── SearchSortBar.jsx
        │   ├── UploadDropzone.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx         method checkboxes + "Continue to BridgePass" button
            ├── Callback.jsx      reads ?AuthCode= and exchanges it for a session token
            ├── Dashboard.jsx     (protected) wallet info card + nav buttons
            ├── MyFiles.jsx       (protected) paginated file table + search + sort
            ├── Upload.jsx        (protected) drag-drop + MD5 + PUT-to-SAS with progress
            ├── Transactions.jsx  (protected) paginated on-chain history for the signed-in wallet
            └── NotFound.jsx
```

In plain English: there are two main folders. `server/` holds the middleman server. `web/` holds the website (React) part. The `.env` file at the very top is shared by both.

---

## The 6 routes

The Express server exposes four paths under `/api/auth` (for the BridgePass OAuth flow) and two under `/api/user/files` (for the logged-in user's files). Each one is a thin proxy: it adds your `lumen-api-key`, `lumen-api-secret`, and — where needed — a per-request `lumen-user-token` or `lumen-authentication-code` header before forwarding the request to Lumen.

The full reference is in [API_REFERENCE.md](API_REFERENCE.md).

---

## Security choices

Each row below is a possible attack or mistake, and what we did to block it.

| Concern | Mitigation |
|---|---|
| Secret leakage | The API key and secret live in `.env` (which is in `.gitignore`, so it never goes to Git) and only on the server. The browser-side `VITE_*` variables are intentionally limited to the BFF URL and the callback URL — nothing sensitive. |
| Cross-origin attacks | CORS (Cross-Origin Resource Sharing) is a browser rule limiting which websites can call your server. We use an allowlist driven by `ALLOWED_ORIGIN`. Methods allowed on `/api` are `GET`, `POST`, `DELETE`, and `PATCH`. |
| Header injection | We use Helmet (a security middleware) to set a strict Content Security Policy with an explicit `connect-src` allowlist — so the browser refuses to load resources from unexpected places. `frame-ancestors` is `'none'`, so the app can't be embedded in an iframe. |
| Abuse / runaway scripts | `express-rate-limit` caps `/api/*` at **200 requests per 15 minutes per IP address**. Higher than the auth-only sample (which is at 100) because the file table can pull more pages in normal use. If something starts hammering the server, it gets a `429 Too Many Requests` response. |
| Body / query fuzzing | Zod (a validation library) checks every incoming body and query — `AllowedLoginMethods` shape on login-config, `pageNumber`/`pageSize`/`search`/`sort[0][field]` on file list (allowlist of fields: `Name`, `_ts`, `FileExtension`, `CreatedAt`, `UpdatedAt`, `OwnerAddress`), `path` regex on the upload `path` query, `Name`/`FileExtension`/base64-MD5 `Checksum`/`Description` on the upload body. Junk values get rejected before the request ever reaches Lumen. |
| Oversized JSON | `express.json({ limit: '32kb' })` caps the request body at 32 kilobytes. The upload body is metadata only — bytes go directly to Azure. |
| Error leakage | Errors from Lumen are normalized into a clean `{ ok, status, error }` shape. Stack traces (which can reveal internal details) never reach the browser. |
| Token theft via XSS | The session token is stored in **sessionStorage** — per-tab, clears on tab close. We didn't use `localStorage` (which persists forever). We didn't use a cookie (which would need CSRF protection). sessionStorage trades off a little user convenience (each tab logs in separately) for a smaller XSS blast radius. |
| Upload tampering | The browser computes the MD5 fingerprint and sends it to Lumen with the upload-slot request. Azure independently re-checks the fingerprint when the file lands. A mismatch is rejected. The fingerprint also makes the upload idempotent — uploading the same bytes twice produces the same result. |

> **Heads up:** These mitigations are good for a local sample and small deployments. For real production traffic, see "Deploying this" below.

---

## Design system choice

Lumen has a full design system package called `@bayanichain/lumen-design-system`. We deliberately do **not** depend on it in this sample, because that package lives on GitHub Package Registry — meaning every public user would have to set up an `.npmrc` file with an authentication token before `npm install` would work. That would completely break the "anyone can run this in ten minutes" promise of this sample.

Instead, we mirror the four core Lumen design principles directly in plain Tailwind v4:

- **Flat and sharp** — no rounded corners (`border-radius: 0` everywhere, except the loading spinner ring which needs a circle).
- **Monochrome** — black, white, and gray only. The only color exceptions are `#ef4444` for errors and `#22c55e` for success.
- **Typographic** — the Sora font, with tight letter spacing (`tracking: -0.04em`).
- **Minimal** — no shadows, no gradients, 1-pixel solid borders only.

If you're building your own internal app and want to use the real design system, look at how `mvp-baas-org-webapp` wires it up.

---

## What's intentionally NOT here

This sample is deliberately small. We left things out for clarity:

- **No folder hierarchy on user files.** Every uploaded file lands at the root path `/`. The Lumen user-files API supports a `path`, but we don't expose a folder picker in this sample. You can add one — the field is already validated by Zod on the server.
- **No chunked upload for huge files.** The browser PUTs the entire file in a single request. That works fine up to a few hundred MB on a typical home connection. For multi-gigabyte uploads, you'd want to switch to Azure's block-list upload API; that's out of scope for this sample.
- **No batch upload.** You can only upload one file at a time. The user-files API is single-file by design — the **organization-files** API has a batch endpoint, and that's exposed in the separate `files-management-sample-webapp` sample (which uses org credentials, not end-user credentials).
- **No token refresh.** When the session expires, the user is sent back to `/login` and signs in again.
- **No multi-tab sync.** Because we use `sessionStorage`, each browser tab is its own session.
- **No database, no server-side sessions.** The Express server holds zero state. Restart it any time without losing anything.

---

## Deploying this

The local-only flow works as-is. If you want to put this sample on the public internet, here's the short version:

1. **Frontend** — deploy to Vercel or Netlify (both free tiers). Set the environment variable `VITE_BFF_URL` to your backend's public URL, and `VITE_CALLBACK_URL` to `https://your-frontend-domain/callback`.
2. **Backend** — deploy to Render, Railway, or Azure Container Apps. Set `LUMEN_API_KEY`, `LUMEN_API_SECRET`, and `ALLOWED_ORIGIN` (= your frontend's public URL).
3. **CORS update** — make sure `ALLOWED_ORIGIN` matches the deployed frontend URL exactly. Update the Helmet CSP `connect-src` allowlist if it's pointing at a new host.
4. **Register the production callback URL on your API key** — exactly the same step you did for `http://localhost:5173/callback`, but with the deployed frontend's HTTPS URL + `/callback`. BridgePass won't redirect to an unregistered URL.
5. **Azure Blob CORS** — ask the Lumen team to add your deployed frontend URL to the allowed origins on their user-files storage account. Without it, browser uploads from your deployed site will fail with a CORS error.

> **Tip:** For a true production deployment, you'd also want centralized logging, distributed rate limiting (backed by Redis instead of in-memory), and TLS (HTTPS) at both hops. Those upgrades are out of scope for this sample but are well-trodden paths if you want them.
