// Customer orders.
//   GET  -> the signed-in customer's own orders (newest first)
//   POST -> place a new order request. Prices come from the products table
//           (never from the browser); the owner still confirms the total.

import { getStore } from "@netlify/blobs";
import db from "../lib/db.js";
import api from "../lib/api.js";
import catalog from "../lib/catalog.js";
import limits from "../lib/limits.js";
import mail from "../lib/mail.js";
import v2Lib from "../lib/v2.js";

const { json, cleanText } = api;

const MAX_LINES = 30;
const MAX_QTY = 100;
const MAX_ORDERS_PER_DAY = 10;
const DAY = 24 * 60 * 60 * 1000;
const REVIEWABLE = ["confirmed", "ready", "completed"];

function todayInIndia() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Returns { order } or { error } — never trusts anything from the browser.
function validateOrder(body) {
  if (!Array.isArray(body.items) || !body.items.length) return { error: "Your order is empty." };
  if (body.items.length > MAX_LINES) return { error: `Please keep it to ${MAX_LINES} different items or fewer.` };

  const merged = new Map();
  for (const line of body.items) {
    const item = cleanText(line && line.item, 80);
    const qty = Math.floor(Number(line && line.qty));
    if (!item) return { error: "One of the items has no name." };
    if (!(qty >= 1 && qty <= MAX_QTY)) return { error: `Quantity for "${item}" must be between 1 and ${MAX_QTY}.` };
    merged.set(item, Math.min(MAX_QTY, (merged.get(item) || 0) + qty));
  }
  const items = [...merged].map(([item, qty]) => ({ item, qty }));

  const name = cleanText(body.name, 60);
  if (name.length < 2) return { error: "Please enter your name." };

  const phone = cleanText(body.phone, 20).replace(/[^\d+]/g, "");
  if (!/^\+?\d{10,13}$/.test(phone)) return { error: "Please enter a valid phone number (10 digits, or with country code)." };

  const fulfilment = body.fulfilment === "delivery" ? "delivery" : body.fulfilment === "pickup" ? "pickup" : null;
  if (!fulfilment) return { error: "Choose pickup or delivery." };

  const address = cleanText(body.address, 300);
  if (fulfilment === "delivery" && address.length < 10) return { error: "Please enter your full delivery address." };

  let preferredDate = null;
  if (body.preferred_date) {
    preferredDate = cleanText(body.preferred_date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || isNaN(Date.parse(preferredDate))) {
      return { error: "Please pick a valid date." };
    }
    const latest = new Date(Date.now() + 90 * DAY).toISOString().slice(0, 10);
    if (preferredDate < todayInIndia() || preferredDate > latest) {
      return { error: "Please pick a date between today and the next 3 months." };
    }
  }

  return {
    order: {
      customer_name: name,
      phone,
      items,
      fulfilment,
      address: fulfilment === "delivery" ? address : null,
      preferred_date: preferredDate,
      notes: cleanText(body.notes, 500) || null,
    },
  };
}

// Adds the pack (size + unit) and unit price to each line from the current menu and returns the
// estimated total. While nothing is priced yet (menu not set up), orders are
// accepted without prices, as before. Returns { items, total } or { error }.
async function priceLines(items) {
  const onSale = (await catalog.loadAll()).filter(catalog.isOnSale);
  if (!onSale.length) return { items, total: null };

  const byName = new Map(onSale.map((p) => [p.name, p]));
  let total = 0;
  const priced = [];
  for (const line of items) {
    const p = byName.get(line.item);
    if (!p) return { error: `"${line.item}" isn't available right now. Please remove it from your order.` };
    const unitPrice = Number(p.price);
    total += unitPrice * line.qty;
    priced.push({ item: line.item, qty: line.qty, pack_size: p.pack_size, unit: p.unit, unit_price: unitPrice });
  }
  return { items: priced, total: Math.round(total * 100) / 100 };
}

function itemsHtml(items) {
  return items
    .map((l) => {
      const pack = l.pack_size ? ` (${l.pack_size} ${l.unit === "pcs" ? "pcs" : "g"})` : "";
      const price = l.unit_price != null ? ` &mdash; &#8377;${l.unit_price * l.qty}` : "";
      return `<li>${mail.escapeHtml(l.item)}${pack} &times; ${l.qty}${price}</li>`;
    })
    .join("");
}

async function listMine(user) {
  const [orders, reviews] = await Promise.all([
    db.select("orders", {
      where: { customer_email: user.email },
      order: "created_at.desc",
      limit: 50,
      columns: "id,created_at,items,fulfilment,address,preferred_date,notes,status,total_price,admin_note",
    }),
    db.select("reviews", { where: { customer_email: user.email }, columns: "order_id,status" }),
  ]);
  const reviewed = new Set(reviews.map((r) => r.order_id));
  return orders.map((o) =>
    Object.assign(o, { reviewed: reviewed.has(o.id), can_review: REVIEWABLE.includes(o.status) && !reviewed.has(o.id) })
  );
}

const handler = api.safe(async (event) => {
  const user = api.currentUser(event);
  if (!user) return json(401, { error: "Please sign in first." });

  if (event.httpMethod === "GET") {
    return json(200, { orders: await listMine(user) });
  }

  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const body = api.readJsonBody(event);
  if (!body) return json(400, { error: "Invalid request" });

  const { order, error } = validateOrder(body);
  if (error) return json(400, { error });

  const store = limits.openStore(getStore);
  if (!(await limits.allow(store, limits.keyFor("order", user.email), MAX_ORDERS_PER_DAY, DAY))) {
    return json(429, { error: "You've placed a lot of orders today. Please message us on WhatsApp instead." });
  }

  const pricing = await priceLines(order.items);
  if (pricing.error) return json(400, { error: pricing.error });
  order.items = pricing.items;
  order.total_price = pricing.total; // estimate; the owner confirms or adjusts it

  const saved = await db.insert("orders", Object.assign({ customer_email: user.email }, order));

  const e = mail.escapeHtml;
  await mail.sendMail({
    to: api.adminEmails(),
    subject: `New order #${saved.id} from ${order.customer_name}`,
    html:
      `<h2>New order #${saved.id}</h2>` +
      `<ul>${itemsHtml(order.items)}</ul>` +
      `<p><strong>${e(order.customer_name)}</strong> &middot; ${e(order.phone)} &middot; ${e(user.email)}</p>` +
      `<p>${order.fulfilment === "delivery" ? "Delivery to: " + e(order.address) : "Pickup"}` +
      `${order.preferred_date ? " &middot; for " + e(order.preferred_date) : ""}</p>` +
      (order.notes ? `<p>Notes: ${e(order.notes)}</p>` : "") +
      (order.total_price != null ? `<p><strong>Estimated total: &#8377;${order.total_price}</strong></p>` : "") +
      `<p>Open the admin page to confirm the order.</p>`,
  });

  return json(201, { ok: true, order: { id: saved.id, status: saved.status } });
});

export default v2Lib.v2(handler);
