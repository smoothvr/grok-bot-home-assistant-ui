// SPDX-License-Identifier: MIT
// Which settings are shown, and the stepped values the iPad can hit cleanly.

export const VOL_STUFEN = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
export const LEBEN_STUFEN = [
  { id: 'still', v: 0 },
  { id: 'ruhig', v: 0.2 },
  { id: 'normal', v: 0.42 },
  { id: 'munter', v: 0.7 },
  { id: 'wach', v: 1 },
];
export const SCHLAF_MIN = [0, 5, 15, 30, 60];
export const DIM_SEK = [0, 30, 60, 120, 300];
export const DIM_PROZENT = [10, 20, 30, 50, 80];
export const GESICHT = 'index.html';

export function schnapp(wert, stufen) {
  const liste = stufen || [];
  if (!liste.length) return 0;
  let best = liste[0];
  let dist = Math.abs((Number(wert) || 0) - best);
  for (let i = 1; i < liste.length; i++) {
    const d = Math.abs((Number(wert) || 0) - liste[i]);
    if (d < dist) {
      dist = d;
      best = liste[i];
    }
  }
  return best;
}

export function lebenStufe(wert) {
  const werte = [];
  for (let i = 0; i < LEBEN_STUFEN.length; i++) werte.push(LEBEN_STUFEN[i].v);
  const v = schnapp(wert, werte);
  for (let i = 0; i < LEBEN_STUFEN.length; i++) if (LEBEN_STUFEN[i].v === v) return LEBEN_STUFEN[i];
  return LEBEN_STUFEN[2];
}

// A key that config.local.json sets is absent from the page. Demo is a link, not a stored field.
export function hauptSichtbar(zentral, demoGesperrt) {
  const liste = zentral || [];
  const hat = (key) => liste.indexOf(key) >= 0;
  const dimNach = !hat('dimNachSekunden');
  const dimStufe = !hat('dimStufe');
  return {
    schlaf: !hat('schlafSekunden'),
    dimNach: dimNach,
    dimStufe: dimStufe,
    dim: dimNach || dimStufe,
    sprache: !hat('lang'),
    laut: !hat('lautstaerke'),
    leben: !hat('lebendigkeit'),
    uhr: !hat('uhr'),
    demo: true,
    verbindung: !demoGesperrt && (!hat('haUrl') || !hat('haToken')),
    haUrl: !demoGesperrt && !hat('haUrl'),
    haToken: !demoGesperrt && !hat('haToken'),
  };
}
