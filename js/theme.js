/* ============================================
   Moon's Kitchen — random colour theme
   Loaded in <head> (before the page paints) so there is no flash
   of the wrong colours. Picks a random theme on every load, never
   the same one twice in a row. Themes are defined in css/style.css.
   Force a theme with ?theme=caramel|rose|sage|lavender|peach
   ============================================ */
(function () {
  "use strict";

  var THEMES = ["caramel", "rose", "sage", "lavender", "peach"];
  var KEY = "mk_last_theme";

  var forced = (location.search.match(/[?&]theme=([a-z]+)/) || [])[1];
  var theme = THEMES.indexOf(forced) !== -1 ? forced : null;

  if (!theme) {
    var last = null;
    try { last = localStorage.getItem(KEY); } catch (e) {}
    var choices = THEMES.filter(function (t) { return t !== last; });
    theme = choices[Math.floor(Math.random() * choices.length)];
  }

  try { localStorage.setItem(KEY, theme); } catch (e) {}
  document.documentElement.setAttribute("data-theme", theme);
})();
