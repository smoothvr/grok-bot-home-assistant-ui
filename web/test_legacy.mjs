// SPDX-License-Identifier: MIT
// The committed classic bundle has to parse as ES2015. Safari 10.1 ignores nomodule.
import fs from 'fs';
import { webcrypto } from 'crypto';
import * as acorn from 'acorn';
import { istAltgeraet } from './power.js';
import { sha256Hex } from './lock.js';
import { VERSION } from './version.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

const legacyUrl = new URL('./legacy.js', import.meta.url);
let legacy = '';
try {
  legacy = fs.readFileSync(legacyUrl, 'utf8');
} catch {
  console.error('FAIL: web/legacy.js is missing. Run npm run build.');
  process.exit(1);
}
assert(legacy.length > 1000, 'legacy bundle is empty');
try {
  acorn.parse(legacy, { ecmaVersion: 2015, sourceType: 'script' });
} catch (err) {
  console.error('FAIL: web/legacy.js is not ES2015:', err.message);
  process.exit(1);
}

const seite = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert(!/\bnomodule\b/.test(seite), 'the loader must not use nomodule');
assert(seite.includes("script.src = 'legacy.js'") && seite.includes("script.src = 'app.js'"), 'loader chooses legacy.js or app.js');
assert(!/\binset\s*:/.test(seite), 'no inset shorthand');
const inline = seite.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/);
assert(inline, 'inline loader');
if (inline) {
  try {
    acorn.parse(inline[1], { ecmaVersion: 5, sourceType: 'script' });
  } catch (err) {
    assert(false, `loader is not ES5: ${err.message}`);
  }
}

const ipad = 'Mozilla/5.0 (iPad; CPU OS 10_3_3 like Mac OS X) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.0 Mobile/14G60 Safari/602.1';
assert(istAltgeraet({ nav: { userAgent: ipad }, win: {} }), 'iPad OS 10 is low power');
assert(istAltgeraet({ nav: { userAgent: 'Mozilla/5.0', deviceMemory: 1 }, win: { PointerEvent() {} } }), '1 GB is low power');
assert(!istAltgeraet({
  nav: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', deviceMemory: 8 },
  win: { PointerEvent() {} },
}), 'a current desktop stays full power');

const bytes = new TextEncoder().encode('eye-ui-lock:abc:secret');
const digest = new Uint8Array(await webcrypto.subtle.digest('SHA-256', bytes));
const expected = [...digest].map((b) => b.toString(16).padStart(2, '0')).join('');
assert(sha256Hex(bytes) === expected, 'sha256 fallback matches subtle');

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
assert(pkg.version === VERSION, 'package version matches the page');
const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');
assert(/iOS 10\.3/.test(readme), 'README names the minimum iOS');
assert(readme.includes('Voice is not part of this release'), 'README says voice is not in this release');
assert(readme.includes('iPad 4') && readme.includes('iOS 10.3.3'), 'eyes stay available from iPad 4');
const hilfe = fs.readFileSync(new URL('../docs/help.md', import.meta.url), 'utf8');
assert(hilfe.includes('Voice is not part of this release'), 'help says voice is not in this release');
assert(!/asking Grok|Hey Grok|script\.grok_hallo|script\.grok_spiel_musik/i.test(readme + hilfe), 'docs do not claim that asking Grok works');
const settingsLegacy = fs.readFileSync(new URL('./settings-legacy.js', import.meta.url), 'utf8');
try {
  acorn.parse(settingsLegacy, { ecmaVersion: 2015, sourceType: 'script' });
} catch (err) {
  assert(false, `settings-legacy.js is not ES2015: ${err.message}`);
}

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Legacy bundle parses as ES2015');
