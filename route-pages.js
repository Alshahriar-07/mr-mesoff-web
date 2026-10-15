(function () {
  const config = window.MR_MESOFF_CONFIG;
  const faqContent = `<div class="faq-list"><details class="faq-item"><summary>Is MR MESOFF available to download?</summary><p>No verified desktop installers are published yet. See the <a href="/download/">download page</a> for current status.</p></details><details class="faq-item"><summary>Which platforms are supported?</summary><p>Windows, macOS, and Linux are planned targets. Specific supported OS versions and requirements have not been verified or published.</p></details><details class="faq-item"><summary>Can I connect a personal Meta account?</summary><p>The product is intended for eligible business accounts that you own or are authorized to manage. Access depends on official authorization, account eligibility, permissions, review, and platform rules.</p></details><details class="faq-item"><summary>Does AI send messages automatically?</summary><p>Website materials describe an intended workflow, not a guarantee of released behavior. Review replies before sending; AI can be incomplete or incorrect.</p></details><details class="faq-item"><summary>What does MR MESOFF cost?</summary><p>Planned pricing is $20 per month or $199 per year. Checkout is not available. Meta may charge separately for some WhatsApp Business Platform usage.</p></details><details class="faq-item"><summary>How do I disconnect an account or request deletion?</summary><p>Use available product controls if present and remove permissions in relevant Meta settings. For data held by MR MESOFF, follow the <a href="/data-deletion/">deletion instructions</a>.</p></details><details class="faq-item"><summary>How can I install it?</summary><p>No installer script is currently published or tested. Check the <a href="/download/">download page</a> for verified release information.</p></details></div>`;
  const pages = {
    ecosystem: {
      title: "Seed Code Ecosystem",
      description: "How MR MESOFF relates to the Seed Code ecosystem, Eagox Studio, and its developer.",
      intro: "A product with a clear place.",
      content: `<p>MR MESOFF is a product in the <strong>Seed Code</strong> ecosystem. It is the product described on this website; no additional ecosystem catalog or product links are published here.</p><h2>MR MESOFF</h2><p>A desktop-first workspace being developed for business messaging, with AI assistance and human control. Availability is described on the product pages and depends on verified releases and integrations.</p><h2>Seed Code</h2><p>Seed Code is the broader ecosystem context for MR MESOFF. This site does not claim an unverified legal structure or list unverified products.</p><h2>Eagox Studio</h2><p>Eagox Studio is the studio and website publisher brand used for MR MESOFF. It is not presented here as a separate legal entity.</p><h2>Developer</h2><p>MR MESOFF is developed by Al Shahriar Sowan, also known by the creator identity “SHAHRIAR — Man with lots of curiosity.”</p><p class="legal-notice">Related ecosystem links will appear here only after their names and destinations are verified.</p>`
    },
    documentation: {
      title: "MR MESOFF Documentation",
      description: "Public product guidance for installation, account connections, AI and human controls, business context, and troubleshooting.",
      intro: "Product guidance, with current limits made clear.",
      content: `<h2>Installation</h2><p>Desktop installers have not been published. Check the <a href="/download/">download page</a> for platform status. Do not run the displayed reference commands until the corresponding scripts are published and tested.</p><h2>Account connection</h2><p>The intended connection flow uses official Meta authorization for eligible business accounts. Do not share a Meta password with MR MESOFF. Account connection is not represented as available on this site.</p><h2>AI and human controls</h2><p>The product is designed around AI-assisted responses with a person able to handle a conversation. Availability depends on the actual application release; review replies before sending.</p><h2>Business context</h2><p>Business-provided products, prices, FAQs, offers, and policies are intended to ground responses. Do not treat generated content as verified business information.</p><h2>Troubleshooting</h2><p>For installation status, review <a href="/system-requirements/">system requirements</a>. For account access questions, review <a href="/meta-platforms/">platform information</a>. Contact <a href="/contact/">support</a> with a brief description and no passwords or access tokens.</p><h2>Known limitations</h2><p>Downloads, subscription checkout, platform permissions, and some integrations are not published as available. Meta eligibility, permissions, review, and policies may affect future availability.</p>`
    },
    faq: {
      title: "Frequently Asked Questions",
      description: "Answers about MR MESOFF availability, platforms, Meta account eligibility, AI behavior, pricing, and data requests.",
      intro: "Straight answers about what is planned and what is available.",
      content: faqContent
    },
    changelog: {
      title: "MR MESOFF Changelog",
      description: "Verified MR MESOFF release notes. No official release history has been published yet.",
      intro: "Release notes, when there is a release to document.",
      content: `<div class="empty-state"><p class="eyebrow">No published releases</p><h2>No official release notes yet.</h2><p>There is no verified release history available for publication at this time. Release notes will be added here as versions become available.</p><a class="button secondary" href="/download/">Check download status</a></div>`
    },
    roadmap: {
      title: "MR MESOFF Roadmap",
      description: "A transparent view of planned MR MESOFF work, clearly separated from released functionality.",
      intro: "Planned work is not released functionality.",
      content: `<p class="legal-notice"><strong>Status: planned.</strong> The items below describe product direction and do not promise a release date or availability.</p><h2>Planned product areas</h2><ul><li>Desktop releases for Windows, macOS, and Linux.</li><li>Unified handling of eligible connected business messaging channels.</li><li>Conversation-level AI assistance and human handoff.</li><li>Business context for products, offers, FAQs, and policies.</li></ul><h2>What affects availability</h2><p>Development, platform eligibility, API permissions, account setup, policy changes, and release testing can affect whether and when a capability becomes available. No delivery dates are published.</p><p>For current verified status, see <a href="/download/">downloads</a> and <a href="/features/">features</a>.</p>`
    },
    "system-requirements": {
      title: "System Requirements",
      description: "Current verified operating-system requirements for MR MESOFF. Exact desktop requirements have not yet been published.",
      intro: "Requirements will ship with verified releases.",
      content: `<h2>Desktop application</h2><p>Windows, macOS, and Linux are planned platform targets. No minimum OS version, processor, memory, storage, or graphics requirements have been verified for publication.</p><h2>Before installing</h2><p>Wait for a release listing its supported versions and requirements. Do not infer compatibility from the platform name alone. Current release availability is shown on the <a href="/download/">download page</a>.</p><h2>Website</h2><p>This public website is a responsive static site intended for current browsers. No browser-specific cutoff has been established.</p>`
    },
    security: {
      title: "Security Information",
      description: "Security and responsible disclosure information for MR MESOFF. No certifications or formal bounty program are claimed.",
      intro: "Report a concern directly.",
      content: `<h2>Responsible disclosure</h2><p>If you identify a security concern involving MR MESOFF, contact <a href="mailto:${config.supportEmail}">${config.supportEmail}</a> with a concise description and steps to reproduce where safe. Do not include passwords, access tokens, or unnecessary personal information.</p><h2>Current security statements</h2><p>This website does not claim a security certification, independent audit, penetration-test result, bug bounty, encryption guarantee, or formal response timeframe. Product security practices must be verified against the deployed application before they are described as implemented.</p><h2>Account authorization</h2><p>MR MESOFF should use the supported official authorization flow for connected platforms and should not ask users to provide Meta passwords as a substitute. Account and permission details are described on the <a href="/meta-platforms/">platform information page</a>.</p>`
    },
    cookies: {
      title: "Cookies and Local Storage",
      description: "Information about cookies and browser storage used by the MR MESOFF public website and its third-party services.",
      intro: "A plain account of browser storage.",
      content: `<h2>Storage used by this website</h2><p>The published website code does not intentionally write cookies or browser local storage. It uses session storage for a short-lived flag that prevents the animated intro from replaying during the current browser tab session; the flag is cleared when the session ends. The site also uses browser features such as clipboard access when you activate a copy control.</p><h2>Third-party services</h2><p>The website loads fonts from Google Fonts and sends contact form submissions to Web3Forms when you choose to submit. Those providers may process technical request information under their own terms. Hosting infrastructure may also process request data; the operator should verify provider behavior before making broader claims.</p><h2>Desktop application</h2><p>This page describes the public website, not storage behavior inside the desktop application. Review the <a href="/privacy/">Privacy Policy</a> for application data handling, which remains subject to owner verification.</p>`
    },
    "acceptable-use": {
      title: "Acceptable Use Policy",
      description: "Responsible use expectations for MR MESOFF, including lawful messaging, consent, account authorization, and platform policy compliance.",
      intro: "Use messaging tools responsibly.",
      content: `<p class="legal-notice">This policy is informational and requires owner and legal review before being treated as binding terms.</p><h2>Authorized accounts</h2><p>Connect only business accounts you own or are explicitly authorized to manage. Use official authorization flows and do not submit account passwords through the website.</p><h2>Lawful communications</h2><p>You are responsible for lawful messaging, required consent and opt-in, honoring opt-outs, and complying with applicable laws and channel policies. Do not use the product to send unlawful spam, deceptive content, threats, or unwanted campaigns.</p><h2>Respect platform rules</h2><p>Messaging availability, templates, windows, permissions, and eligibility may be limited by the relevant platform. Do not attempt to bypass those restrictions.</p><h2>Review AI-assisted content</h2><p>AI output can be incorrect or incomplete. Check business facts and consequential claims before sending; use human judgment where needed.</p><h2>Report misuse</h2><p>Contact <a href="mailto:${config.supportEmail}">${config.supportEmail}</a> with a report. Do not include passwords or access tokens.</p>`
    },
    licenses: {
      title: "Third-Party Software and Licenses",
      description: "Third-party software and asset attribution for the MR MESOFF website, based on dependencies visible in the published project.",
      intro: "Attribution for what this website currently uses.",
      content: `<h2>Website implementation</h2><p>The published site uses browser-native HTML, CSS, and JavaScript and does not declare an installed JavaScript package dependency. This is not a statement about the desktop application's dependency inventory.</p><h2>Fonts</h2><p>The stylesheet requests DM Sans and Space Grotesk from Google Fonts. Their distribution terms are provided by their respective authors and Google Fonts; confirm the applicable license notices before redistributing font files.</p><h2>Product and brand assets</h2><p>MR MESOFF image assets in this repository are product/brand materials. Third-party marks, including Meta, WhatsApp, Facebook, and Instagram, remain the property of their respective owners. Their appearance does not indicate endorsement.</p><h2>Additional notices</h2><p>No complete software bill of materials or desktop dependency license inventory is present in the website project. Add verified notices here if third-party application components are distributed with a release.</p>`
    },
    accessibility: {
      title: "Accessibility Statement",
      description: "Accessibility information for the MR MESOFF public website, including keyboard, focus, semantic structure, and reduced-motion support.",
      intro: "Designed to remain usable across input and motion preferences.",
      content: `<h2>Website features</h2><p>The website includes semantic page landmarks, a skip link, keyboard-visible focus styles, labeled contact fields, live form feedback, responsive navigation, and a reduced-motion stylesheet. The mobile navigation can be opened and dismissed with the keyboard.</p><h2>Ongoing work</h2><p>No independent accessibility audit or conformance certification is claimed. Accessibility of the desktop application is not described by this website statement.</p><h2>Feedback</h2><p>Report an accessibility barrier at <a href="mailto:${config.supportEmail}">${config.supportEmail}</a>. Include the page and a brief description; avoid sharing sensitive information.</p>`
    },
    "contact/privacy": {
      title: "Privacy Contact",
      description: "How to contact MR MESOFF about privacy, data access, or deletion requests.",
      intro: "A direct path for privacy requests.",
      content: `<h2>Privacy and deletion inquiries</h2><p>Email <a href="mailto:${config.supportEmail}?subject=MR%20MESOFF%20privacy%20request">${config.supportEmail}</a> with “Privacy request” or “Data deletion” in the subject. Share only information needed to identify the request; do not include passwords or access tokens.</p><p>Requests are reviewed and handled under the published policy and applicable requirements. No response deadline or automated deletion callback is claimed here.</p><p>Read the <a href="/privacy/">Privacy Policy</a> and <a href="/data-deletion/">Data Deletion Instructions</a>.</p>`
    },
    "404": {
      title: "Page Not Found",
      description: "The MR MESOFF page you requested does not exist or may have moved.",
      intro: "Lost in the wrong workspace.",
      content: `<div class="empty-state"><span class="status-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 4"/><path d="M12 17h.01"/></svg></span><p class="eyebrow">404 · Page not found</p><h2>The page you’re looking for doesn’t exist or may have moved.</h2><div class="button-row"><a class="button" href="/">Back to home</a><a class="button secondary" href="/features/">Explore features</a><a class="button secondary" href="/download/">Download MR MESOFF</a><a class="button secondary" href="/contact/">Contact support</a></div></div>`
    },
    "500": {
      title: "Something Went Wrong",
      description: "A branded recovery page for an unexpected MR MESOFF website error.",
      intro: "The page could not be displayed.",
      content: `<div class="empty-state"><span class="status-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/></svg></span><p class="eyebrow">Unexpected error</p><h2>Something didn’t load as expected.</h2><p>Try again, return to the homepage, or contact support if the problem continues. This page does not display technical details.</p><div class="button-row"><button class="button secondary" type="button" data-error-retry>Try again</button><a class="button" href="/">Back to Home</a><a class="button secondary" href="/contact/">Contact support</a></div></div>`
    },
    maintenance: {
      title: "Maintenance Information",
      description: "A reusable maintenance notice page that does not claim a maintenance event is currently active.",
      intro: "A status page, not a live status claim.",
      content: `<div class="empty-state"><p class="eyebrow">Service information</p><h2>No maintenance notice is active here.</h2><p>This route is a reusable information page. It does not indicate that the MR MESOFF website or application is currently under maintenance.</p><a class="button secondary" href="/">Return to home</a></div>`
    },
    offline: {
      title: "Offline Information",
      description: "Offline guidance for MR MESOFF visitors. The website does not currently provide an offline application shell.",
      intro: "Offline mode is not available on this site.",
      content: `<div class="empty-state"><p class="eyebrow">Connection unavailable</p><h2>This website has no offline mode.</h2><p>This page is useful only when opened directly; the current site does not include a service worker or offline application shell. Check your connection and try again.</p><a class="button secondary" href="/">Try the homepage</a></div>`
    },
    "unsupported-browser": {
      title: "Browser Compatibility",
      description: "Browser compatibility guidance for MR MESOFF. No unsupported-browser cutoff has been established.",
      intro: "No unsupported-browser list has been established.",
      content: `<h2>Current guidance</h2><p>No browser-specific compatibility cutoff is published for this website. For the best results, use a current browser with JavaScript and modern CSS support enabled.</p><p>This website does not test or certify every browser. The desktop application's supported environment will be listed with verified releases.</p><a class="button secondary" href="/system-requirements/">View system requirements</a>`
    },
    "coming-soon": {
      title: "Coming Soon",
      description: "Reusable coming-soon page for MR MESOFF features that have not yet been released.",
      intro: "Planned does not mean available.",
      content: `<div class="empty-state"><p class="eyebrow">Not released</p><h2>This capability is not available yet.</h2><p>Check the roadmap for planned areas and the changelog for verified releases. No release date is promised.</p><div class="button-row"><a class="button secondary" href="/roadmap/">View roadmap</a><a class="button secondary" href="/changelog/">View changelog</a></div></div>`
    }
  };
  const slug = location.pathname.replace(/^\/+|\/+$/g, "").replace(/\.html$/, "");
  const page = pages[slug];
  const main = document.querySelector("[data-generated-page]");
  if (!page || !main) return;
  document.title = `${page.title} — MR MESOFF`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = page.description;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = `${config.url}/${slug}/`;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogTitle) ogTitle.content = document.title;
  if (ogDescription) ogDescription.content = page.description;
  if (ogUrl) ogUrl.content = `${config.url}/${slug}/`;
  const setSocialMeta = (name, value) => {
    let element = document.querySelector(`meta[name="${name}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.name = name;
      document.head.appendChild(element);
    }
    element.content = value;
  };
  setSocialMeta("twitter:title", document.title);
  setSocialMeta("twitter:description", page.description);
  setSocialMeta("twitter:image", `${config.url}/assets/light/bannar.png`);
  main.innerHTML = `<section class="page-intro"><div class="container"><p class="eyebrow">${page.title}</p><h1>${page.intro}</h1><p class="lead">${page.description}</p></div></section><article class="rich-content container generated-content">${page.content}</article>`;
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const items = main.querySelectorAll(".page-intro .container, .generated-content > *");
    items.forEach((item) => item.classList.add("reveal"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.1, rootMargin: "0px 0px -24px 0px" });
    items.forEach((item) => observer.observe(item));
    main.querySelector(".page-intro .container")?.classList.add("is-visible");
  }
})();