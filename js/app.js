/* ============================================
   Moon's Kitchen — shared helpers for the order / account pages
   (cart, API calls, session). Loaded before page-specific scripts.
   ============================================ */
(function () {
  "use strict";

  var CART_KEY = "mk_cart";
  var MAX_QTY = 100;

  // Safe for both element text and quoted attribute values.
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Cart (kept in this browser until the order is placed) ---------- */

  function readCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(raw) ? raw.filter(function (l) { return l && l.item && l.qty > 0; }) : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(lines) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(lines)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("mk:cart"));
  }

  // Sets an item's quantity (0 removes it), keeping its place in the list.
  function setQty(item, qty) {
    qty = Math.max(0, Math.min(MAX_QTY, Math.floor(qty) || 0));
    var lines = readCart();
    var line = lines.find(function (l) { return l.item === item; });
    if (line) line.qty = qty;
    else lines.push({ item: item, qty: qty });
    writeCart(lines.filter(function (l) { return l.qty > 0; }));
  }

  function qtyOf(item) {
    var line = readCart().find(function (l) { return l.item === item; });
    return line ? line.qty : 0;
  }

  function cartCount() {
    return readCart().reduce(function (n, l) { return n + l.qty; }, 0);
  }

  /* ---------- API ---------- */

  function api(path, options) {
    options = options || {};
    var init = { method: options.method || "GET", credentials: "same-origin", headers: {} };
    if (options.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }
    return fetch("/.netlify/functions/" + path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = new Error(data.error || "Something went wrong. Please try again.");
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  var sessionPromise = null;
  function session() {
    if (!sessionPromise) {
      sessionPromise = location.protocol === "file:"
        ? Promise.resolve({ loggedIn: false })
        : api("session").catch(function () { return { loggedIn: false }; });
    }
    return sessionPromise;
  }

  // The live menu (priced, switched-on items). Resolves to
  // { products: [...], byName: Map, priced: bool }. priced is false when the
  // menu couldn't load or nothing is priced yet — pages then keep their
  // original look ("Price on request", every item shown).
  var menuPromise = null;
  function menu() {
    if (!menuPromise) {
      var load = location.protocol === "file:"
        ? Promise.resolve({ products: [] })
        : api("menu").catch(function () { return { products: [] }; });
      menuPromise = load.then(function (data) {
        var products = data.products || [];
        var byName = new Map(products.map(function (p) { return [p.name, p]; }));
        return { products: products, byName: byName, priced: products.length > 0 };
      });
    }
    return menuPromise;
  }

  // "250 g", "500 g", "1 kg", "9 pcs", "1 pc"
  function size(packSize, unit) {
    if (packSize == null) return "";
    if (unit === "pcs") return packSize + (packSize === 1 ? " pc" : " pcs");
    return packSize >= 1000 ? (Math.round(packSize / 10) / 100) + " kg" : packSize + " g";
  }

  function pack(p) {
    return [size(p.pack_size, p.unit), money(p.price)].filter(Boolean).join(" · ");
  }

  function loginUrl() {
    return "login.html?next=" + encodeURIComponent(location.pathname + location.search);
  }

  /* ---------- Formatting ---------- */

  var STATUS_LABELS = {
    new: "Received",
    confirmed: "Confirmed",
    ready: "Ready",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "To approve",
    approved: "Approved",
    hidden: "Hidden"
  };

  function statusBadge(status) {
    return '<span class="status status-' + esc(status) + '">' + esc(STATUS_LABELS[status] || status) + "</span>";
  }

  function money(n) {
    return n == null ? "" : "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }

  function date(iso, withTime) {
    if (!iso) return "";
    var d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    var opts = { day: "numeric", month: "short", year: "numeric" };
    if (withTime) { opts.hour = "numeric"; opts.minute = "2-digit"; }
    return d.toLocaleString("en-IN", opts);
  }

  function itemsList(items) {
    return "<ul class=\"line-items\">" + (items || []).map(function (l) {
      var detail = l.pack_size ? ' <small class="muted">(' + esc(size(l.pack_size, l.unit)) + ")</small>" : "";
      var price = l.unit_price != null ? " &middot; " + esc(money(l.unit_price * l.qty)) : "";
      return "<li><span>" + esc(l.item) + detail + "</span><strong>&times; " + esc(l.qty) + price + "</strong></li>";
    }).join("") + "</ul>";
  }

  /* ---------- Header cart badge (any page that has one) ---------- */

  function paintCartBadges() {
    var n = cartCount();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }
  document.addEventListener("mk:cart", paintCartBadges);
  window.addEventListener("storage", function (e) { if (e.key === CART_KEY) paintCartBadges(); });
  document.addEventListener("DOMContentLoaded", paintCartBadges);

  window.MK = {
    esc: esc,
    cart: { read: readCart, write: writeCart, setQty: setQty, qtyOf: qtyOf, count: cartCount, clear: function () { writeCart([]); } },
    api: api,
    session: session,
    menu: menu,
    size: size,
    pack: pack,
    loginUrl: loginUrl,
    statusBadge: statusBadge,
    money: money,
    date: date,
    itemsList: itemsList,
    MAX_QTY: MAX_QTY
  };
})();
