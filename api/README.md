# MR MESOFF — portable `api/` (Meta OAuth relay for the website)

A **zero-dependency, framework-free** folder of Vercel Functions for
**https://mrmesoff.vercel.app**. Its single job: serve the public HTTPS
redirect endpoint Meta needs for per-customer OAuth/onboarding and hand
the result to the customer's running **MR MESOFF desktop app** on
loopback — with **no secrets in this folder and nothing stateful**.

> Deliberately dumb relay (verified design, `backend/README.md` §15.4):
> tokens, the Meta App Secret and signature verification live ONLY in the
> customer's desktop install. The relay can neither mint, verify, nor
> fake a connection — that is mathematically impossible without the
> customer's locally-minted signed state.

## What's inside

| Path | Route | Purpose |
|---|---|---|
| `meta/callback.js` | `GET /api/meta/callback` | Public OAuth redirect page. Relays `code` + `state` from Meta to `http://127.0.0.1:<port>/api/v1/channels/<platform>/connection/complete` via page JS, then renders the honest result. Handles Meta's own top-level `error=…` redirects. |

`package.json` pins Node ≥ 20 and declares **no dependencies** — if a
repository already has one, it is never read (each function is standalone;
CommonJS is used deliberately so no `type: module` assumption exists).

## Copy-and-deploy checklist (website repository)

1. Copy the **whole `api/` folder** to the website repository root, next
   to `web/`. No imports cross the folder boundary — nothing else is
   required to make the function deployable.
2. **Do not** remove or replace the website's existing `vercel.json`.
   Nothing here needs an entry in it: routes are implicitly discovered
   from the filesystem (`api/meta/callback.js` → `/api/meta/callback`).
   If the website's `vercel.json` has a build/output configuration, keep
   it — this folder adds functions only, no routing conflicts, because
   no static asset or website route collides with `/api/meta/*`.
3. No environment variables are REQUIRED by this function (it is
   secret-free by design). Optional hardening knob, set in the Vercel
   project if desired:
   - `MESOFF_RELAY_MAX_STATE_BYTES` (int, default `4096`) — reject absurd
     query strings earlier.
4. Deploy to production (same pipeline as before — this only adds
   functions alongside the static site).
5. Point the desktop-side config at the deployed origin:
   `MESOFF_META_REDIRECT_URI=https://mrmesoff.vercel.app/api/meta/callback`
   and (desktop `.env`) `MESOFF_WEBSITE_ORIGIN=https://mrmesoff.vercel.app`.
6. Verify: `curl -sS https://mrmesoff.vercel.app/api/meta/callback`
   must return **200** + the relay HTML (never 404; never 405 for GET).
   Open `?error=access_denied&error_description=…` and confirm the page
   renders the honest failure. In Meta App Dashboard → Facebook Login →
   Settings, add `https://mrmesoff.vercel.app` under **Valid OAuth
   Redirect URIs** (and `Allow Use for Business`).

## Local function test

```bash
node --test api-tests/callback.test.cjs api-tests/site-package.test.cjs
# run from this repository's root
```

(The suites drive the exported handler and the page's inline script with
mock req/res + DOM stubs — no network, no deployment needed.)

## Security properties (implemented, not aspirational)

- **No CORS on the relay itself**: it serves HTML for top-level browser
  navigation only (CSP `default-src 'none'`, `form-action 'none'`,
  `no-store`, `noindex`). No API caller is trusted.
- The `code`/`state` are relayed verbatim; the relay **cannot** be used
  to inject or replay a connection because the desktop backend verifies
  the HMAC-SHA256-signed state (key derived from the machine-local app
  secret), checks expiry and platform binding, and consumes the
  single-use nonce. A tampered or reused state is rejected there.
- The page displays **only** provider-supplied human-readable
  negotiation details and the local API's sanitized `detail`; the
  authorization code is never rendered.
- HTTPS→`http://127.0.0.1:<port>` is Chrome's officially-permitted
  "potentially trustworthy" exception for loopback, so the page works on
  the exact computer where the desktop app runs, and only there.

## Why loopback handoff instead of a server-side redirect?

A serverless function cannot reach a customer's `127.0.0.1` — the handoff
MUST be performed by the browser on the customer's machine while the
desktop app is live. This is the same browser-mediated-relay pattern used
by GitHub CLI, VS Code Remote and Sentry: render a completion page, let
page JS perform the localhost call.
