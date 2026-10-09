/* My orders: the signed-in customer's orders, status, price and reviews. */
(function () {
  "use strict";

  var esc = MK.esc;
  var list = document.getElementById("orders");
  var lead = document.getElementById("lead");

  var STATUS_HELP = {
    new: "We've received your order and will confirm the price and timing soon.",
    confirmed: "Confirmed! We're baking it for you.",
    ready: "Your order is ready.",
    completed: "Completed — thank you for ordering!",
    cancelled: "This order was cancelled."
  };

  function reviewForm(order) {
    var id = "o" + order.id;
    var stars = [5, 4, 3, 2, 1].map(function (n) {
      return '<input type="radio" id="' + id + "s" + n + '" name="rating" value="' + n + '"' + (n === 5 ? " checked" : "") + " />" +
        '<label for="' + id + "s" + n + '" title="' + n + ' star' + (n > 1 ? "s" : "") + '">★</label>';
    }).join("");
    return '<form class="review-form" data-order="' + order.id + '" hidden>' +
      '<div class="field"><span class="label">Your rating</span><span class="star-input">' + stars + "</span></div>" +
      '<div class="field"><label for="' + id + 'c">Your review</label>' +
      '<textarea id="' + id + 'c" name="comment" maxlength="600" required placeholder="How were your bakes?"></textarea></div>' +
      '<div class="field"><label for="' + id + 'n">Name to show</label>' +
      '<input id="' + id + 'n" name="display_name" maxlength="40" required /></div>' +
      '<button type="submit" class="btn btn-dark btn-sm">Submit review</button>' +
      '<p class="form-note">Reviews appear on our site after a quick check.</p>' +
      '<p class="form-error" role="alert"></p></form>';
  }

  function card(o) {
    var meta = [
      o.fulfilment === "delivery" ? "Delivery" : "Pickup",
      o.preferred_date ? "for " + MK.date(o.preferred_date) : ""
    ].filter(Boolean).join(" · ");

    var review = "";
    if (o.reviewed) review = '<p class="order-meta">✓ Thanks for your review!</p>';
    else if (o.can_review) {
      review = '<button type="button" class="add-btn btn-inline" data-review="' + o.id + '" style="width:auto;padding:8px 16px">★ Write a review</button>' + reviewForm(o);
    }

    return '<article class="order-card">' +
      '<div class="order-head"><div><h3>Order #' + esc(o.id) + "</h3><small>" + esc(MK.date(o.created_at, true)) + "</small></div>" +
      MK.statusBadge(o.status) + "</div>" +
      MK.itemsList(o.items) +
      '<p class="order-meta">' + esc(meta) + "</p>" +
      '<p class="order-meta">' + esc(STATUS_HELP[o.status] || "") + "</p>" +
      (o.total_price != null ? '<p class="order-meta">' + (o.status === "new" ? "Estimated total (we'll confirm): " : "Total: ") + '<span class="order-price">' + esc(MK.money(o.total_price)) + "</span></p>" : "") +
      (o.admin_note ? '<div class="owner-note"><strong>From Moon\'s Kitchen:</strong> ' + esc(o.admin_note) + "</div>" : "") +
      (review ? '<div style="margin-top:12px">' + review + "</div>" : "") +
      "</article>";
  }

  function load() {
    MK.api("orders").then(function (data) {
      if (!data.orders.length) {
        lead.innerHTML = 'You haven\'t placed any orders yet. <a href="order.html">Order online</a>.';
        list.innerHTML = "";
        return;
      }
      lead.textContent = "Track your orders here. We'll update the status and price as we go.";
      list.innerHTML = data.orders.map(card).join("");
    }).catch(function (err) {
      if (err.status === 401) {
        lead.innerHTML = 'Please <a href="' + esc(MK.loginUrl()) + '">sign in</a> to see your orders.';
      } else {
        lead.textContent = err.message;
      }
    });
  }

  list.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-review]");
    if (!btn) return;
    var form = list.querySelector('.review-form[data-order="' + btn.getAttribute("data-review") + '"]');
    form.hidden = false;
    btn.remove();
    var nameInput = form.querySelector('[name="display_name"]');
    if (!nameInput.value) {
      try { nameInput.value = (JSON.parse(localStorage.getItem("mk_order_details") || "{}").name || "").split(" ")[0]; } catch (err) {}
    }
    form.querySelector("textarea").focus();
  });

  list.addEventListener("submit", function (e) {
    var form = e.target.closest(".review-form");
    if (!form) return;
    e.preventDefault();
    var errEl = form.querySelector(".form-error");
    var submit = form.querySelector('button[type="submit"]');
    errEl.textContent = "";
    submit.disabled = true;
    MK.api("reviews", {
      method: "POST",
      body: {
        order_id: Number(form.getAttribute("data-order")),
        rating: Number(form.querySelector('[name="rating"]:checked').value),
        comment: form.comment.value,
        display_name: form.display_name.value
      }
    }).then(function () {
      form.outerHTML = '<p class="order-meta">✓ Thanks for your review! It will appear on our site once approved.</p>';
    }).catch(function (err) {
      errEl.textContent = err.message;
      submit.disabled = false;
    });
  });

  MK.session().then(function (s) {
    document.querySelectorAll("[data-admin-only]").forEach(function (el) { el.hidden = !s.isAdmin; });
  });
  load();
})();
