// SPDX-License-Identifier: MIT
// Local commands for music and lights. Questions stay with Grok Bot.
// musik_aus has no clip of its own. The eyes return to idle.
export const BEFEHLE = {
  musik_an: { zustand: 'musik_an', scriptKey: 'scriptMusikAn', label: 'Music on' },
  musik_aus: { zustand: 'idle', scriptKey: 'scriptMusikAus', label: 'Music off' },
  licht_an: { zustand: 'licht_an', scriptKey: 'scriptLichtAn', label: 'Lights on' },
  licht_aus: { zustand: 'licht_aus', scriptKey: 'scriptLichtAus', label: 'Lights out' },
};
