/* Admin page: manage orders (status, price, note) and approve reviews.
   The server checks admin rights on every request — hiding this page
   from non-admins here is only for convenience. */
(function () {
  "use strict";

  var esc = MK.esc;
  var lead = document.getElementById("lead");
  var app = document.getElementById("adminApp");
  var listEl = document.getElementById("list");
  var filtersEl = document.getElementById("filters");

  var FILTERS = {
    orders: [["new", "New"], ["confirmed", "Confirmed"], ["ready", "Ready"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["all", "All"]],
    reviews: [["pending", "To approve"], ["approved", "Approved"], ["hidden", "Hidden"], ["all", "All"]],
    products: [["all", "All items"]]
  };
  var ORDER_STATUSES = ["new", "confirmed", "ready", "completed", "cancelled"];
  var state = { tab: "orders", status: "new" };

  function waLink(phone, id) {
    var digits = String(phone).replace(/\D/g, "");
    if (digits.length === 10) digits = "91" + digits;
    var msg = "Hi! This is Moon's Kitchen about your order #" + id + ".";
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(msg);
  }

  function orderCard(o) {
    var options = ORDER_STATUSES.map(function (s) {
      return '<option value="' + s + '"' + (s === o.status ? " selected" : "") + ">" + s.charAt(0).toUpperCase() + s.slice(1) + "</option>";
    }).join("");
    return '<article class="order-card" data-id="' + o.id + '">' +
      '<div class="order-head"><div><h3>#' + esc(o.id) + " &middot; " + esc(o.customer_name) + "</h3>" +
      "<small>" + esc(MK.date(o.created_at, true)) + " &middot; " + esc(o.customer_email) + "</small></div>" +
      MK.statusBadge(o.status) + "</div>" +
      MK.itemsList(o.items) +
      '<p class="order-meta"><strong>' + (o.fulfilment === "delivery" ? "Delivery" : "Pickup") + "</strong>" +
      (o.preferred_date ? " &middot; for " + esc(MK.date(o.preferred_date)) : "") +
      (o.address ? "<br>" + esc(o.address) : "") + "</p>" +
      (o.notes ? '<p class="order-meta">Notes: ' + esc(o.notes) + "</p>" : "") +
      '<div class="contact-links">' +
      '<a href="tel:' + esc(o.phone) + '">📞 ' + esc(o.phone) + "</a>" +
      '<a href="' + esc(waLink(o.phone, o.id)) + '" target="_blank" rel="noopener noreferrer">WhatsApp</a></div>' +
      '<form class="admin-edit">' +
      '<div class="field"><label for="o' + o.id + 's">Status</label><select id="o' + o.id + 's" name="status">' + options + "</select></div>" +
      '<div class="field"><label for="o' + o.id + 'p">Price (₹)</label><input id="o' + o.id + 'p" name="total_price" type="number" min="0" step="1" value="' + (o.total_price == null ? "" : esc(o.total_price)) + '" /></div>' +
      '<div class="field note-field"><label for="o' + o.id + 'n">Note to customer</label><input id="o' + o.id + 'n" name="admin_note" maxlength="500" value="' + esc(o.admin_note || "") + '" placeholder="e.g. Ready Saturday after 4pm" /></div>' +
      '<button type="submit" class="btn btn-dark btn-sm btn-inline">Save</button>' +
      "</form><p class=\"form-error\" role=\"alert\"></p></article>";
  }

  function reviewCard(r) {
    var stars = "★★★★★".slice(0, r.rating) + "☆☆☆☆☆".slice(r.rating);
    var actions = ["approved", "hidden", "pending"].filter(function (s) { return s !== r.status; }).map(function (s) {
      var label = { approved: "Approve", hidden: "Hide", pending: "Back to pending" }[s];
      return '<button type="button" class="btn ' + (s === "approved" ? "btn-dark" : "btn-outline") + ' btn-sm btn-inline" data-set="' + s + '">' + label + "</button>";
    }).join(" ");
    return '<article class="order-card" data-id="' + r.id + '">' +
      '<div class="order-head"><div><h3>' + esc(r.display_name) + " &middot; " + stars + "</h3>" +
      "<small>Order #" + esc(r.order_id) + " &middot; " + esc(MK.date(r.created_at, true)) + " &middot; " + esc(r.customer_email) + "</small></div>" +
      MK.statusBadge(r.status) + "</div>" +
      "<p>" + esc(r.comment) + "</p>" +
      (r.item_summary ? '<p class="order-meta">' + esc(r.item_summary) + "</p>" : "") +
      '<div class="contact-links" style="margin-top:12px">' + actions + "</div>" +
      '<p class="form-error" role="alert"></p></article>';
  }

  function productState(p) {
    if (!p.active) return ["hidden", "Switched off"];
    if (p.price == null || p.pack_size == null) return ["pending", "Needs pack size & price"];
    return ["approved", "On website"];
  }

  function productRow(p) {
    var st = productState(p);
    return '<form class="order-card product-edit" data-id="' + p.id + '">' +
      '<div class="order-head"><div><h3>' + esc(p.name) + "</h3><small>" + esc(p.category) + "</small></div>" +
      '<span class="status status-' + st[0] + '">' + esc(st[1]) + "</span></div>" +
      '<div class="admin-edit product-fields">' +
      '<div class="field"><label for="p' + p.id + 'g">Pack size</label><input id="p' + p.id + 'g" name="pack_size" type="number" min="1" step="1" inputmode="numeric" value="' + (p.pack_size == null ? "" : esc(p.pack_size)) + '" placeholder="e.g. 500" /></div>' +
      '<div class="field"><label for="p' + p.id + 'u">Unit</label><select id="p' + p.id + 'u" name="unit">' +
      '<option value="g"' + (p.unit !== "pcs" ? " selected" : "") + '>grams</option>' +
      '<option value="pcs"' + (p.unit === "pcs" ? " selected" : "") + ">pieces</option></select></div>" +
      '<div class="field"><label for="p' + p.id + 'p">Price (₹)</label><input id="p' + p.id + 'p" name="price" type="number" min="0" step="1" inputmode="numeric" value="' + (p.price == null ? "" : esc(Number(p.price))) + '" placeholder="e.g. 180" /></div>' +
      '<div class="field"><label class="check"><input name="active" type="checkbox"' + (p.active ? " checked" : "") + " /> Show on website</label></div>" +
      '<button type="submit" class="btn btn-dark btn-sm btn-inline">Save</button>' +
      '</div><p class="form-error" role="alert"></p></form>';
  }

  function renderProducts(rows) {
    var cats = [];
    var byCat = {};
    rows.forEach(function (p) {
      if (!byCat[p.category]) { byCat[p.category] = []; cats.push(p.category); }
      byCat[p.category].push(p);
    });
    var live = rows.filter(function (p) { return productState(p)[0] === "approved"; }).length;
    return '<p class="form-note" style="margin:0 0 14px">' + live + " of " + rows.length +
      " items are on the website. Each item needs a pack size (grams or pieces) and a price to appear; changes show on the website within a minute.</p>" +
      cats.map(function (c) {
        return '<h2 class="menu-cat">' + esc(c) + "</h2>" + byCat[c].map(productRow).join("");
      }).join("");
  }

  function renderFilters() {
    filtersEl.hidden = FILTERS[state.tab].length < 2;
    filtersEl.innerHTML = FILTERS[state.tab].map(function (f) {
      return '<button type="button" data-status="' + f[0] + '" aria-pressed="' + (f[0] === state.status) + '">' + f[1] + "</button>";
    }).join("");
    document.querySelectorAll("[data-tab]").forEach(function (b) {
      b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === state.tab));
    });
  }

  function load() {
    renderFilters();
    listEl.innerHTML = '<p class="empty-state">Loading…</p>';
    MK.api("admin?type=" + state.tab + "&status=" + state.status).then(function (data) {
      var rows = data[state.tab] || [];
      if (state.tab === "products") {
        listEl.innerHTML = rows.length ? renderProducts(rows) : '<p class="empty-state">No menu items yet.</p>';
        return;
      }
      listEl.innerHTML = rows.length
        ? rows.map(state.tab === "orders" ? orderCard : reviewCard).join("")
        : '<p class="empty-state">Nothing here.</p>';
    }).catch(function (err) {
      listEl.innerHTML = '<p class="empty-state">' + esc(err.message) + "</p>";
    });
  }

  document.addEventListener("click", function (e) {
    var tab = e.target.closest("[data-tab]");
    if (tab) {
      state.tab = tab.getAttribute("data-tab");
      state.status = FILTERS[state.tab][0][0];
      load();
      return;
    }
    var filter = e.target.closest("[data-status]");
    if (filter) {
      state.status = filter.getAttribute("data-status");
      load();
      return;
    }
    var setBtn = e.target.closest("[data-set]");
    if (setBtn) {
      var cardEl = setBtn.closest(".order-card");
      setBtn.disabled = true;
      MK.api("admin", { method: "PATCH", body: { type: "review", id: Number(cardEl.getAttribute("data-id")), status: setBtn.getAttribute("data-set") } })
        .then(load)
        .catch(function (err) {
          cardEl.querySelector(".form-error").textContent = err.message;
          setBtn.disabled = false;
        });
    }
  });

  listEl.addEventListener("submit", function (e) {
    var productForm = e.target.closest(".product-edit");
    if (productForm) {
      e.preventDefault();
      var pErr = productForm.querySelector(".form-error");
      var pBtn = productForm.querySelector("button");
      pErr.textContent = "";
      pBtn.disabled = true;
      MK.api("admin", {
        method: "PATCH",
        body: {
          type: "product",
          id: Number(productForm.getAttribute("data-id")),
          pack_size: productForm.pack_size.value,
          unit: productForm.unit.value,
          price: productForm.price.value,
          active: productForm.active.checked
        }
      }).then(function (data) {
        productForm.outerHTML = productRow(data.product);
      }).catch(function (err) {
        pErr.textContent = err.message;
        pBtn.disabled = false;
      });
      return;
    }
    var form = e.target.closest(".admin-edit");
    if (!form) return;
    e.preventDefault();
    var cardEl = form.closest(".order-card");
    var errEl = cardEl.querySelector(".form-error");
    var btn = form.querySelector("button");
    errEl.textContent = "";
    btn.disabled = true;
    MK.api("admin", {
      method: "PATCH",
      body: {
        type: "order",
        id: Number(cardEl.getAttribute("data-id")),
        status: form.status.value,
        total_price: form.total_price.value,
        admin_note: form.admin_note.value
      }
    }).then(function (data) {
      cardEl.outerHTML = orderCard(data.order);
    }).catch(function (err) {
      errEl.textContent = err.message;
      btn.disabled = false;
    });
  });

  MK.session().then(function (s) {
    if (!s.loggedIn) {
      lead.innerHTML = 'Please <a href="' + esc(MK.loginUrl()) + '">sign in</a> with the owner account.';
      return;
    }
    if (!s.isAdmin) {
      lead.textContent = "This page is only for the Moon's Kitchen owner.";
      return;
    }
    lead.textContent = "Signed in as " + s.email + ". Confirm orders by setting the status and price — the customer sees both in My orders.";
    app.hidden = false;
    load();
  });
})();
