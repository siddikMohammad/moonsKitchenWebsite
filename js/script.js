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
  if (testiTrack && TESTIMONIALS.length) {
    var esc = function (str) {
      var d = document.createElement("div");
      d.textContent = str == null ? "" : String(str);
      return d.innerHTML;
    };
    TESTIMONIALS.forEach(function (t) {
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
    if (testiNav && TESTIMONIALS.length > 1) {
      testiNav.hidden = false;
      testiNav.querySelectorAll(".testi-arrow").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var step = (testiTrack.firstElementChild.offsetWidth + 20) * Number(btn.getAttribute("data-dir"));
          testiTrack.scrollBy({ left: step, behavior: "smooth" });
        });
      });
    }
  } else if (testiTrack) {
    testiTrack.remove();
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
   * Optional customer login in the header. Login is never forced:
   * the "Login" button stays until the customer signs in, then it
   * becomes an account button with a Log out option.
   * ---------------------------------------------------------- */
  var accountLogin = document.getElementById("accountLogin");
  var accountToggle = document.getElementById("accountToggle");
  var accountMenu = document.getElementById("accountMenu");

  function setAccountMenu(open) {
    accountMenu.classList.toggle("hidden", !open);
    accountToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (accountLogin && accountToggle && accountMenu) {
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

    document.getElementById("accountLogout").addEventListener("click", function () {
      fetch("/.netlify/functions/logout", { method: "POST", credentials: "same-origin" })
        .finally(function () { window.location.reload(); });
    });
  }
})();
