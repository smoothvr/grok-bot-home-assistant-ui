// SPDX-License-Identifier: MIT
// Pointer events where the browser has them. Touch and mouse where it does not (Safari 10).

export function hatPointer() {
  return typeof window !== 'undefined' && typeof window.PointerEvent === 'function';
}

function paket(e, touch) {
  return {
    clientX: touch ? touch.clientX : e.clientX,
    clientY: touch ? touch.clientY : e.clientY,
    pointerId: touch ? touch.identifier : 1,
    target: e.target,
    currentTarget: e.currentTarget,
    preventDefault() { try { e.preventDefault(); } catch { /* not cancelable */ } },
    stopPropagation() { e.stopPropagation(); },
  };
}

// One listener. On an old browser a tap also synthesizes a mouse event, so the mouse path waits.
export function onZeiger(target, kind, handler, capture) {
  if (!target || typeof handler !== 'function') return;
  const cap = !!capture;
  if (hatPointer()) {
    const name = { down: 'pointerdown', move: 'pointermove', up: 'pointerup', cancel: 'pointercancel', over: 'pointerover' }[kind];
    if (name) target.addEventListener(name, handler, cap);
    return;
  }
  let touched = false;
  const note = () => {
    touched = true;
    setTimeout(() => { touched = false; }, 800);
  };
  if (kind === 'down') {
    target.addEventListener('touchstart', (e) => {
      note();
      const t = e.changedTouches && e.changedTouches[0];
      if (t) handler(paket(e, t));
    }, cap);
    target.addEventListener('mousedown', (e) => {
      if (touched) return;
      handler(paket(e, null));
    }, cap);
  } else if (kind === 'move') {
    target.addEventListener('touchmove', (e) => {
      const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
      if (t) handler(paket(e, t));
    }, cap);
    target.addEventListener('mousemove', (e) => {
      if (touched) return;
      handler(paket(e, null));
    }, cap);
  } else if (kind === 'up') {
    target.addEventListener('touchend', (e) => {
      const t = e.changedTouches && e.changedTouches[0];
      if (t) handler(paket(e, t));
    }, cap);
    target.addEventListener('mouseup', (e) => {
      if (touched) return;
      handler(paket(e, null));
    }, cap);
  } else if (kind === 'cancel') {
    target.addEventListener('touchcancel', (e) => {
      const t = e.changedTouches && e.changedTouches[0];
      handler(t ? paket(e, t) : { pointerId: -1, target: e.target });
    }, cap);
  } else if (kind === 'over') {
    target.addEventListener('mouseover', (e) => handler(paket(e, null)), cap);
  }
}
