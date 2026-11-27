/* ============================================
   Moon's Kitchen — Order page (order.html)
   Item picker + your order + details. Signed-in
   customers can save the order on the site (My
   orders, admin page); everyone can send it on
   WhatsApp. Needs script.js, app.js and cart.js.
   ============================================ */

(function () {
  "use strict";

  var cart = window.MKCart;
  var WA = window.MoonsKitchen;
  var MK = window.MK;
  var form = document.getElementById("orderForm");
  if (!cart || !WA || !MK || !form) return;

  var picker = document.getElementById("menuPicker");
  var cartLines = document.getElementById("cartLines");
  var cartTotal = document.getElementById("cartTotal");
  var errorEl = document.getElementById("orderError");
  var addressField = document.getElementById("addressField");
  var pickupAddress = document.getElementById("pickupAddress");
  var placed = document.getElementById("placed");
  var grid = document.getElementById("orderGrid");
  var DETAILS_KEY = "mk_order_details";
  var f = form.elements;
  var placeBtn = document.getElementById("placeBtn");
  var signedIn = false;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function stepper(item, where) {
    var qty = cart.qtyOf(item);
    var wrap = el("span", "stepper" + (qty ? "" : " is-zero"));
    [[-1, "−", "One less "], [1, "+", "One more "]].forEach(function (d, i) {
      var b = el("button", "", d[1]);
      b.type = "button";
      b.setAttribute("aria-label", d[2] + item);
      b.setAttribute("data-step", d[0]);
      b.setAttribute("data-item", item);
      b.setAttribute("data-where", where);
      if (d[0] < 0 && !qty) b.disabled = true;
      wrap.appendChild(b);
      if (i === 0) wrap.appendChild(el("output", "", qty));
    });
    return wrap;
  }

  function row(className, item, where) {
    var r = el("div", className);
    r.appendChild(el("span", "", item));
    var controls = el("span", "row-controls");
    controls.appendChild(stepper(item, where));
    if (where === "cart") {
      var rm = el("button", "remove-btn", "Remove");
      rm.type = "button";
      rm.setAttribute("aria-label", "Remove " + item + " from your order");
      rm.setAttribute("data-remove", item);
      controls.appendChild(rm);
    }
    r.appendChild(controls);
    return r;
  }

  function render() {
    picker.textContent = "";
    cart.MENU.forEach(function (group) {
      var g = el("div", "menu-group");
      g.appendChild(el("h3", "", group.category));
      group.items.forEach(function (item) { g.appendChild(row("pick-row", item, "menu")); });
      picker.appendChild(g);
    });

    cartLines.textContent = "";
    var lines = cart.read();
    lines.forEach(function (l) { cartLines.appendChild(row("cart-row", l.item, "cart")); });
    if (!lines.length) {
      var p = el("p", "cart-empty", "Nothing yet — ");
      var a = el("a", "", "choose items from the menu");
      a.href = "#pickTitle";
      p.appendChild(a);
      cartLines.appendChild(p);
    }
    cartTotal.textContent = cart.count();
  }

  document.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-remove]");
    if (rm) {
      cart.setQty(rm.getAttribute("data-remove"), 0);
      var next = cartLines.querySelector(".remove-btn, a");
      if (next) next.focus({ preventScroll: true });
      return;
    }
    var b = e.target.closest("[data-step]");
    if (!b) return;
    var key = [b.getAttribute("data-item"), b.getAttribute("data-step"), b.getAttribute("data-where")];
    cart.setQty(key[0], cart.qtyOf(key[0]) + Number(key[1]));
    errorEl.textContent = "";
    // The lists were rebuilt: put keyboard focus back on the same button
    var again = Array.prototype.filter.call(document.querySelectorAll("[data-step]"), function (n) {
      return n.getAttribute("data-item") === key[0] && n.getAttribute("data-step") === key[1] &&
        n.getAttribute("data-where") === key[2] && !n.disabled;
    })[0];
    if (again) again.focus({ preventScroll: true });
  });
  document.addEventListener("mk:cart", render);

  /* ---------- Details ---------- */
  function syncAddress() {
    var delivery = f.fulfilment.value === "Delivery";
    addressField.hidden = !delivery;
    pickupAddress.hidden = delivery;
  }
  form.addEventListener("change", syncAddress);

  var now = new Date();
  f.date.min = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);

  // Remember these on this device for next time
  try {
    var saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}");
    if (saved.name) f.name.value = saved.name;
    if (saved.phone) f.phone.value = saved.phone;
    if (saved.address) f.address.value = saved.address;
    if (saved.fulfilment) f.fulfilment.value = saved.fulfilment;
  } catch (e) {}
  syncAddress();

  MK.session().then(function (s) {
    signedIn = !!s.loggedIn;
    document.getElementById("phoneField").hidden = !signedIn;
    placeBtn.hidden = !signedIn;
    document.getElementById("waBtn").textContent = signedIn ? "Order on WhatsApp instead" : "Place Order on WhatsApp";
    document.getElementById("signInBox").hidden = signedIn || location.protocol === "file:";
    document.getElementById("signInLink").href = MK.loginUrl();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.textContent = "";
    var lines = cart.read();
    // Enter key or the main button saves when signed in; otherwise WhatsApp
    var save = signedIn && !(e.submitter && e.submitter.value === "whatsapp");
    var val = function (n) { return f[n].value.trim(); };
    var delivery = f.fulfilment.value === "Delivery";
    if (!lines.length) { errorEl.textContent = "Add at least one item to your order."; return; }
    if (!val("name")) { errorEl.textContent = "Please enter your name."; f.name.focus(); return; }
    if (save && !/^\+?\d{10,13}$/.test(val("phone").replace(/[^\d+]/g, ""))) {
      errorEl.textContent = "Please enter a valid phone number (10 digits).";
      f.phone.focus();
      return;
    }
    if (delivery && !val("address")) { errorEl.textContent = "Please enter your delivery address."; f.address.focus(); return; }

    var date = f.date.value ? f.date.value.split("-").reverse().join("-") : "";
    var details = [
      "Name: " + val("name"),
      delivery ? "Delivery to: " + val("address") : "Pickup",
      date && "Preferred date: " + date,
      val("notes") && "Notes: " + val("notes")
    ].filter(Boolean);
    var items = lines.map(function (l, i) { return (i + 1) + ". " + l.item + " × " + l.qty; });
    var url = WA.whatsappUrl(["Hi Moon's Kitchen! I'd like to order:"].concat(items, details,
      "Could you please confirm the price and timing?").join("\n"));

    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify({ name: val("name"), phone: val("phone"), address: val("address"), fulfilment: f.fulfilment.value }));
    } catch (err) {}
    if (save) {
      saveOrder(lines, val, items.concat(details));
      return;
    }
    window.open(url, "_blank", "noopener");
    showPlaced(url, items.concat(details));
  });

  function saveOrder(lines, val, summary) {
    placeBtn.disabled = true;
    placeBtn.textContent = "Placing order…";
    MK.api("orders", { method: "POST", body: {
      items: lines,
      name: val("name"),
      phone: val("phone"),
      fulfilment: f.fulfilment.value.toLowerCase(),
      address: val("address"),
      preferred_date: f.date.value,
      notes: val("notes")
    } }).then(function (data) {
      cart.clear();
      showSaved(data.order.id, summary);
    }).catch(function (err) {
      errorEl.textContent = err.message + (err.status && err.status < 500 ? "" : " You can also order on WhatsApp.");
    }).then(function () {
      placeBtn.disabled = false;
      placeBtn.textContent = "Place Order";
    });
  }

  function showBox(title, summary) {
    placed.textContent = "";
    placed.appendChild(el("h2", "", title));
    var ul = el("ul", "placed-summary");
    summary.forEach(function (s) { ul.appendChild(el("li", "", s)); });
    placed.appendChild(ul);
    placed.hidden = false;
    grid.hidden = true;
    placed.setAttribute("tabindex", "-1");
    placed.focus();
    window.scrollTo(0, 0);
  }

  function showSaved(id, summary) {
    showBox("Thank you! Order #" + id + " received", summary);
    placed.appendChild(el("p", "", "We'll confirm the price and timing soon. You can follow it under My orders."));
    var mine = el("a", "btn btn-dark", "View my orders");
    mine.href = "my-orders.html";
    placed.appendChild(mine);
  }

  // The cart is only emptied when the customer says the message was sent
  function showPlaced(url, summary) {
    showBox("Almost done — press Send in WhatsApp", summary);
    var again = el("a", "btn btn-wa", "Open WhatsApp again");
    again.href = url;
    again.target = "_blank";
    again.rel = "noopener noreferrer";
    var sent = el("button", "btn btn-dark", "I've sent it — clear my order");
    sent.type = "button";
    sent.addEventListener("click", function () { cart.clear(); location.href = "index.html"; });
    var back = el("button", "basket-clear", "Go back and edit");
    back.type = "button";
    back.addEventListener("click", function () { placed.hidden = true; grid.hidden = false; });
    [again, sent, back].forEach(function (n) { placed.appendChild(n); });
  }

  render();
})();
