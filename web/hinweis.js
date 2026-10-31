// SPDX-License-Identifier: MIT
// A short note the tablet keeps on screen until someone taps it.

const LEER = { unknown: 1, unavailable: 1, none: 1, null: 1 };

export function createHinweis() {
  let text = '';
  let offen = false;
  return {
    setzen(roh) {
      const next = String(roh == null ? '' : roh).trim();
      if (!next || LEER[next.toLowerCase()]) {
        if (!offen) return 'still';
        text = '';
        offen = false;
        return 'leer';
      }
      if (offen && next === text) return 'gleich';
      text = next;
      offen = true;
      return 'zeigen';
    },
    quittieren() {
      if (!offen) return false;
      offen = false;
      text = '';
      return true;
    },
    get text() { return offen ? text : ''; },
    get offen() { return offen; },
  };
}

// Only a note that Home Assistant sent is cleared by the acknowledgement script.
export function ackAnHa(quelle) {
  return quelle === 'ha';
}
