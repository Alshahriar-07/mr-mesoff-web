"use strict";
(function () {
  var panel = document.querySelector("[data-meta-platform]");
  var button = document.querySelector("[data-meta-connect]");
  var status = document.querySelector("[data-meta-status]");
  if (!panel || !button || !status) return;

  var platform = panel.dataset.metaPlatform;
  // Official Facebook Login for Business scopes — must match what the
  // desktop backend requires after completion (backend README §18.5):
  // Instagram needs the instagram_business_* scopes on the Professional
  // account's linked Page; Messenger needs the pages_messaging family.
  // business_management is required for business-owned assets.
  var scopes = {
    instagram: ["instagram_business_basic", "instagram_business_manage_messages", "pages_show_list", "business_management"],
    messenger: ["pages_show_list", "pages_manage_messaging", "pages_read_engagement", "pages_messaging", "business_management"]
  };
  var params = new URLSearchParams(window.location.search);
  var signedState = params.get("ctx") || params.get("state") || "";
  var appId = params.get("appId") || (window.MR_MESOFF_CONFIG && window.MR_MESOFF_CONFIG.meta.appId) || "";
  var graphVersion = params.get("graph_version") || (window.MR_MESOFF_CONFIG && window.MR_MESOFF_CONFIG.meta.graphVersion) || "v25.0";
  var redirectUri = window.MR_MESOFF_CONFIG && window.MR_MESOFF_CONFIG.meta.redirectUri;

  function payloadOf(value) {
    try {
      var encoded = (String(value).split(".")[0] || "").replace(/-/g, "+").replace(/_/g, "/");
      while (encoded.length % 4) encoded += "=";
      return JSON.parse(decodeURIComponent(escape(atob(encoded))));
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