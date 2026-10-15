# MR MESOFF Website

This repository contains the public MR MESOFF website as static HTML, CSS, and JavaScript. Routes are served from their directory `index.html` files. `404.html` is the branded not-found fallback for compatible static hosting, including Vercel.

## Contact form

The contact page posts to Web3Forms at `https://api.web3forms.com/submit`. The configured access key is in `site-config.js` under `web3forms.accessKey`. The supplied key is a Web3Forms public access key; the provider documents that it is intended to appear in frontend code. It is not a private backend secret. The form only displays a success state when the provider returns a successful response.

The form includes required name, email, inquiry type, message, privacy acknowledgement, and Web3Forms' hidden honeypot field. Configure any available domain restriction or spam controls for `mrmesoff.vercel.app` in the Web3Forms dashboard. Test the deployed form with non-sensitive test content and confirm delivery to the configured inbox.

The support and privacy contact address is centrally configured as `seedcode.ai@gmail.com` in `site-config.js`. Update `web3forms.accessKey` there if the provider key is rotated. Do not put unrelated private credentials in this public configuration.

## Central configuration

`site-config.js` owns the public brand and publisher attribution, creator, support/privacy contacts, ecosystem links, download/install URLs, platform availability, release information, pricing state, legal fields, and Web3Forms configuration. Blank URLs and dates intentionally indicate that the value has not been verified or published.

## Publication checks

- Verify and complete legal operator identity, effective dates, data handling, retention, providers, and legal review before treating the Privacy Policy or Terms as final.
- Desktop release files and installer scripts are not configured; download actions remain unavailable.
- Pricing is planned at $20/month and $199/year; no checkout is configured.
- `/500/` is a visitor-facing recovery page only. It does not configure hosting-level handling for actual HTTP 500 responses.
- The public contact form forwards data to Web3Forms. Keep its privacy disclosure aligned with the provider and actual deployment behavior.
