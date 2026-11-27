/* ============================================
   Moon's Kitchen — ordering (index.html only)
   1 Add to order buttons, 2 Build your own box,
   3 Custom cakes. The cart itself is in cart.js and
   is sent from the Order page (order.html). Load after
   script.js and cart.js. Without this file, every Order
   button still opens WhatsApp for that single item.
   ============================================ */

(function () {
  "use strict";

  var MK = window.MoonsKitchen;
  var cart = window.MKCart;
  if (!MK || !cart) return;

  /* ------------------------------------------------------------
   * Settings — safe to edit
   * ---------------------------------------------------------- */
  var BOX_SIZES = [
    { name: "Mini", picks: 4 },
    { name: "Classic", picks: 6 },
    { name: "Party", picks: 12 }
  ];
  // Sections whose items can go in a box
  var BOX_SECTIONS = ["ragi-cookies", "ragi-special", "brownies", "classic-cookies"];

  function byId(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function sendWhatsApp(lines) {
    window.open(MK.whatsappUrl(lines.filter(Boolean).join("\n")), "_blank", "noopener");
  }

  // yyyy-mm-dd in the visitor's own time zone
  function isoToday() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  function prettyDate(value) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return p ? p[3] + "-" + p[2] + "-" + p[1] : "";
  }

  document.querySelectorAll("[data-min-today]").forEach(function (input) { input.min = isoToday(); });

  /* ------------------------------------------------------------
   * 1. Add to order — product cards keep their WhatsApp Order button
   *    and get "+ Add to order" under it; flavour tiles add instead of
   *    opening WhatsApp. Once added, the button becomes − qty + with
   *    Remove, so a second tap never adds by accident.
   * ---------------------------------------------------------- */
  var controls = [];

  function say(text) { byId("cartLive").textContent = text + " " + cart.count() + " in your order."; }

  function button(className, text, label, onClick) {
    var b = el("button", className, text);
    b.type = "button";
    b.setAttribute("aria-label", label);
    b.addEventListener("click", onClick);
    return b;
  }

  function makeControl(item) {
    var box = el("div", "add-wrap");
    var add = button("add-btn", "+ Add to order", "Add " + item + " to your order", function () {
      cart.setQty(item, 1);
      say(item + " added.");
      plus.focus({ preventScroll: true });
      nudgeSignIn();
    });
    var row = el("div", "add-row");
    var step = el("span", "stepper");
    var minus = button("", "−", "One less " + item, function () { change(cart.qtyOf(item) - 1); });
    var out = el("output", "", "0");
    var plus = button("", "+", "One more " + item, function () { change(cart.qtyOf(item) + 1); });
    var remove = button("remove-btn", "Remove", "Remove " + item + " from your order", function () { change(0); });
    function change(qty) {
      cart.setQty(item, qty);
      say(qty > 0 ? item + ": " + qty + "." : item + " removed.");
      if (qty < 1) add.focus({ preventScroll: true });
    }
    [minus, out, plus].forEach(function (n) { step.appendChild(n); });
    row.appendChild(step);
    row.appendChild(remove);
    box.appendChild(add);
    box.appendChild(row);
    controls.push(function () {
      var qty = cart.qtyOf(item);
      add.hidden = qty > 0;
      row.hidden = qty === 0;
      out.textContent = qty;
      box.parentNode.classList.toggle("is-added", qty > 0);
    });
    return box;
  }

  document.querySelectorAll(".product-card .order-btn[data-item]").forEach(function (waBtn) {
    waBtn.insertAdjacentElement("afterend", makeControl(waBtn.getAttribute("data-item")));
  });

  document.querySelectorAll(".tile[data-item]").forEach(function (tile) {
    var item = tile.getAttribute("data-item");
    var cta = tile.querySelector(".tile-cta");
    if (!cta) return;
    tile.classList.remove("whatsapp-link");
    tile.removeAttribute("href");
    tile.removeAttribute("target");
    tile.removeAttribute("rel");
    cta.replaceWith(makeControl(item));
    // Tapping the photo adds the first one only
    tile.addEventListener("click", function (e) {
      if (e.target.closest(".add-wrap") || cart.qtyOf(item)) return;
      cart.setQty(item, 1);
      say(item + " added.");
      nudgeSignIn();
    });
  });

  function paintControls() { controls.forEach(function (paint) { paint(); }); }
  document.addEventListener("mk:cart", paintControls);
  paintControls();

  /* ------------------------------------------------------------
   * 1b. Sign-in popup — after the first item a signed-out visitor
   *     adds, suggest signing in so the order can be saved. Never
   *     forced: "Continue without signing in" closes it and the item
   *     stays in the basket. Shown once per visit (sessionStorage).
   * ---------------------------------------------------------- */
  var NUDGE_KEY = "mk_signin_nudge";
  var signedIn = null; // null = not known yet, so no popup

  if (location.protocol !== "file:") {
    fetch("/.netlify/functions/session", { credentials: "same-origin" })
      .then(function (res) { return res.ok ? res.json() : {}; })
      .then(function (data) { signedIn = !!data.loggedIn; })
      .catch(function () { /* functions unavailable: leave the popup off */ });
  }

  function nudgeSeen() {
    try { return sessionStorage.getItem(NUDGE_KEY) === "1"; } catch (e) { return true; }
  }

  function nudgeSignIn() {
    if (signedIn !== false || nudgeSeen()) return;
    var dlg = document.createElement("dialog");
    if (typeof dlg.showModal !== "function") return;
    try { sessionStorage.setItem(NUDGE_KEY, "1"); } catch (e) { /* private mode */ }

    dlg.className = "signin-nudge";
    dlg.setAttribute("aria-labelledby", "nudgeTitle");
    dlg.appendChild(el("p", "nudge-title", "Added to your basket ✓")).id = "nudgeTitle";
    dlg.appendChild(el("p", "", "Sign in with your email to save your orders and follow them under My orders. You can also just order on WhatsApp."));
    var actions = el("div", "nudge-actions");
    var signIn = el("a", "btn btn-dark", "Sign in");
    signIn.href = "login.html?next=" + encodeURIComponent(location.pathname + location.search);
    var skip = button("btn nudge-skip", "Continue without signing in", "Continue without signing in", function () { dlg.close(); });
    actions.appendChild(signIn);
    actions.appendChild(skip);
    dlg.appendChild(actions);

    // Tap outside the box closes it too
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { dlg.remove(); });
    document.body.appendChild(dlg);
    dlg.showModal();
    skip.focus();
  }

  /* ------------------------------------------------------------
   * 2. Build your own box — items are read from the menu on the
   *    page, so a new product appears here automatically
   * ---------------------------------------------------------- */
  var boxRoot = byId("boxBuilder");
  if (boxRoot) {
    var sizesEl = byId("boxSizes");
    var slotsEl = byId("boxSlots");
    var itemsEl = byId("boxItems");
    var statusEl = byId("boxStatus");
    var boxAdd = byId("boxAdd");
    var size = BOX_SIZES[1];
    var picks = []; // [{ name, node }]

    var boxCount = function () {
      statusEl.textContent = picks.length === size.picks
        ? "Your box is full. Add it to your order!"
        : picks.length + " of " + size.picks + " picked";
      boxAdd.disabled = picks.length !== size.picks;
      itemsEl.querySelectorAll("button").forEach(function (b) { b.disabled = picks.length >= size.picks; });
    };

    // A picture for the slot: the item's photo if it has one, else its emoji
    var picture = function (node) {
      var img = node.querySelector("img");
      if (img) {
        var copy = new Image();
        copy.sizes = "120px";
        copy.srcset = img.srcset;
        copy.src = img.src;
        copy.alt = "";
        return copy;
      }
      var media = node.querySelector(".tile-media, .product-media");
      var text = "";
      Array.prototype.forEach.call((media || node).childNodes, function (n) {
        if (n.nodeType === 3) text += n.textContent.trim();
      });
      return el("span", "slot-emoji", text || "🍪");
    };

    var renderBox = function () {
      slotsEl.textContent = "";
      slotsEl.setAttribute("data-size", size.picks);
      for (var i = 0; i < size.picks; i++) {
        var pick = picks[i];
        var li = el("li");
        if (pick) {
          var b = el("button", "slot is-filled");
          b.type = "button";
          b.title = pick.name;
          b.setAttribute("aria-label", "Remove " + pick.name);
          b.setAttribute("data-i", i);
          b.appendChild(picture(pick.node));
          li.appendChild(b);
        } else {
          li.appendChild(el("span", "slot"));
        }
        slotsEl.appendChild(li);
      }
      boxCount();
    };

    slotsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]");
      if (!b) return;
      var i = Number(b.getAttribute("data-i"));
      picks.splice(i, 1);
      renderBox();
      var left = slotsEl.querySelectorAll(".is-filled");
      if (left.length) left[Math.min(i, left.length - 1)].focus();
    });

    BOX_SIZES.forEach(function (s) {
      var b = el("button", "chip");
      b.type = "button";
      b.appendChild(el("strong", "", s.name));
      b.appendChild(document.createTextNode(" " + s.picks + " picks"));
      b.setAttribute("aria-pressed", String(s === size));
      b.addEventListener("click", function () {
        size = s;
        picks = picks.slice(0, s.picks);
        sizesEl.querySelectorAll("button").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        renderBox();
      });
      sizesEl.appendChild(b);
    });

    BOX_SECTIONS.forEach(function (id) {
      var section = byId(id);
      if (!section) return;
      var heading = section.querySelector("h2, h3");
      var group = el("div", "box-group");
      group.appendChild(el("h4", "", heading ? heading.textContent : ""));
      var chips = el("div", "chips");
      section.querySelectorAll(".order-btn[data-item], .tile[data-item]").forEach(function (node) {
        var name = node.getAttribute("data-item");
        var source = node.closest(".product-card") || node;
        var b = el("button", "chip", "+ " + name.replace(/^Ragi Special – /, "").replace(/ \(.*\)$/, ""));
        b.type = "button";
        b.setAttribute("aria-label", "Put " + name + " in the box");
        b.addEventListener("click", function () {
          if (picks.length >= size.picks) return;
          picks.push({ name: name, node: source });
          renderBox();
        });
        chips.appendChild(b);
      });
      group.appendChild(chips);
      itemsEl.appendChild(group);
    });

    byId("boxReset").addEventListener("click", function () { picks = []; renderBox(); });

    boxAdd.addEventListener("click", function () {
      if (picks.length !== size.picks) return;
      var counts = {};
      picks.forEach(function (p) { counts[p.name] = (counts[p.name] || 0) + 1; });
      var parts = Object.keys(counts).sort().map(function (n) { return n + " ×" + counts[n]; });
      var box = size.name + " box of " + size.picks + " (" + parts.join(", ") + ")";
      cart.setQty(box, cart.qtyOf(box) + 1);
      location.href = "order.html";
    });

    renderBox();
  }

  /* ------------------------------------------------------------
   * 3. Custom cake enquiry
   * ---------------------------------------------------------- */
  var cakeForm = byId("cakeForm");
  if (cakeForm) {
    cakeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = cakeForm.elements;
      var val = function (n) { return f[n].value.trim(); };
      sendWhatsApp([
        "Hi Moon's Kitchen! I'd like to ask about a custom cake:",
        "Occasion: " + val("occasion"),
        "Needed on: " + prettyDate(f.date.value),
        val("weight") && "Weight: " + val("weight"),
        val("flavour") && "Flavour: " + val("flavour"),
        val("message") && "Message on cake: " + val("message"),
        val("note") && "Notes: " + val("note"),
        "Could you please share the price and availability?"
      ]);
    });
  }
})();
