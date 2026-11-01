// SPDX-License-Identifier: MIT
// HTML5 application cache for /local/eye-ui/. Paths stay relative to the manifest.
import fs from 'fs';

const versionFile = fs.readFileSync(new URL('../web/version.js', import.meta.url), 'utf8');
const versionMatch = versionFile.match(/export const VERSION = '([^']+)'/);
if (!versionMatch) throw new Error('web/version.js has no VERSION');
const version = versionMatch[1];

export const APPCACHE_DATEIEN = [
  'index.html',
  'settings.html',
  'manifest.webmanifest',
  'app.js',
  'settings.js',
  'settings-legacy.js',
  'legacy.js',
  'engine.js',
  'augen.js',
  'zustaende.js',
  'led.js',
  'zwei_d.js',
  'namen.js',
  'ha.js',
  'konfig.js',
  'audio.js',
  'schlaf.js',
  'befehle.js',
  'renderer.js',
  'gesten.js',
  'aktionen.js',
  'nowplaying.js',
  'strings.js',
  'polyfills.js',
  'zeiger.js',
  'power.js',
  'demotrack.js',
  'demo.js',
  'hilfe.js',
  'lock.js',
  'version.js',
  'dashboard.js',
  'ansichten.js',
  'licht.js',
  'dimmen.js',
  'siteconfig.js',
  'wache.js',
  'hinweis.js',
  'empfang.js',
  'blick.js',
  'wahl.js',
  'reaktionen.js',
  'stimme.js',
  'laden.js',
  'sw.js',
  'onsets.json',
  'config.example.json',
  'icons/favicon-32.png',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'assets/brand/hvuz-logo.jpg',
  'assets/brand/NOTICE.md',
  'sounds/01_hallo.wav',
  'sounds/02_zuhoeren.wav',
  'sounds/03_verstanden.wav',
  'sounds/04_erledigt_danke.wav',
  'sounds/05_lachen.wav',
  'sounds/06_nicht_verstanden.wav',
  'sounds/07_nachdenken.wav',
  'sounds/08_schlafen.wav',
  'sounds/09_fehler.wav',
  'sounds/10_musik_an.wav',
  'sounds/11_licht_an.wav',
  'sounds/12_licht_aus.wav',
  'sounds/13_kitzel.wav',
  'sounds/14_angry.wav',
  'sounds/15_hmmm_a.wav',
  'sounds/16_hmmm_b.wav',
  'sounds/17_hmmm_c.wav',
  'sounds/18_hmmm_d.wav',
  'sounds/19_hinweis.wav',
];

export function appcacheText(ver) {
  const kopf = ['CACHE MANIFEST', `# version ${ver}`, '', 'CACHE:'];
  return `${kopf.concat(APPCACHE_DATEIEN).concat(['', 'NETWORK:', '*', '']).join('\n')}`;
}

const ziel = new URL('../web/eye-ui.appcache', import.meta.url);
fs.writeFileSync(ziel, appcacheText(version));
