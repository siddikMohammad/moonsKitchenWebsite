# Moon's Kitchen — Website

A responsive one-page website for Moon's Kitchen (home-baked millet & grain
bakes), with animated sections and direct WhatsApp ordering.

## Folder structure

```
MoonsKitchenWebsite/
├── index.html          Main page (all sections: hero, about, menu, order, footer)
├── css/
│   └── style.css        All styling, colors, animations, responsive rules
├── js/
│   └── script.js         WhatsApp link builder, star background, scroll animations, mobile nav
├── assets/
│   └── images/           Put real photos here (empty for now — site uses emoji icons)
└── README.md              This file
```

## How to view it

No install or build step needed — it's plain HTML/CSS/JS.

1. Open the `MoonsKitchenWebsite` folder.
2. Double-click `index.html` to open it in your browser.
   - Or, in VS Code, right-click `index.html` → "Open with Live Server" for
     auto-reload while editing.

## 1. Add your real WhatsApp number (do this first)

Open [`js/script.js`](js/script.js) and find this line near the top:

```js
var WHATSAPP_NUMBER = "910000000000"; // TODO: replace with real WhatsApp number
```

Replace `910000000000` with your real number:
- Country code + number, **no** `+`, spaces, or dashes.
- Example: an Indian number `98765 43210` becomes `"919876543210"`.

Every "Order Now" / "Order on WhatsApp" button on the site reads this one
variable, so you only need to change it in this single place.

Each button already sends a different pre-filled message depending on which
item/category it's on, e.g.:

> Hi Moon's Kitchen! I'd like to order Millet Cookies (15+ Dryfruits). Could
> you please share the price and availability?

## 2. Edit the menu

All menu content lives in `index.html` inside `<section class="menu" id="menu">`.

- **Priced-style items** (Signature Ragi Cookies) are individual cards:
  ```html
  <article class="menu-card">
    <div class="menu-card-icon">🍪</div>
    <h4>Ragi Cookies</h4>
    <p>Classic ragi flour cookies — subtly sweet, wholesome and crumbly.</p>
    <a href="#" class="card-order whatsapp-link" data-item="Ragi Cookies">Order Now</a>
  </article>
  ```
  Copy/paste a card to add a new item. The `data-item` value is what gets
  inserted into the WhatsApp message — change it to match the item name.

- **Flavour-list items** (Ragi Special, Brownies, Cupcakes, Classic Cookies)
  use `.chip` tags inside a `.flavour-card`:
  ```html
  <span class="chip">Butterscotch</span>
  ```
  Add or remove `<span class="chip">…</span>` lines to update flavours.

Prices are intentionally left out site-wide — customers are guided to ask on
WhatsApp instead. If you ever want to show a price, add a line under the
item description, e.g. `<p class="tag-line">₹600 / ½ kg</p>`.

## 3. Add real photos (optional)

Right now menu cards use emoji icons (🍪🧁) instead of photos. To use real
images:

1. Drop image files into `assets/images/` (e.g. `ragi-cookies.jpg`).
2. In `index.html`, replace an icon div with an image tag:
   ```html
   <img src="assets/images/ragi-cookies.jpg" alt="Ragi Cookies" class="menu-card-photo">
   ```
3. Add matching CSS in `style.css` if you want a fixed image size/crop
   (e.g. `.menu-card-photo { width:100%; height:160px; object-fit:cover; border-radius:12px; }`).

Keep photos reasonably small (compressed JPG/WebP) so the site stays fast.

## 4. Colors & fonts

All colors are defined once at the top of `css/style.css` under `:root`:

```css
--bg: #17111f;      /* page background */
--gold: #e0a83c;     /* accent color */
--whatsapp: #25d366;  /* WhatsApp button green */
```

Change a value there and it updates everywhere it's used.

## 5. Publishing the site online

Once you're happy with it, you can host it for free with any static host —
no server code needed. Two easy options:

- **Netlify Drop** — go to https://app.netlify.com/drop and drag the whole
  `MoonsKitchenWebsite` folder in. You'll get a live URL instantly.
- **GitHub Pages** — push the folder to a GitHub repo, then enable Pages in
  the repo settings (Settings → Pages → Deploy from branch).

⚠️ **If you've set up the OTP login gate (see below), Netlify Drop is no
longer enough** — it only publishes static files, not the Functions/Edge
Functions the OTP gate needs. See the "Deploying with OTP enabled" section.

## 6. OTP login gate (optional)

The whole site can be gated behind an email OTP verification screen
(`login.html`). Nobody sees any page until they verify their email.

**How it works:**
- `netlify/functions/send-otp.js` — generates a 6-digit code, emails it via
  Brevo, and returns a signed token (the code itself is never sent back to
  the browser — only a keyed HMAC of it — so no database is needed)
- `netlify/functions/verify-otp.js` — checks the submitted code against that
  token, then sets a signed session cookie (valid 12 hours)
- `netlify/edge-functions/gate.js` — runs on *every* page request and
  redirects to `/login.html` unless a valid session cookie is present. This
  is the part that actually blocks access — a JS popup alone can't, since
  the raw HTML files are still sitting on the server either way.

### One-time setup

1. **Create a Brevo account** at https://app.brevo.com/account/register
   (free tier: 300 emails/day, no cost).
2. **Verify a sender email address** — Brevo → Settings → Senders, add the
   email you want OTPs to be sent from (e.g. your own Gmail or a business
   address) and click the confirmation link Brevo emails you. No domain/DNS
   setup required for this.
3. **Get an API key** — Brevo → Settings → SMTP & API → API Keys → generate
   a new key.
4. **Install the Netlify CLI** (only needed once):
   ```bash
   npm install -g netlify-cli
   netlify login
   ```
   This opens a browser to authorize the CLI against your existing Netlify
   account.
5. **Link this folder to your Netlify site**:
   ```bash
   netlify link
   ```
6. **Add environment variables** in the Netlify dashboard — do NOT put these
   in any file in this folder: Site settings → Environment variables → Add:
   - `BREVO_API_KEY` — the API key from step 3
   - `BREVO_SENDER_EMAIL` — the email address you verified in step 2
   - `OTP_SECRET` — any long random string (e.g. generate one with
     `openssl rand -hex 32`) — signs the OTP verification token, keep it secret
   - `SESSION_SECRET` — a second, different long random string — signs the
     login session, keep it secret too

### Deploying with OTP enabled

Once the above is done, deploy with the CLI instead of drag-and-drop:

```bash
netlify deploy --prod
```

This publishes the static site **and** the Functions/Edge Function together.
Drag-and-drop (Netlify Drop) will NOT deploy the OTP gate correctly.

### Turning the gate off

Delete or rename the `netlify/edge-functions/gate.js` file (or remove the
`[[edge_functions]]` block in `netlify.toml`) and redeploy — the site goes
back to being fully public, no code changes needed elsewhere.

## 7. Optional customer login (header "Login" button)

The site is public. A **Login** button in the header opens `login.html`,
where customers can sign in with **Google** or an **email OTP** — or tap
"Continue without signing in". Once signed in they stay signed in for 30
days, and the header shows their name with a **Log out** option.

- `netlify/functions/session.js` — tells the header who is signed in
- `netlify/functions/google-login.js` — verifies a Google sign-in
- `netlify/functions/logout.js` — clears the session
- `netlify/lib/session.js` — shared cookie helpers

**Abuse limits** (`netlify/lib/limits.js`, stored in Netlify Blobs — free,
no setup): max 5 code emails per address per hour, 20 per visitor IP per
hour, and 5 wrong codes per address per 15 minutes. Change the numbers at the
top of `send-otp.mjs` / `verify-otp.mjs`.

Email OTP uses the same Brevo setup and env vars as section 6
(`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `OTP_SECRET`, `SESSION_SECRET`).

### Enabling "Continue with Google"

1. Go to https://console.cloud.google.com/ → create (or pick) a project.
2. APIs & Services → OAuth consent screen → set it up as **External**.
3. APIs & Services → Credentials → Create credentials → **OAuth client ID**
   → type **Web application**. Under *Authorized JavaScript origins* add
   your live URL (e.g. `https://your-site.netlify.app`) and, for local
   testing with `netlify dev`, `http://localhost` and `http://localhost:8888`.
4. Copy the client ID and add it in Netlify → Environment variables as
   `GOOGLE_CLIENT_ID`. Redeploy with `netlify deploy --prod`.

Without `GOOGLE_CLIENT_ID` the Google button simply doesn't appear and the
login page offers email OTP only. Login needs the Netlify Functions, so it
won't work when `index.html` is opened directly from disk — use
`netlify dev` to test locally.

## Notes

- The site is fully responsive: check it on mobile by resizing your browser
  or using dev tools' device toolbar (F12 → toggle device icon).
- Animations (fade-ins, floating moon, pulsing WhatsApp button, twinkling
  stars) are built with pure CSS + a small amount of JS — no external
  animation libraries required.
- Users with "reduce motion" enabled in their OS accessibility settings will
  automatically see animations turned off.
