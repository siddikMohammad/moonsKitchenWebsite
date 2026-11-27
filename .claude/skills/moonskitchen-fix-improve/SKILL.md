---
name: moonskitchen-fix-improve
description: Diagnose and fix bugs, and make improvements, on the Moon's Kitchen website (QA feedback, review comments, client requests). Use whenever the user reports something wrong or asks for a change on the site, even without the word "bug". Examples include the header, nav, mobile menu, hero slider, menu/product cards, photos, reels, testimonials, FAQ, footer, WhatsApp order buttons, colour themes, animations, login/OTP/Google sign-in, privacy page, layout or text cut off on phone/tablet, speed, SEO and accessibility.
---

# Moon's Kitchen: bug fixes and improvements

Read `CLAUDE.md` first for the stack and file map, and follow `moonskitchen-rules` for every change.

## 1. Understand the request
- Restate the problem or change in one line. If it's a bug, note the device/width, browser, theme (`?theme=`), and whether the user was signed in.
- If the request is ambiguous (which section? which screen size?), ask **one** short question before you edit.
- Treat several feedback points as separate items and track each one.

## 2. Find the code
Go from the visible thing to its code:

| Area | HTML (`index.html`) | CSS (`css/style.css`) | JS |
|---|---|---|---|
| Header, nav, account menu | `.site-header`, `#navLinks`, `#account` | "Announcement + header" | `script.js` §4, §4b, §5 |
| Hero slider | `#home`, `#heroTrack`, `#heroDots` | "Hero slider" | §2 |
| Categories / product cards | `.categories`, `#bestsellers`, `#ragi-cookies` | "Categories", "Product cards" | §1, §1b (photos) |
| Feature rows (ragi special, brownies, cupcakes, classic cookies) | `.feature-row` | "Category feature rows" | §1b |
| Instagram posts | `#reels`, `#reelRow` | "Instagram reels" | §1c (`INSTAGRAM_POSTS`) |
| Add to order, bag, bottom basket button | `.cart-btn`, `#basketFab` | `css/order.css` | `js/cart.js`, `js/order.js` |
| Order page | `order.html` | `css/order.css` | `js/order-page.js` |
| Box builder, custom cakes | `#build-box`, `#cakes` | `css/order.css` | `js/order.js` |
| My orders, Admin | `my-orders.html`, `admin.html` | `css/order.css` | `js/my-orders.js`, `js/admin.js`, `netlify/functions/*` |
| Testimonials | `#reviews`, `#testiTrack` | "Testimonials" | §1d |
| FAQ | `#faq`, `#faqList` | "FAQ" | §4c |
| Footer, floating WhatsApp, back to top | `.site-footer`, `#toTop` | "Footer", "Floating WhatsApp button" | §6 |
| Colour themes | `<html data-theme>` | top `:root[data-theme=...]` blocks | `js/theme.js` |
| Mobile layout | none | "Responsive" (1080/860/720/460px) | none |
| Login | `login.html` | `css/login.css` | `js/login.js` + `netlify/functions/*`, `netlify/lib/*` |

Use Grep for the visible text, class or id. Remember that §1b swaps some emoji placeholders for Unsplash photos at runtime.

## 3. Fix or improve
- **Root cause, smallest change.** Fix the cause, not the symptom. Don't refactor unrelated code in the same change.
- Edit the root source files, **never `dist/`**.
- Follow the existing style: ES5 IIFE, `var`, section comment headers, CSS custom properties for every colour.
- A colour change must be made in **all five themes** (caramel, rose, sage, lavender, peach).
- A layout change must work at every breakpoint. Add responsive rules inside the matching `@media` block in the "Responsive" section, not scattered through the file.
- New animations must be disabled under `prefers-reduced-motion: reduce`.
- New order buttons: `<a href="#" class="whatsapp-link" data-item="Exact Item Name">`. Never hard-code a `wa.me` URL.
- New images go in `assets/images/`, compressed (JPG/WebP, ideally < 200 KB), with meaningful `alt` text and `width`/`height` or `aspect-ratio` to avoid layout shift.
- Login/functions changes: keep the rate limits, HMAC signing and `HttpOnly`/`Secure` cookie flags. Never log or return OTP codes or secrets, and never weaken the checks to "make it work".
- Text content: no prices and no invented testimonials (see `CLAUDE.md`).

## 4. Check it
Run these checks yourself before saying it's done:
- Re-read the diff and confirm that only the intended files changed and `dist/` is untouched.
- Trace the logic at desktop, tablet (~768px) and phone (~375px) widths, and under at least two themes.
- JS: no console errors, and null-safe for elements that might not exist on `login.html`/`privacy.html`.
- If functions changed: `node --check` the file, then think through the success, wrong-code, rate-limited and missing-env-var paths.
- If anything couldn't be verified, say so plainly. The user checks in the browser themselves (`index.html` directly, or `netlify dev` at http://localhost:8888 for login).

## 5. Report
For each item, give:
- **What was wrong / what changed**, in one or two lines.
- **Files touched**, as clickable `path:line` links.
- **How to check it**: the exact section, screen width or theme to look at.
- Any follow-up worth doing that you didn't do.

Remind the user to run `npm run build` (or `netlify deploy --prod`) before publishing.
