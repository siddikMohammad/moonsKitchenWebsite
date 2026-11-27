/* ============================================
   Moon's Kitchen — cart shared by the home page
   and the Order page. Kept in this browser only
   (localStorage) until the order is sent.
   Load after script.js, before order.js /
   order-page.js.
   ============================================ */

(function () {
  "use strict";

  var CART_KEY = "mk_cart";
  var MAX_QTY = 100;

  /* ------------------------------------------------------------
   * The menu on the Order page. When you add or rename an item on
   * the home page, change it here too: names must match the home
   * page's data-item values.
   * ---------------------------------------------------------- */
  var MENU = [
    { category: "Cookies", items: [
      "Millet Cookies (15+ Dryfruits)", "Ragi Cookies", "Ragi Chocolate Cookies", "Kesar Pista Cookies",
      "Almonds Oats Cookies", "Fruit Cookies", "Multigrain Cookies", "Jowar Cookies",
      "Vanilla Cookies", "Chocolate Chip Cookies", "Butter Cookies"
    ] },
    { category: "Ragi Special", items: [
      "Ragi Special – Almond", "Ragi Special – Dry Fruit", "Ragi Special – Cashew",
      "Ragi Special – Millet", "Ragi Special – Whole Wheat"
    ] },
    { category: "Brownies", items: [
      "Fudge Brownie", "Chewy Brownie", "Cakey Brownie", "Triple Chocolate Brownie Bits",
      "Dark Chocolate Brownie Bits", "White Chocolate Brownie Bits", "Dark & White Chocolate Brownie Bits"
    ] },
    { category: "Cupcakes", items: [
      "Chocolate Cupcakes", "Vanilla Cupcakes", "Pineapple Cupcakes", "Butterscotch Cupcakes",
      "Rasmalai Cupcakes", "Strawberry Cupcakes", "Pista Cupcakes"
    ] }
  ];

  function clean(lines) {
    if (!Array.isArray(lines)) return [];
    return lines.filter(function (l) {
      return l && typeof l.item === "string" && l.item && l.qty >= 1;
    }).map(function (l) {
      return { item: l.item.slice(0, 400), qty: Math.min(MAX_QTY, Math.floor(l.qty)) };
    });
  }

  var memory = []; // used when the browser blocks localStorage

  function read() {
    try { return clean(JSON.parse(localStorage.getItem(CART_KEY) || "[]")); } catch (e) { return clean(memory); }
  }

  function write(lines) {
    memory = lines;
    try { localStorage.setItem(CART_KEY, JSON.stringify(lines)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("mk:cart"));
  }

  function find(lines, item) {
    return lines.filter(function (l) { return l.item === item; })[0];
  }

  // Sets an item's quantity (0 removes it), keeping its place in the list.
  function setQty(item, qty) {
    qty = Math.max(0, Math.min(MAX_QTY, Math.floor(qty) || 0));
    var lines = read();
    var line = find(lines, item);
    if (line) line.qty = qty;
    else lines.push({ item: item, qty: qty });
    write(lines.filter(function (l) { return l.qty > 0; }));
  }

  function qtyOf(item) {
    var line = find(read(), item);
    return line ? line.qty : 0;
  }

  function count() {
    return read().reduce(function (n, l) { return n + l.qty; }, 0);
  }

  // Carry over anything saved by the first basket (mk_basket), once.
  try {
    var old = JSON.parse(localStorage.getItem("mk_basket") || "null");
    if (Array.isArray(old)) {
      clean(old.map(function (l) { return { item: l && l.name, qty: l && l.qty }; })).forEach(function (l) {
        if (!qtyOf(l.item)) setQty(l.item, l.qty);
      });
    }
    localStorage.removeItem("mk_basket");
  } catch (e) {}

  /* ---------- Count on the bag icon ---------- */
  function paintBadges() {
    var n = count();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    // Bottom "View basket" button (home page)
    var fab = document.getElementById("basketFab");
    if (fab) {
      fab.hidden = n === 0;
      document.getElementById("basketCount").textContent = n + (n === 1 ? " item" : " items");
      document.body.classList.toggle("has-basket", n > 0);
    }
    document.querySelectorAll(".cart-btn").forEach(function (el) {
      el.setAttribute("aria-label", "Your order, " + n + (n === 1 ? " item" : " items"));
    });
  }
  document.addEventListener("mk:cart", paintBadges);
  // Another tab, or coming back with the Back button
  window.addEventListener("storage", function (e) {
    if (e.key === CART_KEY) document.dispatchEvent(new CustomEvent("mk:cart"));
  });
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) document.dispatchEvent(new CustomEvent("mk:cart"));
  });
  paintBadges();

  window.MKCart = {
    MENU: MENU,
    read: read,
    setQty: setQty,
    qtyOf: qtyOf,
    count: count,
    clear: function () { write([]); }
  };
})();
