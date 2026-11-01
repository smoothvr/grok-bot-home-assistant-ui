// SPDX-License-Identifier: MIT
// Pick an index and never the one that just played.

export function waehleIndex(n, letzte, rnd) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  const menge = n > 1 ? n : 1;
  let pick = Math.floor(Number(zufall()) * menge);
  if (!(pick >= 0) || pick >= menge) pick = 0;
  if (letzte == null || pick !== letzte || menge === 1) return pick;
  let hop = Math.floor(Number(zufall()) * (menge - 1));
  if (!(hop >= 0) || hop >= menge - 1) hop = 0;
  return (letzte + hop + 1) % menge;
}
