// SPDX-License-Identifier: MIT
// Offline shell. Classic script: an already registered worker updates this URL as a classic script.
// npm run build writes VERSION from web/version.js. Do not add import or export here.
const VERSION = '2.2.1';
const CACHE = `grok-bot-home-ui-${VERSION}`;
const DATEIEN = [
  './',
  './index.html',
  './settings.html',
  './settings.js',
  './manifest.webmanifest',
  './app.js',
  './engine.js',
  './augen.js',
  './zustaende.js',
  './led.js',
  './zwei_d.js',
  './namen.js',
  './ha.js',
  './konfig.js',
  './audio.js',
  './schlaf.js',
  './befehle.js',
  './renderer.js',
  './gesten.js',
  './aktionen.js',
  './nowplaying.js',
  './strings.js',
  './polyfills.js',
  './zeiger.js',
  './power.js',
  './demotrack.js',
  './demo.js',
  './hilfe.js',
  './lock.js',
  './version.js',
  './dashboard.js',
  './ansichten.js',
  './licht.js',
  './dimmen.js',
  './siteconfig.js',
  './wache.js',
  './hinweis.js',
  './empfang.js',
  './blick.js',
  './wahl.js',
  './reaktionen.js',
  './stimme.js',
  './legacy.js',
  './settings-legacy.js',
  './onsets.json',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './assets/brand/hvuz-logo.jpg',
  './assets/brand/NOTICE.md',
  './sounds/01_hallo.wav',
  './sounds/02_zuhoeren.wav',
  './sounds/03_verstanden.wav',
  './sounds/04_erledigt_danke.wav',
  './sounds/05_lachen.wav',
  './sounds/06_nicht_verstanden.wav',
  './sounds/07_nachdenken.wav',
  './sounds/08_schlafen.wav',
  './sounds/09_fehler.wav',
  './sounds/10_musik_an.wav',
  './sounds/11_licht_an.wav',
  './sounds/12_licht_aus.wav',
  './sounds/13_kitzel.wav',
  './sounds/14_angry.wav',
  './sounds/15_hmmm_a.wav',
  './sounds/16_hmmm_b.wav',
  './sounds/17_hmmm_c.wav',
  './sounds/18_hmmm_d.wav',
  './sounds/19_hinweis.wav',
];

// The page, the version, and the scripts must come from the network when it is up.
function netzZuerst(url, navigation) {
  if (navigation) return true;
  const path = url.pathname;
  return /\.(js|mjs|css|html)$/.test(path) || path.endsWith('/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    for (let i = 0; i < DATEIEN.length; i++) {
      const url = DATEIEN[i];
      const antwort = await fetch(new Request(url, { cache: 'reload' }));
      if (!antwort || !antwort.ok) throw new Error(url);
      await cache.put(url, antwort);
    }
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  // Drop every older shell, including grok-bot-home-ui-v7 from before the versioned name.
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  const navigation = event.request.mode === 'navigate';
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (netzZuerst(url, navigation)) {
      try {
        const antwort = await fetch(event.request, { cache: 'no-cache' });
        if (antwort && antwort.ok) cache.put(navigation ? './index.html' : event.request, antwort.clone());
        return antwort;
      } catch (err) {
        const hit = await cache.match(event.request, { ignoreSearch: navigation });
        if (hit) return hit;
        if (navigation) {
          const start = await cache.match('./index.html');
          if (start) return start;
        }
        throw err;
      }
    }
    const hit = await cache.match(event.request);
    if (hit) return hit;
    const antwort = await fetch(event.request);
    if (antwort && antwort.ok) cache.put(event.request, antwort.clone());
    return antwort;
  })());
});
