// Customer reviews.
//   GET  -> approved reviews, for the "Kind Words" section (public)
//   POST -> a signed-in customer reviews one of their confirmed orders;
//           it stays hidden until the owner approves it on the admin page.

import { getStore } from "@netlify/blobs";
import db from "../lib/db.js";
import api from "../lib/api.js";
import limits from "../lib/limits.js";
import mail from "../lib/mail.js";
import v2Lib from "../lib/v2.js";

const { json, cleanText } = api;

const REVIEWABLE = ["confirmed", "ready", "completed"];
const MAX_REVIEWS_PER_DAY = 5;
const DAY = 24 * 60 * 60 * 1000;

function summarise(items) {
  const names = (items || []).map((l) => l.item);
  return names.length > 2 ? `${names.slice(0, 2).join(", ")} + ${names.length - 2} more` : names.join(", ");
}

const handler = api.safe(async (event) => {
  if (event.httpMethod === "GET") {
    const reviews = await db.select("reviews", {
      where: { status: "approved" },
      order: "created_at.desc",
      limit: 30,
      columns: "display_name,rating,comment,item_summary,created_at",
    });
    return { statusCode: 200, headers: { "Cache-Control": "public, max-age=60" }, body: JSON.stringify({ reviews }) };
  }

  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const user = api.currentUser(event);
  if (!user) return json(401, { error: "Please sign in first." });

  const body = api.readJsonBody(event);
  if (!body) return json(400, { error: "Invalid request" });

  const orderId = Number(body.order_id);
  const rating = Math.round(Number(body.rating));
  const comment = cleanText(body.comment, 600);
  const displayName = cleanText(body.display_name, 40);
  if (!Number.isInteger(orderId)) return json(400, { error: "Invalid order." });
  if (!(rating >= 1 && rating <= 5)) return json(400, { error: "Please choose 1 to 5 stars." });
  if (comment.length < 5) return json(400, { error: "Please write a few words about your order." });
  if (displayName.length < 2) return json(400, { error: "Please enter the name to show with your review." });

  const [order] = await db.select("orders", {
    where: { id: orderId, customer_email: user.email },
    columns: "id,status,items",
  });
  if (!order) return json(404, { error: "Order not found." });
  if (!REVIEWABLE.includes(order.status)) {
    return json(400, { error: "You can review this order once it's confirmed." });
  }
  const [existing] = await db.select("reviews", { where: { order_id: orderId }, columns: "id" });
  if (existing) return json(409, { error: "You've already reviewed this order. Thank you!" });

  const store = limits.openStore(getStore);
  if (!(await limits.allow(store, limits.keyFor("review", user.email), MAX_REVIEWS_PER_DAY, DAY))) {
    return json(429, { error: "Too many reviews today. Please try again tomorrow." });
  }

  await db.insert("reviews", {
    order_id: orderId,
    customer_email: user.email,
    display_name: displayName,
    rating,
    comment,
    item_summary: summarise(order.items),
  });

  const e = mail.escapeHtml;
  await mail.sendMail({
    to: api.adminEmails(),
    subject: `New ${rating}★ review to approve (order #${orderId})`,
    html: `<p><strong>${e(displayName)}</strong> &middot; ${"★".repeat(rating)}</p><p>${e(comment)}</p>` +
      `<p>Open the admin page to approve or hide it.</p>`,
  });

  return json(201, { ok: true });
});

export default v2Lib.v2(handler);
