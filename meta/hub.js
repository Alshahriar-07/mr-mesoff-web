"use strict";
(function () {
  var params = new URLSearchParams(window.location.search);
  var signedState = params.get("ctx") || params.get("state") || "";
  if (!signedState) return;

  // Structural payload decode only; the HMAC signature is verified by the
  // desktop backend. TextDecoder keeps non-ASCII payloads intact (the
  // deprecated escape()/decodeURIComponent pair does not).
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

  var payload = payloadOf(signedState);
  var validPlatforms = ["whatsapp", "instagram", "messenger"];
  if (!payload || validPlatforms.indexOf(payload.platform) === -1) return;

  document.querySelectorAll("[data-platform-link]").forEach(function (link) {
    if (link.dataset.platformLink !== payload.platform) {
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.textContent = "Not in this connection session";
      return;
    }
    var target = new URL(link.href);
    ["appId", "graph_version", "config_id", "waba_id"].forEach(function (name) {
      var value = params.get(name);
      if (value) target.searchParams.set(name, value);
    });
    target.searchParams.set("ctx", signedState);
    link.href = target.pathname + target.search + target.hash;
  });

  var note = document.querySelector(".connection-note");
  if (note) note.textContent = "This short-lived session is bound to " + payload.platform + ". Continue only with that channel; to connect another channel, start a new connection in MR MESOFF. The desktop app confirms the connection after Meta authorization.";
})();