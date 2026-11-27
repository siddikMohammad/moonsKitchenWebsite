---
name: moonskitchen-rules
description: The house rules for everything made for Moon's Kitchen - the website (design, wording, ordering, basket, admin, login, privacy, publishing) and its Instagram / WhatsApp images, posters and reels. Use this skill whenever the user asks to add, change, fix, design, write, publish or check anything for Moon's Kitchen, even for a small edit, a new product, a photo, a poster or a caption, and even when they don't mention rules. Also use it when the user says "follow our rules", "same as our page" or "/moonskitchen-rules".
---

# Moon's Kitchen: house rules

Moon's Kitchen is a home bakery in Amalapuram selling millet and grain bakes. Customers are mostly on phones and order by WhatsApp. These rules keep every change looking and behaving like one brand.

Read `CLAUDE.md` for the file map. For bug hunting, also use `moonskitchen-fix-improve`. If a request clashes with a rule here, say which rule, ask once, and do what the user decides.

## 1. Understand first
- The user writes short messages. Say back in one line what you will change. If two readings would lead to different edits ("card" may mean product card or cart/basket), ask one short question with a screenshot or options before editing.
- Change only what was asked. Keep everything else as it is.

## 2. Look
- **Theme:** a random one of the five themes on every reload or new visit, never the same twice in a row (`js/theme.js`). On festival dates (Christmas, New Year, Sankranti & Pongal, Diwali, Ramzan) the festival theme and its wishes in the top banner take over; the dates are in `FESTIVALS` in `js/theme.js` (Diwali and Ramzan need new dates each year). `?theme=rose` or `?theme=diwali` shows one theme only, `?date=2027-10-29` tests a date. Every layout must work in all ten themes. On festival days the whole page dresses up (`js/festival.js`, `css/festival.css`): a festival hero slide with wishes and artwork, festive section titles, lights or toran under the header, footer art and gentle hero motion. Festival words never rename menu items.
- **Colours:** CSS variables only (`--choc`, `--gold`, `--ivory`, `--sand`...). No hex in rules, because a hex colour breaks the other themes.
- **Fonts:** Fraunces for headings, Inter for text.
- **Motion:** gentle only. Photos dissolve inside a still frame; nothing spins, cubes or drifts on scroll. Festival days may add slow snow, confetti, kites, sparks or twinkling stars behind the hero content only. Everything stops under `prefers-reduced-motion`.
- **Phone first:** must work from 340px with no sideways scroll. The logo never touches the header icons. Tap targets at least 32px.
- One `<h1>` per page. Keep `aria-*`, `alt` text and visible keyboard focus.

## 3. Words and honesty
- Plain, warm, short English. Say "Baked fresh to order", never "factory", "best in India" or similar claims.
- **No prices on the website or posters** unless the user asks for that specific one.
- **Reviews must be real** and approved on the admin page. Never invent reviews, ratings, delivery areas, ingredients, awards or an FSSAI number. If a fact is missing, ask for it.
- Health words: describe ingredients ("made with ragi"). Don't promise health results.
- Item names must be identical in three places: `data-item` in `index.html`, `MENU` in `js/cart.js`, and the visible title.

## 4. Photos
- The user's own photos first. Stock photos keep the "representation only" note.
- WebP in `assets/images/`, under 200 KB, plus a `-400.webp` copy, with `alt`, `width` and `height`. Images are cached for a week, so give a replacement photo a new file name.
- Never show a customer's name, face or address. Crop it out.
- Editing a real bake is fine (cut-out, light, background). Don't alter the food itself or present a made-up bake as real.

## 5. Ordering
- **Order** on a card opens WhatsApp for that item. **+ Add to order** fills the basket. Keep both. Once added, the button shows − qty + and **Remove**, so a second tap never adds by accident.
- The bag icon (header) and the bottom **View basket** button both open `order.html`.
- Signed-in customers can save an order (My orders, admin page). Everyone can always order on WhatsApp without signing in.
- The WhatsApp number lives only in `WHATSAPP_NUMBER` in `js/script.js`. Use `class="whatsapp-link"` with `data-item`, or `data-msg="order"` / `data-msg="chat"`.
- No payments on the site.

## 6. Accounts, admin and privacy
- The server decides who is admin (`ADMIN_EMAILS`). Hiding a link is never the protection, so every admin function keeps its own check.
- Customers may see only their own orders. Public replies never include emails, phones or addresses.
- Secrets stay in Netlify environment variables. Don't print their values or copy them into files. Don't open `.env`.
- Keep rate limits, HttpOnly cookies, the JSON-only check and the `?next=` same-site check.
- Collecting or showing anything new about customers means updating `privacy.html` in the same change.
- Test with a fake database and `example.test` emails. Never create test orders or send test emails on the live site.

## 7. Posters, images and reels
- Sizes: post 2160 x 2700, reel/story 1080 x 1920 with text clear of the top 220px and bottom 320px.
- Always include the name **Moon's Kitchen**, "Order on WhatsApp", and @moons_kitchen11 or moonskitchen.netlify.app.
- Vary the design between pieces when making a set. A reference image gives style only: never copy another bakery's name, logo, claims or layout exactly.
- Music must be original or left silent for the user to add in Instagram.
- Save in `posters/` (not published with the site). Never post for the user.

- Instagram posts appear on the site by themselves once `INSTAGRAM_TOKEN` is set. Show views, not likes, and only real numbers from Instagram. A post with a customer's name should carry `#noweb` in its caption.

## 8. Check and publish
1. Run the rule checker from the project root: `node .claude/skills/moonskitchen-rules/scripts/check.mjs`. Fix every FAIL.
2. Look at the change at 360px and desktop width, with no console errors.
3. Show the user what changed, and what was not tested. Then **wait for a clear yes before publishing**; a yes for one change doesn't cover the next.
4. Before `netlify deploy --prod`, confirm the live deploy is the one expected, so newer work isn't overwritten. Note its id for undo.
5. After publishing, check the live pages and report plainly.

Never edit `dist/`. The folder `work on moonkitchen git` is a separate version linked to the same live site: don't edit it or deploy from it.

## Reply style
Short and simple: what changed, where to see it, what was checked, what the user must decide. Use a small table when there are several items.
