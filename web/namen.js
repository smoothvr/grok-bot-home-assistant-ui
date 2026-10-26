// SPDX-License-Identifier: MIT
// Short ids for the URL, the keyboard, and Home Assistant. Values are clip names from zustaende.js.
export const KURZ = {
  schlafen: '01_schlafen',
  hallo: '02_hallo',
  idle: '03_idle',
  blicke: '04_blicke',
  zuhoeren: '05_zuhoeren',
  nachdenken: '06_nachdenken',
  verstanden: '07_verstanden',
  erledigt: '08_erledigt',
  nicht_verstanden: '09_nicht_verstanden',
  fehler: '10_fehler',
  lachen: '11_lachen',
  musik_an: '12_musik_an',
  licht_an: '13_licht_an',
  licht_aus: '14_licht_aus',
  angry: '15_angry',
};

export const KURZ_VON_CLIP = Object.fromEntries(Object.entries(KURZ).map(([kurz, clip]) => [clip, kurz]));
