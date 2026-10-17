// Ptak na stronie startowej wodzi okiem za kursorem.
// Pomijane, gdy użytkownik wyłączył animacje w systemie.
(function () {
  var eye = document.querySelector(".mascot .eye");
  if (!eye || !window.matchMedia) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
