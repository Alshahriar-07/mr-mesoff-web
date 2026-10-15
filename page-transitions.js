(() => {
  const transitionForPath = Object.freeze({
    "/": { transform: "translate3d(-102%, 0, 0)" },
    "/features": { transform: "translate3d(0, -102%, 0)" },
    "/how-it-works": { transform: "translate3d(102%, 0, 0)" },
    "/pricing": { transform: "translate3d(0, 102%, 0)" },
    "/about": { clip: "polygon(0 0, 0 0, 0 100%, 0 100%)", fullClip: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" },
    "/contact": { transform: "translate3d(-102%, 0, 0) scaleX(.72)", origin: "left center" },
    "/download": { split: true },
    "/documentation": { transform: "scaleX(.015)", origin: "left center" },
    "/system-requirements": { transform: "scaleY(.015)", origin: "center top" },
    "/roadmap": { transform: "scaleX(.015)", origin: "right center" },
    "/changelog": { transform: "scaleY(.015)", origin: "center bottom" },
    "/privacy": { clip: "circle(0% at 50% 50%)", fullClip: "circle(150% at 50% 50%)" },
    "/terms": { clip: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)", fullClip: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" },
    "/data-deletion": { clip: "inset(0 0 100% 0)", fullClip: "inset(0 0 0 0)" },
    "/cookies": { transform: "rotate(-80deg) scale(.02)", origin: "top left" },
    "/acceptable-use": { clip: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)", fullClip: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" },
    "/accessibility": { transform: "translate3d(0, 102%, 0) scaleX(.72)", origin: "center bottom" },
    "/security": { clip: "circle(0% at 0% 0%)", fullClip: "circle(170% at 0% 0%)" },
    "/meta-platforms": { transform: "translate3d(0, -102%, 0) scaleX(.72)", origin: "center top" },
    "/ecosystem": { transform: "translate3d(102%, 0, 0) scaleY(.72)", origin: "right center" },
    "/faq": { clip: "inset(0 50% 0 50%)", fullClip: "inset(0 0 0 0)" },
    "/licenses": { transform: "translate3d(-102%, 0, 0) scaleY(.72)", origin: "left center" },
    "/creator": { clip: "polygon(0 0, 0 0, 0 0, 0 0)", fullClip: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" },
    "/contact/privacy": { clip: "inset(100% 0 0 0)", fullClip: "inset(0 0 0 0)" },
    "/404": { transform: "translate3d(0, 102%, 0) rotate(2deg)", origin: "center bottom" },
    "/404.html": { transform: "translate3d(102%, 0, 0) rotate(2deg)", origin: "right center" },
    "/500": { opacity: ".02", transform: "scale(1.18)" },
    "/maintenance": { clip: "polygon(0 0, 100% 0, 100% 0, 0 0)", fullClip: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" },
    "/offline": { transform: "translate3d(-102%, 0, 0) skewX(-12deg)", origin: "left center" },
    "/unsupported-browser": { clip: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)", fullClip: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" },
    "/coming-soon": { transform: "translate3d(0, -102%, 0) rotate(-2deg)", origin: "center top" }
  });
  const transitionKey = "mrMesoffPendingTransition";
  const normalizePath = (path) => path.replace(/\/+$/, "") || "/";
  const getTransition = (path) => transitionForPath[normalizePath(path)] || transitionForPath["/"];
  const isReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeOverlay = null;
  let navigationLocked = false;
  let leavingForNavigation = false;

  const applyTransition = (overlay, style) => {
    overlay.dataset.split = style.split ? "true" : "false";
    overlay.style.setProperty("--cover-transform", style.transform || "translate3d(-102%, 0, 0)");
    overlay.style.setProperty("--cover-clip", style.clip || "inset(0)");
    overlay.style.setProperty("--covered-clip", style.fullClip || "inset(0)");
    overlay.style.setProperty("--cover-origin", style.origin || "center center");
    overlay.style.setProperty("--cover-opacity", style.opacity || "1");
  };
  const createOverlay = (path, covered = false) => {
    const overlay = document.createElement("div");
    overlay.className = "page-transition";
    overlay.setAttribute("aria-hidden", "true");
    overlay.dataset.transition = normalizePath(path);
    applyTransition(overlay, getTransition(path));
    if (covered) overlay.classList.add("is-covered");
    document.documentElement.appendChild(overlay);
    activeOverlay = overlay;
    return overlay;
  };
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const waitForCover = async (overlay) => {
    await nextFrame();
    if (!isReducedMotion()) await nextFrame();
    overlay.classList.add("is-covered");
    if (isReducedMotion()) return;
    await Promise.race([
      new Promise((resolve) => overlay.addEventListener("transitionend", (event) => {
        if (event.target === overlay && (event.propertyName === "transform" || event.propertyName === "clip-path" || event.propertyName === "opacity")) resolve();
      }, { once: true })),
      new Promise((resolve) => window.setTimeout(resolve, 700))
    ]);
  };
  const revealOverlay = async (overlay) => {
    await nextFrame();
    if (!isReducedMotion()) await nextFrame();
    overlay.classList.remove("is-covered");
    if (isReducedMotion()) {
      overlay.remove();
      if (activeOverlay === overlay) activeOverlay = null;
      return;
    }
    await Promise.race([
      new Promise((resolve) => overlay.addEventListener("transitionend", (event) => {
        if (event.target === overlay && (event.propertyName === "transform" || event.propertyName === "clip-path" || event.propertyName === "opacity")) resolve();
      }, { once: true })),
      new Promise((resolve) => window.setTimeout(resolve, 700))
    ]);
    overlay.remove();
    if (activeOverlay === overlay) activeOverlay = null;
  };
  const showTransitionError = (destination, retry) => {
    activeOverlay?.remove();
    activeOverlay = null;
    navigationLocked = false;
    leavingForNavigation = false;
    document.querySelector("[data-transition-error]")?.remove();
    const notice = document.createElement("section");
    notice.className = "transition-error";
    notice.dataset.transitionError = "true";
    notice.setAttribute("role", "alert");
    notice.innerHTML = '<div><strong>That page could not be opened.</strong><p>Your current page is still available. Check your connection and try again.</p><div class="transition-error-actions"><button class="button" type="button" data-transition-retry>Retry</button><a class="button secondary" href="/">Back to Home</a></div></div>';
    notice.querySelector("[data-transition-retry]").addEventListener("click", retry);
    document.body.appendChild(notice);
    notice.querySelector("button").focus();
    if (destination) console.error("MR MESOFF navigation failed.", destination);
  };
  const validateDestination = async (url) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(url.href, { credentials: "same-origin", signal: controller.signal, cache: "force-cache" });
        const isHtml = /text\/html/i.test(response.headers.get("content-type") || "");
      const html = await response.text();
        const isBrandedNotFound = response.status === 404 && html.includes("Lost in the wrong workspace.");
        if ((!response.ok && !isBrandedNotFound) || !isHtml || !html.trim()) throw new Error(`Unexpected response (${response.status})`);
    } finally {
      window.clearTimeout(timeout);
    }
  };
  const navigate = async (url) => {
    if (navigationLocked) return;
    navigationLocked = true;
    const overlay = createOverlay(url.pathname);
    try {
      await waitForCover(overlay);
      await validateDestination(url);
      try {
        window.sessionStorage.setItem(transitionKey, JSON.stringify({ path: normalizePath(url.pathname), timestamp: Date.now() }));
      } catch {
        throw new Error("Session storage is unavailable, so a covered destination cannot be guaranteed.");
      }
      leavingForNavigation = true;
      window.location.assign(url.href);
    } catch (error) {
      showTransitionError(url.href, () => navigate(url));
    }
  };
  const shouldHandleLink = (anchor, event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self") || anchor.relList.contains("external")) return false;
    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return false;
    }
    if (url.origin !== window.location.origin || !["http:", "https:"].includes(url.protocol)) return false;
    if (/\.(?:ps1|sh|zip|exe|dmg|pkg|pdf|png|jpe?g|webp|ico|svg|css|js)$/i.test(url.pathname)) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
    return url;
  };

  const currentPath = normalizePath(window.location.pathname);
  const showCoveredUntilReady = (overlay) => {
    const readyTimeout = window.setTimeout(() => {
      if (activeOverlay !== overlay) return;
      showTransitionError(window.location.href, () => window.location.reload());
    }, 15000);
    const revealWhenReady = () => {
      if (activeOverlay !== overlay) return;
      window.clearTimeout(readyTimeout);
      void revealOverlay(overlay);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", revealWhenReady, { once: true });
    else revealWhenReady();
  };
  let hasPendingTransition = false;
  try {
    const pending = JSON.parse(window.sessionStorage.getItem(transitionKey) || "null");
    if (pending && pending.path === currentPath && Date.now() - pending.timestamp < 20000) {
      window.sessionStorage.removeItem(transitionKey);
      hasPendingTransition = true;
    } else if (pending) {
      window.sessionStorage.removeItem(transitionKey);
    }
  } catch {}
  if (hasPendingTransition || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
    showCoveredUntilReady(createOverlay(currentPath, true));
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const anchor = target?.closest("a[href]");
    if (!anchor) return;
    const destination = shouldHandleLink(anchor, event);
    if (!destination) return;
    event.preventDefault();
    void navigate(destination);
  }, true);

  window.MRMesoffNavigate = (destination) => {
    const url = new URL(destination, window.location.href);
    if (url.origin !== window.location.origin || !["http:", "https:"].includes(url.protocol)) {
      window.location.assign(url.href);
      return;
    }
    void navigate(url);
  };

  window.addEventListener("pagehide", () => {
    if (leavingForNavigation) return;
    if (!activeOverlay) createOverlay(currentPath);
    activeOverlay.style.transition = "none";
    activeOverlay.classList.add("is-covered");
  });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    const overlay = activeOverlay || createOverlay(currentPath, true);
    applyTransition(overlay, getTransition(currentPath));
    overlay.style.removeProperty("transition");
    overlay.classList.add("is-covered");
    void revealOverlay(overlay);
  });
})();
