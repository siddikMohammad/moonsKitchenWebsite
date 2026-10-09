// Wraps a Lambda-style handler ({ httpMethod, headers, body } -> { statusCode,
// headers, body }) as a Netlify v2 function. The v2 format is what Netlify
// Blobs needs for strongly-consistent reads (used by the login rate limits).

function v2(handler) {
  return async (req, context) => {
    const headers = Object.fromEntries(req.headers);
    if (context && context.ip) headers["x-nf-client-connection-ip"] = context.ip;
    const event = {
      httpMethod: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? null : await req.text(),
    };
    const res = await handler(event);
    return new Response(res.body, {
      status: res.statusCode,
      headers: Object.assign({ "Content-Type": "application/json", "Cache-Control": "no-store" }, res.headers),
    });
  };
}

module.exports = { v2 };
