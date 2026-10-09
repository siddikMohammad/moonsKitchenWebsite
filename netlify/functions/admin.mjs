// Owner-only admin API (emails listed in the ADMIN_EMAILS env var).
//   GET   ?type=orders&status=new|confirmed|ready|completed|cancelled|all
//   GET   ?type=reviews&status=pending|approved|hidden|all
//   PATCH { type: "order", id, status?, total_price?, admin_note? }
//   PATCH { type: "review", id, status }

import db from "../lib/db.js";
import api from "../lib/api.js";
import v2Lib from "../lib/v2.js";

const { json, cleanText } = api;

const ORDER_STATUSES = ["new", "confirmed", "ready", "completed", "cancelled"];
const REVIEW_STATUSES = ["pending", "approved", "hidden"];

async function list(q) {
  const type = q.type === "reviews" ? "reviews" : "orders";
  const allowed = type === "orders" ? ORDER_STATUSES : REVIEW_STATUSES;
  const where = allowed.includes(q.status) ? { status: q.status } : {};
  const rows = await db.select(type, { where, order: "created_at.desc", limit: 200 });
  return json(200, { [type]: rows });
}

async function updateOrder(body) {
  const id = Number(body.id);
  if (!Number.isInteger(id)) return json(400, { error: "Invalid order id" });

  const patch = {};
  if (body.status !== undefined) {
    if (!ORDER_STATUSES.includes(body.status)) return json(400, { error: "Invalid status" });
    patch.status = body.status;
  }
  if (body.total_price !== undefined) {
    if (body.total_price === null || body.total_price === "") {
      patch.total_price = null;
    } else {
      const price = Number(body.total_price);
      if (!(price >= 0 && price <= 1000000)) return json(400, { error: "Price must be a number" });
      patch.total_price = Math.round(price * 100) / 100;
    }
  }
  if (body.admin_note !== undefined) patch.admin_note = cleanText(body.admin_note, 500) || null;
  if (!Object.keys(patch).length) return json(400, { error: "Nothing to update" });

  const row = await db.update("orders", { id }, patch);
  return row ? json(200, { order: row }) : json(404, { error: "Order not found" });
}

async function updateReview(body) {
  const id = Number(body.id);
  if (!Number.isInteger(id) || !REVIEW_STATUSES.includes(body.status)) return json(400, { error: "Invalid request" });
  const row = await db.update("reviews", { id }, { status: body.status });
  return row ? json(200, { review: row }) : json(404, { error: "Review not found" });
}

const handler = api.safe(async (event) => {
  const user = api.currentUser(event);
  if (!user) return json(401, { error: "Please sign in first." });
  if (!user.isAdmin) return json(403, { error: "Not allowed." });

  if (event.httpMethod === "GET") return list(event.queryStringParameters || {});

  if (event.httpMethod === "PATCH") {
    const body = api.readJsonBody(event);
    if (!body) return json(400, { error: "Invalid request" });
    if (body.type === "order") return updateOrder(body);
    if (body.type === "review") return updateReview(body);
    return json(400, { error: "Invalid type" });
  }

  return json(405, { error: "Method not allowed" });
});

export default v2Lib.v2(handler);
