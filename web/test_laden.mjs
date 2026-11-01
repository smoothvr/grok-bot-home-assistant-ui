// SPDX-License-Identifier: MIT
import fs from 'fs';
import {
  CACHE_UPDATE_MS, RELOAD_ENTITY, UPDATEREADY,
  cacheAktualisieren, cacheUebernehmen, neuLaden, reloadImpuls, sollNeuLaden,
} from './laden.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

assert(RELOAD_ENTITY === 'input_button.eye_ui_reload', 'default reload entity');
assert(CACHE_UPDATE_MS === 30 * 60 * 1000, 'cache check is half an hour');
assert(UPDATEREADY === 4, 'Safari reports a ready cache as status 4');

{
  const gesehen = {};
  assert(reloadImpuls(gesehen, '2026-11-01T10:00:00+00:00') === false, 'the first state is ignored');
  assert(gesehen.bereit === true, 'the first state is remembered');
  assert(reloadImpuls(gesehen, '2026-11-01T10:00:00+00:00') === false, 'the same timestamp does not reload');
  assert(reloadImpuls(gesehen, 'unknown') === false, 'unknown is not a press');
  assert(reloadImpuls(gesehen, 'unavailable') === false, 'unavailable is not a press');
  assert(reloadImpuls(gesehen, '') === false, 'an empty state is not a press');
  assert(gesehen.wert === '2026-11-01T10:00:00+00:00', 'a gap does not forget the last press');
  assert(reloadImpuls(gesehen, '2026-11-01T10:05:00+00:00') === true, 'a new timestamp reloads');
  assert(reloadImpuls(gesehen, '2026-11-01T10:05:00+00:00') === false, 'the new timestamp is only used once');
}

{
  const gesehen = {};
  assert(reloadImpuls(gesehen, 'unknown') === false, 'an unknown first state is ignored');
  assert(reloadImpuls(gesehen, '2026-11-01T11:00:00+00:00') === true, 'a later press still counts');
}

{
  const gesehen = {};
  assert(sollNeuLaden('input_button.other', RELOAD_ENTITY, gesehen, '2026-11-01T12:00:00+00:00') === false, 'another entity is ignored');
  assert(gesehen.bereit !== true, 'a different entity does not count as the first state');
  assert(sollNeuLaden('', RELOAD_ENTITY, gesehen, '2026-11-01T12:00:00+00:00') === false, 'a missing entity does nothing');
  assert(sollNeuLaden(RELOAD_ENTITY, '', gesehen, '2026-11-01T12:00:00+00:00') === false, 'an empty watch id does nothing');
  assert(sollNeuLaden(RELOAD_ENTITY, RELOAD_ENTITY, gesehen, '2026-11-01T12:00:00+00:00') === false, 'the matching entity still ignores the first state');
  assert(sollNeuLaden('Input_Button.Eye_UI_Reload', RELOAD_ENTITY, gesehen, '2026-11-01T12:01:00+00:00') === true, 'entity ids compare regardless of case');
}

{
  let updates = 0;
  assert(cacheAktualisieren(null) === false, 'no cache is a no-op');
  assert(cacheAktualisieren({ update() { updates += 1; } }) === true && updates === 1, 'update is called');
  assert(cacheAktualisieren({ update() { throw new Error('invalid'); } }) === false, 'a refused update does not throw');
}

{
  assert(cacheUebernehmen(null) === false, 'swap needs a cache');
  assert(cacheUebernehmen({ status: 1, swapCache() {} }) === false, 'an idle cache is not swapped');
  let swapped = 0;
  assert(cacheUebernehmen({ status: UPDATEREADY, swapCache() { swapped += 1; } }) === true && swapped === 1, 'a ready cache is swapped');
  assert(cacheUebernehmen({ status: UPDATEREADY, swapCache() { throw new Error('no'); } }) === false, 'a failed swap does not throw');
}

{
  const events = {};
  const cache = {
    status: 1,
    update() {
      this.status = UPDATEREADY;
      this.onupdateready();
    },
    swapCache() { this.swapped = true; },
    addEventListener(name, fn) { events[name] = fn; },
  };
  let reloaded = 0;
  neuLaden(cache, () => { reloaded += 1; }, { warteMs: 60000 });
  assert(cache.swapped === true && reloaded === 1, 'a ready update swaps and reloads once');
  events.noupdate();
  assert(reloaded === 1, 'a second cache event does not reload again');
}

{
  const cache = {
    status: UPDATEREADY,
    update() { throw new Error('already ready'); },
    swapCache() { this.swapped = true; },
    addEventListener() {},
  };
  let reloaded = 0;
  neuLaden(cache, () => { reloaded += 1; }, { warteMs: 60000 });
  assert(cache.swapped === true && reloaded === 1, 'an already ready cache reloads without a new download');
}

{
  let reloaded = 0;
  const cache = {
    status: 1,
    update() {},
    addEventListener(name, fn) { this[name] = fn; },
  };
  neuLaden(cache, () => { reloaded += 1; }, { warteMs: 60000 });
  cache.noupdate();
  assert(reloaded === 1, 'noupdate still reloads');
  const plain = { status: 1, update() {}, addEventListener() {} };
  neuLaden(plain, () => { reloaded += 1; }, { warteMs: 60000 });
  plain.onerror();
  assert(reloaded === 2, 'an error still reloads');
}

{
  let reloaded = 0;
  neuLaden(null, () => { reloaded += 1; });
  assert(reloaded === 1, 'without a cache the page still reloads');
}

const legacy = fs.readFileSync(new URL('./legacy.js', import.meta.url), 'utf8');
assert(legacy.includes('updateready') && legacy.includes('eye_ui_reload'), 'the legacy bundle keeps the reload path');
assert(legacy.includes('DynamicsCompressor') || legacy.includes('createDynamicsCompressor'), 'the legacy bundle keeps the limiter');

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Reload trigger ok');
