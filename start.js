// Strona startowa: panel „Wygląd i dostępność” i ptak, który wodzi okiem za kursorem.
// Wczytywanie i zapisywanie ustawień jest w settings-init.js (window.PizuSettings).

// Panel „Wygląd i dostępność”: zmiany działają od razu i są zapisywane.
(function () {
  var Settings = window.PizuSettings;
  var dialog = document.querySelector("dialog.settings");
  var opener = document.querySelector(".settings-open");
  if (!Settings || !dialog || !opener || typeof dialog.showModal !== "function") {
    if (opener) opener.hidden = true; // bez <dialog> (bardzo stare przeglądarki) panel nie zadziała
    return;
  }

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

  opener.addEventListener("click", function () {
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
