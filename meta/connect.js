"use strict";
(function () {
  var panel = document.querySelector("[data-meta-platform]");
  var button = document.querySelector("[data-meta-connect]");
  var status = document.querySelector("[data-meta-status]");
  if (!panel || !button || !status) return;

  var platform = panel.dataset.metaPlatform;
  // Official scopes for the flow actually implemented here: the FACEBOOK
  // Login dialog (facebook.com/<version>/dialog/oauth) with a Facebook
  // User/Page token and graph.facebook.com endpoints. Per the current Meta
  // permission reference, that configuration requests
  // `instagram_basic` + `instagram_manage_messages` (+ pages_show_list,
  // pages_read_engagement) — the `instagram_business_*` family belongs to
  // the SEPARATE Business Login for Instagram flow (graph.instagram.com,
  // Instagram User token) and is not valid here. Messenger additionally
  // needs `pages_manage_metadata` to install the app on the Page
  // (POST /<page_id>/subscribed_apps). These lists MUST stay identical to
  // backend/app/integrations/providers/meta_cloud.py SCOPES.
  var scopes = {
    instagram: ["instagram_basic", "instagram_manage_messages", "pages_show_list", "pages_read_engagement", "business_management"],
    messenger: ["pages_show_list", "pages_manage_messaging", "pages_manage_metadata", "pages_read_engagement", "pages_messaging", "business_management"]
  };
  var params = new URLSearchParams(window.location.search);
  var signedState = params.get("ctx") || params.get("state") || "";
  var appId = params.get("appId") || (window.MR_MESOFF_CONFIG && window.MR_MESOFF_CONFIG.meta.appId) || "";
  var graphVersion = params.get("graph_version") || (window.MR_MESOFF_CONFIG && window.MR_MESOFF_CONFIG.meta.graphVersion) || "v25.0";
  var redirectUri = window.MR_MESOFF_CONFIG && window.MR_MESOFF_CONFIG.meta.redirectUri;

  // Payload-only decode of the signed state. The SIGNATURE is verified by
  // the desktop backend alone (it never leaves the machine), so this is
  // purely structural. TextDecoder (never the deprecated escape()/
  // decodeURIComponent pair, which corrupts non-ASCII payloads).
  function payloadOf(value) {
    try {
      var encoded = (String(value).split(".")[0] || "").replace(/-/g, "+").replace(/_/g, "/");
      while (encoded.length % 4) encoded += "=";
      var raw = atob(encoded);
      var bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i) & 0xff;
      return JSON.parse(new TextDecoder("utf-8").decode(bytes));
    } catch (error) {
      return null;
    }
  }

  function fail(message) {
    status.dataset.kind = "error";
    status.textContent = message;
    button.disabled = true;
    button.textContent = "Secure session unavailable";
  }

  var payload = payloadOf(signedState);
  var portText = payload ? String(payload.port || "") : "";
  var port = Number(portText);
  if (!payload || payload.platform !== platform || !/^\d{1,5}$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
    fail("Open this connection page from MR MESOFF on the same computer. A valid, short-lived signed session is required.");
    return;
  }
  if (!/^\d+$/.test(appId) || !redirectUri || !/^v\d+\.\d+$/.test(graphVersion) || !scopes[platform]) {
    fail("Meta connection settings are incomplete. Check the app ID, Graph API version, and redirect URI in the website configuration.");
    return;
  }
  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    fail("Open this page over HTTPS to continue with Meta.");
    return;
  }

  button.disabled = false;
  button.textContent = "Continue with Meta";
  status.textContent = "Secure session ready. Meta will ask you to review and grant the requested permissions.";
  button.addEventListener("click", function () {
    button.disabled = true;
    button.textContent = "Opening Meta...";
    status.dataset.kind = "loading";
    status.textContent = "Redirecting to Meta's official authorization page...";
    var query = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: "code",
      state: signedState,
      scope: scopes[platform].join(",")
    });
    window.location.assign("https://www.facebook.com/" + graphVersion + "/dialog/oauth?" + query.toString());
  });
})();