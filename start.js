// Strona startowa: panel „Wygląd i dostępność”, okno „O Pizu” i ptak, który wodzi okiem za kursorem.
// Wczytywanie i zapisywanie ustawień jest w settings-init.js (window.PizuSettings);
// belka i stopka to wspólny komponent pizu-shell.js (zdarzenia „pizu-settings” i „pizu-about”).

// Panel „Wygląd i dostępność”: zmiany działają od razu i są zapisywane.
(function () {
  var Settings = window.PizuSettings;
  var dialog = document.querySelector("dialog.settings");
  // bez <dialog> (bardzo stare przeglądarki) panel nie zadziała — przycisk w belce wtedy nic nie robi
  if (!Settings || !dialog || typeof dialog.showModal !== "function") return;

  var current = Settings.load();

  function syncInputs() {
    var inputs = dialog.querySelectorAll("input[type=radio]");
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].checked = String(current[inputs[i].name]) === inputs[i].value;
    }
  }

  function update(next) {
    current = next;
    Settings.apply(current);
    Settings.save(current);
    syncInputs();
  }

  // przycisk „Wygląd” w belce (pizu-shell.js)
  document.addEventListener("pizu-settings", function () {
    syncInputs();
    dialog.showModal();
  });

  dialog.addEventListener("change", function (e) {
    var input = e.target;
    if (input.type !== "radio") return;
    var next = Object.assign({}, current);
    next[input.name] = input.name === "textScale" ? Number(input.value) : input.value;
    update(next);
  });

  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close(); // kliknięcie w tło poza panelem
    else if (e.target.closest("[data-settings-close]")) dialog.close();
    else if (e.target.closest("[data-settings-reset]")) update(Object.assign({}, Settings.DEFAULTS));
  });
})();

// Okno „O Pizu”: zakładki Prywatność, Licencje, Kontakt. Otwierają je „Prywatność” i „Licencje”
// w stopce (zdarzenie „pizu-about” z pizu-shell.js) oraz przyciski data-about na stronie.
(function () {
  var dialog = document.querySelector("dialog.about");
  if (!dialog || typeof dialog.showModal !== "function") return;
  var tabs = Array.prototype.slice.call(dialog.querySelectorAll("[role=tab]"));

  function select(name, focus) {
    var found = false;
    tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-tab") === name;
      if (on) found = true;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) tab.focus();
    });
    if (!found) select("privacy", focus); // np. „version” — strona startowa nie ma numeru wersji
  }

  function open(name) {
    select(name || "privacy", false);
    if (!dialog.open) dialog.showModal();
  }

  document.addEventListener("pizu-about", function (e) {
    open(e.detail && e.detail.tab);
  });

  // przyciski na samej stronie (np. „Jak to działa”); stopka wysyła już zdarzenie sama
  document.addEventListener("click", function (e) {
    var button = e.target.closest("[data-about]");
    if (button && !button.closest("pizu-footer")) open(button.getAttribute("data-about"));
  });

  dialog.addEventListener("click", function (e) {
    if (e.target === dialog || e.target.closest("[data-dialog-close]")) dialog.close();
    var tab = e.target.closest("[role=tab]");
    if (tab) select(tab.getAttribute("data-tab"), true);
  });

  // strzałki, Home i End przełączają zakładki (wzorzec ARIA „tabs”)
  dialog.querySelector("[role=tablist]").addEventListener("keydown", function (e) {
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length].getAttribute("data-tab"), true);
  });
})();

// Ptak wodzi okiem za kursorem, gdy animacje są włączone (system albo panel „Wygląd”).
(function () {
  var eye = document.querySelector(".mascot .eye");
  if (!eye || !window.PizuSettings) return;

  var svg = eye.ownerSVGElement;
  // Środek oka w układzie viewBox 0 0 400 400: translate(62 80) scale(1.45) z punktu (120, 55).
  var EYE_X = 62 + 120 * 1.45;
  var EYE_Y = 80 + 55 * 1.45;
  var MAX = 4; // jednostki ptaka; źrenica ma promień 9
  var pending = false;
  var pointerX = 0;
  var pointerY = 0;

  function look() {
    pending = false;
    var motion = document.documentElement.getAttribute("data-motion") || "system";
    if (!window.PizuSettings.motionAllowed({ motion: motion })) {
      eye.removeAttribute("transform");
      return;
    }
    var box = svg.getBoundingClientRect();
    if (!box.width) return;
    var cx = box.left + (EYE_X / 400) * box.width;
    var cy = box.top + (EYE_Y / 400) * box.height;
    var dx = pointerX - cx;
    var dy = pointerY - cy;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var reach = Math.min(1, dist / 220);
    eye.setAttribute(
      "transform",
      "translate(" + ((dx / dist) * MAX * reach).toFixed(2) + " " + ((dy / dist) * MAX * reach).toFixed(2) + ")"
    );
  }

  window.addEventListener(
    "pointermove",
    function (e) {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!pending) {
        pending = true;
        window.requestAnimationFrame(look);
      }
    },
    { passive: true }
  );

  document.documentElement.addEventListener("pointerleave", function () {
    eye.removeAttribute("transform");
  });
})();
