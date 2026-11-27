// Public: Moon's Kitchen's latest Instagram posts with view counts, for the
// home page. Empty until INSTAGRAM_TOKEN is set; the page then keeps showing
// the Instagram boxes listed in js/script.js.

import { getStore } from "@netlify/blobs";
import instagram from "../lib/instagram.js";

export default async (req) => {
  if (req.method !== "GET") return new Response("{}", { status: 405, headers: { "Content-Type": "application/json" } });
  let store = null;
  try {
    store = getStore({ name: "instagram", consistency: "strong" });
  } catch (err) {
    console.error("instagram: Blobs unavailable:", err.message);
  }
  let posts = [];
  try {
    posts = await instagram.posts(store);
  } catch (err) {
    console.error("instagram:", err.message);
  }
  return new Response(JSON.stringify({ posts }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120",
      // Shared by all visitors, so many visits still mean few calls to Instagram
      "Netlify-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
};
