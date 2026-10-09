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

  function renderPicker() {
    picker.innerHTML = window.MK_MENU.map(function (group) {
      return '<div class="menu-group"><h3>' + esc(group.category) + "</h3>" +
        group.items.map(function (item) {
          return '<div class="pick-row"><span>' + esc(item) + "</span>" + stepper(item) + "</div>";
        }).join("") + "</div>";
    }).join("");
  }

  function renderCart() {
    var lines = MK.cart.read();
    cartLines.innerHTML = lines.length
      ? lines.map(function (l) {
          return '<div class="cart-row"><span>' + esc(l.item) + "</span>" + stepper(l.item) + "</div>";
        }).join("")
      : '<p class="cart-empty">Nothing yet &mdash; <a href="#pickTitle">choose items from the menu</a>.</p>';
    cartTotal.textContent = MK.cart.count();
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
    addressField.hidden = form.fulfilment.value !== "delivery";
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
          MK.cart.clear();
          showPlaced(data.order.id);
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

  function showPlaced(id) {
    var box = document.getElementById("placed");
    box.innerHTML =
      "<p><strong>Thank you! Your order #" + esc(id) + " has been received.</strong></p>" +
      "<p>We'll confirm the price and timing soon &mdash; you can follow it under My orders.</p>" +
      '<a href="my-orders.html" class="btn btn-dark btn-sm btn-inline">View my orders</a>';
    box.hidden = false;
    document.getElementById("orderGrid").hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderAll();
})();
