// Ustawienia wyglądu i dostępności — wczytywane przed pierwszym malowaniem (bez mignięcia
// jasnego motywu). Zwykły, blokujący skrypt w <head>; panel z przełącznikami jest w start.js.
// Te same opcje co w narzędziach Pizu: motyw, kontrast, wielkość tekstu, animacje.
(function () {
  var KEY = "pizu-settings";
  var DEFAULTS = { theme: "auto", contrast: "normal", textScale: 100, motion: "system" };

  function load() {
    var s = {};
    try {
      s = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (e) {
      // pamięć zablokowana albo uszkodzony wpis: domyślne ustawienia
    }
    return {
      theme: s.theme === "light" || s.theme === "dark" ? s.theme : DEFAULTS.theme,
      contrast: s.contrast === "high" ? "high" : DEFAULTS.contrast,
      textScale: [115, 130, 150].indexOf(s.textScale) >= 0 ? s.textScale : DEFAULTS.textScale,
      motion: s.motion === "reduced" || s.motion === "full" ? s.motion : DEFAULTS.motion,
    };
  }

  function save(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {
      // bez zapisu: ustawienia działają do zamknięcia karty
    }
  }

  function setAttr(root, name, value) {
    if (value) root.setAttribute("data-" + name, value);
    else root.removeAttribute("data-" + name);
  }

  // Wartości domyślne nie zostawiają atrybutów — wtedy o motywie i animacjach decyduje system.
  function apply(s) {
    var root = document.documentElement;
    setAttr(root, "theme", s.theme === "auto" ? null : s.theme);
    setAttr(root, "contrast", s.contrast === "high" ? "high" : null);
    setAttr(root, "text", s.textScale === 100 ? null : String(s.textScale));
    setAttr(root, "motion", s.motion === "system" ? null : s.motion);
  }

  // Czy ruchome efekty mają działać: wybór użytkownika, a przy „Jak w systemie” — ustawienie systemu.
  function motionAllowed(s) {
    if (s.motion === "full") return true;
    if (s.motion === "reduced") return false;
    return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  apply(load());
  window.PizuSettings = { DEFAULTS: DEFAULTS, load: load, save: save, apply: apply, motionAllowed: motionAllowed };
})();
