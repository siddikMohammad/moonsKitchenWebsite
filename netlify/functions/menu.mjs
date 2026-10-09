// Public menu: items that are switched on and priced, for the home page
// and the Order page. Unpriced / hidden items are never sent.

import api from "../lib/api.js";
import catalog from "../lib/catalog.js";
import v2Lib from "../lib/v2.js";

const handler = api.safe(async (event) => {
  if (event.httpMethod !== "GET") return api.json(405, { error: "Method not allowed" });
  const products = await catalog.loadPublic();
  return {
    statusCode: 200,
    headers: { "Cache-Control": "public, max-age=60" },
    body: JSON.stringify({ products }),
  };
});

export default v2Lib.v2(handler);
