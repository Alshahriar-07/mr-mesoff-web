"use strict";
(function () {
  var dialog = document.querySelector("[data-install-dialog]");
  var prompt = document.querySelector("[data-install-prompt]");
  var waiting = document.querySelector("[data-install-wait]");
  var error = document.querySelector("[data-install-error]");
  var yesButton = document.querySelector("[data-install-yes]");
  var noButton = document.querySelector("[data-install-no]");
  var retryButton = document.querySelector("[data-install-retry]");
  var downloadButton = document.querySelector("[data-install-download]");
  var closeButton = document.querySelector("[data-install-close]");
  var launchStatus = document.querySelector("[data-launch-status]");
  if (!dialog || !prompt || !waiting || !error || !yesButton || !noButton) return;

  var storageKey = "mrMesoffMetaInstallAttempt";
  var attempt = null;
  var launching = false;
  var opened = false;
  var timeout = 0;
  var launchTimer = 0;

  function readAttempt() {
    try {
      var saved = JSON.parse(window.sessionStorage.getItem(storageKey) || "null");
      if (saved && Date.now() - saved.createdAt < 10 * 60 * 1000) return saved;
      window.sessionStorage.removeItem(storageKey);
    } catch (storageError) {
      return null;
    }
    return null;
  }

  function saveAttempt() {
    try { window.sessionStorage.setItem(storageKey, JSON.stringify(attempt)); } catch (storageError) { /* session tracking is best effort */ }
  }

  function setPanel(panel) {
    prompt.hidden = panel !== "prompt";
    waiting.hidden = panel !== "waiting";
    error.hidden = panel !== "error";
  }

  function showDialog(panel) {
    setPanel(panel);
    if (!dialog.open) dialog.showModal();
    if (panel === "prompt") yesButton.focus();
    else if (panel === "error") retryButton.focus();
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  function setLaunchStatus(message) {
    launchStatus.hidden = !message;
    launchStatus.textContent = message || "";
  }

  function makeRequestId() {
    return window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : String(Date.now()) + "-" + Math.random().toString(36).slice(2);
  }

  function cleanupListeners() {
    window.clearTimeout(timeout);
    document.removeEventListener("visibilitychange", checkOpened);
    window.removeEventListener("blur", checkOpened);
  }

  function checkOpened() {
    if (document.visibilityState !== "hidden" && document.hasFocus()) return;
    opened = true;
    launching = false;
    cleanupListeners();
    attempt.status = "opened";
    saveAttempt();
    closeDialog();
    setLaunchStatus("MR MESOFF Desktop is opening. Complete authorization in the browser, then check the desktop app for the verified connection status.");
  }

  function showOpenError() {
    launching = false;
    cleanupListeners();
    attempt.status = "error";
    saveAttempt();
    setLaunchStatus("");
    showDialog("error");
  }

  function launchDesktop() {
    if (!attempt || launching) return;
    launching = true;
    opened = false;
    attempt.requestId = makeRequestId();
    attempt.status = "pending";
    saveAttempt();
    setPanel("waiting");
    if (!dialog.open) dialog.showModal();
    document.addEventListener("visibilitychange", checkOpened);
    window.addEventListener("blur", checkOpened);
    timeout = window.setTimeout(function () {
      if (!opened) showOpenError();
    }, 2400);

    try {
      var target = "mrmesoff://connect/website?platform=" + encodeURIComponent(attempt.platform) +
        "&request_id=" + encodeURIComponent(attempt.requestId);
      window.location.assign(target);
    } catch (launchError) {
      showOpenError();
    }
  }

  document.querySelectorAll("[data-platform-link]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (link.getAttribute("aria-disabled") === "true") return;
      event.preventDefault();
      var platform = link.dataset.platformLink;
      if (!platform) return;
      if (attempt && attempt.platform === platform && attempt.status === "error") {
        showDialog("error");
        return;
      }
      if (attempt && attempt.platform === platform && (attempt.status === "pending" || attempt.status === "opened")) {
        setLaunchStatus("This connection attempt is already in progress. Return to MR MESOFF Desktop to continue.");
        return;
      }
      attempt = { platform: platform, createdAt: Date.now(), requestId: "", status: "prompt" };
      showDialog("prompt");
    });
  });

  yesButton.addEventListener("click", function () {
    attempt = attempt || readAttempt();
    if (attempt) launchDesktop();
  });
  noButton.addEventListener("click", function () {
    try { window.sessionStorage.removeItem(storageKey); } catch (storageError) { /* ignore */ }
    window.location.assign("/download/");
  });
  if (retryButton) retryButton.addEventListener("click", launchDesktop);
  if (downloadButton) downloadButton.addEventListener("click", function () { window.location.assign("/download/"); });
  if (closeButton) closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog && !launching) closeDialog();
  });
  dialog.addEventListener("close", function () {
    if (!launching && attempt && attempt.status === "prompt") attempt = null;
  });

  attempt = readAttempt();
  if (attempt && attempt.status === "opened") {
    setLaunchStatus("MR MESOFF Desktop was opened for this attempt. Return to the app after authorization to confirm the connection.");
  } else if (attempt && attempt.status === "error") {
    showDialog("error");
  }
})();