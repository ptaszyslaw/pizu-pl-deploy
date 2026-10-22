/**
 * Pizu — wspólna belka i stopka wszystkich stron: pizu.pl, PizuAudio, PizuGrafika, PizuPDF.
 *
 * Jedno źródło: ten plik i pizu-shell.css w katalogu shell/ projektu pizu-pl.
 * scripts/sync-shell.mjs kopiuje je do każdej strony — tam ich nie edytuj.
 * Bez frameworka i zależności: działa w statycznym HTML i w React (zwykłe elementy HTML).
 *
 *   <pizu-header site="pdf" tool="scal-pdf" settings></pizu-header>
 *     site      home | audio | grafika | pdf — wyróżnia bieżącą kategorię
 *     tool      adres bieżącego narzędzia (np. „scal-pdf”) — wyróżnia je w menu
 *     settings  pokazuje przycisk „Wygląd”; kliknięcie wysyła zdarzenie „pizu-settings”
 *     busy      adresy narzędzi, które właśnie pracują (oddzielone spacją) — kręciołek przy nich
 *
 *     Kliknięcie narzędzia tej samej strony (site) wysyła zdarzenie „pizu-navigate” (detail.slug,
 *     "" = strona główna narzędzia). Gdy strona wywoła na nim preventDefault(), sama przełącza
 *     narzędzie bez przeładowania (praca w otwartych narzędziach zostaje); inaczej link działa zwykle.
 *
 *   <pizu-footer product="PizuPDF" version="1.7.1"></pizu-footer>
 *     „Prywatność”, „Licencje” i numer wersji wysyłają zdarzenie „pizu-about”
 *     z detail.tab = "privacy" | "licenses" | "version" — strona otwiera swoje okno informacji.
 *
 * Zdarzenia mają bubbles, więc wystarczy nasłuchiwać na document.
 */
(function () {
  if (window.customElements === undefined || customElements.get('pizu-header')) return

  // Narzędzia w menu. Adresy (slug) to osobne strony narzędzi, np. https://pdf.pizu.pl/scal-pdf/.
  var GROUPS = [
    {
      id: 'audio',
      label: 'Audio',
      about: 'Dźwięk i muzyka',
      home: 'https://audio.pizu.pl/',
      tools: [
        { slug: 'oddziel-wokal', name: 'Oddziel wokal', desc: 'Wokal i podkład, tonacja, tempo, karaoke' },
        { slug: 'przytnij-mp3', name: 'Przytnij i konwertuj', desc: 'Wytnij fragment, zapisz jako MP3 lub WAV' },
      ],
    },
    {
      id: 'grafika',
      label: 'Grafika',
      about: 'Zdjęcia i grafika',
      home: 'https://grafika.pizu.pl/',
      tools: [
        { slug: 'konwertuj-zdjecia', name: 'Konwertuj i kompresuj', desc: 'JPG, PNG, WebP, AVIF, HEIC — mniejsze pliki' },
        { slug: 'kadruj-zdjecie', name: 'Kadruj i zmień rozmiar', desc: 'Proporcje, gotowe rozmiary, zdjęcie do dowodu' },
        { slug: 'zaslon-i-znak-wodny', name: 'Zasłoń i dodaj znak wodny', desc: 'Twarze, tablice rejestracyjne, dane osobowe' },
        { slug: 'kod-qr', name: 'Utwórz kod QR', desc: 'Strona, Wi-Fi, kontakt, przelew — PNG lub SVG' },
      ],
    },
    {
      id: 'pdf',
      label: 'PDF',
      about: 'Dokumenty PDF',
      home: 'https://pdf.pizu.pl/',
      wide: true,
      tools: [
        { slug: 'scal-pdf', name: 'Scal PDF', desc: 'Kilka plików w jeden dokument' },
        { slug: 'podziel-pdf', name: 'Podziel PDF', desc: 'Pojedyncze strony lub zakresy' },
        { slug: 'kompresuj-pdf', name: 'Kompresuj PDF', desc: 'Mniejszy plik, ta sama treść' },
        { slug: 'pdf-na-word', name: 'PDF do Word', desc: 'Także skany, z rozpoznawaniem tekstu' },
        { slug: 'word-na-pdf', name: 'Tekst z Worda do PDF', desc: 'Sam tekst z DOCX, bez układu' },
        { slug: 'pdf-na-obraz', name: 'PDF na obraz', desc: 'Strony jako PNG lub JPG' },
        { slug: 'obraz-na-pdf', name: 'Obraz na PDF', desc: 'Zdjęcia i skany w jednym PDF' },
        { slug: 'faktura-xml-na-pdf', name: 'Faktura XML na PDF', desc: 'Czytelny PDF z e-faktury (KSeF)' },
        { slug: 'podpisz-pdf', name: 'Podpisz PDF', desc: 'Podpis odręczny lub inicjały' },
        { slug: 'edytuj-pdf', name: 'Edytuj PDF', desc: 'Tekst i adnotacje' },
        { slug: 'zamaz-dane-w-pdf', name: 'Zamaż dane', desc: 'Trwale, bez możliwości odzyskania' },
      ],
    },
  ]

  var SUPPORT_URL = 'https://suppi.pl/pizu'
  var CONTACT = 'kontakt@pizu.pl'

  var BIRD =
    '<svg class="pz-mark" viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
    '<circle cx="100" cy="100" r="96" class="pz-c-brand"/>' +
    '<g transform="translate(34 40) scale(0.66)">' +
    '<ellipse cx="95" cy="105" rx="55" ry="50" class="pz-c-white"/>' +
    '<circle cx="105" cy="60" r="45" class="pz-c-white"/>' +
    '<path d="M142 48 L180 66 L140 88 C147 74 147 60 142 48 Z" class="pz-c-beak"/>' +
    '<circle cx="120" cy="55" r="9" class="pz-c-ink"/>' +
    '<path d="M20 140 C36 92 88 74 128 90 C138 102 134 118 120 130 C88 148 44 150 20 140 Z" class="pz-c-wing"/>' +
    '</g></svg>'
  var CHEVRON = '<svg class="pz-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>'
  var SLIDERS =
    '<svg class="pz-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/></svg>'
  var BURGER = '<svg class="pz-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  var SPINNER =
    '<svg class="pz-spinner" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3a9 9 0 1 0 9 9"/></svg>'
  var BUSY_TEXT = '<span class="pz-visually-hidden"> (trwa przetwarzanie)</span>'
  var NEW_TAB = '<span class="pz-visually-hidden"> (otwiera się w nowej karcie)</span>'

  function toolUrl(group, tool) {
    return group.home + tool.slug + '/'
  }

  function product(group) {
    return 'Pizu<span class="pz-product-name">' + group.label + '</span>'
  }

  function toolLink(group, tool, current, withDesc, busy) {
    var working = busy.indexOf(tool.slug) >= 0
    return (
      '<li><a class="pz-tool" href="' + toolUrl(group, tool) + '" data-pz-site="' + group.id + '" data-pz-slug="' + tool.slug + '"' +
      (current === tool.slug ? ' aria-current="page"' : '') + '>' +
      '<span class="pz-tool-name">' + tool.name + (working ? SPINNER + BUSY_TEXT : '') + '</span>' +
      (withDesc ? '<span class="pz-tool-desc">' + tool.desc + '</span>' : '') +
      '</a></li>'
    )
  }

  function renderHeader(site, tool, settings, busy) {
    var nav = GROUPS.map(function (g) {
      var here = site === g.id
      var working = g.tools.some(function (t) { return busy.indexOf(t.slug) >= 0 })
      return (
        '<li class="pz-nav-item">' +
        '<button type="button" class="pz-nav-btn' + (here ? ' is-current' : '') + '" aria-expanded="false" aria-controls="pz-menu-' + g.id + '">' +
        g.label + (here ? '<span class="pz-visually-hidden"> (tu jesteś)</span>' : '') + (working ? SPINNER + BUSY_TEXT : '') + CHEVRON +
        '</button>' +
        '<div class="pz-panel' + (g.wide ? ' pz-panel-wide' : '') + '" id="pz-menu-' + g.id + '" hidden>' +
        '<div class="pz-panel-head"><a class="pz-product" href="' + g.home + '" data-pz-site="' + g.id + '" data-pz-slug=""' + (here && !tool ? ' aria-current="page"' : '') + '>' + product(g) + '</a>' +
        '<span class="pz-panel-about">' + g.about + '</span></div>' +
        '<ul class="pz-panel-list">' + g.tools.map(function (t) { return toolLink(g, t, here ? tool : null, true, busy) }).join('') + '</ul>' +
        '</div></li>'
      )
    }).join('')

    var mobile = GROUPS.map(function (g) {
      var here = site === g.id
      return (
        '<div class="pz-mobile-group">' +
        '<p class="pz-mobile-title"><a class="pz-product" href="' + g.home + '" data-pz-site="' + g.id + '" data-pz-slug="">' + product(g) + '</a> <span class="pz-panel-about">' + g.about + '</span></p>' +
        '<ul class="pz-mobile-list">' + g.tools.map(function (t) { return toolLink(g, t, here ? tool : null, false, busy) }).join('') + '</ul>' +
        '</div>'
      )
    }).join('')

    return (
      '<div class="pz-bar">' +
      '<a class="pz-logo" href="https://pizu.pl/"' + (site === 'home' ? ' aria-current="page"' : '') + '>' + BIRD +
      '<span class="pz-logo-name">Pizu</span><span class="pz-visually-hidden"> — wszystkie narzędzia</span></a>' +
      '<nav class="pz-nav" aria-label="Narzędzia Pizu"><ul class="pz-nav-list">' + nav + '</ul></nav>' +
      '<div class="pz-actions">' +
      (settings
        ? '<button type="button" class="pz-btn pz-settings" aria-haspopup="dialog" aria-label="Wygląd i dostępność">' + SLIDERS + '<span class="pz-btn-text">Wygląd</span></button>'
        : '') +
      '<button type="button" class="pz-btn pz-menu-btn" aria-expanded="false" aria-controls="pz-mobile">' + BURGER + '<span class="pz-btn-text">Menu</span></button>' +
      '</div></div>' +
      '<nav class="pz-mobile" id="pz-mobile" aria-label="Narzędzia Pizu" hidden>' + mobile + '</nav>'
    )
  }

  class PizuHeader extends HTMLElement {
    static get observedAttributes() {
      return ['site', 'tool', 'settings', 'busy']
    }

    connectedCallback() {
      this.render()
      this._onDocClick = this.onDocClick.bind(this)
      document.addEventListener('click', this._onDocClick)
      if (!this._wired) {
        this._wired = true
        this.addEventListener('click', this.onClick.bind(this))
        this.addEventListener('keydown', this.onKeydown.bind(this))
        this.addEventListener('focusout', this.onFocusOut.bind(this))
      }
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._onDocClick)
    }

    attributeChangedCallback() {
      if (this.isConnected && this._rendered) this.render()
    }

    render() {
      this._rendered = true
      var busy = (this.getAttribute('busy') || '').split(/\s+/).filter(Boolean)
      // ponowne rysowanie (np. zmiana „busy”) nie może zamknąć otwartego menu ani zgubić fokusu
      var open = this.querySelector('[aria-expanded="true"]')
      var openId = open && open.getAttribute('aria-controls')
      var focused = document.activeElement
      var focusedId = focused && this.contains(focused) && focused.getAttribute('aria-controls')
      this.innerHTML = renderHeader(this.getAttribute('site') || '', this.getAttribute('tool') || '', this.hasAttribute('settings'), busy)
      if (openId) {
        var button = this.querySelector('[aria-controls="' + openId + '"]')
        if (button) this.toggle(button, true)
      }
      if (focusedId) {
        var focus = this.querySelector('[aria-controls="' + focusedId + '"]')
        if (focus) focus.focus()
      }
    }

    // otwarty panel (rozwijana kategoria albo menu na telefonie) i jego przycisk
    toggle(button, open) {
      var panel = document.getElementById(button.getAttribute('aria-controls'))
      if (!panel) return
      button.setAttribute('aria-expanded', open ? 'true' : 'false')
      panel.hidden = !open
      if (open && panel.classList.contains('pz-panel')) this.keepInView(panel)
    }

    // szeroki panel (PDF) przy dużym tekście lub wąskim oknie przesuwa się w lewo, zamiast wystawać
    // (style przez CSSOM — CSP stron nie blokuje go, w przeciwieństwie do atrybutu style)
    keepInView(panel) {
      panel.style.removeProperty('left')
      var margin = 12
      var rect = panel.getBoundingClientRect()
      var over = rect.right - (document.documentElement.clientWidth - margin)
      if (over > 0) panel.style.left = -Math.min(over, Math.max(0, rect.left - margin)) + 'px'
    }

    closeAll(except) {
      var buttons = this.querySelectorAll('[aria-expanded="true"]')
      for (var i = 0; i < buttons.length; i++) if (buttons[i] !== except) this.toggle(buttons[i], false)
    }

    onClick(e) {
      var button = e.target.closest('.pz-nav-btn, .pz-menu-btn')
      if (button) {
        var open = button.getAttribute('aria-expanded') !== 'true'
        this.closeAll(button)
        this.toggle(button, open)
        return
      }
      if (e.target.closest('.pz-settings')) {
        this.closeAll()
        this.dispatchEvent(new CustomEvent('pizu-settings', { bubbles: true }))
        return
      }
      var link = e.target.closest('a')
      if (!link) return
      var site = link.getAttribute('data-pz-site')
      // narzędzie tej samej strony: niech strona przełączy je sama (Ctrl / środkowy przycisk → nowa karta)
      if (site && site === this.getAttribute('site') && !(e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)) {
        var nav = new CustomEvent('pizu-navigate', { bubbles: true, cancelable: true, detail: { slug: link.getAttribute('data-pz-slug') || '' } })
        if (!this.dispatchEvent(nav)) e.preventDefault()
      }
      this.closeAll()
    }

    onDocClick(e) {
      if (!this.contains(e.target)) this.closeAll()
    }

    onKeydown(e) {
      if (e.key !== 'Escape') return
      var open = this.querySelector('[aria-expanded="true"]')
      if (!open) return
      e.preventDefault()
      this.toggle(open, false)
      open.focus()
    }

    // rozwijana kategoria zamyka się, gdy fokus wyjdzie poza nią (Tab dalej)
    onFocusOut(e) {
      var item = e.target.closest('.pz-nav-item')
      if (!item) return
      if (e.relatedTarget && item.contains(e.relatedTarget)) return
      var button = item.querySelector('.pz-nav-btn')
      if (button && button.getAttribute('aria-expanded') === 'true') this.toggle(button, false)
    }
  }

  function renderFooter(productName, version) {
    var sep = '<span class="pz-sep" aria-hidden="true">·</span>'
    var tools = GROUPS.map(function (g) {
      return '<a href="' + g.home + '">Pizu' + g.label + '</a>'
    }).join(sep)
    var meta = '© ' + new Date().getFullYear() + ' Pizu'
    if (productName && version) {
      meta += sep + '<button type="button" data-about="version">' + productName + ' v' + version + '</button>'
    }
    return (
      '<div class="pz-foot">' +
      '<nav class="pz-foot-row" aria-label="Pizu">' +
      '<a class="pz-foot-brand" href="https://pizu.pl/">' + BIRD + 'Pizu</a>' + sep + tools +
      '</nav>' +
      '<p class="pz-foot-row">' +
      '<button type="button" data-about="privacy" aria-haspopup="dialog">Prywatność</button>' + sep +
      '<button type="button" data-about="licenses" aria-haspopup="dialog">Licencje</button>' + sep +
      '<a href="' + SUPPORT_URL + '" target="_blank" rel="noopener">Wesprzyj Pizu' + NEW_TAB + '</a>' + sep +
      '<a href="mailto:' + CONTACT + '">' + CONTACT + '</a>' +
      '</p>' +
      '<p class="pz-foot-row pz-foot-meta">' + meta + '</p>' +
      '</div>'
    )
  }

  class PizuFooter extends HTMLElement {
    static get observedAttributes() {
      return ['product', 'version']
    }

    connectedCallback() {
      this.render()
      if (!this._wired) {
        this._wired = true
        this.addEventListener('click', function (e) {
          var button = e.target.closest('[data-about]')
          if (!button) return
          this.dispatchEvent(new CustomEvent('pizu-about', { bubbles: true, detail: { tab: button.getAttribute('data-about') } }))
        })
      }
    }

    attributeChangedCallback() {
      if (this.isConnected && this._rendered) this.render()
    }

    render() {
      this._rendered = true
      this.innerHTML = renderFooter(this.getAttribute('product'), this.getAttribute('version'))
    }
  }

  customElements.define('pizu-header', PizuHeader)
  customElements.define('pizu-footer', PizuFooter)
})()
