(function () {
  let frontendErrorShown = false;
  let introOverlay = null;
  const removeIntro = () => {
    introOverlay?.remove();
    introOverlay = null;
  };
  const startIntro = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (window.sessionStorage.getItem("mrMesoffIntroSeen") === "1") return;
      window.sessionStorage.setItem("mrMesoffIntroSeen", "1");
    } catch {
      return;
    }
    const overlay = document.createElement("div");
    overlay.className = "intro-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = '<div class="intro-content"><img class="intro-logo" src="/assets/dark/logo.png" alt="" /><span class="intro-brand-name">MR MESOFF</span><span class="intro-progress-track"><span class="intro-progress"></span></span></div>';
    document.body.appendChild(overlay);
    introOverlay = overlay;
    let isFinishing = false;
    let fallbackTimer;
    const remove = () => {
      if (introOverlay !== overlay) return;
      overlay.remove();
      introOverlay = null;
    };
    const finish = () => {
      if (isFinishing || introOverlay !== overlay) return;
      isFinishing = true;
      window.clearTimeout(fallbackTimer);
      overlay.classList.add("is-leaving");
      overlay.addEventListener("animationend", (event) => {
        if (event.target === overlay) remove();
      }, { once: true });
      window.setTimeout(remove, 250);
    };
    overlay.querySelector(".intro-progress").addEventListener("animationend", finish, { once: true });
    fallbackTimer = window.setTimeout(finish, 1500);
  };
  const showFrontendError = () => {
    removeIntro();
    const main = document.querySelector("main");
    if (!main || frontendErrorShown) return;
    frontendErrorShown = true;
    document.title = "Something Went Wrong — MR MESOFF";
    main.innerHTML = `<section class="frontend-error" role="alert" aria-labelledby="frontend-error-title"><span class="status-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/></svg></span><p class="eyebrow">Unexpected page error</p><h1 id="frontend-error-title" tabindex="-1">Something went wrong.</h1><p>We couldn’t display this page as expected. Try reloading, or return to useful content.</p><div class="button-row"><button class="button" type="button" data-error-retry>Try again</button><a class="button secondary" href="/">Back to Home</a><a class="button secondary" href="/contact/">Contact support</a></div></section>`;
    main.querySelector("[data-error-retry]").addEventListener("click", () => window.location.reload());
    main.querySelector("h1").focus();
  };
  const isDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  window.addEventListener("error", (event) => {
    if (event.target !== window || !event.error) return;
    if (isDevelopment) console.error("Unhandled MR MESOFF frontend error.", event.error);
    showFrontendError();
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-error-retry]")) window.location.reload();
  });
  const config = window.MR_MESOFF_CONFIG;
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const setMeta = (selector, attribute, value) => {
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(selector.includes("property=") ? "property" : "name", selector.match(/["']([^"']+)["']/)[1]);
      document.head.appendChild(element);
    }
    element.setAttribute(attribute, value);
  };
  setMeta('meta[name="author"]', "content", config.publisherName);
  setMeta('meta[name="publisher"]', "content", config.publisherName);
  if (config.seo.searchConsoleVerification) {
    setMeta('meta[name="google-site-verification"]', "content", config.seo.searchConsoleVerification);
  }
  const nonIndexablePaths = new Set(["/404", "/404.html", "/500", "/maintenance", "/offline", "/unsupported-browser", "/coming-soon"]);
  if (nonIndexablePaths.has(path)) setMeta('meta[name="robots"]', "content", "noindex,follow");
  if (!document.head.querySelector('script[type="application/ld+json"]')) {
    const structuredData = document.createElement("script");
    structuredData.type = "application/ld+json";
    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${config.url}/#publisher`,
          name: config.publisherName,
          logo: { "@type": "ImageObject", url: `${config.url}/assets/light/logo.png` }
        },
        {
          "@type": "WebSite",
          "@id": `${config.url}/#website`,
          name: config.name,
          url: `${config.url}/`,
          inLanguage: "en",
          publisher: { "@id": `${config.url}/#publisher` }
        },
        {
          "@type": "SoftwareApplication",
          "@id": `${config.url}/#application`,
          name: config.name,
          applicationCategory: "BusinessApplication",
          description: config.seo.productDescription,
          url: `${config.url}/`,
          creator: { "@type": "Person", name: config.creatorName },
          publisher: { "@id": `${config.url}/#publisher` }
        }
      ]
    });
    document.head.appendChild(structuredData);
  }
  if (path !== "/" && !nonIndexablePaths.has(path)) {
    const canonical = document.head.querySelector('link[rel="canonical"]')?.href || `${config.url}${path}/`;
    const pageName = document.title.replace(/\s+—\s+MR MESOFF$/, "");
    const breadcrumbs = document.createElement("script");
    breadcrumbs.type = "application/ld+json";
    breadcrumbs.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${config.url}/` },
        { "@type": "ListItem", position: 2, name: pageName, item: canonical }
      ]
    });
    document.head.appendChild(breadcrumbs);
  }
  const navItems = [
    ["Features", "/features/"],
    ["How it works", "/how-it-works/"],
    ["Connect", "/meta/"],
    ["Pricing", "/pricing/"],
    ["About", "/about/"],
    ["Contact", "/contact/"]
  ];
  const iconPaths = {
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    next: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    loader: '<circle cx="12" cy="12" r="9" stroke-dasharray="42 16"/>',
    windows: '<path d="M3 5.5 10.5 4v7H3z"/><path d="M12 3.7 21 2v9h-9z"/><path d="M3 13h7.5v7L3 18.5z"/><path d="M12 13h9v9l-9-1.7z"/>',
    macos: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    linux: '<path d="M4 19h16M6 16l6-12 6 12"/><path d="M9 11h6"/>'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${iconPaths[name]}</svg>`;
  const link = (label, href, className) => `<a${className ? ` class="${className}"` : ""} href="${href}">${label}</a>`;

  const header = document.querySelector("[data-site-header]");
  if (header) {
    header.innerHTML = `<a class="brand" href="/"><img src="/assets/light/logo.png" alt="" /><span class="brand-name">MR MESOFF</span></a>
      <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primary-navigation"><span></span><span></span><span class="sr-only">Open menu</span></button>
      <nav class="primary-nav" id="primary-navigation" aria-label="Main navigation">${navItems.map(([label, href]) => link(label, href, path === href.replace(/\/$/, "") ? "current" : "")).join("")}${link(`${icon("download")}<span>Download app</span>`, "/download/", "nav-cta")}</nav>`;
  }

  const footer = document.querySelector("[data-site-footer]");
  if (footer) {
    const contact = link("Contact", "/contact/");
    const supportEmail = config.supportEmail ? link(config.supportEmail, `mailto:${config.supportEmail}`) : "";
    const portfolio = config.portfolioUrl ? link("Portfolio", config.portfolioUrl) : "";
    footer.innerHTML = `<div class="footer-main"><div class="footer-brand"><a href="/" aria-label="MR MESOFF home"><img src="/assets/light/logo.png" alt="MR MESOFF" /></a><p>A desktop workspace for business messaging, AI assistance, and human-controlled conversations.</p></div>
      <div class="footer-column"><h2>Product</h2>${link("Features", "/features/")}${link("How it works", "/how-it-works/")}${link("Download", "/download/")}${link("Pricing", "/pricing/")}${link("System requirements", "/system-requirements/")}${link("Roadmap", "/roadmap/")}${link("Changelog", "/changelog/")}</div>
      <div class="footer-column"><h2>Information</h2>${link("About", "/about/")}${link("Ecosystem", "/ecosystem/")}${link("Documentation", "/documentation/")}${link("FAQ", "/faq/")}${link("Meta platforms", "/meta-platforms/")}${contact}${link("Creator", "/creator/")}${portfolio}</div>
      <div class="footer-column"><h2>Policies</h2>${link("Privacy", "/privacy/")}${link("Terms", "/terms/")}${link("Data deletion", "/data-deletion/")}${link("Privacy contact", "/contact/privacy/")}${link("Cookies & local storage", "/cookies/")}${link("Acceptable use", "/acceptable-use/")}${link("Licenses", "/licenses/")}${link("Accessibility", "/accessibility/")}${link("Security", "/security/")}${supportEmail}</div></div>
      <div class="footer-bottom"><p>© ${new Date().getFullYear()} MR MESOFF · ${config.publisherName}</p><p>MR MESOFF is an independent product in the Seed Code ecosystem. Not affiliated with, sponsored by, or endorsed by Meta Platforms, Inc.</p></div>`;
  }

  const notFoundHeading = document.querySelector("main[data-generated-page] .page-intro h1");
  if (notFoundHeading?.textContent === "Lost in the wrong workspace.") {
    notFoundHeading.parentElement.insertAdjacentHTML("afterbegin", '<span class="status-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 4"/><path d="M12 17h.01"/></svg></span>');
    const recoveryActions = document.querySelector("main[data-generated-page] .button-row");
    if (recoveryActions && !recoveryActions.querySelector('a[href="/contact/"]')) {
      recoveryActions.insertAdjacentHTML("beforeend", '<a class="button secondary" href="/contact/">Contact support</a>');
    }
  }
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".primary-nav");
  if (toggle && nav) {
    const closeMenu = (returnFocus = false) => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      toggle.querySelector(".sr-only").textContent = "Open menu";
      nav.classList.remove("is-open");
      if (returnFocus) toggle.focus();
    };
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.setAttribute("aria-label", expanded ? "Open menu" : "Close menu");
      toggle.querySelector(".sr-only").textContent = expanded ? "Open menu" : "Close menu";
      nav.classList.toggle("is-open", !expanded);
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") closeMenu(true);
    });
    document.addEventListener("click", (event) => {
      if (!header.contains(event.target) && toggle.getAttribute("aria-expanded") === "true") closeMenu();
    });
  }

  document.querySelectorAll(".arrow").forEach((element) => {
    element.innerHTML = icon(element.dataset.icon || "next");
  });
  document.querySelectorAll(".copy-button").forEach((button) => {
    button.innerHTML = `${icon("copy")}<span>Copy</span>`;
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const command = button.getAttribute("data-copy");
      const status = button.closest(".terminal").querySelector("[role='status']");
      try {
        await navigator.clipboard.writeText(command);
        status.textContent = "Copied to clipboard";
      } catch (error) {
        const field = document.createElement("textarea");
        field.value = command;
        field.setAttribute("readonly", "");
        field.style.position = "absolute";
        field.style.left = "-9999px";
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        status.textContent = copied ? "Copied to clipboard" : "Copy failed. Select the command to copy it.";
      }
      const copied = status.textContent === "Copied to clipboard";
      button.innerHTML = `${icon(copied ? "check" : "copy")}<span>${copied ? "Copied" : "Copy"}</span>`;
      button.classList.toggle("is-copied", copied);
      window.setTimeout(() => {
        status.textContent = "";
        button.innerHTML = `${icon("copy")}<span>Copy</span>`;
        button.classList.remove("is-copied");
      }, 4000);
    });
  });

  const platformPicker = document.querySelector("[data-platform-picker]");
  if (platformPicker) {
    const panels = [...document.querySelectorAll("[data-platform-panel]")];
    const platformNames = { windows: "Windows", macos: "macOS", linux: "Linux" };
    const platformIcons = { windows: "windows", macos: "macos", linux: "linux" };
    platformPicker.querySelectorAll("[data-platform]").forEach((button) => {
      const platform = button.dataset.platform;
      const status = button.querySelector("small");
      const label = button.childNodes[0].textContent.trim();
      button.innerHTML = `<span>${icon(platformIcons[platform])}${label}</span>${status.outerHTML}`;
    });
    panels.forEach((panel) => {
      const platform = panel.dataset.platformPanel;
      const downloadUrl = config.downloads[platform];
      const availability = config.platforms[platform];
      const action = panel.querySelector(".download-empty");
      if (!action) return;
      if (downloadUrl && availability === "available") {
        action.innerHTML = `<div><strong>${platformNames[platform]} release is available.</strong><span>Use the official configured release link.</span></div><a class="button" href="${downloadUrl}" download>Download for ${platformNames[platform]}</a>`;
      } else {
        action.querySelector("strong").textContent = "Download not published yet.";
        action.querySelector("button").disabled = true;
      }
    });
    platformPicker.addEventListener("click", (event) => {
      const button = event.target.closest("[data-platform]");
      if (!button) return;
      platformPicker.querySelectorAll("[data-platform]").forEach((item) => {
        const selected = item === button;
        item.setAttribute("aria-pressed", String(selected));
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.platformPanel !== button.dataset.platform; });
      const selectedPanel = panels.find((panel) => panel.dataset.platformPanel === button.dataset.platform);
      if (selectedPanel) {
        selectedPanel.classList.remove("panel-enter");
        window.requestAnimationFrame(() => selectedPanel.classList.add("panel-enter"));
      }
    });
  }

  document.querySelectorAll("[data-home-platform]").forEach((element) => {
    const platform = element.dataset.homePlatform;
    const available = config.downloads[platform] && config.platforms[platform] === "available";
    element.textContent = available ? "Download available" : "Download not published yet";
  });

  const contactBox = document.querySelector(".contact-box");
  if (path === "/contact" && contactBox) {
    document.title = "Contact MR MESOFF — Support, Privacy & Product Inquiries";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = "Contact MR MESOFF support, send product feedback, report a bug, or make a privacy, deletion, or security inquiry.";
    const intro = document.querySelector(".page-intro .lead");
    if (intro) intro.textContent = "Reach Eagox Studio about MR MESOFF support, product feedback, business inquiries, privacy, data deletion, or security concerns.";
    const heading = document.querySelector(".page-intro h1");
    if (heading) heading.textContent = "A direct line to MR MESOFF.";
    contactBox.innerHTML = `<form class="contact-form" data-web3forms-form data-state="IDLE" action="${config.web3forms.endpoint}" method="POST" novalidate>
      <input type="hidden" name="access_key" value="${config.web3forms.accessKey}" />
      <input type="hidden" name="from_name" value="MR MESOFF website" />
      <input type="checkbox" name="botcheck" class="form-honeypot" tabindex="-1" aria-hidden="true" />
      <div class="form-grid">
        <div class="form-field"><label for="contact-name">Name <span class="required-indicator" aria-hidden="true">*</span><span class="sr-only"> required</span></label><input id="contact-name" name="name" autocomplete="name" required aria-describedby="contact-name-error" /><p class="field-error" id="contact-name-error" data-error-for="name" hidden></p></div>
        <div class="form-field"><label for="contact-email">Email <span class="required-indicator" aria-hidden="true">*</span><span class="sr-only"> required</span></label><input id="contact-email" type="email" name="email" autocomplete="email" required aria-describedby="contact-email-error" /><p class="field-error" id="contact-email-error" data-error-for="email" hidden></p></div>
      </div>
      <div class="form-field"><label for="contact-subject">Inquiry type <span class="required-indicator" aria-hidden="true">*</span><span class="sr-only"> required</span></label><select id="contact-subject" name="subject" required aria-describedby="contact-subject-error"><option value="" selected disabled>Select an inquiry</option><option>General support</option><option>Product feedback</option><option>Bug report</option><option>Business inquiry</option><option>Privacy or data deletion</option><option>Security concern</option><option>Other</option></select><p class="field-error" id="contact-subject-error" data-error-for="subject" hidden></p></div>
      <div class="form-field"><label for="contact-message">Message <span class="required-indicator" aria-hidden="true">*</span><span class="sr-only"> required</span></label><textarea id="contact-message" name="message" rows="6" required aria-describedby="contact-message-error"></textarea><p class="field-error" id="contact-message-error" data-error-for="message" hidden></p></div>
      <div class="form-field"><label class="privacy-consent" for="contact-privacy"><input id="contact-privacy" type="checkbox" name="privacy_acknowledged" value="yes" required aria-describedby="contact-privacy-error" /><span>I have read the <a href="/privacy/">Privacy Policy</a> and understand that my inquiry will be sent to Web3Forms for delivery to the support contact. <span class="required-indicator" aria-hidden="true">*</span><span class="sr-only"> required</span></span></label><p class="field-error" id="contact-privacy-error" data-error-for="privacy_acknowledged" hidden></p></div>
      <p class="form-config-message" data-form-config-message role="alert" hidden></p>
      <button class="button contact-submit" type="submit" data-form-submit><span class="button-icon" data-submit-icon aria-hidden="true">${icon("next")}</span><span data-submit-label>Send message</span></button>
      <p class="form-status" data-form-status role="status" aria-live="polite"></p>
    </form>`;
    const form = contactBox.querySelector("[data-web3forms-form]");
    const status = form.querySelector("[data-form-status]");
    const configMessage = form.querySelector("[data-form-config-message]");
    const submit = form.querySelector("[data-form-submit]");
    const submitIcon = form.querySelector("[data-submit-icon]");
    const submitLabel = form.querySelector("[data-submit-label]");
    const isDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const genericFailure = "We couldn't submit your message. Please check your connection and try again.";
    const setState = (state) => { form.dataset.state = state; };
    const setButtonIdle = () => {
      submit.disabled = false;
      submit.classList.remove("is-loading");
      submitIcon.innerHTML = icon("next");
      submitLabel.textContent = "Send message";
      form.setAttribute("aria-busy", "false");
    };
    const setFieldError = (name, message) => {
      const field = form.elements.namedItem(name);
      const error = form.querySelector(`[data-error-for="${name}"]`);
      error.textContent = message;
      error.hidden = false;
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", error.id);
    };
    const clearFieldError = (name) => {
      const field = form.elements.namedItem(name);
      const error = form.querySelector(`[data-error-for="${name}"]`);
      error.textContent = "";
      error.hidden = true;
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    };
    const clearErrors = () => {
      ["name", "email", "subject", "message", "privacy_acknowledged"].forEach(clearFieldError);
    };
    const getValidationErrors = () => {
      const invalid = [];
      const name = form.elements.namedItem("name");
      const email = form.elements.namedItem("email");
      const subject = form.elements.namedItem("subject");
      const message = form.elements.namedItem("message");
      const privacy = form.elements.namedItem("privacy_acknowledged");
      if (!name.value.trim()) invalid.push(["name", "Enter your name."]);
      if (!email.value.trim()) invalid.push(["email", "Enter your email address."]);
      else if (email.validity.typeMismatch) invalid.push(["email", "Enter a valid email address."]);
      if (!subject.value) invalid.push(["subject", "Choose an inquiry type."]);
      if (!message.value.trim()) invalid.push(["message", "Enter a message."]);
      if (!privacy.checked) invalid.push(["privacy_acknowledged", "Please acknowledge the Privacy Policy."]);
      return invalid;
    };
    const showSuccess = (restored = false) => {
      setState("SUCCESS");
      status.textContent = "";
      if (!restored) {
        const currentState = window.history.state && typeof window.history.state === "object" ? window.history.state : {};
        window.history.replaceState({ ...currentState, mrMesoffContactSuccess: true }, "");
      }
      form.setAttribute("aria-hidden", "true");
      form.inert = true;
      form.classList.add("is-leaving");
      const success = document.createElement("section");
      success.className = "form-success";
      success.tabIndex = -1;
      success.setAttribute("role", "status");
      success.setAttribute("aria-labelledby", "contact-success-heading");
      success.innerHTML = `<span class="form-success-icon" aria-hidden="true">${icon("check")}</span><p class="eyebrow">Message sent</p><h2 id="contact-success-heading">Thank you. Message received.</h2><p class="success-copy">Thanks for reaching out to MR MESOFF. Your message has been submitted successfully. We'll review your inquiry and respond when appropriate.</p><div class="form-success-actions"><a class="button" href="/"><span>Back to Home</span>${icon("next")}</a><a class="button secondary" href="/features/"><span>Explore MR MESOFF</span>${icon("next")}</a></div><button class="form-send-another" type="button" data-send-another>Send another message</button>`;
      contactBox.appendChild(success);
      window.requestAnimationFrame(() => {
        success.classList.add("is-visible");
        success.focus();
      });
      success.querySelector("[data-send-another]").addEventListener("click", () => {
        success.classList.remove("is-visible");
        const currentState = window.history.state && typeof window.history.state === "object" ? { ...window.history.state } : {};
        delete currentState.mrMesoffContactSuccess;
        window.history.replaceState(Object.keys(currentState).length ? currentState : null, "");
        form.classList.remove("is-leaving");
        form.removeAttribute("aria-hidden");
        form.inert = false;
        form.reset();
        clearErrors();
        configMessage.hidden = true;
        configMessage.textContent = "";
        status.textContent = "";
        setState("IDLE");
        setButtonIdle();
        form.elements.namedItem("name").focus();
        window.setTimeout(() => success.remove(), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 360);
      });
    };
    form.addEventListener("input", (event) => {
      const field = event.target;
      if (field.name && form.querySelector(`[data-error-for="${field.name}"]`)) clearFieldError(field.name);
      if (form.dataset.state === "ERROR") {
        setState("IDLE");
        status.textContent = "";
        configMessage.hidden = true;
      }
    });
    form.addEventListener("change", (event) => {
      const field = event.target;
      if (field.name && form.querySelector(`[data-error-for="${field.name}"]`)) clearFieldError(field.name);
      if (form.dataset.state === "ERROR") {
        setState("IDLE");
        status.textContent = "";
        configMessage.hidden = true;
      }
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (form.dataset.state === "SUBMITTING" || form.dataset.state === "SUCCESS") return;
      setState("VALIDATING");
      status.textContent = "Checking your details.";
      configMessage.hidden = true;
      clearErrors();
      const validationErrors = getValidationErrors();
      if (validationErrors.length) {
        validationErrors.forEach(([name, message]) => setFieldError(name, message));
        setState("ERROR");
        status.textContent = "Please review the highlighted fields and try again.";
        form.elements.namedItem(validationErrors[0][0]).focus();
        return;
      }
      if (!config.web3forms?.accessKey || !config.web3forms?.endpoint) {
        setState("ERROR");
        if (isDevelopment) {
          configMessage.textContent = "Contact form configuration is missing. Add the Web3Forms access key and endpoint in site-config.js.";
          configMessage.hidden = false;
        } else {
          status.textContent = genericFailure;
        }
        if (isDevelopment) status.textContent = "The contact form is not configured yet.";
        return;
      }
      setState("SUBMITTING");
      form.setAttribute("aria-busy", "true");
      status.textContent = "Sending your message.";
      submit.disabled = true;
      submit.classList.add("is-loading");
      submitIcon.innerHTML = icon("loader");
      submitLabel.textContent = "Sending message...";
      let responseStatus = null;
      let providerMessage = "";
      try {
        const data = new FormData(form);
        data.set("name", data.get("name").trim());
        data.set("email", data.get("email").trim());
        data.set("message", data.get("message").trim());
        const response = await fetch(config.web3forms.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.fromEntries(data))
        });
        responseStatus = response.status;
        let result;
        try {
          result = await response.json();
        } catch {
          throw new Error("malformed_response");
        }
        if (!result || typeof result !== "object" || typeof result.success !== "boolean") throw new Error("malformed_response");
        providerMessage = typeof result.message === "string" ? result.message : "";
        if (!response.ok || result.success !== true) throw new Error("provider_rejected");
        showSuccess();
      } catch (error) {
        setState("ERROR");
        const providerText = providerMessage.toLowerCase();
        if (responseStatus === 429 || /rate limit|too many requests/.test(providerText)) {
          status.textContent = "Too many attempts were made. Please wait a moment, then try again.";
        } else {
          status.textContent = genericFailure;
        }
        if (isDevelopment) {
          console.warn("Web3Forms contact submission failed.", {
            status: responseStatus,
            reason: error instanceof Error ? error.message : "unexpected_error"
          });
        }
      } finally {
        setButtonIdle();
      }
    });
    if (window.history.state?.mrMesoffContactSuccess) showSuccess(true);
  }

  document.querySelectorAll(".owner-field").forEach((field) => {
    if (/INSERT.*(EMAIL|CONTACT)/i.test(field.textContent)) {
      field.textContent = config.legal.privacyContactEmail || config.supportEmail;
    }
  });
  if (path === "/data-deletion") {
    const notice = document.querySelector(".legal-notice");
    if (notice) notice.innerHTML = "<strong>Owner action required:</strong> verify the listed app controls and deletion behavior before treating those steps as available. No automated deletion callback is configured or claimed.";
  }

  const canonicalUrl = document.head.querySelector('link[rel="canonical"]')?.href || `${config.url}${path === "/" ? "/" : `${path}/`}`;
  const pageDescription = document.head.querySelector('meta[name="description"]')?.content || config.tagline;
  setMeta('meta[property="og:site_name"]', "content", config.name);
  setMeta('meta[property="og:type"]', "content", "website");
  setMeta('meta[property="og:title"]', "content", document.title);
  setMeta('meta[property="og:description"]', "content", pageDescription);
  setMeta('meta[property="og:url"]', "content", canonicalUrl);
  setMeta('meta[property="og:image"]', "content", `${config.url}/assets/light/bannar.png`);
  setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "content", document.title);
  setMeta('meta[name="twitter:description"]', "content", pageDescription);
  setMeta('meta[name="twitter:image"]', "content", `${config.url}/assets/light/bannar.png`);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll(".page-intro .container, .product-image, .section-heading, .story-columns article, .feature-item, .step, .download-panel, .terminal, .price-option, .contact-box, .rich-content h2, .creator-mark, .footer-main > *");
  if ("IntersectionObserver" in window && !reducedMotion) {
    revealItems.forEach((item) => item.classList.add("reveal"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
    revealItems.forEach((item) => observer.observe(item));
    document.documentElement.classList.add("motion-ready");
  }
  startIntro();
})();