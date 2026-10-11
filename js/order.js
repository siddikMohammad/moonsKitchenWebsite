/* Order page: item picker + cart + details form. */
(function () {
  "use strict";

  var esc = MK.esc;
  var picker = document.getElementById("menuPicker");
  var cartLines = document.getElementById("cartLines");
  var cartTotal = document.getElementById("cartTotal");
  var form = document.getElementById("orderForm");
  var errorEl = document.getElementById("orderError");
  var placeBtn = document.getElementById("placeBtn");
  var addressField = document.getElementById("addressField");
  var signInBox = document.getElementById("signInBox");
  var DETAILS_KEY = "mk_order_details";

  function stepper(item) {
    var qty = MK.cart.qtyOf(item);
    return '<span class="stepper' + (qty ? "" : " is-zero") + '" data-item="' + esc(item) + '">' +
      '<button type="button" data-step="-1" aria-label="One less ' + esc(item) + '">&minus;</button>' +
      "<output>" + qty + "</output>" +
      '<button type="button" data-step="1" aria-label="One more ' + esc(item) + '">+</button></span>';
  }

  // Live menu (prices); null until loaded. Falls back to the built-in item
  // list without prices when nothing is priced yet.
  var liveMenu = null;

  function groups() {
    if (liveMenu && liveMenu.priced) {
      var order = [];
      var byCat = {};
      liveMenu.products.forEach(function (p) {
        if (!byCat[p.category]) { byCat[p.category] = []; order.push(p.category); }
        byCat[p.category].push(p.name);
      });
      return order.map(function (c) { return { category: c, items: byCat[c] }; });
    }
    return window.MK_MENU;
  }

  function productOf(item) {
    return liveMenu && liveMenu.priced ? liveMenu.byName.get(item) : null;
  }

  function renderPicker() {
    picker.innerHTML = groups().map(function (group) {
      return '<div class="menu-group"><h3>' + esc(group.category) + "</h3>" +
        group.items.map(function (item) {
          var p = productOf(item);
          return '<div class="pick-row"><span>' + esc(item) +
            (p ? '<small class="pack">' + esc(MK.pack(p)) + "</small>" : "") + "</span>" + stepper(item) + "</div>";
        }).join("") + "</div>";
    }).join("");
  }

  // Drops cart items that are no longer for sale (hidden or unpriced).
  function pruneCart() {
    if (!liveMenu || !liveMenu.priced) return [];
    var removed = MK.cart.read().filter(function (l) { return !productOf(l.item); });
    if (removed.length) {
      MK.cart.write(MK.cart.read().filter(function (l) { return productOf(l.item); }));
    }
    return removed.map(function (l) { return l.item; });
  }

  function renderCart() {
    var lines = MK.cart.read();
    var total = 0;
    var allPriced = lines.length > 0;
    cartLines.innerHTML = lines.length
      ? lines.map(function (l) {
          var p = productOf(l.item);
          if (p) total += p.price * l.qty; else allPriced = false;
          return '<div class="cart-row"><span>' + esc(l.item) +
            (p ? '<small class="pack">' + esc(l.qty > 1 && p.pack_size != null
              ? l.qty + " × " + MK.size(p.pack_size, p.unit) + " = " + MK.size(p.pack_size * l.qty, p.unit)
              : MK.size(p.pack_size, p.unit)) + " &middot; " + esc(MK.money(p.price * l.qty)) + "</small>" : "") +
            "</span>" + stepper(l.item) + "</div>";
        }).join("")
      : '<p class="cart-empty">Nothing yet &mdash; <a href="#pickTitle">choose items from the menu</a>.</p>';
    cartTotal.textContent = MK.cart.count();
    var totalRow = document.getElementById("cartMoney");
    totalRow.hidden = !allPriced;
    document.getElementById("cartMoneyValue").textContent = MK.money(total);
    document.getElementById("priceNote").textContent = allPriced
      ? "Estimated total. We'll confirm it with you (delivery charges, if any, are added then). Pay on pickup/delivery."
      : "Price on confirmation · pay on pickup/delivery.";
  }

  function renderAll() {
    renderPicker();
    renderCart();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".stepper button");
    if (!btn) return;
    var item = btn.closest(".stepper").getAttribute("data-item");
    MK.cart.setQty(item, MK.cart.qtyOf(item) + Number(btn.getAttribute("data-step")));
  });
  document.addEventListener("mk:cart", renderAll);

  /* ---------- Details form ---------- */

  function syncAddress() {
    var delivery = form.fulfilment.value === "delivery";
    addressField.hidden = !delivery;
    document.getElementById("pickupAddress").hidden = delivery;
  }
  form.addEventListener("change", syncAddress);

  // Earliest selectable date = today.
  var today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  form.preferred_date.min = today;

  // Remember name/phone/address on this device for next time (convenience only).
  try {
    var saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}");
    ["name", "phone", "address"].forEach(function (k) { if (saved[k]) form[k].value = saved[k]; });
    if (saved.fulfilment) form.fulfilment.value = saved.fulfilment;
  } catch (e) {}
  syncAddress();

  MK.session().then(function (s) {
    document.querySelectorAll("[data-admin-only]").forEach(function (el) { el.hidden = !s.isAdmin; });
    if (!s.loggedIn) {
      signInBox.hidden = false;
      document.getElementById("signInLink").href = MK.loginUrl();
      placeBtn.textContent = "Sign in to place order";
      // Pickup/delivery is offered once the customer is signed in.
      form.fulfilment[0].closest(".field").hidden = true;
      addressField.hidden = true;
      addressField.setAttribute("data-signed-out", "");
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    MK.session().then(function (s) {
      if (!s.loggedIn) {
        location.href = MK.loginUrl();
        return;
      }
      var items = MK.cart.read();
      if (!items.length) {
        errorEl.textContent = "Add at least one item to your order.";
        return;
      }
      var body = {
        items: items,
        name: form.name.value,
        phone: form.phone.value,
        fulfilment: form.fulfilment.value,
        address: form.address.value,
        preferred_date: form.preferred_date.value,
        notes: form.notes.value
      };

      placeBtn.disabled = true;
      placeBtn.textContent = "Placing order…";
      MK.api("orders", { method: "POST", body: body })
        .then(function (data) {
          try {
            localStorage.setItem(DETAILS_KEY, JSON.stringify({
              name: body.name, phone: body.phone, address: body.address, fulfilment: body.fulfilment
            }));
          } catch (err) {}
          showPlaced(data.order.id, body);
          MK.cart.clear();
        })
        .catch(function (err) {
          errorEl.textContent = err.message;
        })
        .finally(function () {
          placeBtn.disabled = false;
          placeBtn.textContent = "Place order";
        });
    });
  });

  // Order summary shown on the confirmation: items, total, pickup/delivery.
  function summaryHtml(body) {
    var total = 0;
    var allPriced = body.items.length > 0;
    var rows = body.items.map(function (l) {
      var p = productOf(l.item);
      var detail = "";
      if (p) {
        total += p.price * l.qty;
        var size = l.qty > 1 && p.pack_size != null
          ? l.qty + " × " + MK.size(p.pack_size, p.unit) + " = " + MK.size(p.pack_size * l.qty, p.unit)
          : MK.size(p.pack_size, p.unit);
        detail = '<small class="pack">' + esc(size) + " &middot; " + esc(MK.money(p.price * l.qty)) + "</small>";
      } else {
        allPriced = false;
        detail = '<small class="pack">Qty ' + l.qty + "</small>";
      }
      return '<div class="cart-row"><span>' + esc(l.item) + detail + "</span></div>";
    }).join("");

    var html = '<div class="placed-summary">' + rows;
    if (allPriced) {
      html += '<div class="cart-total cart-money"><span>Estimated total</span><span>' + esc(MK.money(total)) + "</span></div>";
    }
    if (body.fulfilment === "delivery") {
      html += "<p><strong>Delivery to:</strong><br />" + esc(body.address).replace(/\n/g, "<br />") + "</p>" +
        "<p><strong>Delivery charges apply</strong> &mdash; we'll confirm the charge with your final total.</p>";
    } else {
      html += "<p><strong>Pickup from:</strong><br />Amalapuram, BlackBridge Road,<br />" +
        "East Godavari District (Konaseema), Andhra Pradesh &ndash; 533201</p>";
    }
    if (body.preferred_date) html += "<p><strong>Preferred date:</strong> " + esc(body.preferred_date) + "</p>";
    return html + "</div>";
  }

  function showPlaced(id, body) {
    var box = document.getElementById("placed");
    box.innerHTML =
      "<p><strong>Thank you! Your order #" + esc(id) + " has been received.</strong></p>" +
      summaryHtml(body) +
      "<p>We'll confirm the price and timing soon &mdash; you can follow it under My orders.</p>" +
      '<a href="my-orders.html" class="btn btn-dark btn-sm btn-inline">View my orders</a>';
    box.hidden = false;
    document.getElementById("orderGrid").hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderAll();
  MK.menu().then(function (m) {
    liveMenu = m;
    var removed = pruneCart();
    if (removed.length) {
      errorEl.textContent = "Removed from your order (not available right now): " + removed.join(", ") + ".";
    }
    renderAll();
  });
})();
