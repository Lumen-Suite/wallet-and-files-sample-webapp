# API Reference

<p align="center">
  <img src="images/lumen-logo.svg" alt="Lumen" width="100" />
</p>

This page lists the six internet addresses (routes) the local Express server provides. The website part of the app uses them automatically as you click through the sign-in flow, browse files, and upload — **you don't need to call them by hand** unless you're curious, debugging, or building something on top of this sample.

> **Note:** A **route** is a specific URL path the server responds to. For example, `GET /api/user/files` is a route. **GET**, **POST**, and **DELETE** are HTTP methods. **GET** means "ask for data". **POST** means "submit data". **DELETE** means "destroy this resource".

Each route is a thin proxy: the local Express server attaches your `lumen-api-key` and `lumen-api-secret` headers (and a per-request user token or auth code where applicable), then forwards the call to the real Lumen Wallet API.

**Base URL when running locally:** `http://localhost:8787`

> **Tip:** A **base URL** is the part of the address that goes in front of every route. So `GET /api/user/files` actually lives at `http://localhost:8787/api/user/files` when you run the app on your own computer.

---

## Route 1 — Build the BridgePass login URL

### `POST /api/auth/login-config`

The first step of the sign-in flow. You tell the server which login methods you want to allow and where BridgePass should send the user back. The server returns a `LoginURL` to point the browser at.

### Body

The body must be JSON. Validated by Zod before the request leaves your server.

```json
{
  "AllowedLoginMethods": {
    "Wallets": ["METAMASK"],
    "SocialMedia": ["GOOGLE", "FACEBOOK"]
  },
  "RedirectURL": "http://localhost:5173/callback"
}
```

| Field | Type | Notes |
|---|---|---|
| `AllowedLoginMethods.Wallets` | array, optional | Currently only `"METAMASK"` is supported. |
| `AllowedLoginMethods.SocialMedia` | array, optional | One or both of `"GOOGLE"`, `"FACEBOOK"`. |
| `RedirectURL` | string (a real URL) | Must match a redirect URL you registered on your API key. |

> **Heads up:** You must include at least one method between `Wallets` and `SocialMedia`. Sending both arrays empty (or omitting both) is a `400`.

### Example

```
curl -X POST "http://localhost:8787/api/auth/login-config" \
  -H "Content-Type: application/json" \
  -d '{"AllowedLoginMethods":{"SocialMedia":["GOOGLE"]},"RedirectURL":"http://localhost:5173/callback"}'
```

> **What you should see:** A JSON object with a `LoginURL` field (a long https link) and a `Config` object.

### Response shape

```json
{
  "LoginURL": "https://bridgepass.lumen.example/auth?...",
  "Config": { "...": "opaque" }
}
```

### What it wraps

`POST {LUMEN_API_BASE_URL}/Custodial/login-config` — with your org `lumen-api-key` and `lumen-api-secret` attached server-side.

---

## Route 2 — Exchange the AuthCode for a session token

### `GET /api/auth/access-token`

After BridgePass finishes the login, it redirects the browser back to `/callback?AuthCode=...`. The React app reads that `AuthCode` and immediately hands it to this route, which trades it in for a session token.

### Headers

| Name | What it holds |
|---|---|
| `lumen-authentication-code` | The single-use `AuthCode` from the redirect URL. |

> **Heads up:** The AuthCode is **single-use**. Refreshing the callback page after a successful exchange will produce a `400` the second time, because Lumen has already marked the code as spent.

### Example

```
curl "http://localhost:8787/api/auth/access-token" \
  -H "lumen-authentication-code: AUTH-CODE-FROM-REDIRECT"
```

> **What you should see:** A JSON object with a `Token` (containing the session token and its expiry) and a `Wallet` describing the logged-in user's wallet.

### Response shape

```json
{
  "Token": {
    "token": "long-opaque-session-token",
    "expiresAt": "2026-05-22T14:00:00.000Z"
  },
  "Wallet": {
    "WalletAddress": "0x1234...abcd",
    "Provider": { "AccountName": "Alice", "Email": "alice@example.com" }
  }
}
```

### What it wraps

`GET {LUMEN_API_BASE_URL}/Custodial/access-token` — with the AuthCode forwarded as a header.

---

## Route 3 — Confirm the session token is still valid

### `GET /api/auth/authenticate`

The React app calls this once on every page reload, to make sure the token it pulled out of sessionStorage hasn't expired. If Lumen says no (`401`), the app clears the session and routes back to `/login`.

### Headers

| Name | What it holds |
|---|---|
| `lumen-user-token` | The session token from Route 2. |

### Example

```
curl "http://localhost:8787/api/auth/authenticate" \
  -H "lumen-user-token: SESSION-TOKEN-FROM-ROUTE-2"
```

> **What you should see:** A JSON object echoing the current `Token` and `Wallet`, with a fresh expiry. Or a `401` if the token has expired.

### Response shape

```json
{
  "Token": { "token": "...", "expiresAt": "..." },
  "Wallet": { "WalletAddress": "0x...", "Provider": { "..." : "..." } }
}
```

### What it wraps

`GET {LUMEN_API_BASE_URL}/Custodial/authenticate`

---

## Route 4 — End the session

### `DELETE /api/auth/logout`

The React app calls this when the user clicks **Sign out**. Lumen invalidates the session server-side, then the React app clears sessionStorage and routes back to `/login`.

### Headers

| Name | What it holds |
|---|---|
| `lumen-user-token` | The session token to invalidate. |

### Example

```
curl -X DELETE "http://localhost:8787/api/auth/logout" \
  -H "lumen-user-token: SESSION-TOKEN-FROM-ROUTE-2"
```

> **What you should see:** A small JSON object with a `Message` confirming the session was ended.

### Response shape

```json
{ "Message": "Logged out" }
```

### What it wraps

`DELETE {LUMEN_API_BASE_URL}/Custodial/logout`

---

## Route 5 — List the logged-in user's files

### `GET /api/user/files`

Returns a paginated list of every file owned by the logged-in end-user. Used by the "My Files" page.

### Headers

| Name | What it holds |
|---|---|
| `lumen-user-token` | The session token from Route 2. |

### Query parameters (all optional)

These are extra values you can attach to the URL after a `?` to filter or sort the results. The Express server validates each value with Zod before forwarding the request.

| Name | Type | Default | What it does |
|---|---|---|---|
| `pageNumber` | integer (1 to 10000) | 1 | Which page of results to return. |
| `pageSize` | integer (1 to 100) | 10 | How many rows per page. |
| `search` | string (up to 200 chars) | — | Full-text search across file fields. |
| `sort[0][field]` | string | — | One of: `Name`, `_ts`, `FileExtension`, `CreatedAt`, `UpdatedAt`, `OwnerAddress`. |
| `sort[0][order]` | `asc` or `desc` | — | Sort direction (ascending or descending). |

### Example

```
curl "http://localhost:8787/api/user/files?pageNumber=1&pageSize=5&sort[0][field]=CreatedAt&sort[0][order]=desc" \
  -H "lumen-user-token: SESSION-TOKEN-FROM-ROUTE-2"
```

> **What you should see:** A JSON object with a `Files` array and `Pagination` info.

### Response shape

```json
{
  "Files": [
    {
      "id": "file-xyz",
      "Name": "report",
      "FileExtension": "pdf",
      "OwnerAddress": "0x1234...abcd",
      "Checksum": "base64-md5-here",
      "CreatedAt": "2026-05-22T13:00:00.000Z"
    }
  ],
  "Pagination": { "TotalRowCount": 7, "TotalPage": 2, "CurrentPage": 1 }
}
```

### What it wraps

`GET {LUMEN_API_BASE_URL}/user/files`

---

## Route 6 — Reserve an upload slot for a new file

### `POST /api/user/files?path=...`

The first step of the two-step upload. You hand the server the file's metadata (name, extension, fingerprint), and the server hands you back a one-time **SAS URL** to PUT the bytes to.

### Headers

| Name | What it holds |
|---|---|
| `lumen-user-token` | The session token from Route 2. |

### Query parameter

| Name | What it holds |
|---|---|
| `path` | The destination path for the file inside the user's storage. Use `/` for the root. Validated against a strict regex on the server (`[A-Za-z0-9_\-./%() ]`). |

### Body

```json
{
  "Name": "report",
  "FileExtension": "pdf",
  "Checksum": "BASE64-MD5-OF-FILE-BYTES==",
  "Description": "Optional human-readable description."
}
```

| Field | Type | Notes |
|---|---|---|
| `Name` | string (1 to 255 chars) | The file name without the extension. |
| `FileExtension` | string (1 to 32 chars) | The extension, no leading dot. |
| `Checksum` | base64-encoded MD5 | A 24-character string ending in `==`. This is the 16-byte MD5 of the file's bytes, base64-encoded. The browser computes this with `spark-md5` before calling this route. |
| `Description` | string (up to 2000 chars), optional | Defaults to `""` if omitted. |

> **Heads up:** The `Checksum` must be **base64-encoded MD5**, not hex. The Zod regex requires `22 base64 chars + ==`. Hex MD5 (32 lowercase chars) is rejected.

### Example

```
curl -X POST "http://localhost:8787/api/user/files?path=%2F" \
  -H "Content-Type: application/json" \
  -H "lumen-user-token: SESSION-TOKEN-FROM-ROUTE-2" \
  -d '{"Name":"report","FileExtension":"pdf","Checksum":"AAAAAAAAAAAAAAAAAAAAAA==","Description":""}'
```

> **What you should see:** A JSON object with a `SASURL` (the Azure pre-signed link), a `WorkflowID` (background processing ID), and the new `File` metadata record.

### Response shape

```json
{
  "SASURL": "https://lumenuserfiles.blob.core.windows.net/...?sv=...&sig=...",
  "WorkflowID": "wf-abc123",
  "File": {
    "id": "file-xyz",
    "Name": "report",
    "FileExtension": "pdf",
    "Checksum": "AAAAAAAAAAAAAAAAAAAAAA==",
    "OwnerAddress": "0x1234...abcd"
  }
}
```

### The headline: what happens next (step 2 of the upload)

After this route returns, the **browser** PUTs the file bytes directly to the `SASURL`. Your local Express server is not involved in that step. The PUT must include two headers:

```
x-ms-blob-type: BlockBlob
x-ms-blob-content-md5: <same Checksum value from the POST body>
```

Azure verifies the fingerprint when the bytes land. A mismatch is rejected (the upload fails and the workflow doesn't run). The `Content-Type` header should reflect the file's MIME type if known, or `application/octet-stream` as a fallback.

> **Why directly to Azure?** Routing file bytes through your local Express server would make uploads slow and double the bandwidth your computer spends. The pre-signed URL is scoped to one file, one operation (`PUT`), and a short expiry — so it's safe to give to the browser.

### What it wraps

`POST {LUMEN_API_BASE_URL}/user/files/{Path}` — where `{Path}` is the URL-encoded value of the `path` query parameter.

---

## Error responses

When something goes wrong, every route comes back with the same shape — and the HTTP status code (a 3-digit number that tells you what kind of problem it is) from the upstream Lumen call:

```json
{
  "ok": false,
  "status": 401,
  "error": "Invalid API key"
}
```

> **Note:** **HTTP status codes** are standard 3-digit numbers. Anything starting with `2` means success. `4xx` means the client (you) did something wrong. `5xx` means the server had a problem.

### Common statuses

| Status | What it means | How to fix it |
|---|---|---|
| 400 | Bad body or missing header — for example a missing `lumen-authentication-code`, an empty `AllowedLoginMethods`, a `RedirectURL` that isn't a valid URL, a `Checksum` that isn't base64-MD5, or a `path` with disallowed characters. Zod rejected it before the request ever reached Lumen. | Check the JSON body, required headers, and query parameters against the route above. |
| 401 | Your `LUMEN_API_KEY` or `LUMEN_API_SECRET` is invalid (Route 1), the AuthCode is missing or expired (Route 2), or the session token is missing or expired (Routes 3, 4, 5, 6). | Re-check `.env`, re-sign-in if needed, save, then restart with `npm start`. |
| 403 | Your API key is valid but doesn't have permission for the WALLETS module on your organization, or the end-user lacks a personal-files quota. | Contact the Lumen team to enable the appropriate module and quota. |
| 404 | The route path or upstream resource doesn't exist. | Double-check the URL — easy to mistype. |
| 429 | You hit the local rate limit: **200 requests per 15 minutes per IP**. | Slow down. Wait a few minutes and try again. |
| 500 | Something upstream failed. | Check the terminal where `npm start` is running for more detail. |

---

## Health check (outside `/api`)

### `GET /health`

A tiny endpoint to confirm the server is alive.

### Example

```
curl "http://localhost:8787/health"
```

> **What you should see:**
>
> ```json
> { "ok": true, "service": "wfs-server" }
> ```

Use this when you suspect the server isn't running and want a quick yes/no answer before debugging anything bigger.
