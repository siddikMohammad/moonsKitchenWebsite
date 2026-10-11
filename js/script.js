/* ============================================
   Moon's Kitchen — Site Script
   ============================================ */

(function () {
  "use strict";

  /* ------------------------------------------------------------
   * 1. WhatsApp number — every order button reads this one value.
   *    Format: country code + number, no +, no spaces, no dashes.
   * ---------------------------------------------------------- */
  var WHATSAPP_NUMBER = "917981052332";

  function buildWhatsAppUrl(itemLabel) {
    var message =
      "Hi Moon's Kitchen! I'd like to order " + itemLabel + ". " +
      "Could you please share the price and availability?";
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  function buildCatalogUrl() {
    return "https://wa.me/c/" + WHATSAPP_NUMBER;
  }

  document.querySelectorAll(".whatsapp-link").forEach(function (link) {
    var item = link.getAttribute("data-item") || "your menu";
    link.setAttribute("href", buildWhatsAppUrl(item));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  document.querySelectorAll(".whatsapp-catalog-link").forEach(function (link) {
    link.setAttribute("href", buildCatalogUrl());
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  /* ------------------------------------------------------------
   * 1b. Online photos for items without our own photo yet.
   *     Each element with data-photo="<group>" gets a random free
   *     Unsplash photo from that group, different on every reload.
   *     No two items share a photo until a group runs out. If a photo
   *     fails to load, the emoji stays. To use your own photo instead,
   *     swap the element for an <img> pointing at assets/images/.
   * ---------------------------------------------------------- */
  var PHOTO_GROUPS = {
    brownie: ["1636743715220-d8f8dd900b87", "1606313564200-e75d5e30476c", "1762922425478-7049c54bfbec",
      "1515037893149-de7f840978e2", "1777647364657-2319b02095de", "1769434128994-fa6634bf6310",
      "1642453031286-8991becafe19", "1606313564573-104197cf8f91"],
    bits: ["1780682570683-71754767f8cc", "1629856428041-6f9721807b05", "1564355808539-22fda35bed7e"],
    white: ["1700411360138-1bd3d70ca291", "1700411350768-1d55c60bdcc6", "1757520419300-1b5661560bc2"],
    darkwhite: ["1657875861147-d1456a1eb65d", "1624353365286-3f8d62daad51"],
    chococup: ["1603532648955-039310d9ed75", "1640806353257-6c408529d822", "1652284918100-1fd4a60e7356",
      "1550617931-e17a7b70dce2"],
    vanillacup: ["1519869325930-281384150729", "1595450648353-d16bb38772c9", "1680580735621-4371027734eb"],
    strawcup: ["1614707267537-b85aaf00c4b7", "1599785209615-a35f883d93c8", "1563778084459-859099e48677",
      "1599785209796-786432b228bc"],
    bscup: ["1576618148400-f54bed99fcfd", "1610306212789-7508d076e925", "1597991772523-8bde7eed9f73"],
    pinecup: ["1732966283172-033d29bf02ca", "1771016833930-859834ab08ad"],
    pistacup: ["1551893132-13b98b83cb44", "1587668178277-295251f900ce"],
    chocchip: ["1558961363-fa8fdf82db35", "1597733153203-a54d0fbc47de", "1634188023615-7e08901193b6",
      "1645258751218-1a1ddb1630dc"],
    butter: ["1600625649542-f668edc636dc", "1621353354739-1420ff28ead9", "1573827196605-0a95831e07f9"],
    vanillacook: ["1633362218447-b80f27dc2ada", "1630782622540-26a9f8c7a095", "1579618385552-046edd29f899"],
    grain: ["1600147573971-a2135dbff47e", "1631311253861-52eaf0337adb", "1588345274200-42aa29063b78",
      "1613703154528-fa47dd7ffcfd"],
    almond: ["1608797178974-15b35a64ede9", "1508061253366-f7da158b6d46", "1631815333332-e3ffb24e2bf8",
      "1600188999986-331bec5f9a8d"],
    cashew: ["1726771517475-e7acdd34cd8a", "1723466998040-78d7e2ef6d72", "1686721635283-70e6344183e1"],
    dryfruit: ["1641291361624-38b69b86b1cf", "1543158181-1274e5362710", "1607664608695-45aaa6d621fc",
      "1710857397974-f0617001c39e"]
  };

  var photoDecks = {};
  function nextPhoto(group) {
    var pool = PHOTO_GROUPS[group];
    if (!pool) return null;
    if (!photoDecks[group] || !photoDecks[group].length) {
      var deck = pool.slice();
      for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
      }
      photoDecks[group] = deck;
    }
    return photoDecks[group].pop();
  }

  document.querySelectorAll("[data-photo]").forEach(function (el) {
    var id = nextPhoto(el.getAttribute("data-photo"));
    if (!id) return;
    var isFeature = el.classList.contains("feature-emoji");
    var size = isFeature ? "w=600&h=450" : "w=500&h=500";
    var img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.className = isFeature ? "feature-img" : "online-photo";
    img.onload = function () {
      if (isFeature) {
        el.replaceWith(img);
      } else {
        el.appendChild(img);
        el.classList.add("has-photo");
      }
    };
    img.src = "https://images.unsplash.com/photo-" + id + "?" + size + "&fit=crop&auto=format&q=75";
  });

  /* ------------------------------------------------------------
   * 1c. Instagram reels
   *     Paste reel links here (copy from Instagram: ••• → Copy link).
   *     While this list is empty, the Reels section shows photo cards
   *     that open the Instagram profile instead.
   *     Example: "https://www.instagram.com/reel/ABC123xyz/"
   * ---------------------------------------------------------- */
  var INSTAGRAM_REELS = [];

  var reelRow = document.getElementById("reelRow");
  var reelCodes = INSTAGRAM_REELS.map(function (url) {
    var m = /instagram\.com\/(?:[^/]+\/)?(?:reel|reels|p)\/([A-Za-z0-9_-]+)/.exec(url);
    return m && m[1];
  }).filter(Boolean);

  if (reelRow && reelCodes.length) {
    reelRow.innerHTML = "";
    reelRow.classList.add("has-embeds");
    reelCodes.forEach(function (code) {
      var wrap = document.createElement("div");
      wrap.className = "reel-embed";
      var frame = document.createElement("iframe");
      frame.src = "https://www.instagram.com/reel/" + code + "/embed/";
      frame.loading = "lazy";
      frame.title = "Moon's Kitchen reel on Instagram";
      frame.setAttribute("allowfullscreen", "");
      frame.setAttribute("scrolling", "no");
      wrap.appendChild(frame);
      reelRow.appendChild(wrap);
    });
  }

  /* ------------------------------------------------------------
   * 1d. Testimonials — add REAL customer reviews here only
   *     (e.g. copied from WhatsApp messages or Instagram comments,
   *     with the customer's permission to show their name).
   *     While the list is empty, the section shows just the
   *     "Share Your Review" invitation.
   *     { name: "Customer name", place: "City", item: "What they ordered",
   *       rating: 5, text: "Their words..." }
   * ---------------------------------------------------------- */
  var TESTIMONIALS = [];

  var reviewMsg = "Hi Moon's Kitchen! I'd like to share a review of my order: ";
  document.querySelectorAll(".whatsapp-review-link").forEach(function (link) {
    link.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(reviewMsg));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  var testiTrack = document.getElementById("testiTrack");
  var testiNav = document.getElementById("testiNav");

  function renderTestimonials(list) {
    if (!testiTrack) return;
    var esc = function (str) {
      var d = document.createElement("div");
      d.textContent = str == null ? "" : String(str);
      return d.innerHTML;
    };
    list.forEach(function (t) {
      var rating = Math.max(0, Math.min(5, Math.round(t.rating || 0)));
      var card = document.createElement("figure");
      card.className = "testi-card";
      card.innerHTML =
        (rating ? '<div class="testi-stars" aria-label="' + rating + ' out of 5 stars">' +
          "★★★★★".slice(0, rating) + '<span class="testi-stars-off">' + "★★★★★".slice(rating) + "</span></div>" : "") +
        "<blockquote>" + esc(t.text) + "</blockquote>" +
        '<figcaption><span class="testi-avatar">' + esc((t.name || "?").trim().charAt(0).toUpperCase()) + "</span>" +
        "<span><strong>" + esc(t.name) + "</strong>" +
        "<small>" + esc([t.place, t.item].filter(Boolean).join(" · ")) + "</small></span></figcaption>";
      testiTrack.appendChild(card);
    });
    var total = testiTrack.children.length;
    testiTrack.hidden = total === 0;
    if (testiNav && total > 1 && testiNav.hidden) {
      testiNav.hidden = false;
      testiNav.querySelectorAll(".testi-arrow").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var step = (testiTrack.firstElementChild.offsetWidth + 20) * Number(btn.getAttribute("data-dir"));
          testiTrack.scrollBy({ left: step, behavior: "smooth" });
        });
      });
    }
  }

  // Hand-added testimonials first, then customer reviews approved on the admin page.
  if (testiTrack) testiTrack.hidden = true;
  renderTestimonials(TESTIMONIALS);
  if (testiTrack && location.protocol !== "file:") {
    fetch("/.netlify/functions/reviews")
      .then(function (res) { return res.ok ? res.json() : { reviews: [] }; })
      .then(function (data) {
        renderTestimonials((data.reviews || []).map(function (r) {
          return { name: r.display_name, rating: r.rating, text: r.comment, item: r.item_summary };
        }));
      })
      .catch(function () {});
  }

  /* ------------------------------------------------------------
   * 2. Hero slider
   * ---------------------------------------------------------- */
  var slides = document.querySelectorAll(".hero-slide");
  var dots = document.querySelectorAll("#heroDots button");
  if (slides.length > 1) {
    var current = 0;
    var timer = null;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var showSlide = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
        slide.setAttribute("aria-hidden", String(i !== current));
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === current);
        dot.setAttribute("aria-selected", String(i === current));
      });
    };

    var startAuto = function () {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(function () { showSlide(current + 1); }, 5500);
    };

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        showSlide(i);
        startAuto();
      });
    });

    // Swipe on touch screens
    var hero = document.getElementById("home");
    var touchX = null;
    hero.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) {
        showSlide(current + (dx < 0 ? 1 : -1));
        startAuto();
      }
      touchX = null;
    });

    showSlide(0);
    startAuto();
  }

  /* ------------------------------------------------------------
   * 3. Scroll animations
   *    - .reveal blocks fade/rise in when they enter the screen
   *    - rows of cards (products, tiles, reels, categories...) get
   *      .stagger so each card pops in one after another
   * ---------------------------------------------------------- */
  var reduceMotionAll = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STAGGER_ROWS = ".cat-row, .product-row, .product-grid, .reel-row, .feature-track, .testi-track, .faq-list, .trust-row, .promise-stats";

  document.querySelectorAll(STAGGER_ROWS).forEach(function (row) {
    row.classList.remove("reveal");
    row.classList.add("stagger");
    Array.prototype.forEach.call(row.children, function (child, i) {
      child.style.setProperty("--i", Math.min(i, 8));
    });
  });

  var revealEls = document.querySelectorAll(".reveal, .stagger");
  var markVisible = function (el) {
    el.classList.add(el.classList.contains("stagger") ? "in-view" : "visible");
  };
  if ("IntersectionObserver" in window && !reduceMotionAll) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            markVisible(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(markVisible);
  }

  /* ------------------------------------------------------------
   * 4. Scroll effects: slimmer header, progress bar, hero
   *    parallax, back-to-top button (one rAF-throttled handler)
   * ---------------------------------------------------------- */
  var header = document.getElementById("siteHeader");
  var progressBar = document.getElementById("scrollProgress");
  var heroEl = document.getElementById("home");
  var toTop = document.getElementById("toTop");
  var ticking = false;

  var onScroll = function () {
    ticking = false;
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle("scrolled", y > 40);
    if (progressBar) progressBar.style.setProperty("--progress", max > 0 ? Math.min(y / max, 1) : 0);
    if (toTop) toTop.classList.toggle("show", y > 700);
    if (heroEl && !reduceMotionAll && y < heroEl.offsetHeight + 200) {
      heroEl.style.setProperty("--hero-scroll", y);
    }
  };
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotionAll ? "auto" : "smooth" });
    });
  }

  /* ------------------------------------------------------------
   * 4b. Highlight the menu link for the section on screen
   * ---------------------------------------------------------- */
  var navMap = {
    "ragi-cookies": "#ragi-cookies", "ragi-special": "#ragi-cookies",
    "brownies": "#brownies", "cupcakes": "#cupcakes", "classic-cookies": "#ragi-cookies",
    "about": "#about"
  };
  var navAnchors = document.querySelectorAll("#navLinks a[href^='#']");
  if ("IntersectionObserver" in window && navAnchors.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var target = navMap[entry.target.id];
        navAnchors.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === target);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------
   * 4c. FAQ accordion — one answer open at a time
   * ---------------------------------------------------------- */
  var faqButtons = document.querySelectorAll(".faq-q button");
  faqButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var willOpen = btn.getAttribute("aria-expanded") !== "true";
      faqButtons.forEach(function (other) {
        other.setAttribute("aria-expanded", "false");
        other.closest(".faq-item").classList.remove("open");
      });
      if (willOpen) {
        btn.setAttribute("aria-expanded", "true");
        btn.closest(".faq-item").classList.add("open");
      }
    });
  });

  // Footer "Help" links jump to the FAQ and open the matching answer
  document.querySelectorAll("a[data-faq]").forEach(function (link) {
    link.addEventListener("click", function () {
      var btn = faqButtons[Number(link.getAttribute("data-faq"))];
      if (btn && btn.getAttribute("aria-expanded") !== "true") btn.click();
    });
  });

  /* ------------------------------------------------------------
   * 5. Mobile nav drawer
   * ---------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  var navBackdrop = document.getElementById("navBackdrop");

  if (navToggle && navLinks) {
    var setNav = function (open) {
      navLinks.classList.toggle("open", open);
      navToggle.classList.toggle("open", open);
      if (navBackdrop) navBackdrop.classList.toggle("open", open);
      document.body.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    navToggle.addEventListener("click", function () {
      setNav(!navLinks.classList.contains("open"));
    });
    if (navBackdrop) navBackdrop.addEventListener("click", function () { setNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNav(false);
    });
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setNav(false); });
    });
  }

  /* ------------------------------------------------------------
   * 6. Footer phone number + year
   * ---------------------------------------------------------- */
  var footerPhone = document.getElementById("footerPhone");
  if (footerPhone && WHATSAPP_NUMBER.indexOf("91") === 0 && WHATSAPP_NUMBER.length === 12) {
    footerPhone.textContent = "+91 " + WHATSAPP_NUMBER.slice(2, 7) + " " + WHATSAPP_NUMBER.slice(7);
  }

  // Twinkling stars in the footer night sky
  var footerStars = document.getElementById("footerStars");
  if (footerStars) {
    var starFrag = document.createDocumentFragment();
    var starCount = window.innerWidth < 720 ? 28 : 55;
    for (var si = 0; si < starCount; si++) {
      var star = document.createElement("span");
      var size = (Math.random() * 2 + 1).toFixed(1) + "px";
      star.style.left = (Math.random() * 100).toFixed(2) + "%";
      star.style.top = (Math.random() * 100).toFixed(2) + "%";
      star.style.width = size;
      star.style.height = size;
      star.style.animationDuration = (2 + Math.random() * 4).toFixed(2) + "s";
      star.style.animationDelay = (Math.random() * -6).toFixed(2) + "s";
      starFrag.appendChild(star);
    }
    footerStars.appendChild(starFrag);
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------
   * "Add to order" buttons on product cards. They fill the cart used by
   * the Order page (order.html); the WhatsApp "Order" button stays too.
   * ---------------------------------------------------------- */
  // Only signed-in customers get the cart (header bag + Add to order);
  // everyone else keeps the plain WhatsApp order buttons.
  if (window.MK) MK.session().then(function (s) {
    if (!s || !s.loggedIn) return;
    var cartBtn = document.querySelector(".cart-btn");
    if (cartBtn) cartBtn.hidden = false;

    document.querySelectorAll(".product-card .order-btn[data-item]").forEach(function (waBtn) {
      var item = waBtn.getAttribute("data-item");
      var add = document.createElement("button");
      add.type = "button";
      add.className = "add-btn";
      add.setAttribute("data-add-item", item);
      waBtn.insertAdjacentElement("afterend", add);
    });

    // Feature-row tiles (Ragi Special, brownies...) add to the cart too,
    // instead of opening WhatsApp.
    document.querySelectorAll(".tile[data-item]").forEach(function (tile) {
      tile.classList.remove("whatsapp-link");
      tile.setAttribute("href", "#");
      tile.removeAttribute("target");
      tile.removeAttribute("rel");
      tile.setAttribute("data-add-item", tile.getAttribute("data-item"));
    });

    var paintAddButtons = function () {
      document.querySelectorAll("[data-add-item]").forEach(function (btn) {
        var qty = MK.cart.qtyOf(btn.getAttribute("data-add-item"));
        btn.classList.toggle("is-added", qty > 0);
        var label = qty > 0 ? "✓ Added (" + qty + ") · +1" : "+ Add to order";
        var cta = btn.classList.contains("tile") ? btn.querySelector(".tile-cta") : btn;
        if (cta) cta.textContent = label;
      });
    };
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add-item]");
      if (!btn) return;
      e.preventDefault();
      var item = btn.getAttribute("data-add-item");
      MK.cart.setQty(item, MK.cart.qtyOf(item) + 1);
    });
    document.addEventListener("mk:cart", paintAddButtons);
    paintAddButtons();
  });

  /* ------------------------------------------------------------
   * Prices from the admin Menu page. Priced items show their pack and
   * price; items that are hidden or not priced yet are removed from the
   * page. If nothing is priced yet (or the menu can't load) the page stays
   * exactly as designed, with "Price on request" and WhatsApp ordering.
   * ---------------------------------------------------------- */
  if (window.MK) {
    MK.menu().then(function (m) {
      if (!m.priced) return;

      document.querySelectorAll(".product-card").forEach(function (card) {
        var orderBtn = card.querySelector(".order-btn[data-item]");
        if (!orderBtn) return;
        var p = m.byName.get(orderBtn.getAttribute("data-item"));
        if (!p) {
          card.style.display = "none";
          return;
        }
        var note = card.querySelector(".price-note");
        if (!note) {
          note = document.createElement("p");
          note.className = "price-note";
          orderBtn.insertAdjacentElement("beforebegin", note);
        }
        note.textContent = MK.pack(p);
        note.classList.add("has-price");
      });

      document.querySelectorAll(".tile[data-item]").forEach(function (tile) {
        var p = m.byName.get(tile.getAttribute("data-item"));
        if (!p) {
          tile.style.display = "none";
          return;
        }
        var price = tile.querySelector(".tile-price");
        if (!price) {
          price = document.createElement("span");
          price.className = "tile-price";
          tile.querySelector(".tile-name").insertAdjacentElement("afterend", price);
        }
        // "Box of 9" / "5 pcs" is already in the tile name: show just the price.
        var numbersInName = tile.querySelector(".tile-name").textContent.match(/\d+/g) || [];
        var countInName = p.unit === "pcs" && numbersInName.indexOf(String(p.pack_size)) !== -1;
        price.textContent = countInName ? MK.money(p.price) : MK.pack(p);
      });

      // Hide rows / sections left with nothing in them, and menu links to them.
      var shown = function (el) { return el.style.display !== "none"; };
      var hideBlock = function (block) {
        block.style.display = "none";
        if (block.id) {
          document.querySelectorAll('.nav-links a[href="#' + block.id + '"]').forEach(function (link) {
            link.closest("li").style.display = "none";
          });
        }
      };
      document.querySelectorAll(".feature-row").forEach(function (row) {
        var tiles = row.querySelectorAll(".tile[data-item]");
        if (tiles.length && ![].some.call(tiles, shown)) hideBlock(row);
      });
      document.querySelectorAll("#bestsellers, #ragi-cookies").forEach(function (section) {
        var cards = section.querySelectorAll(".product-card");
        if (cards.length && ![].some.call(cards, shown)) hideBlock(section);
      });
    });
  }

  /* ------------------------------------------------------------
   * Optional customer login in the header. Login is never forced:
   * the "Login" button stays until the customer signs in, then it
   * becomes an account button with a Log out option.
   * ---------------------------------------------------------- */
  var accountLogin = document.getElementById("accountLogin");
  var accountToggle = document.getElementById("accountToggle");
  var accountMenu = document.getElementById("accountMenu");

  function logout() {
    fetch("/.netlify/functions/logout", { method: "POST", credentials: "same-origin" })
      .finally(function () { window.location.reload(); });
  }

  function setAccountMenu(open) {
    accountMenu.classList.toggle("hidden", !open);
    accountToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (accountLogin && accountToggle && accountMenu && window.location.protocol !== "file:") {
    fetch("/.netlify/functions/session", { credentials: "same-origin" })
      .then(function (res) { return res.ok ? res.json() : {}; })
      .then(function (data) {
        if (!data.loggedIn || !data.email) return;
        var name = data.email.split("@")[0];
        document.getElementById("accountInitial").textContent = name.charAt(0);
        document.getElementById("accountName").textContent = name;
        document.getElementById("accountEmail").textContent = "Signed in as " + data.email;
        accountToggle.setAttribute("aria-label", "Account: " + data.email);
        accountLogin.classList.add("hidden");
        accountToggle.classList.remove("hidden");
        if (data.isAdmin) document.getElementById("accountAdmin").classList.remove("hidden");

        // Mobile drawer: swap "Sign in" for "Log out".
        var drawerLink = document.getElementById("drawerAccountLink");
        if (drawerLink) {
          drawerLink.textContent = "Log out (" + name + ")";
          drawerLink.setAttribute("href", "#");
          drawerLink.addEventListener("click", function (e) {
            e.preventDefault();
            logout();
          });
        }
      })
      .catch(function () {
        // Functions unavailable (e.g. opened as a local file) — keep showing "Login".
      });

    accountToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setAccountMenu(accountMenu.classList.contains("hidden"));
    });
    document.addEventListener("click", function (e) {
      if (!accountMenu.contains(e.target)) setAccountMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setAccountMenu(false);
    });

    document.getElementById("accountLogout").addEventListener("click", logout);
  }

  /* ------------------------------------------------------------
   * Sign-in nudge + "how do you want to order?" chooser.
   * - Visitors who aren't signed in see a dismissible bar asking them to
   *   add their email (sign in).
   * - Clicking any Order button asks: website or WhatsApp. WhatsApp opens a
   *   small form so the message arrives with name, address etc. filled in.
   * ---------------------------------------------------------- */
  (function () {
    if (!window.MK) return;
    var DETAILS_KEY = "mk_order_details";
    var PICKUP = "Amalapuram, BlackBridge Road, East Godavari District (Konaseema), Andhra Pradesh – 533201";

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }
    function store(get) {
      try { return get(); } catch (e) { return null; }
    }

    /* ----- sign-in bar ----- */
    if (location.protocol !== "file:" && !store(function () { return sessionStorage.getItem("mk_signin_bar"); })) {
      MK.session().then(function (s) {
        if (!s || s.loggedIn) return;
        var bar = el("div", "signin-bar");
        bar.setAttribute("role", "status");
        bar.appendChild(el("span", "signin-bar-text", "Add your email to sign in: order online, track your orders and choose delivery."));
        var go = el("a", "signin-bar-btn", "Sign in");
        go.href = MK.loginUrl();
        var x = el("button", "signin-bar-x", "×");
        x.type = "button";
        x.setAttribute("aria-label", "Dismiss");
        x.addEventListener("click", function () {
          bar.remove();
          store(function () { sessionStorage.setItem("mk_signin_bar", "1"); });
        });
        bar.appendChild(go);
        bar.appendChild(x);
        document.body.appendChild(bar);
      });
    }

    /* ----- order chooser ----- */
    var overlay = el("div", "order-modal");
    overlay.hidden = true;
    var card = el("div", "order-modal-card");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    function close() { overlay.hidden = true; document.body.style.overflow = ""; }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !overlay.hidden) close(); });

    function closeBtn() {
      var b = el("button", "order-modal-x", "×");
      b.type = "button";
      b.setAttribute("aria-label", "Close");
      b.addEventListener("click", close);
      return b;
    }

    function isMenuItem(item, menu) {
      if (menu && menu.priced) return menu.byName.has(item);
      return (window.MK_MENU || []).some(function (g) { return g.items.indexOf(item) !== -1; });
    }

    function goWebsite(item) {
      MK.menu().then(function (m) {
        if (isMenuItem(item, m)) MK.cart.setQty(item, MK.cart.qtyOf(item) + 1);
      }, function () {}).then(function () { location.href = "order.html"; });
    }

    function showChoice(item) {
      card.innerHTML = "";
      card.appendChild(closeBtn());
      card.appendChild(el("h3", "", "How would you like to order?"));
      card.appendChild(el("p", "order-modal-item", item));
      var web = el("button", "btn btn-dark", "Order on the website");
      web.type = "button";
      web.addEventListener("click", function () { goWebsite(item); });
      var wa = el("button", "btn btn-wa", "Order on WhatsApp");
      wa.type = "button";
      wa.addEventListener("click", function () { showForm(item); });
      card.appendChild(web);
      card.appendChild(wa);
      card.appendChild(el("p", "order-modal-note", "On the website you can track your order under My orders (sign in with your email)."));
    }

    function field(label, input) {
      var wrap = el("div", "field");
      var l = el("label", "", label);
      wrap.appendChild(l);
      wrap.appendChild(input);
      return { wrap: wrap, input: input };
    }
    function input(type, name, ph) {
      var i = el("input");
      i.type = type; i.name = name; if (ph) i.placeholder = ph; i.maxLength = 120;
      return i;
    }

    function showForm(item) {
      var saved = store(function () { return JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}"); }) || {};
      card.innerHTML = "";
      card.appendChild(closeBtn());
      card.appendChild(el("h3", "", "Order on WhatsApp"));
      card.appendChild(el("p", "order-modal-item", item));

      var form = el("form", "order-modal-form");
      form.noValidate = true;
      var qty = field("Quantity / pack (e.g. 2 packs of 250 g)", input("text", "qty", "e.g. 2 × 250 g"));
      var name = field("Name", input("text", "name"));
      var phone = field("Phone (WhatsApp)", input("tel", "phone", "98765 43210"));
      name.input.value = saved.name || "";
      phone.input.value = saved.phone || "";

      var ful = el("div", "field");
      ful.appendChild(el("span", "label", "Pickup or delivery"));
      var choice = el("div", "choice");
      ["pickup", "delivery"].forEach(function (v) {
        var lab = el("label");
        var r = el("input");
        r.type = "radio"; r.name = "fulfilment"; r.value = v;
        r.checked = (saved.fulfilment || "pickup") === v;
        lab.appendChild(r);
        lab.appendChild(document.createTextNode(" " + (v === "pickup" ? "Pickup" : "Delivery")));
        choice.appendChild(lab);
      });
      ful.appendChild(choice);

      var pickupNote = el("p", "order-modal-note", "Pickup location: " + PICKUP);
      var addr = el("textarea");
      addr.name = "address"; addr.maxLength = 300;
      addr.placeholder = "House no., street, area, city, PIN";
      addr.value = saved.address || "";
      var addrField = field("Delivery address", addr);
      var charge = el("p", "order-modal-note", "Delivery charges apply. We'll confirm the charge with your final total.");
      addrField.wrap.appendChild(charge);

      var date = field("Preferred date (optional)", input("date", "date"));
      var notes = el("textarea");
      notes.name = "notes"; notes.maxLength = 300;
      notes.placeholder = "Flavour preferences, sugar level, occasion…";
      var notesField = field("Notes (optional)", notes);

      function sync() {
        var delivery = form.fulfilment.value === "delivery";
        addrField.wrap.hidden = !delivery;
        pickupNote.hidden = delivery;
      }
      form.addEventListener("change", sync);

      var err = el("p", "form-error");
      err.setAttribute("role", "alert");
      var send = el("button", "btn btn-wa", "Send on WhatsApp");
      send.type = "submit";
      var back = el("button", "order-modal-back", "Back");
      back.type = "button";
      back.addEventListener("click", function () { showChoice(item); });

      [qty.wrap, name.wrap, phone.wrap, ful, pickupNote, addrField.wrap, date.wrap, notesField.wrap, err, send, back]
        .forEach(function (n) { form.appendChild(n); });
      card.appendChild(form);
      sync();

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var delivery = form.fulfilment.value === "delivery";
        if (!name.input.value.trim() || !phone.input.value.trim()) {
          err.textContent = "Please enter your name and phone number.";
          return;
        }
        if (delivery && !addr.value.trim()) {
          err.textContent = "Please enter your delivery address.";
          return;
        }
        store(function () {
          localStorage.setItem(DETAILS_KEY, JSON.stringify({
            name: name.input.value.trim(), phone: phone.input.value.trim(),
            address: addr.value.trim(), fulfilment: form.fulfilment.value
          }));
        });
        var lines = [
          "Hi Moon's Kitchen! I'd like to order " + item + ".",
          ""
        ];
        if (qty.input.value.trim()) lines.push("Quantity: " + qty.input.value.trim());
        lines.push("Name: " + name.input.value.trim());
        lines.push("Phone: " + phone.input.value.trim());
        if (delivery) {
          lines.push("Delivery address: " + addr.value.trim());
        } else {
          lines.push("Pickup from: " + PICKUP);
        }
        if (date.input.value) lines.push("Preferred date: " + date.input.value);
        if (notes.value.trim()) lines.push("Notes: " + notes.value.trim());
        lines.push("", "Could you please share the price and availability?");
        window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
        close();
      });
    }

    // Capture phase, so it runs before the link's own WhatsApp navigation.
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest("a.whatsapp-link");
      if (!link) return;
      var item = link.getAttribute("data-item") || "";
      if (!item || item === "a chat") return; // plain "chat with us" goes straight to WhatsApp
      e.preventDefault();
      e.stopPropagation();
      showChoice(item);
      overlay.hidden = false;
      document.body.style.overflow = "hidden";
    }, true);
  })();

  /* ------------------------------------------------------------
   * Image viewer: click any product photo to see it full size.
   * Delegated, so cards rendered later (prices, menu) work too.
   * ---------------------------------------------------------- */
  (function () {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.hidden = true;
    box.innerHTML = '<button type="button" class="lightbox-close" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(box);
    var big = box.querySelector("img");

    function close() { box.hidden = true; document.body.style.overflow = ""; }
    box.addEventListener("click", function (e) { if (e.target !== big) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });

    document.addEventListener("click", function (e) {
      var img = e.target.closest && e.target.closest(".product-media img");
      if (!img) return;
      big.src = img.currentSrc || img.src;
      big.alt = img.alt || "";
      box.hidden = false;
      document.body.style.overflow = "hidden";
    });
  })();
})();
