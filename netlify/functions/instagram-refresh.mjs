// Runs once a day by itself: keeps the Instagram token renewed and the post
// list warm even when nobody visits. Does nothing without INSTAGRAM_TOKEN.

import { getStore } from "@netlify/blobs";
import instagram from "../lib/instagram.js";

export default async () => {
  const list = await instagram.posts(getStore({ name: "instagram", consistency: "strong" }), true);
  console.log("instagram: daily refresh,", list.length, "posts");
};

export const config = { schedule: "0 3 * * *" };
