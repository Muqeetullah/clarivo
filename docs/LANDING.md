# Landing page

The public `/` page keeps the existing video and pixel headline treatment with a lighter plum overlay and readable white copy. The headline scales from 23px on small phones to 72px on large desktops. A stronger middle overlay on phone protects text contrast over the brighter video frames. A gradient provides a fallback when video is unavailable or reduced motion is enabled.

The landing-only `public/assets/landing-logo.svg` uses two overlapping conversation bubbles, filling the circular home link. The dashboard and auth brand asset remains independent. The black Log in button occupies the former header demo-button position and stays visible on phone. The main call to action and product detail panels lead to signup; landing demo buttons have been removed. The public `/demo` route remains available directly.

The footer describes four planned product capabilities: four knowledge source formats, full conversation history, human support on request, and a single embed snippet. These are product facts from the PRD, not customer or performance metrics. The footer labels the product preview; detail panels explicitly identify AI, uploads, and the installable widget as still in development.

Verification: lint, strict typecheck, and the Webpack production build passed. Browser checks covered desktop (1440 × 1000), phone (390 × 844), phone menu and How it works panel, CTA destinations, and no horizontal overflow. Screenshots: `artifacts/landing/updated-desktop.png` and `updated-phone.png`. No live account was created or provider configuration changed.
