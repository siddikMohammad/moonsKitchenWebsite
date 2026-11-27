# Moon's Kitchen Website

One-page marketing site for Moon's Kitchen (home-baked millet / ragi / grain bakes).
Customers fill a cart and place it from the Order page: signed-in customers can save it (Supabase, My orders, admin page), everyone can send it as one WhatsApp message. There is no payment. Optional customer
login (Google or email OTP) runs on Netlify Functions.

## Stack
- Plain HTML + CSS + vanilla JS (ES5-style IIFEs, `"use strict"`, `var`). No framework, no bundler for the front end.
- Hosted on Netlify. `npm run build` (scripts/build.mjs) copies the live files into `dist/`, which Netlify publishes.
- Serverless: Netlify Functions (Node 18, esbuild) in `netlify/functions/`, helpers in `netlify/lib/`.
- Rate limits are stored in Netlify Blobs (`@netlify/blobs`).
- Fonts: Google Fonts (Fraunces for headings, Inter for body).

## Layout
| Path | What it is |
|---|---|
| `index.html` | The whole site: SVG icon sprite, header/nav, hero slider, categories, bestsellers, ragi cookies, reels, feature rows, promise/about, testimonials, FAQ, trust strip, footer |
| `login.html`, `js/login.js`, `css/login.css` | Customer sign-in page (Google + email OTP + "continue without signing in") |
| `privacy.html` | Privacy policy |
| `css/style.css` | All main-site styles. Colour themes at the top, then sections in page order, then `/* Responsive */` (breakpoints 1080 / 860 / 720 / 460px) and `prefers-reduced-motion` |
| `js/theme.js` | Sets the colour theme before paint. Picks a random theme on every reload or new visit, never the same twice in a row (`DEFAULT_THEME`, caramel, only if storage is blocked); pages within one visit keep the same theme. On festival dates (`FESTIVALS`: Christmas, New Year, Sankranti & Pongal, Diwali, Ramzan) the festival theme is used and its wishes replace the top banner text. Show one theme only with `?theme=rose` / `?theme=diwali`; test a date with `?date=2027-10-29` |
| `js/festival.js`, `css/festival.css` | Festival look, only while a festival is on (`<html data-festival>`): festival hero slide with wishes and SVG artwork (first slide), festive section titles (`WORDS`), string of lights / toran under the header (also on the Order page), footer art, gentle hero motion. `festival.js` loads before `script.js` on `index.html` |
| `js/script.js` | Numbered sections: 1 WhatsApp links, 1b Unsplash photo groups, 1c Instagram reels and posts (`INSTAGRAM_POSTS`), 1d testimonials, 2 hero slider, 3 scroll reveal, 4 header/progress, 4b active nav link, 4c FAQ accordion, 5 mobile nav drawer, 6 footer year |
| `js/cart.js` | Cart shared by both pages (`localStorage` `mk_cart`), bag count, and the Order page `MENU`. Keep `MENU` names the same as the home page's `data-item` values |
| `order.html`, `js/order-page.js` | Order page: item picker, your order, details, then saved order or one WhatsApp message |
| `my-orders.html`, `admin.html` + `js/my-orders.js`, `js/admin.js`, `js/app.js` | Customer's orders and reviews; owner page (orders, reviews). `app.js` = shared helpers |
| `js/order.js`, `css/order.css` | Home page "+ Add to order" buttons, Build Your Own Box (`BOX_SIZES`), custom cake form. Load order: `script.js`, `cart.js`, `order.js` |
| `css/new-design.css` | "Moonrise" design preview, only loaded with `?design=new` |
| `netlify/functions/` | `send-otp.mjs`, `verify-otp.mjs`, `google-login.js`, `session.js`, `logout.js`, `orders.mjs`, `reviews.mjs`, `admin.mjs` (owner only: `ADMIN_EMAILS`), `instagram.mjs` (latest posts + views), `instagram-refresh.mjs` (daily) |
| `netlify/lib/` | `session.js` (signed cookie `mk_session`, 30 days), `limits.js` (abuse limits), `v2.js` (Lambda-style to v2 adapter), `db.js` (Supabase REST), `api.js` (auth + JSON helpers), `mail.js` (Brevo), `instagram.js` (Meta API; renewed token kept encrypted in Blobs). Tables: `supabase/schema.sql` |
| `netlify/disabled/gate.js` | Site-wide OTP gate, currently OFF (see `netlify.toml`) |
| `assets/images/` | Logos, favicons, product photos |
| `dist/` | **Build output. Never edit by hand.** Run `npm run build` |

## Rules
- Edit the source files in the project root, never `dist/`.
- The WhatsApp number lives only in `WHATSAPP_NUMBER` in `js/script.js`. Order buttons use `class="whatsapp-link"` + `data-item="<Item name>"`; general buttons use `data-msg="order"` or `data-msg="chat"` instead.
- Colours: use the CSS custom properties (`--choc`, `--gold`, `--ivory`, ...). Never hard-code hex values in rules. A new colour must be added to **every** `[data-theme]` block.
- Keep the existing code style: ES5 `var`/`function`, comment headers per section, no new libraries or CDNs without asking.
- Every change must work at phone width (down to 360px) and respect `prefers-reduced-motion`.
- Keep accessibility attributes (`aria-*`, `alt`, focus states) intact or improve them.
- Secrets (`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `OTP_SECRET`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_EMAILS`, `INSTAGRAM_TOKEN`) live only in Netlify environment variables. Never write them into files.
- Prices are intentionally not shown on the site. Customers ask on WhatsApp.
- Testimonials must be real customer reviews only. Never invent them.
- `README.md` is partly out of date (for example, it says there are no photos and that the gate is in `edge-functions/`). Trust the code over the README.

## Running locally
- Front end only: open `index.html` directly in a browser.
- With login/functions: `netlify dev`, then open http://localhost:8888 (serves source files, no build).
- Deploy: `netlify deploy --prod` (runs `npm run build`).

## Skills
- `moonskitchen-rules`: the house rules. Use for every change, new content, poster or reel, and before publishing.
- `moonskitchen-fix-improve`: use for any bug fix or improvement on the site.
