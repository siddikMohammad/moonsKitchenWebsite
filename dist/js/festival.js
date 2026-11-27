/* ============================================
   Moon's Kitchen — festival look (index.html only)
   Runs only when js/theme.js has switched a festival on
   (<html data-festival="...">). Load BEFORE script.js, because
   it adds the festival slide that script.js then runs in the
   hero slider. Styles are in css/festival.css.
     1 Festival words (hero slide, section titles, footer)
     2 Artwork (hero picture + footer picture), drawn as SVG
       in the theme's own colours
     3 Festival hero slide
     4 Festive section titles
     5 Footer art
     6 Gentle festive motion in the hero
   Preview with ?theme=christmas|newyear|sankranti|diwali|ramzan
   ============================================ */

(function () {
  "use strict";

  var root = document.documentElement;
  var name = root.getAttribute("data-festival");
  if (!name) return;

  var info = window.MK_FESTIVAL || {};
  var day = info.date || "";
  var year = Number(day.slice(0, 4)) || new Date().getFullYear();
  // New Year in late December is for the coming year
  var newYear = day.slice(5, 7) === "12" ? year + 1 : year;

  /* ------------------------------------------------------------
   * 1. Festival words — safe to edit. "titles" swaps a heading's
   *    exact current text for the festival version. Item names are
   *    never changed here, so ordering keeps working.
   * ---------------------------------------------------------- */
  var WORDS = {
    christmas: {
      eyebrow: "Merry Christmas",
      title: "Christmas treats, <em>baked with love.</em>",
      sub: "Cookies, brownies and cakes for your Christmas table, baked fresh in our Amalapuram home kitchen.",
      button: "Order Christmas Bakes",
      icon: "🎄",
      titles: {
        "Bestsellers": "Christmas Favourites",
        "Build Your Own Box": "Build a Christmas Gift Box",
        "Custom Cakes": "Custom Cakes for Christmas",
        "Craving something fresh?": "Planning your Christmas treats?",
        "Baked under the moon": "Merry Christmas"
      },
      motion: "snow"
    },
    newyear: {
      eyebrow: "Happy New Year " + newYear,
      title: "Start the year <em>on a sweet note.</em>",
      sub: "Party boxes, cakes and cookies for your celebrations, baked fresh to order.",
      button: "Order for the Party",
      icon: "✨",
      titles: {
        "Bestsellers": "New Year Favourites",
        "Build Your Own Box": "Build a New Year Party Box",
        "Custom Cakes": "Custom Cakes for New Year",
        "Craving something fresh?": "Celebrating the new year?",
        "Baked under the moon": "Happy New Year"
      },
      motion: "confetti"
    },
    sankranti: {
      eyebrow: "Happy Sankranti & Pongal",
      title: "Festive bakes <em>for the whole family.</em>",
      sub: "Ragi, jowar and millet treats to share with family and guests this Sankranti.",
      button: "Order Festive Bakes",
      icon: "🪁",
      titles: {
        "Bestsellers": "Sankranti Favourites",
        "Build Your Own Box": "Build a Sankranti Gift Box",
        "Custom Cakes": "Custom Cakes for Sankranti",
        "Craving something fresh?": "Treats for the whole family?",
        "Baked under the moon": "Happy Sankranti & Pongal"
      },
      motion: "kites"
    },
    diwali: {
      eyebrow: "Happy Diwali",
      title: "Light up Diwali <em>with sweet treats.</em>",
      sub: "Gift boxes of cookies and brownies for family and friends, baked fresh to order.",
      button: "Order Diwali Treats",
      icon: "🪔",
      titles: {
        "Bestsellers": "Diwali Favourites",
        "Build Your Own Box": "Build a Diwali Gift Box",
        "Custom Cakes": "Custom Cakes for Diwali",
        "Craving something fresh?": "Gifting sweets this Diwali?",
        "Baked under the moon": "Happy Diwali"
      },
      motion: "sparks"
    },
    ramzan: {
      eyebrow: "Ramzan Mubarak",
      title: "Sweet treats <em>for Iftar and Eid.</em>",
      sub: "Cookies, brownies and cakes to share with family, baked fresh to order. Eid Mubarak!",
      button: "Order for Eid",
      icon: "🌙",
      titles: {
        "Bestsellers": "Ramzan Favourites",
        "Build Your Own Box": "Build an Eid Gift Box",
        "Custom Cakes": "Custom Cakes for Eid",
        "Craving something fresh?": "Treats for Iftar and Eid?",
        "Baked under the moon": "Ramzan Mubarak"
      },
      motion: "stars"
    }
  };

  var words = WORDS[name];
  if (!words) return;

  /* ------------------------------------------------------------
   * 2. Artwork. Colours come from the theme (classes fa-* and
   *    fs-* in css/festival.css), so there are no fixed colours.
   * ---------------------------------------------------------- */
  function star(cx, cy, outer, inner, points) {
    points = points || 5;
    var out = [];
    for (var i = 0; i < points * 2; i++) {
      var r = i % 2 ? inner : outer;
      var a = (Math.PI / points) * i - Math.PI / 2;
      out.push((cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1));
    }
    return '<polygon points="' + out.join(" ") + '"';
  }

  function dot(cx, cy, r, cls, extra) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" class="' + cls + '"' + (extra || "") + "/>";
  }

  function burst(cx, cy, r, cls, rays) {
    var s = "";
    for (var i = 0; i < rays; i++) {
      var a = (Math.PI * 2 / rays) * i;
      var x1 = cx + Math.cos(a) * r * 0.3, y1 = cy + Math.sin(a) * r * 0.3;
      var x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
      s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" class="' + cls + '" stroke-width="3" stroke-linecap="round"/>';
      s += dot(x2.toFixed(1), y2.toFixed(1), 3.2, cls.replace("fs-", "fa-"));
    }
    return '<g class="fa-twinkle">' + s + "</g>";
  }

  function diya(x, y, scale) {
    return '<g transform="translate(' + x + " " + y + ") scale(" + scale + ')">' +
      dot(0, -38, 26, "fa-gold fa-glow") +
      '<path d="M0,-62 C10,-46 12,-34 0,-24 C-12,-34 -10,-46 0,-62 Z" class="fa-light"/>' +
      '<path d="M0,-50 C5,-42 6,-35 0,-29 C-6,-35 -5,-42 0,-50 Z" class="fa-card"/>' +
      '<path d="M-46,-18 Q0,40 46,-18 Z" class="fa-dark"/>' +
      '<ellipse cx="0" cy="-18" rx="46" ry="8" class="fa-gold"/>' +
      '<path d="M-30,2 Q0,18 30,2" class="fs-light" stroke-width="3" fill="none"/>' +
      "</g>";
  }

  function kite(x, y, size, rot, a, b) {
    var h = size, w = size * 0.75;
    return '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ')">' +
      '<path d="M0,' + (h - 4) + " C-14," + (h + 30) + " 14," + (h + 50) + " -4," + (h + 85) + '" class="fs-ink" stroke-width="2" fill="none" opacity="0.6"/>' +
      '<polygon points="0,' + (-h) + " " + w + ",0 0," + h + '" class="' + a + '"/>' +
      '<polygon points="0,' + (-h) + " " + (-w) + ",0 0," + h + '" class="' + b + '"/>' +
      '<line x1="0" y1="' + (-h) + '" x2="0" y2="' + h + '" class="fs-card" stroke-width="1.5"/>' +
      '<line x1="' + (-w) + '" y1="0" x2="' + w + '" y2="0" class="fs-card" stroke-width="1.5"/>' +
      "</g>";
  }

  function lantern(x, y, len, scale) {
    return '<g transform="translate(' + x + " " + y + ')">' +
      '<line x1="0" y1="0" x2="0" y2="' + len + '" class="fs-gold" stroke-width="1.5"/>' +
      '<g transform="translate(0 ' + len + ") scale(" + scale + ')">' +
      dot(0, 40, 34, "fa-gold fa-glow") +
      '<polygon points="-12,0 12,0 20,12 -20,12" class="fa-dark"/>' +
      '<path d="M-20,12 L20,12 L26,58 Q0,72 -26,58 Z" class="fa-gold"/>' +
      '<path d="M-10,20 L10,20 L13,54 Q0,60 -13,54 Z" class="fa-light"/>' +
      '<polygon points="-16,64 16,64 8,76 -8,76" class="fa-dark"/>' +
      "</g></g>";
  }

  function scatter(n, cls, seed, rMax, area) {
    // Same positions every time (simple seeded steps), no clumping
    var s = "", x = seed;
    for (var i = 0; i < n; i++) {
      x = (x * 9301 + 49297) % 233280;
      var px = 12 + (x / 233280) * (area[0] - 24);
      x = (x * 9301 + 49297) % 233280;
      var py = 12 + (x / 233280) * (area[1] - 24);
      s += dot(px.toFixed(0), py.toFixed(0), (1 + (i % 3) * rMax / 3).toFixed(1), cls);
    }
    return s;
  }

  var ART = {
    christmas: function () {
      var balls = [[170, 170, "fa-choc"], [232, 182, "fa-gold"], [140, 250, "fa-gold"], [205, 236, "fa-choc"], [262, 258, "fa-choc"],
        [118, 330, "fa-choc"], [176, 316, "fa-gold"], [236, 330, "fa-gold"], [292, 322, "fa-choc"]];
      var s = '<rect width="400" height="440" class="fa-sand"/>' +
        scatter(26, "fa-card", 7, 4, [400, 300]) +
        '<ellipse cx="200" cy="440" rx="270" ry="70" class="fa-card"/>' +
        '<polygon points="200,78 128,192 272,192" class="fa-deep"/>' +
        '<polygon points="200,134 100,272 300,272" class="fa-deep"/>' +
        '<polygon points="200,206 74,356 326,356" class="fa-deep"/>' +
        '<path d="M140,186 Q200,214 262,182 M114,266 Q200,300 290,262 M88,348 Q200,384 316,346" class="fs-gold" stroke-width="3" fill="none"/>' +
        '<rect x="182" y="356" width="36" height="36" rx="4" class="fa-choc2"/>';
      balls.forEach(function (b) { s += dot(b[0], b[1], 9, b[2]) + dot(b[0] - 3, b[1] - 3, 2.5, "fa-card"); });
      s += '<g class="fa-twinkle">' + star(200, 66, 30, 12) + ' class="fa-gold"/></g>' +
        '<rect x="62" y="366" width="58" height="48" rx="5" class="fa-choc"/><rect x="86" y="366" width="10" height="48" class="fa-gold"/><rect x="62" y="384" width="58" height="10" class="fa-gold"/>' +
        '<rect x="290" y="376" width="50" height="40" rx="5" class="fa-gold"/><rect x="310" y="376" width="9" height="40" class="fa-choc"/><rect x="290" y="390" width="50" height="9" class="fa-choc"/>';
      return s;
    },
    newyear: function () {
      return '<rect width="400" height="440" class="fa-ink"/>' +
        scatter(40, "fa-gold2", 3, 2.5, [400, 300]) +
        burst(110, 120, 70, "fs-gold", 14) +
        burst(290, 90, 55, "fs-light", 12) +
        burst(300, 230, 45, "fs-dark", 10) +
        burst(90, 260, 40, "fs-gold2", 10) +
        '<text x="200" y="380" text-anchor="middle" class="fa-gold fa-year">' + newYear + "</text>" +
        '<path d="M60,400 L340,400" class="fs-gold" stroke-width="2" opacity="0.6"/>';
    },
    sankranti: function () {
      var cane = function (x, tilt) {
        return '<g transform="translate(' + x + " 440) rotate(" + tilt + ')">' +
          '<rect x="-6" y="-250" width="12" height="250" rx="5" class="fa-deep"/>' +
          '<path d="M-6,-60 h12 M-6,-120 h12 M-6,-180 h12" class="fs-sand" stroke-width="3"/>' +
          '<path d="M0,-250 C-40,-290 -60,-280 -80,-300 C-50,-270 -30,-262 0,-240 Z M0,-250 C30,-300 60,-300 70,-320 C50,-290 30,-270 0,-236 Z" class="fa-deep"/>' +
          "</g>";
      };
      return '<rect width="400" height="440" class="fa-sand"/>' +
        dot(320, 80, 46, "fa-light") + dot(320, 80, 32, "fa-gold") +
        kite(110, 90, 38, -14, "fa-choc", "fa-gold") +
        kite(230, 150, 30, 12, "fa-deep", "fa-gold2") +
        kite(150, 220, 24, -6, "fa-gold", "fa-choc2") +
        cane(44, -6) + cane(362, 6) +
        // Pongal pot with rice boiling over
        '<ellipse cx="200" cy="420" rx="120" ry="14" class="fa-dark" opacity="0.35"/>' +
        dot(200, 360, 62, "fa-choc2") +
        '<rect x="160" y="290" width="80" height="22" rx="8" class="fa-choc"/>' +
        dot(176, 288, 16, "fa-card") + dot(200, 280, 20, "fa-card") + dot(224, 288, 16, "fa-card") + dot(244, 300, 10, "fa-card") +
        '<path d="M146,350 Q200,372 254,350" class="fs-gold" stroke-width="6" fill="none"/>' +
        '<path d="M150,372 Q200,392 250,372" class="fs-gold2" stroke-width="3" fill="none" stroke-dasharray="2 8" stroke-linecap="round"/>';
    },
    diwali: function () {
      var petals = "";
      for (var i = 0; i < 12; i++) {
        petals += '<ellipse cx="200" cy="372" rx="11" ry="30" class="' + (i % 2 ? "fa-gold" : "fa-choc2") + '" transform="rotate(' + i * 30 + ' 200 400)"/>';
      }
      var bulbs = "";
      for (var b = 0; b < 9; b++) {
        var bx = 20 + b * 45, by = 36 + Math.sin(b / 8 * Math.PI) * 26;
        bulbs += dot(bx, by + 6, 6, b % 2 ? "fa-gold fa-twinkle" : "fa-light fa-twinkle");
      }
      return '<rect width="400" height="440" class="fa-ink"/>' +
        dot(200, 250, 170, "fa-choc fa-soft") +
        '<path d="M0,30 Q200,90 400,30" class="fs-gold" stroke-width="1.5" fill="none"/>' + bulbs +
        scatter(18, "fa-gold2", 11, 2, [400, 180]) +
        dot(200, 400, 62, "fa-dark") + petals + dot(200, 400, 22, "fa-light") + dot(200, 400, 9, "fa-choc") +
        diya(110, 290, 1) + diya(200, 250, 1.25) + diya(290, 290, 1);
    },
    ramzan: function () {
      return '<rect width="400" height="440" class="fa-ink"/>' +
        scatter(34, "fa-gold2 fa-twinkle", 5, 2.5, [400, 280]) +
        dot(250, 120, 64, "fa-gold") + dot(278, 100, 58, "fa-ink") +
        '<g class="fa-twinkle">' + star(300, 150, 14, 6) + ' class="fa-light"/></g>' +
        lantern(70, 0, 110, 1) + lantern(130, 0, 60, 0.8) + lantern(345, 0, 210, 0.75) +
        // Mosque skyline
        '<path d="M0,440 L0,360 L60,360 L60,330 Q95,280 130,330 L130,360 L160,360 L160,300 Q200,230 240,300 L240,360 L270,360 L270,330 Q305,280 340,330 L340,360 L400,360 L400,440 Z" class="fa-choc"/>' +
        '<rect x="22" y="290" width="14" height="70" class="fa-choc"/><polygon points="22,290 36,290 29,268" class="fa-choc"/>' +
        '<rect x="364" y="290" width="14" height="70" class="fa-choc"/><polygon points="364,290 378,290 371,268" class="fa-choc"/>' +
        '<path d="M200,226 Q206,236 200,246 Q194,236 200,226" class="fa-gold"/>' +
        '<rect x="188" y="380" width="24" height="60" rx="12" class="fa-dark" opacity="0.6"/>';
    }
  };

  // Small pictures for the footer sky
  var MINI = {
    christmas: '<svg viewBox="0 0 80 90"><polygon points="40,10 16,46 64,46" class="fa-gold2"/><polygon points="40,30 8,74 72,74" class="fa-gold2"/><rect x="34" y="74" width="12" height="12" class="fa-gold"/>' + star(40, 9, 9, 4) + ' class="fa-gold"/></svg>',
    newyear: '<svg viewBox="0 0 90 90">' + burst(45, 45, 40, "fs-gold", 12) + "</svg>",
    sankranti: '<svg viewBox="0 0 90 120">' + kite(45, 40, 30, -12, "fa-gold", "fa-gold2") + "</svg>",
    diwali: '<svg viewBox="0 0 120 90">' + diya(60, 66, 0.9) + "</svg>",
    ramzan: '<svg viewBox="0 0 80 150">' + lantern(40, 0, 50, 0.9) + "</svg>"
  };

  /* ------------------------------------------------------------
   * 3. Festival hero slide — goes first; the usual slides follow
   * ---------------------------------------------------------- */
  var track = document.getElementById("heroTrack");
  var dotsBox = document.getElementById("heroDots");
  if (track) {
    var slide = document.createElement("div");
    slide.className = "hero-slide fest-slide is-active";
    slide.setAttribute("aria-roledescription", "slide");
    slide.innerHTML =
      '<div class="container hero-inner">' +
        '<div class="hero-copy">' +
          '<p class="eyebrow">' + words.eyebrow + "</p>" +
          "<h2>" + words.title + "</h2>" +
          '<p class="hero-sub">' + words.sub + "</p>" +
          '<div class="hero-actions">' +
            '<a href="#" class="btn btn-wa whatsapp-link" data-msg="order"><svg class="btn-icon"><use href="#i-wa"/></svg>' + words.button + "</a>" +
            '<a href="#bestsellers" class="btn btn-dark">See Favourites</a>' +
          "</div>" +
        "</div>" +
        '<div class="hero-visual">' +
          '<span class="hero-photo fest-art" role="img" aria-label="' + words.eyebrow + ' illustration">' +
            '<svg viewBox="0 0 400 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + ART[name]() + "</svg>" +
          "</span>" +
        "</div>" +
      "</div>";

    var first = track.querySelector(".hero-slide");
    if (first) first.classList.remove("is-active");
    track.insertBefore(slide, first);

    var all = track.querySelectorAll(".hero-slide");
    for (var i = 0; i < all.length; i++) all[i].setAttribute("aria-label", (i + 1) + " of " + all.length);

    if (dotsBox) {
      var btn = document.createElement("button");
      btn.type = "button";
      dotsBox.insertBefore(btn, dotsBox.firstChild);
      var dots = dotsBox.querySelectorAll("button");
      for (var d = 0; d < dots.length; d++) dots[d].setAttribute("aria-label", "Slide " + (d + 1));
    }
  }

  /* ------------------------------------------------------------
   * 4. Festive section titles and footer words
   * ---------------------------------------------------------- */
  root.style.setProperty("--fest-icon", '"' + words.icon + '"');
  document.querySelectorAll(".section-title, .footer-cta h3, .footer-cta .eyebrow").forEach(function (node) {
    var text = node.textContent.trim();
    if (words.titles[text]) node.textContent = words.titles[text];
  });

  /* ------------------------------------------------------------
   * 5. Footer art (Ramzan keeps the moon and adds a lantern)
   * ---------------------------------------------------------- */
  var sky = document.querySelector(".footer-sky");
  if (sky && MINI[name]) {
    var art = document.createElement("span");
    art.className = "fest-footer-art";
    art.innerHTML = MINI[name];
    sky.appendChild(art);
  }

  /* ------------------------------------------------------------
   * 6. Gentle festive motion in the hero (snow, confetti, kites,
   *    sparks or stars). Off when the visitor prefers less motion.
   * ---------------------------------------------------------- */
  var hero = document.getElementById("home");
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (hero && !calm) {
    var CHARS = { snow: "❄", confetti: "", kites: "🪁", sparks: "", stars: "✦" };
    var COUNT = { snow: 16, confetti: 18, kites: 5, sparks: 16, stars: 14 };
    var layer = document.createElement("div");
    layer.className = "fest-motion fest-" + words.motion;
    layer.setAttribute("aria-hidden", "true");
    for (var p = 0; p < COUNT[words.motion]; p++) {
      var bit = document.createElement("span");
      bit.textContent = CHARS[words.motion];
      bit.style.left = ((p * 37) % 100) + "%";
      bit.style.top = words.motion === "stars" ? ((p * 53) % 90) + "%" : "";
      bit.style.animationDelay = (-(p * 1.7) % 14).toFixed(1) + "s";
      bit.style.animationDuration = (11 + (p % 5) * 2) + "s";
      bit.style.fontSize = (0.7 + (p % 4) * 0.25) + "rem";
      layer.appendChild(bit);
    }
    hero.insertBefore(layer, hero.firstChild);
  }
})();
