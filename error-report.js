(() => {
  const endpoint = 'https://o4512300568477696.ingest.de.sentry.io/api/4512408400953424/envelope/?sentry_version=7&sentry_key=3813ca483f42427273465f4d26cb2084&sentry_client=pizu-pl%2F1';
  function scrubFileNames(text) {
    const ext = '(?:pdf|docx?|odt|rtf|txt|xml|jpe?g|png|gif|webp|avif|heic|heif|tiff?|bmp|svg|mp3|wav|flac|ogg|m4a|aac|mp4|zip)';
    for (const [a, b] of [['"', '"'], ["'", "'"], ['„', '”'], ['“', '”'], ['«', '»']])
      text = text.replace(new RegExp(a + '[^' + a + b + '\\r\\n]+\\.' + ext + b, 'gi'), '[plik]');
    return text.replace(new RegExp('[^\\s"\'„”“«»<>]+\\.' + ext + '(?![\\w.-])', 'gi'), '[plik]');
  }
  function ownFrame(frame) {
    return /^https:\/\/pizu\.pl\/(?:[^/]+\.m?js|poradniki\/(?:[^/]+\/)*[^/]+\.m?js)$/.test(frame.filename);
  }
  function parseStack(stack) {
    return String(stack || '').split('\n').flatMap(line => {
      const m = line.match(/^\s*(?:at\s+(?:(.*?)\s+\()?|([^@]*)@)(https:\/\/[^\s)]+):(\d+):(\d+)\)?\s*$/);
      return m ? [{ filename: m[3].split(/[?#]/)[0], function: m[1] || m[2] || '?', lineno: +m[4], colno: +m[5], in_app: true }] : [];
    }).filter(ownFrame).reverse();
  }
  function envelope(error, frames, mechanism, url, id, now) {
    return [{ event_id: id, sent_at: now.toISOString() }, { type: 'event' }, {
      event_id: id, timestamp: now.getTime() / 1000, platform: 'javascript', level: 'error', environment: 'production',
      request: { url }, exception: { values: [{ type: error.name || 'Error', value: scrubFileNames(String(error.message || '')).slice(0, 500),
        stacktrace: { frames }, mechanism: { type: mechanism, handled: false } }] }
    }].map(item => JSON.stringify(item)).join('\n');
  }
  const seen = new Set();
  function report(error, mechanism) {
    try {
      if (location.protocol !== 'https:' || location.hostname !== 'pizu.pl' || !error || seen.size >= 5) return;
      const message = String(error.message || '');
      if (message === 'Script error.' || seen.has(message)) return;
      const frames = parseStack(error.stack);
      if (!frames.length) return;
      const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
      const body = envelope(error, frames, mechanism, location.origin + location.pathname, id, new Date());
      seen.add(message);
      fetch(endpoint, { method: 'POST', body, keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }).catch(() => {});
    } catch {} // Raportowanie nigdy nie może wywołać kolejnego błędu strony.
  }
  window.addEventListener('error', e => report(e.error, 'onerror'));
  window.addEventListener('unhandledrejection', e => report(e.reason, 'onunhandledrejection'));
})();
