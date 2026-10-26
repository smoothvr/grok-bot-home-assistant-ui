// SPDX-License-Identifier: MIT
// Optional config.local.json next to index.html. A missing file is ignored.
// Fetch first. XMLHttpRequest covers a browser without fetch.

export function ladeSiteConfig(timeoutMs = 2500) {
  return new Promise((resolve) => {
    let fertig = false;
    const ende = (wert) => {
      if (fertig) return;
      fertig = true;
      resolve(wert && typeof wert === 'object' ? wert : null);
    };
    const timer = setTimeout(() => ende(null), timeoutMs);
    const ausText = (text, status) => {
      clearTimeout(timer);
      if (status !== 200 || !text) { ende(null); return; }
      try { ende(JSON.parse(text)); }
      catch { ende(null); }
    };
    const xhr = () => {
      try {
        const req = new XMLHttpRequest();
        req.open('GET', 'config.local.json', true);
        req.onload = () => ausText(req.status === 200 ? req.responseText : '', req.status);
        req.onerror = () => { clearTimeout(timer); ende(null); };
        req.send();
      } catch { clearTimeout(timer); ende(null); }
    };
    if (typeof fetch === 'function') {
      try {
        fetch('config.local.json', { cache: 'no-store' }).then((res) => {
          if (!res.ok) { clearTimeout(timer); ende(null); return null; }
          return res.text();
        }).then((text) => {
          if (typeof text === 'string') ausText(text, 200);
        }).catch(() => xhr());
      } catch { xhr(); }
      return;
    }
    xhr();
  });
}
