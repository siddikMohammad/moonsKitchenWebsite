// Moon's Kitchen's own Instagram posts and view counts, through Meta's official
// "Instagram API with Instagram Login" (Standard Access: own account only).
//
// Requires env var INSTAGRAM_TOKEN: a long-lived token made in the Meta App
// Dashboard. It lasts 60 days, so it is renewed here every week. The renewed
// token is kept in Netlify Blobs, encrypted with a key made from SESSION_SECRET
// (never in plain text, never sent to the browser, never logged).
// Without INSTAGRAM_TOKEN everything here simply returns no posts.

const crypto = require("crypto");

const HOST = "https://graph.instagram.com";
const GRAPH = `${HOST}/v27.0`;
const MAX_POSTS = 12;
const FRESH_MS = 15 * 60 * 1000; // how old the saved list may get
const RETRY_MS = 5 * 60 * 1000; // wait after a failed try
const KEEP_MS = 3 * 24 * 60 * 60 * 1000; // Instagram's picture links stop working after some days
const RENEW_MS = 7 * 24 * 60 * 60 * 1000;
const HIDE_TAG = /#noweb\b/i; // add to a caption to keep that post off the website

let memory = null; // used when Blobs is unavailable

const hash = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 32);
const key = () => crypto.createHash("sha256").update("instagram-token:" + process.env.SESSION_SECRET).digest();

function lock(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64");
}

function unlock(b64) {
  try {
    const b = Buffer.from(b64, "base64");
    const d = crypto.createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

async function call(path, params) {
  const url = `${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = await res.json().catch(() => ({}));
  // Only the status and Meta's error code are ever logged: the URL holds the token.
  if (!res.ok) throw new Error(`Instagram ${res.status} code ${(data.error && data.error.code) || "?"}`);
  return data;
}

async function read(store, name) {
  if (!store) return memory && memory[name];
  try { return await store.get(name, { type: "json" }); } catch { return null; }
}

async function write(store, name, value) {
  if (!store) { memory = Object.assign({}, memory, { [name]: value }); return; }
  try { await store.setJSON(name, value); } catch (err) { console.error("instagram: could not save", name, err.message); }
}

// The token to use now; renews it when it is a week old.
async function currentToken(store) {
  const seed = process.env.INSTAGRAM_TOKEN;
  const id = hash(seed);
  if (!store || !process.env.SESSION_SECRET) return { token: seed, id };

  const now = Date.now();
  let saved = await read(store, "token");
  let token = saved && saved.id === id ? unlock(saved.box) : null;
  if (!token) {
    // First run, or a new token was put in Netlify
    token = seed;
    saved = { id, box: lock(seed), at: now, tried: now };
    await write(store, "token", saved);
    return { token, id };
  }
  if (now - saved.at > RENEW_MS && now - (saved.tried || 0) > 24 * 60 * 60 * 1000) {
    try {
      const fresh = await call(`${HOST}/refresh_access_token`, { grant_type: "ig_refresh_token", access_token: token });
      if (fresh.access_token) {
        token = fresh.access_token;
        await write(store, "token", { id, box: lock(token), at: now, tried: now });
      }
    } catch (err) {
      console.error("instagram: token renewal failed:", err.message);
      await write(store, "token", Object.assign({}, saved, { tried: now }));
    }
  }
  return { token, id };
}

function safeUrl(value, hosts) {
  try {
    const u = new URL(value);
    const ok = u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
    return ok ? u.href : null;
  } catch {
    return null;
  }
}
const picture = (v) => safeUrl(v, ["cdninstagram.com", "fbcdn.net"]);

async function views(id, token) {
  try {
    const data = await call(`${GRAPH}/${encodeURIComponent(id)}/insights`, { metric: "views", access_token: token });
    const m = data.data && data.data[0];
    const n = m && (m.values && m.values[0] ? m.values[0].value : m.total_value && m.total_value.value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null; // not available for this post: the site just shows no number
  }
}

async function load(token) {
  const me = await call(`${GRAPH}/me`, { fields: "user_id,username", access_token: token });
  const base = { limit: 25, access_token: token };
  const fields = "id,media_type,media_url,thumbnail_url,permalink,timestamp";
  const list = `${GRAPH}/${encodeURIComponent(me.user_id || me.id)}/media`;
  let media;
  try {
    media = await call(list, Object.assign({ fields: fields + ",caption" }, base));
  } catch {
    media = await call(list, Object.assign({ fields }, base)); // captions not allowed for this login type
  }
  const posts = (media.data || []).filter((m) => !HIDE_TAG.test(m.caption || "")).slice(0, MAX_POSTS);
  const counts = await Promise.all(posts.map((m) => views(m.id, token)));
  return posts.map((m, i) => {
    const video = m.media_type === "VIDEO";
    return {
      type: video ? "video" : "photo",
      link: safeUrl(m.permalink, ["instagram.com"]),
      image: picture(video ? m.thumbnail_url : m.media_url),
      video: video ? picture(m.media_url) : null,
      caption: String(m.caption || "").split("\n")[0].replace(/\s#\S+/g, "").trim().slice(0, 110),
      views: counts[i],
    };
  }).filter((p) => p.link && p.image);
}

// Public list of posts. Never throws.
async function posts(store, force) {
  if (!process.env.INSTAGRAM_TOKEN) return [];
  const { token, id } = await currentToken(store);
  const now = Date.now();
  const saved = await read(store, "feed");
  const mine = saved && saved.id === id ? saved : null;
  const usable = mine && now - mine.at < KEEP_MS ? mine.posts : [];
  if (!force && mine && now - mine.at < FRESH_MS) return mine.posts;
  if (!force && mine && now - (mine.tried || 0) < RETRY_MS) return usable;
  try {
    const list = await load(token);
    await write(store, "feed", { id, at: now, tried: now, posts: list });
    return list;
  } catch (err) {
    console.error("instagram: could not load posts:", err.message);
    await write(store, "feed", { id, at: mine ? mine.at : 0, tried: now, posts: mine ? mine.posts : [] });
    return usable;
  }
}

module.exports = { posts };
