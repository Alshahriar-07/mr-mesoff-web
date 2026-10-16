/**
 * MR MESOFF — Meta OAuth relay callback (Vercel Function, zero dependencies).
 *
 * This is the PUBLIC HTTPS endpoint that Meta redirects the user's browser
 * to after the login dialog (MESOFF_META_REDIRECT_URI = https://mrmesoff.vercel.app/api/meta/callback).
 *
 * Deliberately DUMB and SECRET-FREE (per backend/README.md §15):
 *  - It holds no Meta secrets, does no token exchanges, makes no API calls.
 *  - A serverless function cannot reach the customer's loopback, so the
 *    page's JavaScript performs the handoff to the desktop backend running
 *    on the SAME machine at http://127.0.0.1:<port> (Chrome permits HTTPS
 *    pages to contact localhost; the loopback server allowlists this
 *    exact origin via MESOFF_WEBSITE_ORIGIN — never a wildcard).
 *  - The `code` and `state` values are relayed verbatim to the endpoint
 *    that minted the state; THAT endpoint verifies the signed state
 *    (HMAC-SHA256 keyed from the app secret), binds it to the store, and
 *    consumes it once. The relay can neither validate nor fake that.
 *  - Nothing is logged and no value is persisted by this function.
 */

module.exports = async (req, res) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self' http://127.0.0.1:* http://localhost:*; img-src 'self' data:; form-action 'none'; frame-ancestors 'none'; base-uri 'none'"
  );
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end(JSON.stringify({ error: { code: "METHOD_NOT_ALLOWED", message: "GET only." } }));
    return;
  }

  const q = safeQuery(req);
  // Optional hardening: reject absurdly large authorization payloads
  // before they are ever echoed into the page.
  const maxBytes = parseInt(process.env.MESOFF_RELAY_MAX_STATE_BYTES || "4096", 10);
  const payloadBytes = Buffer.byteLength((q.code || "") + (q.state || ""));
  if (Number.isFinite(maxBytes) && maxBytes > 0 && payloadBytes > maxBytes) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      page(safeJsonForHtml({ errorLine: "The authorization payload is too large — restart the connection from the desktop app." }))
    );
    return;
  }
  // Meta may report OAuth errors directly at the redirect (top-level
  // error parameters). Relay the human-readable reason verbatim.
  const providerError = q.error || q.error_reason || "";
  const errorDetail = q.error_description || q.error_message || "";
  const errorLine = providerError
    ? `${providerError}${errorDetail ? ` — ${errorDetail}` : ""}${q.error_code ? ` (code ${q.error_code})` : ""}`.slice(0, 1200)
    : "";
  const cancelled = /^(access_denied|user_denied|user_cancelled|cancelled)$/i.test(providerError);

  const boot = {
    code: q.code || "",
    state: q.state || "",
    errorLine,
    cancelled,
  };

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(page(safeJsonForHtml(boot)));
};

function safeQuery(req) {
  const out = {};
  for (const [k, v] of Object.entries(req.query || {})) {
    out[k] = Array.isArray(v) ? String(v[0] ?? "") : String(v ?? "");
  }
  return out;
}

function safeJsonForHtml(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028|\u2029/g, "");
}

function page(bootJson) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>MR MESOFF — completing Meta authorization</title>
<style>
  :root { color-scheme: light; --ink: #17201d; --muted: #65716b; --line: #e2e9e5; --green: #18794e; --green-soft: #edf7f1; --red: #a3443f; --red-soft: #fff1ef; --surface: #fff; --canvas: #f2f6f3; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 28px 16px;
    font-family: "Aptos", "Segoe UI", sans-serif;
    background: radial-gradient(ellipse at 10% 0%, #e6f2e9 0, transparent 42%), var(--canvas); color: var(--ink); font-size: 14px; line-height: 1.55;
  }
  .card {
    width: min(560px, 100%); background: var(--surface); border: 1px solid var(--line);
    border-radius: 12px; padding: clamp(22px, 5vw, 36px); box-shadow: 0 18px 56px rgba(31, 66, 47, .10); animation: arrive .35s ease-out both;
  }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 30px; color: #263b30; font-weight: 700; letter-spacing: .02em; }
  .brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; color: #fff; background: #18794e; font-size: 12px; }
  .eyebrow { margin: 0 0 7px; color: var(--green); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; }
  h1 { font-size: clamp(22px, 5vw, 27px); line-height: 1.2; font-weight: 650; margin: 0 0 9px; }
  .intro { color: var(--muted); font-size: 14px; margin: 0; max-width: 54ch; }
  .box { margin-top: 24px; border-radius: 9px; padding: 15px 16px; font-size: 13px; display: none; }
  .box.ok { background: var(--green-soft); color: #216341; border: 1px solid #c9e4d3; }
  .box.cancel { background: #f5f8f6; color: #4f6056; border: 1px solid var(--line); }
  .box.bad { background: var(--red-soft); color: #873c37; border: 1px solid #f0ceca; }
  .box.wait { background: #f5f8f6; color: #4f6056; border: 1px solid var(--line); }
  .detail { display: block; margin-top: 5px; font-size: 12px; opacity: .88; overflow-wrap: anywhere; }
  .spinner {
    position: absolute; left: 14px; top: 50%; width: 12px; height: 12px;
    border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%;
    animation: spin .8s linear infinite;
  }
  .wait-box { position: relative; padding-left: 42px; padding-right: 14px; }
  .help { margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }
  .help-label { margin: 0 0 7px; color: var(--ink); font-weight: 650; }
  .close { display: none; margin-top: 18px; padding: 9px 13px; color: #fff; background: #18794e; border: 0; border-radius: 7px; font: inherit; font-weight: 600; cursor: pointer; }
  .close:hover { background: #12643f; }
  @keyframes arrive { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; } }
  ul { margin: 7px 0 0; padding-left: 18px; }
  li { margin: 3px 0; }
</style>
</head>
<body>
<main class="card">
  <div class="brand" aria-label="MR MESOFF"><span class="brand-mark" aria-hidden="true">MR</span><span>MR MESOFF</span></div>
  <p class="eyebrow">Secure account connection</p>
  <h1 id="page-title">Completing Meta authorization</h1>
  <p class="intro">Your one-time authorization is being handed to the MR MESOFF desktop app on this computer. Credentials are not stored on this website.</p>

  <div id="wait" class="box wait wait-box" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <strong>Contacting the MR MESOFF desktop app…</strong>
    <span class="detail">If nothing happens for a while, the steps below resolve it.</span>
  </div>
  <div id="ok" class="box ok" role="status" aria-live="polite">
    <strong>Authorization complete — you can close this tab.</strong>
    <span id="ok-detail" class="detail"></span>
  </div>
  <div id="cancelled" class="box cancel" role="status" aria-live="polite">
    <strong>No changes were made to your connections.</strong>
    <span id="cancel-detail" class="detail"></span>
  </div>
  <div id="bad" class="box bad" role="alert">
    <strong id="bad-title">The authorization could not be completed.</strong>
    <span id="bad-detail" class="detail"></span>
  </div>

  <button class="close" id="close" type="button">Close this tab</button>
  <div class="help" id="help">
    <p class="help-label">If the connection does not finish</p>
    <ul>
      <li>Keep the MR MESOFF desktop app open <em>on this computer</em> — the connection completes locally.</li>
      <li>If you saw “desktop app unreachable”, make sure the app is running and try again from Settings → Messaging channels → Connect.</li>
      <li>Authorization codes are single-use and expire quickly. Re-running Connect issues a fresh one.</li>
    </ul>
  </div>
</main>
<script>
"use strict";
(function () {
  var boot = ${bootJson};
  var waitEl = document.getElementById("wait");
  var okEl = document.getElementById("ok");
  var cancelledEl = document.getElementById("cancelled");
  var badEl = document.getElementById("bad");
  var okDetail = document.getElementById("ok-detail");
  var cancelDetail = document.getElementById("cancel-detail");
  var badTitle = document.getElementById("bad-title");
  var badDetail = document.getElementById("bad-detail");
  var pageTitle = document.getElementById("page-title");
  var closeButton = document.getElementById("close");

  function show(kind, text) {
    if (waitEl && kind !== "wait") waitEl.style.display = "none";
    var target = kind === "ok" ? okEl : kind === "cancelled" ? cancelledEl : badEl;
    var field = kind === "ok" ? okDetail : kind === "cancelled" ? cancelDetail : badDetail;
    if (target) target.style.display = "block";
    if (field && text) field.textContent = String(text);
    if (pageTitle) pageTitle.textContent = kind === "ok" ? "Connection complete" : kind === "cancelled" ? "Connection cancelled" : "Connection not completed";
    if (closeButton) closeButton.style.display = "inline-flex";
  }

  if (closeButton) closeButton.addEventListener("click", function () { window.close(); });

  try {
    if (boot.errorLine) {
      show(boot.cancelled ? "cancelled" : "bad", boot.cancelled
        ? "You cancelled the Meta authorization. No account was connected. Return to MR MESOFF and start again when ready."
        : boot.errorLine);
      if (!boot.cancelled && badTitle) badTitle.textContent = "Meta reported an error for this authorization attempt.";
      return;
    }
    if (!boot.code || !boot.state) {
      show("bad", "The authorization payload is incomplete (missing code or state). Start the connection again from MR MESOFF Settings.");
      return;
    }
    if (!/^https?:$/.test(window.location.protocol)) {
      show("bad", "This page must be opened over HTTPS.");
      return;
    }
  } catch (e) {
    show("bad", "The authorization could not be prepared. Start the connection again from MR MESOFF Settings.");
    return;
  }

  // The signed state blob (minted by the local desktop backend) carries the
  // platform and the loopback port. Payload-only decode; the SIGNATURE is
  // NOT verified here — it cannot be, without the app secret — the local
  // backend is the only verifier, as designed.
  function payloadOf(state) {
    try {
      var b64 = (String(state).split(".")[0] || "").replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var raw = atob(b64);
      var bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i) & 0xff;
      return JSON.parse(new TextDecoder("utf-8").decode(bytes));
    } catch (e) { return null; }
  }

  var payload = payloadOf(boot.state);
  if (!payload || !payload.platform) {
    show("bad", "The authorization state could not be read. Restart the connection from Settings → Messaging channels → Connect.");
    return;
  }
  var portText = String(payload.port || "");
  var port = Number(portText);
  if (!/^\\d{1,5}$/.test(portText) || !Number.isInteger(port) || !(port > 0 && port < 65536)) {
    show("bad", "The local desktop app did not publish its port for this authorization. Restart the connection inside the desktop app.");
    return;
  }
  var platform = String(payload.platform || "");
  if (["whatsapp", "instagram", "messenger"].indexOf(platform) === -1) {
    show("bad", "This connection type is not supported by this callback. Restart the connection inside the desktop app.");
    return;
  }
  var endpoint = "http://127.0.0.1:" + port + "/api/v1/channels/" + platform + "/connection/complete";

  // The handoff is one local POST; bound it in time so a stalled desktop
  // process (hung sidecar, firewall prompt) cannot leave the page in the
  // waiting state forever.
  var handoffTimeoutMs = 25000;
  var abort = null;
  if (typeof window.AbortController === "function") abort = new window.AbortController();
  if (abort) window.setTimeout(function () { abort.abort(); }, handoffTimeoutMs);

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    cache: "no-store",
    body: JSON.stringify({ code: boot.code, state: boot.state }),
    signal: abort ? abort.signal : undefined
  })
    .then(function (res) {
      return res
        .json()
        .catch(function () { return {}; })
        .then(function (body) { return { status: res.status, body: body }; });
    })
    .then(function (r) {
      var body = r.body || {};
      if (r.status === 200 && body.ok) {
        var name = body.account_name ? (" Connected account: " + body.account_name + ".") : "";
        show("ok", "The desktop app verified the connection with the provider." + name);
      } else {
        show("bad", (body.detail || body.error || ("local API returned HTTP " + r.status)) +
          " — resolve the issue and connect again from Settings → Messaging channels.");
      }
    })
    .catch(function (err) {
      if (badTitle) badTitle.textContent = "Desktop app unreachable.";
      if (abort && (err && (err.name === "AbortError" || String(err).indexOf("Aborted") !== -1))) {
        show("bad", "The MR MESOFF desktop app did not respond within " + Math.round(handoffTimeoutMs / 1000) + " seconds. Keep the app running and connect again from Settings → Messaging channels. Authorization codes are single-use — a new one is issued on the next Connect.");
      } else {
        show("bad", "The MR MESOFF desktop app could not be reached on this computer (loopback rpc failed).");
      }
    });
})();
</script>
</body>
</html>`;
}
