// SPDX-License-Identifier: MIT
// Reload without closing Safari. The logic stays free of the page so tests can run it.

export const RELOAD_ENTITY = 'input_button.eye_ui_reload';
export const CACHE_UPDATE_MS = 30 * 60 * 1000;
export const UPDATEREADY = 4;

// The first observation is the value already on the socket. A later change reloads.
// unknown and unavailable are not a press. A missing entity never arrives here.
export function reloadImpuls(gesehen, state) {
  const g = gesehen && typeof gesehen === 'object' ? gesehen : {};
  const wert = state == null ? '' : String(state).trim();
  if (!g.bereit) {
    g.bereit = true;
    g.wert = wert;
    return false;
  }
  if (!wert || wert === 'unknown' || wert === 'unavailable') return false;
  if (wert === g.wert) return false;
  g.wert = wert;
  return true;
}

export function sollNeuLaden(entityId, watched, gesehen, state) {
  const a = String(entityId || '').trim().toLowerCase();
  const b = String(watched || '').trim().toLowerCase();
  if (!a || !b || a !== b) return false;
  return reloadImpuls(gesehen, state);
}

export function cacheAktualisieren(cache) {
  if (!cache || typeof cache.update !== 'function') return false;
  try {
    cache.update();
    return true;
  } catch (err) {
    return false;
  }
}

export function cacheUebernehmen(cache) {
  if (!cache || Number(cache.status) !== UPDATEREADY || typeof cache.swapCache !== 'function') return false;
  try {
    cache.swapCache();
    return true;
  } catch (err) {
    return false;
  }
}

// Ask for a fresh cache, then reload. A ready cache is swapped first.
// noupdate, an error, or a short wait still reload, so the button cannot hang.
export function neuLaden(cache, reloadFn, opt) {
  const neu = typeof reloadFn === 'function' ? reloadFn : function () {};
  const warte = opt && typeof opt.warteMs === 'number' ? opt.warteMs : 4000;
  if (!cache) {
    neu();
    return;
  }
  let los = false;
  let timer = 0;
  function einmal(tausch) {
    if (los) return;
    los = true;
    if (timer) clearTimeout(timer);
    if (tausch) cacheUebernehmen(cache);
    neu();
  }
  cache.onupdateready = function () { einmal(true); };
  if (typeof cache.addEventListener === 'function') {
    cache.addEventListener('updateready', function () { einmal(true); }, false);
    cache.addEventListener('noupdate', function () { einmal(false); }, false);
    cache.addEventListener('error', function () { einmal(false); }, false);
    cache.addEventListener('obsolete', function () { einmal(false); }, false);
  }
  cache.onnoupdate = function () { einmal(false); };
  cache.onerror = function () { einmal(false); };
  cache.onobsolete = function () { einmal(false); };
  cacheAktualisieren(cache);
  if (Number(cache.status) === UPDATEREADY) einmal(true);
  if (!los && warte >= 0) {
    timer = setTimeout(function () { einmal(false); }, warte);
    if (timer && typeof timer.unref === 'function') timer.unref();
  }
}
