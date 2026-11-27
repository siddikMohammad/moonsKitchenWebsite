/* ============================================
   Moon's Kitchen — shared helpers for the Order,
   My orders and Admin pages (server calls, sign-in
   state, formatting). Load before the page script.
   ============================================ */

(function () {
  "use strict";

  // Safe for both element text and quoted attribute values.
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

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

  function loginUrl() {
    return "login.html?next=" + encodeURIComponent(location.pathname + location.search);
  }

  var STATUS_LABELS = {
    new: "Received", confirmed: "Confirmed", ready: "Ready", completed: "Completed", cancelled: "Cancelled",
    pending: "To approve", approved: "Approved", hidden: "Hidden"
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
    return '<ul class="line-items">' + (items || []).map(function (l) {
      return "<li><span>" + esc(l.item) + "</span><strong>&times; " + esc(l.qty) + "</strong></li>";
    }).join("") + "</ul>";
  }

  // Owner-only links. The server checks admin rights on every request; this
  // only decides whether the link is shown.
  session().then(function (s) {
    document.querySelectorAll("[data-admin-only]").forEach(function (el) { el.hidden = !s.isAdmin; });
  });

  window.MK = {
    esc: esc, api: api, session: session, loginUrl: loginUrl,
    statusBadge: statusBadge, money: money, date: date, itemsList: itemsList
  };
})();
