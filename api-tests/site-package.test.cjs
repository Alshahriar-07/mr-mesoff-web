"use strict";

/**
 * Deployment-package integrity tests for THIS website repository.
 * Verifies the exact copy-and-deploy acceptance criteria:
 * - the OAuth callback function resolves at its deployment path
 *   (api/meta/callback.js -> /api/meta/callback)
 * - no HTML references assume a non-root serving prefix
 * - the relay functions have zero dependencies and pin CommonJS
 * - the three platform connect pages are intact and loopback-oriented
 * - the canonical production origin is used for Meta handoff URLs
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");

test("package contains the OAuth callback at its deployment path", () => {
  const handler = require(path.join(ROOT, "api", "meta", "callback.js"));
  assert.equal(typeof handler, "function", "CJS handler export");
});

test("API functions declare zero dependencies and CommonJS", () => {
  const pkg = JSON.parse(read("api", "package.json"));
  assert.deepEqual(pkg.dependencies, {});
  assert.equal(pkg.type, "commonjs");
  assert.match(pkg.engines.node, /20/);
});

const htmlFiles = [
  "meta/whatsapp-connect.html",
  "meta/instagram-connect.html",
  "meta/messenger-connect.html",
];

for (const file of htmlFiles) {
  test(`no asset reference assumes a non-root serving prefix (${file})`, () => {
    const html = read(...file.split("/"));
    const refs = html.match(/(?:src|href)=["']([^"']+)["']/g) || [];
    for (const ref of refs) {
      const url = ref.split('"')[1];
      assert.ok(
        !url.startsWith("/web/") && !url.startsWith("/mr-mesoff-web/"),
        `non-root absolute reference found in ${file}: ${url}`
      );
    }
  });
}

test("whatsapp-connect page loads Meta's official SDK and posts to loopback", () => {
  const html = read("meta", "whatsapp-connect.html");
  assert.match(html, /connect\.facebook\.net.*sdk\.js/);
  assert.match(html, /whatsapp_embedded_signup/);
  assert.match(html, /127\.0\.0\.1/);          // loopback handoff, not token URLs
  assert.match(html, /connection\/complete/);   // same verified endpoint as relay
  assert.match(html, /sessionInfoVersion/);     // current SDK contract
  assert.doesNotMatch(html, /app_secret|client_secret/i);
});

test("instagram + messenger pages authorize via Meta and hand off to loopback", () => {
  const ig = read("meta", "instagram-connect.html");
  const messenger = read("meta", "messenger-connect.html");
  for (const [platform, html] of [["instagram", ig], ["messenger", messenger]]) {
    assert.match(html, new RegExp(`data-meta-platform="${platform}"`));
    assert.match(html, /meta\/connect\.js/);
    assert.doesNotMatch(html, /app_secret|client_secret/i);
  }
  const connect = read("meta", "connect.js");
  assert.match(connect, /dialog\/oauth/, "FB Login dialog is the authorize entry");
  // AUDITED (2026-10) against the Meta permission reference. This page
  // authorizes through FACEBOOK Login (facebook.com/<v>/dialog/oauth) with
  // a Facebook User/Page token, so the Instagram API with Facebook Login
  // permission names apply: instagram_basic + instagram_manage_messages.
  // The instagram_business_* family belongs to the SEPARATE Business Login
  // for Instagram flow (graph.instagram.com, Instagram User token) and
  // grants nothing here — requesting it was the previous bug. Unneeded or
  // wrong scopes are an explicit App Review rejection reason.
  // Assertions run against the ACTUAL scope lists (not the whole file, which
  // also documents *why* the business-login scopes are excluded).
  const scopesBlock = connect.match(/var scopes = \{[\s\S]*?\n  \};/);
  assert.ok(scopesBlock, "connect.js declares an explicit scope map");
  const scopesText = scopesBlock[0];
  const igScopes = scopesText.match(/instagram: \[([^\]]*)\]/)[1];
  const msgrScopes = scopesText.match(/messenger: \[([^\]]*)\]/)[1];

  for (const required of ["instagram_basic", "instagram_manage_messages", "pages_show_list", "pages_read_engagement"]) {
    assert.ok(igScopes.includes(`"${required}"`), `Instagram scope list must request ${required}`);
  }
  for (const required of ["pages_show_list", "pages_manage_messaging", "pages_manage_metadata", "pages_read_engagement"]) {
    assert.ok(msgrScopes.includes(`"${required}"`), `Messenger scope list must request ${required}`);
  }
  assert.doesNotMatch(
    scopesText,
    /instagram_business_/,
    "Business Login for Instagram scopes grant nothing in a Facebook Login flow"
  );
});

test("relay function holds no secrets", () => {
  const js = read("api", "meta", "callback.js");
  assert.doesNotMatch(js, /MESOFF_META_APP_SECRET\s*=/);
  assert.doesNotMatch(js, /access_token/);
});

test("canonical production origin only (no preview/localhost in OAuth config)", () => {
  const connect = read("meta", "connect.js");
  const config = read("site-config.js");
  const redir = config.match(/redirectUri: "([^"]*)"/);
  assert.equal(redir[1], "https://mrmesoff.vercel.app/api/meta/callback");
  assert.ok(!/localhost|preview|127\.0\.0\.1/i.test(redir[1]), "OAuth redirect URI must be the canonical production domain");
  // the relay fetches only PUBLIC URLs plus the operator-built loopback target
  for (const h of ["meta/whatsapp-connect.html", "meta/instagram-connect.html", "meta/messenger-connect.html"]) {
    const html = read(...h.split("/"));
    const fb = html.match(/https?:\/\/[^"'\s]*facebook[^"'\s]*/g) || [];
    for (const u of fb) assert.ok(/^https:\/\//.test(u), `HTTPS-only Meta URLs in ${h}: ${u}`);
  }
});

test("desktop-originated connect pages do not show the install-check dialog", () => {
  // install-check.js is only wired in meta/index.html (browser-started flows);
  // the three direct connect pages opened by the desktop must not include it.
  const index = read("meta", "index.html");
  assert.match(index, /install-check\.js/, "dialog belongs on the channel-selection page");
  for (const h of ["meta/whatsapp-connect.html", "meta/instagram-connect.html", "meta/messenger-connect.html"]) {
    const html = read(...h.split("/"));
    assert.doesNotMatch(html, /install-check\.js/, `no install modal on ${h}`);
  }
});
