// SPDX-License-Identifier: MIT
// Old tablets, especially an iPad 4 on iOS 10, cannot spend a frame on a full glow.

export function istAltgeraet(env) {
  const nav = (env && env.nav) || (typeof navigator !== 'undefined' ? navigator : {});
  const win = (env && env.win) || (typeof window !== 'undefined' ? window : {});
  if (nav.deviceMemory && nav.deviceMemory <= 1) return true;
  const ua = String(nav.userAgent || '');
  const ios = /(?:CPU )?OS (\d+)[._]/.exec(ua);
  if (/iPad|iPhone|iPod/.test(ua) && ios && Number(ios[1]) <= 10) return true;
  if (typeof win.PointerEvent !== 'function') return true;
  return false;
}
