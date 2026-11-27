/* ============================================
   Moon's Kitchen — colour theme
   Loaded in <head> (before the page paints) so there is no flash
   of the wrong colours. Themes are defined in css/style.css.

   A random theme from THEMES is picked on every reload and on every
   new visit, never the same one twice in a row. Moving between pages
   in the same visit (home → Order page) keeps the same colours. If the
   browser blocks storage, DEFAULT_THEME is used.

   On festival dates (FESTIVALS below) the festival theme is used
   instead of a random one, and the top banner shows its wishes.

   Previews:
     ?theme=caramel|rose|sage|lavender|peach   one everyday theme
     ?theme=christmas|newyear|sankranti|diwali|ramzan   a festival + wishes
     ?date=2027-10-29   pretend today is that date (checks the dates table)
     ?design=new        the new design
   ============================================ */
(function () {
  "use strict";

  var THEMES = ["caramel", "rose", "sage", "lavender", "peach"];
  var DEFAULT_THEME = "caramel";
  var LAST_KEY = "mk_theme";        // localStorage: last theme shown, remembered between visits
  var VISIT_KEY = "mk_theme_visit"; // sessionStorage: theme for this visit (this tab)

  function store(kind) {
    try { return window[kind]; } catch (e) { return null; }
  }

  function isReload() {
    try {
      var nav = performance.getEntriesByType("navigation")[0];
      if (nav) return nav.type === "reload";
      return performance.navigation && performance.navigation.type === 1;
    } catch (e) { return false; }
  }

  function randomTheme() {
    var local = store("localStorage");
    var session = store("sessionStorage");
    try {
      var current = session && session.getItem(VISIT_KEY);
      // Same visit, new page: keep the colours steady
      if (current && THEMES.indexOf(current) !== -1 && !isReload()) return current;

      // Random pick, skipping the theme shown last time
      var last = local && local.getItem(LAST_KEY);
      var choices = THEMES.filter(function (t) { return t !== last; });
      var next = choices[Math.floor(Math.random() * choices.length)];
      if (local) local.setItem(LAST_KEY, next);
      if (session) session.setItem(VISIT_KEY, next);
      return next;
    } catch (e) {
      return DEFAULT_THEME; // storage blocked (private mode): stay on the default
    }
  }

  /* ------------------------------------------------------------
   * Festivals — safe to edit. Each date range is [from, to], both
   * days included. "MM-DD" repeats every year; "YYYY-MM-DD" is for
   * one year only (Diwali and Ramzan move every year, so add the
   * next years' dates here when they are announced). The first
   * festival that matches today wins.
   * ---------------------------------------------------------- */
  var FESTIVALS = [
    {
      theme: "newyear",
      wish: "✨ Happy New Year from Moon's Kitchen · Wishing you a sweet year ahead",
      dates: [["12-30", "12-31"], ["01-01", "01-02"]]
    },
    {
      theme: "christmas",
      wish: "🎄 Merry Christmas from Moon's Kitchen · Order your Christmas bakes on WhatsApp",
      dates: [["12-20", "12-26"]]
    },
    {
      theme: "sankranti",
      wish: "🪁 Happy Sankranti & Pongal · Festive bakes, baked fresh to order",
      dates: [["01-12", "01-16"]] // Bhogi to Kanuma
    },
    {
      theme: "diwali",
      wish: "🪔 Happy Diwali from Moon's Kitchen · Sweet treats, baked fresh to order",
      // About four days before Lakshmi Puja to one day after
      dates: [
        ["2027-10-25", "2027-10-30"], // Lakshmi Puja 29 Oct 2027
        ["2028-10-13", "2028-10-18"], // 17 Oct 2028
        ["2029-11-01", "2029-11-06"], // 5 Nov 2029
        ["2030-10-22", "2030-10-27"]  // 25/26 Oct 2030
      ]
    },
    {
      theme: "ramzan",
      wish: "🌙 Ramzan Mubarak & Eid Mubarak from Moon's Kitchen · Baked fresh to order",
      // The month of Ramzan to the day after Eid. Moon sighting can move
      // these by a day; 2029 and 2030 are early estimates.
      dates: [
        ["2027-02-09", "2027-03-11"], // Eid about 10 Mar 2027
        ["2028-01-28", "2028-02-28"], // Eid about 27 Feb 2028
        ["2029-01-17", "2029-02-16"], // estimate
        ["2030-01-06", "2030-02-06"]  // estimate
      ]
    }
  ];

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // Today as YYYY-MM-DD in the visitor's time zone (or ?date= for previews)
  function today() {
    var asked = (location.search.match(/[?&]date=(\d{4}-\d{2}-\d{2})/) || [])[1];
    if (asked) return asked;
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function festivalOn(day) {
    var md = day.slice(5);
    for (var i = 0; i < FESTIVALS.length; i++) {
      var ranges = FESTIVALS[i].dates;
      for (var j = 0; j < ranges.length; j++) {
        var from = ranges[j][0], to = ranges[j][1];
        var value = from.length === 5 ? md : day;
        if (value >= from && value <= to) return FESTIVALS[i];
      }
    }
    return null;
  }

  function festivalByTheme(name) {
    for (var i = 0; i < FESTIVALS.length; i++) {
      if (FESTIVALS[i].theme === name) return FESTIVALS[i];
    }
    return null;
  }

  var forced = (location.search.match(/[?&]theme=([a-z]+)/) || [])[1];
  var day = today();
  var festival = forced ? festivalByTheme(forced) : festivalOn(day);
  // js/festival.js reads this to draw the festival look
  window.MK_FESTIVAL = festival ? { theme: festival.theme, date: day } : null;
  var theme = festival ? festival.theme
    : THEMES.indexOf(forced) !== -1 ? forced
    : randomTheme();

  document.documentElement.setAttribute("data-theme", theme);

  // Festival wishes replace the top banner text once the page is ready
  if (festival) {
    document.documentElement.setAttribute("data-festival", festival.theme);
    document.addEventListener("DOMContentLoaded", function () {
      var notice = document.querySelector(".notice");
      if (notice) notice.textContent = festival.wish;
    });
  }

  // New design preview: css/new-design.css is only loaded when asked for
  if (/[?&]design=new(&|$)/.test(location.search)) {
    document.documentElement.setAttribute("data-design", "new");
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "css/new-design.css";
    document.head.appendChild(link);
  }
})();
