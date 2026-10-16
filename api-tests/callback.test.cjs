"use strict";

/**
 * Node built-in test runner for the website repository's api/ folder.
 * Runs with: node --test api-tests/   (from THIS repository's root)
 * No frameworks, no dependencies — mirrors the zero-dep runtime.
 *
 * The relay page's inline script is EXECUTED inside a minimal DOM stub
 * (node:vm) so the tests verify behavior, not template strings:
 * - GET returns the relay page with hardened headers; other methods 405
 * - Meta error redirects show the honest failure and never the success box
 * - invalid/missing state, unreachable desktop, and success paths behave
 * - a stalled desktop POST cannot hang the page (handoff timeout)
 * - oversized payloads are rejected (MESOFF_RELAY_MAX_STATE_BYTES)
 * - query-string markup cannot escape the boot JSON island (XSS)
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const handler = require("../api/meta/callback.js");

function makeRes() {
  const res = {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(k, v) { this.headers[k] = v; return this; },
    end(b) { if (b !== undefined) this.body += b; },
  };
  return res;
}

async function settle() {
  for (let i = 0; i < 5; i += 1) await new Promise((r) => setImmediate(r));
}

async function render(query = {}, fetchImpl) {
  const res = makeRes();
  const args = fetchImpl
    ? { method: "GET", query, fetchImpl }
    : { method: "GET", query };
  await handler(args, res);
  return res;
}

function pageScript(html) {
  // first inline <script> block of the body (the page logic)
  const m = html.match(/<script>\n([\s\S]*?)<\/script>/);
  return m ? m[1] : "";
}

function signedState(platform = "instagram", port = 8756) {
  const payload = Buffer.from(
    JSON.stringify({ v: 1, platform, port, nonce: "n", exp: 9999999999 })
  ).toString("base64url");
  return `${payload}.deadbeef`;
}

function runScript(script, { fetchImpl, timers } = {}) {
  // NOTE: the page IIFE kicks off promise chains; callers must flush the
  // microtask queue (await settle()) before asserting on the results.
  const els = {};
  const element = () => ({
    style: { display: "" },
    textContent: "",
    addEventListener() {},
  });
  const documentStub = {
    getElementById(id) {
      if (!els[id]) els[id] = element();
      return els[id];
    },
  };
  const calls = { fetch: 0, url: null, init: null };
  const fetchStub = async (url, init) => {
    calls.fetch += 1;
    calls.url = url;
    calls.init = init;
    if (fetchImpl) return fetchImpl(url, init);
    return { status: 200, json: async () => ({}) };
  };
  // Timers: AbortController.setTimeout registered by the page — run them
  // on demand via the returned handle (tests may simulate a timeout).
  const pendingTimers = [];
  const AbortControllerImpl = AbortController; // Node's real controller
  const sandbox = {
    document: documentStub,
    TextDecoder: TextDecoder, // real implementation, decodes UTF-8
    atob: (s) => Buffer.from(s, "base64").toString("binary"),
    fetch: fetchStub,
    console,
    setTimeout: (fn, ms) => { pendingTimers.push({ fn, ms }); return 0; },
    clearTimeout() {},
  };
  const windowStub = {
    location: { protocol: "https:" },
    addEventListener() {},
    AbortController: AbortControllerImpl,
    setTimeout: sandbox.setTimeout,
  };
  sandbox.window = windowStub;
  vm.runInNewContext(script, sandbox);
  return { els, calls, pendingTimers, sandbox };
}

test("GET renders the relay page with hardened headers", async () => {
  const res = await render({ code: "AQC-x1", state: "eyJhIjoxfQ.aa" });
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /Completing Meta authorization/);
  assert.match(res.headers["Content-Security-Policy"], /default-src 'none'/);
  assert.match(res.headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.equal(res.headers["X-Frame-Options"], "DENY");
  assert.equal(res.headers["Cache-Control"], "no-store, max-age=0");
  assert.equal(res.headers["X-Robots-Tag"], "noindex, nofollow");
});

test("Meta access_denied redirect is handled as an honest cancellation", async () => {
  const res = await render({ error: "access_denied", error_description: "User denied access" });
  assert.equal(res.statusCode, 200);
  const { els } = runScript(pageScript(res.body));
  assert.equal(els["cancelled"].style.display, "block");
  assert.match(els["cancel-detail"].textContent, /No account was connected/i);
  assert.equal(els["ok"].style.display, "", "success box must stay hidden on the error path");
  assert.equal(els["bad"].style.display, "");
});

test("non-cancellation Meta errors show the hard failure, never success", async () => {
  const res = await render({ error: "server_error", error_description: "Meta had a problem" });
  const { els } = runScript(pageScript(res.body));
  assert.equal(els["bad"].style.display, "block");
  assert.match(els["bad-title"].textContent, /Meta reported an error for this authorization attempt/);
  assert.match(els["bad-detail"].textContent, /Meta had a problem/);
  assert.equal(els["ok"].style.display, "");
});

test("error_message variant (without error_description) is relayed", async () => {
  const res = await render({ error: "server_error", error_message: "Meta had a problem" });
  const { els } = runScript(pageScript(res.body));
  assert.match(els["bad-detail"].textContent, /Meta had a problem/);
});

test("valid code+state performs the loopback handoff with the stored state", async () => {
  const state = signedState("instagram", 8756);
  const fetchImpl = async () => ({ status: 200, json: async () => ({ ok: true, account_name: "Own Biz" }) });
  const res = await render({ code: "AQZ-good", state }, fetchImpl);
  const { els, calls } = runScript(pageScript(res.body), { fetchImpl });
  await settle();
  assert.equal(calls.fetch, 1, "exactly one loopback call");
  assert.equal(calls.url, "http://127.0.0.1:8756/api/v1/channels/instagram/connection/complete");
  assert.equal(calls.init.body, JSON.stringify({ code: "AQZ-good", state }), "code+state relayed verbatim");
  assert.equal(els["ok"].style.display, "block");
  assert.match(els["ok-detail"].textContent, /Own Biz/);
  assert.equal(els["bad"].style.display, "");
});

test("handoff is platform-bound to the signed state's platform", async () => {
  const state = signedState("whatsapp", 9001);
  const res = await render({ code: "AQZ-w", state }, async () => ({ status: 200, json: async () => ({ ok: true }) }));
  const { calls } = runScript(pageScript(res.body));
  await settle();
  assert.match(calls.url, /\/api\/v1\/channels\/whatsapp\/connection\/complete$/);
  assert.equal(calls.url.indexOf("http://127.0.0.1:9001/"), 0, "loopback only, exact state port");
});

test("desktop backend rejection surfaces its honest detail", async () => {
  const state = signedState("messenger", 8750);
  const fetchImpl = async () => ({ status: 200, json: async () => ({ ok: false, detail: "OAuth state failed verification (signature/expiry/platform)" }) });
  const res = await render({ code: "AQZ-bad", state }, fetchImpl);
  const { els } = runScript(pageScript(res.body), { fetchImpl });
  await settle();
  assert.equal(els["bad"].style.display, "block");
  assert.match(els["bad-detail"].textContent, /state failed verification/);
  assert.equal(els["ok"].style.display, "");
});

test("unreachable desktop app is reported honestly", async () => {
  const state = signedState("whatsapp", 9000);
  const refusingFetch = async () => { throw new Error("ECONNREFUSED"); };
  const res = await render({ code: "AQZ-x", state }, refusingFetch);
  const { els } = runScript(pageScript(res.body), { fetchImpl: refusingFetch });
  await settle();
  assert.equal(els["bad"].style.display, "block");
  assert.match(els["bad-detail"].textContent, /could not be reached/);
});

test("a stalled desktop POST cannot hang the page (handoff timeout)", async () => {
  const state = signedState("whatsapp", 9002);
  // A fetch that hangs until aborted (plain middle-of-network behavior)
  const hangingFetch = (url, init) => new Promise((_, reject) => {
    if (init && init.signal) {
      init.signal.addEventListener("abort", () => {
        const e = new Error("Aborted");
        e.name = "AbortError";
        reject(e);
      });
    }
  });
  const res = await render({ code: "AQZ-slow", state }, hangingFetch);
  const { els, pendingTimers } = runScript(pageScript(res.body), { fetchImpl: hangingFetch });
  assert.notEqual(els["wait"].style.display, "none", "still waiting initially (CSS-driven box)");
  assert.ok(pendingTimers.some((t) => t.ms === 25000), "a 25s handoff timeout is registered");
  pendingTimers.forEach((t) => t.fn());
  await settle();
  assert.equal(els["bad"].style.display, "block");
  assert.match(els["bad-detail"].textContent, /did not respond within 25 seconds/);
});

test("unreadable state is rejected before any network call", async () => {
  const { els, calls } = runScript(pageScript((await render({ code: "c", state: "garbage-no-signature" })).body));
  assert.match(els["bad-detail"].textContent, /state could not be read/);
  assert.equal(calls.fetch, 0, "no handoff without valid-parsed state");
});

test("platform outside the supported set is rejected without any network call", async () => {
  const payload = Buffer.from(JSON.stringify({ v: 1, platform: "threads", port: 9003, nonce: "n", exp: 9999999999 })).toString("base64url");
  const { els, calls } = runScript(pageScript((await render({ code: "c", state: `${payload}.01a` })).body));
  assert.match(els["bad-detail"].textContent, /not supported by this callback/);
  assert.equal(calls.fetch, 0);
});

test("port outside the valid range is rejected without any network call", async () => {
  const payload = Buffer.from(JSON.stringify({ v: 1, platform: "instagram", port: 99999, nonce: "n", exp: 9999999999 })).toString("base64url");
  const { els, calls } = runScript(pageScript((await render({ code: "c", state: `${payload}.01b` })).body));
  assert.match(els["bad-detail"].textContent, /did not publish its port|not supported|Restart/i);
  assert.equal(calls.fetch, 0);
});

test("POST is method-not-allowed", async () => {
  const res = makeRes();
  await handler({ method: "POST", query: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET");
});

test("oversized payload rejected (MESOFF_RELAY_MAX_STATE_BYTES)", async () => {
  const orig = process.env.MESOFF_RELAY_MAX_STATE_BYTES;
  process.env.MESOFF_RELAY_MAX_STATE_BYTES = "16";
  try {
    const res = await render({ code: "x".repeat(64), state: "y".repeat(64) });
    assert.equal(res.statusCode, 400);
    assert.match(res.body, /too large/);
  } finally {
    if (orig === undefined) delete process.env.MESOFF_RELAY_MAX_STATE_BYTES;
    else process.env.MESOFF_RELAY_MAX_STATE_BYTES = orig;
  }
});

test("scripting payloads in query params cannot escape the JSON island", async () => {
  const res = await render({ code: "</script><img src=x onerror=alert(1)>", state: "s" });
  assert.equal(res.statusCode, 200);
  assert.ok(!res.body.includes("</script><img"), "raw markup must not appear inside the boot JSON");
  assert.ok(!res.body.includes("<img src=x"));
});

test("UTF-8 in state payload decodes correctly (no legacy escape path)", async () => {
  const payload = Buffer.from(
    JSON.stringify({ v: 1, platform: "instagram", port: 7070, nonce: "токé", exp: 9999999999 }),
    "utf8"
  ).toString("base64url");
  const state = `${payload}.deca`;
  const res = await render({ code: "AQZ-u", state }, async () => ({ status: 200, json: async () => ({ ok: true }) }));
  const { calls } = runScript(pageScript(res.body));
  await settle();
  assert.equal(calls.fetch, 1, "unicode payloads still decode and hand off");
  assert.match(calls.url, /7070/);
});
