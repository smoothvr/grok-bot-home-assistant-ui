// SPDX-License-Identifier: MIT
// The eyes sleep after inactivity. A tap or a Home Assistant state wakes them.
// nachSekunden <= 0 disables automatic sleep.
export function createWaechter(nachSekunden, jetzt = () => Date.now() / 1000) {
  let letzte = jetzt();
  let schlaeft = false;
  let pausiert = false;
  let frist = Number(nachSekunden) || 0;
  return {
    setNach(s) { frist = Number(s) || 0; },
    setPause(an) {
      pausiert = !!an;
      if (!an) letzte = jetzt();
    },
    beruehrt() {
      const war = schlaeft;
      schlaeft = false;
      letzte = jetzt();
      return war;
    },
    einschlafen() { schlaeft = true; },
    tick() {
      if (pausiert) return schlaeft ? 'schlafen' : 'wach';
      if (schlaeft) return 'schlafen';
      if (!(frist > 0)) return 'wach';
      if (jetzt() - letzte >= frist) {
        schlaeft = true;
        return 'einschlafen';
      }
      return 'wach';
    },
    ruhe() {
      if (pausiert) return 0;
      return Math.max(0, jetzt() - letzte);
    },
    get schlaeft() { return schlaeft; },
  };
}
