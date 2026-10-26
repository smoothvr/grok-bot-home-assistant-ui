// SPDX-License-Identifier: MIT
// Built for Safari 10.1 (iOS 10.3). Refresh with npm run build.

(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __pow = Math.pow;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // web/polyfills.js
  if (typeof Object.fromEntries !== "function") {
    Object.fromEntries = function fromEntries(entries) {
      const out = {};
      const list = Array.isArray(entries) ? entries : Array.from(entries);
      for (let i = 0; i < list.length; i++) out[list[i][0]] = list[i][1];
      return out;
    };
  }
  if (typeof String.prototype.replaceAll !== "function") {
    String.prototype.replaceAll = function replaceAll(search, replacement) {
      if (search instanceof RegExp) {
        if (!search.global) throw new TypeError("replaceAll called with a non-global RegExp");
        return this.replace(search, replacement);
      }
      return String(this).split(String(search)).join(String(replacement));
    };
  }
  if (typeof Element !== "undefined" && typeof Element.prototype.replaceChildren !== "function") {
    Element.prototype.replaceChildren = function replaceChildren() {
      while (this.firstChild) this.removeChild(this.firstChild);
      for (let i = 0; i < arguments.length; i++) {
        const node = arguments[i];
        this.appendChild(node && node.nodeType ? node : document.createTextNode(String(node)));
      }
    };
  }

  // web/aktionen.js
  var AKTIONEN = ["none", "music_toggle", "light_toggle", "settings", "sheet", "clock", "caption", "demo", "view", "dashboard", "service"];
  var GESTEN_KEYS = ["left", "right", "up", "down", "long"];
  var ECK_KEYS = ["tl", "tr", "bl", "br"];
  var GESTEN_VORGABE = {
    left: { art: "sheet", ziel: "" },
    right: { art: "dashboard", ziel: "" },
    up: { art: "caption", ziel: "" },
    down: { art: "settings", ziel: "" },
    long: { art: "demo", ziel: "" }
  };
  var ECKEN_VORGABE = {
    tl: { tap: { art: "service", ziel: "light.toggle/light.living_room" }, hold: { art: "clock", ziel: "" } },
    tr: { tap: { art: "music_toggle", ziel: "" }, hold: { art: "view", ziel: "" } },
    bl: { tap: { art: "view", ziel: "" }, hold: { art: "none", ziel: "" } },
    br: { tap: { art: "view", ziel: "" }, hold: { art: "none", ziel: "" } }
  };
  var ECKEN_DEMO = {
    tl: { tap: { art: "settings", ziel: "" }, hold: { art: "none", ziel: "" } },
    tr: { tap: { art: "view", ziel: "" }, hold: { art: "light_toggle", ziel: "" } },
    bl: { tap: { art: "music_toggle", ziel: "" }, hold: { art: "none", ziel: "" } },
    br: { tap: { art: "dashboard", ziel: "" }, hold: { art: "none", ziel: "" } }
  };
  function istStandardEcken(ecken) {
    if (!ecken) return true;
    for (const key of ECK_KEYS) {
      const vor = ECKEN_VORGABE[key];
      const c = ecken[key] || {};
      if ((c.tap && c.tap.art) !== vor.tap.art) return false;
      if ((c.hold && c.hold.art) !== vor.hold.art) return false;
    }
    return true;
  }
  function istAltesLayout(gesten, ecken) {
    if (!gesten) return false;
    const art = (slot, name) => slot && slot.art === name && !String(slot.ziel || "").trim();
    if (!art(gesten.left, "music_toggle") || !art(gesten.right, "none")) return false;
    if (!art(gesten.up, "light_toggle") || !art(gesten.down, "light_toggle") || !art(gesten.long, "none")) return false;
    const corners = ecken || {};
    for (const key of ECK_KEYS) {
      const c = corners[key] || {};
      if (c.tap && c.tap.art && c.tap.art !== "none" || c.hold && c.hold.art && c.hold.art !== "none") return false;
    }
    return true;
  }
  var ZIEL_ARTEN = /* @__PURE__ */ new Set(["service"]);
  function normEigene(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const item of raw) {
      if (!item || out.length >= 16) continue;
      const label = String(item.label || "").trim().slice(0, 40);
      const ziel = String(item.ziel || "").trim().slice(0, 240);
      let id = String(item.id || "").replace(/[^\w-]/g, "").slice(0, 24);
      if (!label || !ziel) continue;
      if (!id || seen.has(id)) id = `a${out.length}${seen.size}`;
      seen.add(id);
      out.push({ id, label, ziel });
    }
    return out;
  }
  function normAktion(raw, fallback = { art: "none", ziel: "" }, eigeneIds = null) {
    var _a;
    const art = String((raw == null ? void 0 : raw.art) || "");
    if (art.startsWith("own:")) {
      const id = art.slice(4);
      if (!eigeneIds || eigeneIds.has(id)) return { art, ziel: "" };
      return { art: "none", ziel: "" };
    }
    const known = AKTIONEN.includes(art) ? art : fallback.art || "none";
    const ziel = ZIEL_ARTEN.has(known) ? String((_a = raw == null ? void 0 : raw.ziel) != null ? _a : "").trim().slice(0, 240) : "";
    return { art: known, ziel };
  }
  function idsOf(eigene) {
    return new Set((eigene || []).map((item) => item.id));
  }
  function normGesten(raw, eigene) {
    const ids = idsOf(eigene);
    const out = {};
    for (const key of GESTEN_KEYS) out[key] = normAktion(raw == null ? void 0 : raw[key], GESTEN_VORGABE[key], ids);
    return out;
  }
  function normEcken(raw, eigene) {
    var _a, _b;
    const ids = idsOf(eigene);
    const out = {};
    for (const key of ECK_KEYS) {
      const vor = ECKEN_VORGABE[key];
      out[key] = {
        tap: normAktion((_a = raw == null ? void 0 : raw[key]) == null ? void 0 : _a.tap, vor.tap, ids),
        hold: normAktion((_b = raw == null ? void 0 : raw[key]) == null ? void 0 : _b.hold, vor.hold, ids)
      };
    }
    return out;
  }

  // web/augen.js
  var P = {
    EYE_W: 0.21,
    EYE_H: 0.5,
    SEP: 0.5,
    Y0: 0.06,
    RS: 1.1,
    YAW_MAX: 40,
    PITCH_MAX: 40,
    RIM: 0.95,
    BLINK_T: 0.22,
    BLINK_CLOSE: 0.4,
    BLINK_MIN: 0.1,
    GAZE_W: 16,
    GAZE_Z: 0.72,
    SCALE_W: 20,
    SCALE_Z: 0.55
  };
  var DEFAULT = { gx: 0, gy: 0, roll: 0, dx: 0, dy: 0, scale: 1, sx: 1, sy: 1, tilt: 0, lidT: 0, lidA: 0, happy: 0, bright: 1, sep: 1 };
  var rad = (d) => d * Math.PI / 180;
  var EASE = {
    lin: (u) => u,
    i: (u) => u * u,
    o: (u) => 1 - __pow(1 - u, 2),
    io: (u) => 3 * u * u - 2 * __pow(u, 3),
    back: (u) => {
      const s = 1.7;
      u -= 1;
      return 1 + (s + 1) * __pow(u, 3) + s * __pow(u, 2);
    },
    step: (u) => u >= 1 ? 1 : 0
  };
  function kf(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let k = 0; k < keys.length - 1; k++) {
      const [t0, v0] = keys[k], [t1, v1, e] = keys[k + 1];
      if (t < t1) {
        const u = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
        return v0 + (v1 - v0) * EASE[e](u);
      }
    }
    return keys[keys.length - 1][1];
  }
  function blinkMul(t, times) {
    let m = 1;
    for (const b of times) {
      const u = (t - b) / P.BLINK_T;
      if (u >= 0 && u < 1) {
        const c = P.BLINK_CLOSE, k = u < c ? EASE.i(u / c) : 1 - EASE.o((u - c) / (1 - c));
        m = Math.min(m, 1 - (1 - P.BLINK_MIN) * k);
      }
    }
    return m;
  }
  var Spring = class {
    // halbimplizites Euler, 120 Hz feste Teilschritte
    constructor(x, w, z) {
      this.x = x;
      this.v = 0;
      this.w = w;
      this.z = z;
    }
    step(target, dt) {
      const n = Math.max(1, Math.round(dt * 120)), h = dt / n;
      for (let i = 0; i < n; i++) {
        this.v += (-2 * this.z * this.w * this.v - this.w * this.w * (this.x - target)) * h;
        this.x += this.v * h;
      }
      return this.x;
    }
  };
  function project(u, v, yaw, pitch) {
    const RS = P.RS, d = Math.hypot(u, v), th = d / RS;
    let sx = 0, sy = 0;
    if (d > 1e-9) {
      sx = u / d * Math.sin(th);
      sy = v / d * Math.sin(th);
    }
    let x = RS * sx, y = RS * sy, z = RS * Math.cos(th);
    const cy = Math.cos(yaw), sY = Math.sin(yaw);
    [x, z] = [x * cy + z * sY, -x * sY + z * cy];
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    [y, z] = [y * cp + z * sp, -y * sp + z * cp];
    return [x, y];
  }
  function buildEyes(p, W, H, sep, y0, scr) {
    const out = [];
    for (const side of [-1, 1]) {
      const cu = side * sep / 2, cv = y0, ta = rad(p.tilt) * -side;
      const a = [Math.sin(ta), Math.cos(ta)], n = [a[1], -a[0]];
      let half, r0, ax, wd;
      if (H >= W) {
        half = (H - W) / 2;
        r0 = W / 2;
        ax = a;
        wd = n;
      } else {
        half = (W - H) / 2;
        r0 = H / 2;
        ax = n;
        wd = a;
      }
      const P1 = scr(cu - ax[0] * half, cv - ax[1] * half), P22 = scr(cu + ax[0] * half, cv + ax[1] * half);
      const C = scr(cu, cv), eps = 1e-3, Cw = scr(cu + wd[0] * eps, cv + wd[1] * eps);
      const r = r0 * Math.hypot(Cw[0] - C[0], Cw[1] - C[1]) / eps;
      const Ca = scr(cu + a[0] * eps, cv + a[1] * eps), Cn = scr(cu + n[0] * eps, cv + n[1] * eps);
      const det = Math.abs((Ca[0] - C[0]) * (Cn[1] - C[1]) - (Ca[1] - C[1]) * (Cn[0] - C[0])) / __pow(eps, 2);
      const e = { p1: P1, p2: P22, r, bright: p.bright, lid: null, cut: null };
      if (p.lidT > 1e-3) {
        const la = rad(p.lidA) * side;
        const ld = [n[0] * Math.cos(la) - a[0] * Math.sin(la), n[1] * Math.cos(la) - a[1] * Math.sin(la)];
        const hu = cu + a[0] * (H / 2 - p.lidT * H), hv = cv + a[1] * (H / 2 - p.lidT * H);
        e.lid = [scr(hu - ld[0] * W, hv - ld[1] * W), scr(hu + ld[0] * W, hv + ld[1] * W), scr(cu + a[0] * H, cv + a[1] * H)];
      }
      if (p.happy > 1e-3) {
        const rc = 0.8 * W, off0 = -H / 2 - rc, off1 = H / 2 - 0.42 * W - rc, off = off0 + (off1 - off0) * p.happy;
        e.cut = [scr(cu + a[0] * off, cv + a[1] * off), rc * Math.sqrt(det)];
      }
      out.push(e);
    }
    return out;
  }
  function primsK(p, k) {
    const yaw = rad(p.gx * P.YAW_MAX) * k, pitch = rad(p.gy * P.PITCH_MAX) * k, rr = rad(p.roll), cr = Math.cos(rr), sr = Math.sin(rr);
    const scr = (u, v) => {
      const [x, y] = project(u, v, yaw, pitch);
      return [x * cr - y * sr + p.dx, x * sr + y * cr + p.dy];
    };
    return buildEyes(p, P.EYE_W * p.scale * p.sx, P.EYE_H * p.scale * p.sy, P.SEP * p.sep, P.Y0, scr);
  }
  var extent = (pr) => Math.max(...pr.map((e) => Math.max(Math.hypot(...e.p1), Math.hypot(...e.p2)) + e.r));
  function poseToPrims(pose) {
    const q = __spreadValues(__spreadValues({}, DEFAULT), pose);
    let pr = primsK(q, 1);
    if (extent(pr) <= P.RIM) return pr;
    let lo = 0, hi = 1;
    for (let j = 0; j < 8; j++) {
      const m = (lo + hi) / 2;
      if (extent(primsK(q, m)) <= P.RIM) lo = m;
      else hi = m;
    }
    return primsK(q, lo);
  }
  var P2 = { K: 1.15, MARGIN: 0.1, FILL_X: 0.92, FILL_Y: 0.92, PERSP_X: 0.1, PERSP_Y: 0.07 };
  function travel2d(aspect) {
    const K2 = P2.K, hw = K2 * (P.SEP / 2 + P.EYE_W / 2), hh = K2 * P.EYE_H / 2;
    return [(aspect - P2.MARGIN - hw) * P2.FILL_X, (1 - P2.MARGIN - hh - K2 * P.Y0) * P2.FILL_Y];
  }
  function prims2dK(p, k, aspect) {
    const K2 = P2.K, [tx, ty] = travel2d(aspect), gx = p.gx * k, gy = p.gy * k;
    const fx = 1 - P2.PERSP_X * gx * gx, fy = 1 - P2.PERSP_Y * gy * gy;
    const rr = rad(p.roll), cr = Math.cos(rr), sr = Math.sin(rr), ox = gx * tx + K2 * p.dx, oy = gy * ty + K2 * p.dy;
    const scr = (u, v) => {
      const x = K2 * u * fx, y = K2 * v * fy;
      return [x * cr - y * sr + ox, x * sr + y * cr + oy];
    };
    return buildEyes(p, P.EYE_W * p.scale * p.sx, P.EYE_H * p.scale * p.sy, P.SEP * p.sep, P.Y0, scr);
  }
  function inside2d(pr, aspect) {
    const m = P2.MARGIN;
    for (const e of pr) for (const [x, y] of [e.p1, e.p2]) if (Math.abs(x) + e.r > aspect - m * 0.5 || Math.abs(y) + e.r > 1 - m * 0.5) return false;
    return true;
  }
  function poseToPrims2d(pose, aspect = 2388 / 1668) {
    const q = __spreadValues(__spreadValues({}, DEFAULT), pose);
    const pr = prims2dK(q, 1, aspect);
    if (inside2d(pr, aspect)) return pr;
    let lo = 0, hi = 1;
    for (let j = 0; j < 8; j++) {
      const m = (lo + hi) / 2;
      if (inside2d(prims2dK(q, m, aspect), aspect)) lo = m;
      else hi = m;
    }
    return prims2dK(q, lo, aspect);
  }

  // web/zustaende.js
  var RING = {
    schlafen: [58, 21, 0],
    idle: [255, 106, 0],
    hallo: [255, 176, 102],
    zuhoeren: [0, 200, 255],
    nachdenken: [138, 60, 255],
    verstanden: [43, 255, 136],
    erledigt: [43, 255, 136],
    nicht_verstanden: [255, 160, 0],
    fehler: [255, 26, 26],
    lachen: [255, 90, 138],
    musik: [255, 122, 0],
    licht_an: [255, 230, 168],
    licht_aus: [58, 21, 0]
  };
  var alarmStark = true;
  function setAlarmStaerke(wert) {
    alarmStark = wert !== "normal";
  }
  function angryFrame(t) {
    const stark = alarmStark;
    const slam = Math.min(1, t / 0.11);
    const ease = slam * slam * (3 - 2 * slam);
    const lidT = (stark ? 0.64 : 0.5) * ease;
    const lidA = (stark ? -46 : -28) * ease;
    const sy = 1 + ((stark ? 0.46 : 0.64) - 1) * ease;
    const sx = 1 + ((stark ? 1.18 : 1.08) - 1) * ease;
    let scale = 1;
    let dx = 0;
    if (t < 0.14) scale = stark ? 1.34 : 1.16;
    else if (t < 0.4) scale = stark ? 1.02 : 1;
    if (t < 0.3) {
      const u = t / 0.3;
      dx = (stark ? 0.075 : 0.04) * Math.sin(2 * PI * 24 * t) * (1 - u);
    }
    const tw = t > 0.7 ? (t - 0.7) % 3.2 : 99;
    if (tw < 0.16) {
      const u = tw / 0.16;
      dx += (stark ? 0.045 : 0.022) * Math.sin(2 * PI * 18 * tw) * (1 - u);
      if (tw < 0.07) scale = stark ? 1.14 : 1.06;
    }
    const scan = stark ? 0.78 : 0.4;
    const period = stark ? 0.7 : 1.35;
    const gx = t > 0.9 ? scan * Math.sin(2 * PI * (t - 0.9) / period) : 0;
    const gy = 0;
    const fl = stark ? 0.82 + 0.18 * Math.sin(2 * PI * t / 0.72) : 0.5 + 0.16 * Math.sin(2 * PI * t / 1.4);
    const rgb = stark ? [255, 12, 8] : [214, 32, 22];
    return [{ lidT, lidA, sy, sx, scale, dx, gx, gy, bright: 1 }, [], [rgb, fl, null, "angry"]];
  }
  var clamp01 = (u) => Math.max(0, Math.min(1, u));
  var mix = (c1, c2, u) => c1.map((a, i) => a + (c2[i] - a) * clamp01(u));
  var pulse = (t, period, lo, hi) => lo + (hi - lo) * (0.5 - 0.5 * Math.cos(2 * Math.PI * t / period));
  var breathe = (t, period = 4, amp = 0.025) => amp * Math.sin(2 * Math.PI * t / period);
  var PI = Math.PI;
  function makeClips(ON) {
    const C = [];
    const clip = (name, label, dur, sound, s_off, loop, fn) => C.push({ name, label, dur, sound, s_off, loop, fn });
    const off = (n, s) => ON[n].map((x) => s + x);
    clip("01_schlafen", "schlafen", 6, "08_schlafen", 0.4, true, (t) => {
      const o = off("08_schlafen", 0.4);
      const p = {
        gy: kf([[0, 0, "lin"], [o[0], 0, "lin"], [o[0] + 0.4, -0.3, "io"]], t),
        lidT: kf([[0, 0, "lin"], [o[0], 0, "lin"], [o[0] + 0.3, 0.45, "io"]], t),
        sy: kf([[0, 1, "lin"], [o[1], 1, "lin"], [o[1] + 0.6, 0.16, "io"]], t),
        sx: kf([[0, 1, "lin"], [o[1], 1, "lin"], [o[1] + 0.6, 1.08, "io"]], t),
        bright: kf([[0, 1, "lin"], [o[1], 0.8, "lin"], [o[1] + 0.8, 0.28, "io"]], t)
      };
      if (t > 1.6) {
        p.bright = pulse(t - 1.6, 4.5, 0.18, 0.32);
        p.dy = -0.015 * Math.sin(2 * PI * (t - 1.6) / 4.5);
      }
      return [p, [0.2], [mix(RING.idle, RING.schlafen, (t - o[0]) / 1.2), t > 1.6 ? pulse(t, 4.5, 0.15, 0.35) : 0.3, null]];
    });
    clip("02_hallo", "wake / hallo", 3, "01_hallo", 0, false, (t) => {
      const o = ON["01_hallo"];
      const p = {
        sy: kf([[0, 0.16, "lin"], [o[0], 0.16, "lin"], [o[0] + 0.16, 1.12, "o"], [o[1] + 0.05, 1.12, "lin"], [o[2] + 0.02, 1.08, "lin"], [o[2] + 0.22, 0.86, "i"], [o[2] + 0.45, 1, "back"]], t),
        sx: kf([[0, 1.08, "lin"], [o[0] + 0.16, 0.94, "o"], [o[2] + 0.02, 0.95, "lin"], [o[2] + 0.22, 1.1, "i"], [o[2] + 0.45, 1, "back"]], t),
        dy: kf([[0, 0, "lin"], [o[1], 0, "lin"], [o[2] + 0.02, 0.12, "o"], [o[2] + 0.22, 0, "i"]], t),
        bright: kf([[0, 0.28, "lin"], [o[0], 0.28, "lin"], [o[0] + 0.2, 1, "o"]], t),
        gy: kf([[0, -0.3, "lin"], [o[0], -0.3, "step"], [o[0] + 0.01, 0.15, "step"], [1.4, 0.15, "lin"], [1.41, 0, "step"]], t)
      };
      const ring = [mix(RING.hallo, RING.idle, (t - 0.8) / 1), kf([[0, 0.2, "lin"], [o[0], 0.2, "lin"], [o[0] + 0.2, 1, "o"], [1.2, 0.5, "io"], [2.5, 0.3, "io"]], t), null];
      return [p, [1.75], ring];
    });
    clip("03_idle", "idle (wach)", 9, null, 0, true, (t) => {
      const g = [[0, 0, 0], [2.4, 0.4, 0.12], [3.6, -0.7, 0.35], [5.6, 0, 0], [7, 0.25, -0.45], [8.2, 0, 0]];
      let gx = 0, gy = 0;
      for (const [tt, x, y] of g) if (t >= tt) {
        gx = x;
        gy = y;
      }
      const p = { gx, gy, scale: 1 + breathe(t), dy: 8e-3 * Math.sin(2 * PI * t / 4) };
      return [p, [1.4, 4.7, 4.98, 7.9], [RING.idle, pulse(t, 4, 0.2, 0.32), null]];
    });
    clip("04_blicke", "Blicke: oben, unten, links, rechts", 8, null, 0, false, (t) => {
      const seq = [[0, 0, 0], [0.4, 0, 1], [1.3, 0, -1], [2.2, -1, 0], [3.1, 1, 0], [4, -0.72, 0.72], [4.9, 0.72, 0.72], [5.8, -0.72, -0.72], [6.7, 0.72, -0.72], [7.5, 0, 0]];
      let gx = 0, gy = 0;
      for (const [tt, x, y] of seq) if (t >= tt) {
        gx = x;
        gy = y;
      }
      return [{ gx, gy }, [7.75], [RING.idle, 0.28, null]];
    });
    clip("05_zuhoeren", "zuh\xF6ren (listening)", 4, "02_zuhoeren", 0.1, true, (t) => {
      const o = off("02_zuhoeren", 0.1);
      let sc = kf([[0, 1, "lin"], [o[0], 1, "step"], [o[0] + 0.01, 1.15, "step"]], t);
      if (t > 0.9) sc = 1.15 + 0.02 * Math.sin(2 * PI * (t - 0.9) / 1.2);
      const p = {
        scale: sc,
        roll: kf([[0, 0, "lin"], [o[0], 0, "lin"], [o[0] + 0.35, 9, "back"]], t),
        sy: kf([[0, 1, "lin"], [o[1], 1, "lin"], [o[1] + 0.06, 1.07, "o"], [o[1] + 0.25, 1, "io"]], t),
        gx: t > o[0] ? 0.12 : 0,
        gy: t > o[0] ? 0.1 : 0
      };
      if (t > 2) p.gx = 0.12 + (t > 2 && t < 2.6 ? 0.06 : 0);
      const ring = [mix(RING.idle, RING.zuhoeren, (t - o[0]) / 0.2), t > o[0] ? pulse(t - o[0], 1.2, 0.55, 1) : 0.3, null];
      return [p, [3.3], ring];
    });
    clip("06_nachdenken", "nachdenken (processing)", 4, "07_nachdenken", 0.1, true, (t) => {
      const o = off("07_nachdenken", 0.1);
      let gx = 0, gy = 0;
      if (t >= o[0]) {
        gx = -0.55;
        gy = 0.78;
      }
      if (t >= o[2]) gx = 0.55;
      if (t >= o[4]) gx = -0.55;
      if (t >= o[5] + 0.3) gx = 0.55 * Math.sin(2 * PI * (t - o[5] - 0.3) / 1.6 + PI / 2) * -1;
      const p = { gx, gy, scale: t > o[0] ? 0.95 : 1 };
      const spot = Math.sin(2 * PI * t / 1);
      return [p, [2.9], [mix(RING.idle, RING.nachdenken, (t - o[0]) / 0.2), t > o[0] ? pulse(t, 1, 0.5, 0.9) : 0.3, t > o[0] ? spot : null]];
    });
    clip("07_verstanden", "verstanden", 2.2, "03_verstanden", 0.1, false, (t) => {
      const o = off("03_verstanden", 0.1);
      const hop = (t0, h = 0.05) => {
        const u = (t - t0) / 0.18;
        return u >= 0 && u < 1 ? h * Math.sin(PI * u) : 0;
      };
      const p = {
        dy: hop(o[0]) + hop(o[1], 0.06),
        happy: kf([[0, 0, "lin"], [o[1], 0, "lin"], [o[1] + 0.12, 0.85, "o"], [1.4, 0.85, "lin"], [1.75, 0, "io"]], t),
        sx: kf([[0, 1, "lin"], [o[1], 1, "lin"], [o[1] + 0.12, 1.2, "o"], [1.4, 1.2, "lin"], [1.75, 1, "io"]], t),
        sy: kf([[0, 1, "lin"], [o[1], 1, "lin"], [o[1] + 0.12, 0.8, "o"], [1.4, 0.8, "lin"], [1.75, 1, "io"]], t)
      };
      const inten = kf([[0, 0.3, "lin"], [o[0], 0.3, "lin"], [o[0] + 0.08, 1, "o"], [1, 1, "lin"], [1.6, 0.3, "io"]], t);
      return [p, [], [mix(RING.verstanden, RING.idle, (t - 1.1) / 0.5), inten, null]];
    });
    clip("08_erledigt", "erledigt / danke", 2.6, "04_erledigt_danke", 0.1, false, (t) => {
      const o = off("04_erledigt_danke", 0.1);
      const p = {
        dy: kf([[0, 0, "lin"], [o[0], 0.015, "o"], [o[1], 0.03, "o"], [o[2], 0.045, "o"], [o[3] + 0.14, 0.11, "o"], [o[3] + 0.36, 0, "i"], [o[3] + 0.5, 0.015, "o"], [o[3] + 0.62, 0, "i"]], t),
        happy: kf([[0, 0, "lin"], [o[3], 0, "lin"], [o[3] + 0.1, 1, "o"], [1.8, 1, "lin"], [2.15, 0, "io"]], t),
        sx: kf([[0, 1, "lin"], [o[3], 1, "lin"], [o[3] + 0.1, 1.25, "o"], [o[3] + 0.36, 1.25, "lin"], [o[3] + 0.42, 1.35, "o"], [o[3] + 0.6, 1.25, "io"], [1.8, 1.25, "lin"], [2.15, 1, "io"]], t),
        sy: kf([[0, 1, "lin"], [o[3], 1, "lin"], [o[3] + 0.1, 0.78, "o"], [o[3] + 0.36, 0.78, "lin"], [o[3] + 0.42, 0.66, "o"], [o[3] + 0.6, 0.78, "io"], [1.8, 0.78, "lin"], [2.15, 1, "io"]], t),
        scale: kf([[0, 1, "lin"], [o[0], 1.02, "step"], [o[1], 1.04, "step"], [o[2], 1.06, "step"], [o[3], 1.06, "lin"], [2, 1, "step"]], t)
      };
      const inten = kf([[0, 0.3, "lin"], [o[0], 0.5, "o"], [o[3], 1, "o"], [1.6, 1, "lin"], [2.4, 0.3, "io"]], t);
      return [p, [], [mix(RING.erledigt, RING.idle, (t - 1.7) / 0.6), inten, null]];
    });
    clip("09_nicht_verstanden", "nicht verstanden", 3, "06_nicht_verstanden", 0.1, false, (t) => {
      const o = off("06_nicht_verstanden", 0.1), back = 2.3;
      const p = {
        scale: kf([[0, 1, "lin"], [o[0], 1, "step"], [o[0] + 0.01, 0.86, "step"], [back, 0.86, "lin"], [back + 0.01, 1, "step"]], t),
        gy: kf([[0, 0, "lin"], [o[0], 0, "step"], [o[0] + 0.01, -0.15, "step"], [o[1], -0.15, "step"], [o[1] + 0.01, -0.4, "step"], [back, -0.4, "step"], [back + 0.01, 0, "step"]], t),
        lidT: kf([[0, 0, "lin"], [o[1], 0, "lin"], [o[1] + 0.35, 0.36, "io"], [back, 0.36, "lin"], [back + 0.35, 0, "io"]], t),
        lidA: 22,
        tilt: kf([[0, 0, "lin"], [o[1], 0, "lin"], [o[1] + 0.4, 8, "io"], [back, 8, "lin"], [back + 0.35, 0, "io"]], t),
        bright: kf([[0, 1, "lin"], [o[1], 1, "lin"], [o[1] + 0.4, 0.8, "io"], [back, 0.8, "lin"], [back + 0.3, 1, "io"]], t)
      };
      const inten = t > o[0] && t < o[0] + 0.9 ? 0.3 + 0.5 * Math.max(0, Math.sin(PI * (t - o[0]) / 0.45)) : 0.3;
      return [p, [], [mix(RING.nicht_verstanden, RING.idle, (t - 1.6) / 0.6), inten, null]];
    });
    clip("10_fehler", "fehler", 2.2, "09_fehler", 0.1, false, (t) => {
      const o = off("09_fehler", 0.1);
      let sh = 0;
      if (t >= o[0] && t < o[0] + 0.6) {
        const u = t - o[0];
        sh = 0.05 * Math.sin(2 * PI * 14 * u) * (1 - u / 0.6);
      }
      const p = { dx: sh, lidT: kf([[0, 0, "lin"], [o[0], 0, "lin"], [o[0] + 0.06, 0.3, "o"], [1.3, 0.3, "lin"], [1.6, 0, "io"]], t), lidA: -6, scale: t > o[0] && t < 1.3 ? 0.9 : 1 };
      const fl = t > o[0] && t < o[0] + 0.12 || t > o[1] && t < o[1] + 0.22 ? 1 : 0.25;
      return [p, [1.75], [t < 1.3 ? RING.fehler : mix(RING.fehler, RING.idle, (t - 1.3) / 0.5), fl, null]];
    });
    clip("15_angry", "angry", 2.4, "14_angry", 0.05, true, (t) => angryFrame(t));
    clip("11_lachen", "lachen", 2.6, "05_lachen", 0.1, false, (t) => {
      const o = off("05_lachen", 0.1);
      let dy = 0, roll = 0;
      const ts = [...o, o[o.length - 1] + 0.14, o[o.length - 1] + 0.28];
      ts.forEach((t0, i) => {
        const u = (t - t0) / 0.11;
        if (u >= 0 && u < 1) {
          const amp = i < o.length ? 0.05 : 0.05 * (i === o.length ? 0.6 : 0.35);
          dy = amp * Math.sin(PI * u);
          roll = (i % 2 ? 6 : -6) * Math.sin(PI * u);
        }
      });
      const p = {
        dy,
        roll,
        happy: kf([[0, 0, "lin"], [o[0] - 0.05, 0, "lin"], [o[0] + 0.04, 1, "o"], [1.7, 1, "lin"], [2.05, 0, "io"]], t),
        sx: kf([[0, 1, "lin"], [o[0] - 0.05, 1, "lin"], [o[0] + 0.04, 1.25, "o"], [1.7, 1.25, "lin"], [2.05, 1, "io"]], t),
        sy: kf([[0, 1, "lin"], [o[0] - 0.05, 1, "lin"], [o[0] + 0.04, 0.75, "o"], [1.7, 0.75, "lin"], [2.05, 1, "io"]], t)
      };
      let fl = 0.3;
      for (const t0 of o) if (t >= t0 && t < t0 + 0.08) fl = 1;
      return [p, [], [mix(RING.lachen, RING.idle, (t - 1.6) / 0.5), t < 1.6 ? fl : 0.3, null]];
    });
    clip("12_musik_an", "musik an", 5, "10_musik_an", 0.1, true, (t) => {
      const o = off("10_musik_an", 0.1), BEAT2 = 0.5, tb = o[o.length - 1] + 0.25;
      let sc = 1;
      o.forEach((t0, i) => {
        if (t >= t0) sc = 1 + 0.025 * (i + 1);
      });
      let dy = 0, roll = 0;
      if (t >= tb) {
        const u = (t - tb) / BEAT2;
        dy = 0.035 * Math.abs(Math.sin(PI * u));
        roll = 7 * Math.sin(PI * u);
        sc = 1.05;
      }
      const p = {
        scale: sc,
        dy,
        roll,
        happy: kf([[0, 0, "lin"], [tb, 0, "lin"], [tb + 0.3, 0.35, "io"]], t),
        sx: 1 + 0.08 * Math.min(1, Math.max(0, (t - tb) / 0.3)),
        sy: 1 - 0.06 * Math.min(1, Math.max(0, (t - tb) / 0.3))
      };
      let inten = 0.3;
      if (t >= o[0]) inten = 0.6;
      if (t >= tb) {
        const ph = (t - tb) / BEAT2 % 1;
        inten = 0.45 + 0.5 * __pow(Math.max(0, Math.cos(PI * ph)), 2);
      }
      const col = mix(RING.musik, [255, 176, 0], 0.5 + 0.5 * Math.sin(2 * PI * t / 2));
      return [p, [3.6], [col, inten, null]];
    });
    clip("13_licht_an", "licht an", 2.6, "11_licht_an", 0.3, false, (t) => {
      const o = off("11_licht_an", 0.3);
      const p = {
        bright: kf([[0, 0.4, "lin"], [o[0], 0.4, "lin"], [o[0] + 0.2, 1, "o"]], t),
        lidT: kf([[0, 0.25, "lin"], [o[0], 0.25, "lin"], [o[0] + 0.2, 0, "o"]], t),
        scale: kf([[0, 0.95, "lin"], [o[0], 0.95, "step"], [o[0] + 0.01, 1.08, "step"], [1.6, 1.08, "step"], [1.61, 1, "step"]], t),
        sy: kf([[0, 1, "lin"], [o[1], 1, "lin"], [o[1] + 0.06, 1.08, "o"], [o[1] + 0.3, 1, "io"]], t),
        gy: kf([[0, -0.15, "lin"], [o[0], -0.15, "step"], [o[0] + 0.01, 0.45, "step"], [1.5, 0.45, "step"], [1.51, 0, "step"]], t)
      };
      const inten = kf([[0, 0.12, "lin"], [o[0], 0.12, "lin"], [o[0] + 0.25, 1, "o"], [2.6, 0.8, "lin"]], t);
      return [p, [2], [mix(RING.licht_aus, RING.licht_an, (t - o[0]) / 0.2), inten, null]];
    });
    clip("14_licht_aus", "licht aus", 2.6, "12_licht_aus", 0.3, false, (t) => {
      const o = off("12_licht_aus", 0.3);
      const p = {
        bright: kf([[0, 1, "lin"], [o[0], 1, "lin"], [o[0] + 0.25, 0.38, "io"]], t),
        lidT: kf([[0, 0, "lin"], [o[0], 0, "lin"], [o[0] + 0.25, 0.28, "io"]], t),
        scale: kf([[0, 1, "lin"], [o[0], 1, "step"], [o[0] + 0.01, 0.95, "step"]], t),
        gy: kf([[0, 0, "lin"], [o[0], 0, "step"], [o[0] + 0.01, -0.25, "step"]], t)
      };
      const inten = kf([[0, 0.8, "lin"], [o[0], 0.8, "lin"], [o[0] + 0.3, 0.12, "io"]], t);
      return [p, [1.9], [mix(RING.licht_an, RING.licht_aus, (t - o[0]) / 0.3), inten, null]];
    });
    return C;
  }

  // web/engine.js
  function* clipPoses(c, fps = 30) {
    var _a, _b, _c;
    const nf = Math.round(c.dur * fps);
    const [p0] = c.fn(0);
    const sp = { gx: new Spring((_a = p0.gx) != null ? _a : 0, P.GAZE_W, P.GAZE_Z), gy: new Spring((_b = p0.gy) != null ? _b : 0, P.GAZE_W, P.GAZE_Z), scale: new Spring((_c = p0.scale) != null ? _c : 1, P.SCALE_W, P.SCALE_Z) };
    for (let i = 0; i < nf; i++) {
      const t = i / fps, [tgt, blinks, ring] = c.fn(t), p = __spreadValues(__spreadValues({}, DEFAULT), tgt);
      for (const k in sp) p[k] = sp[k].step(p[k], 1 / fps);
      const m = blinkMul(t, blinks);
      p.sy *= m;
      p.sx *= 1 + 0.15 * (1 - m) / (1 - P.BLINK_MIN);
      yield [p, ring];
    }
  }
  var Augen = class {
    constructor(clips, rnd = Math.random) {
      this.clips = Object.fromEntries(clips.map((c) => [c.name, c]));
      this.rnd = rnd;
      this.sgx = new Spring(0, P.GAZE_W, P.GAZE_Z);
      this.sgy = new Spring(0, P.GAZE_W, P.GAZE_Z);
      this.ssc = new Spring(1, P.SCALE_W, P.SCALE_Z);
      this.now = 0;
      this.blinkAt = -10;
      this.nextBlink = 3;
      this.nextGlance = 4;
      this.glance = [0, 0];
      this.onEnde = null;
      this.set("03_idle");
    }
    set(name) {
      const prev = this.c && this.c.name;
      this.c = this.clips[name];
      this.t0 = this.now;
      if (prev === "15_angry" && name !== "15_angry" && this.pose) {
        this.calm = {
          until: this.now + 0.62,
          from: {
            lidT: this.pose.lidT || 0,
            lidA: this.pose.lidA || 0,
            sy: Math.max(this.pose.sy || 1, 0.42),
            sx: this.pose.sx || 1
          }
        };
      } else this.calm = null;
      if (name === "03_idle") this.nextGlance = this.now + 1.5;
    }
    tick(dt) {
      this.now += dt;
      let t = this.now - this.t0;
      const c = this.c;
      if (!c.loop && t >= c.dur) {
        const alt = c.name;
        this.set("03_idle");
        t = 0;
        if (this.onEnde) this.onEnde(alt);
      }
      const live = this.c.name === "03_idle";
      let [tgt, blinks, ring] = this.c.fn(t);
      const p = __spreadValues(__spreadValues({}, DEFAULT), tgt);
      if (live) {
        p.scale = 1 + 0.025 * Math.sin(2 * Math.PI * t / 4);
        p.dy = 8e-3 * Math.sin(2 * Math.PI * t / 4);
        if (this.now > this.nextGlance) {
          const weit = this.rnd() < 1 / 3, r = weit ? 0.9 : 0.35, w = this.rnd() * 2 * Math.PI;
          this.glance = [this.rnd() < 1 / 3 ? 0 : r * Math.cos(w), this.rnd() < 1 / 3 ? 0 : r * Math.sin(w)];
          this.nextGlance = this.now + 1.2 + this.rnd() * 3;
        }
        p.gx = this.glance[0];
        p.gy = this.glance[1];
      }
      const loopy = live || ["05_zuhoeren", "06_nachdenken", "12_musik_an", "15_angry"].includes(this.c.name);
      if (loopy && this.now > this.nextBlink) {
        this.blinkAt = this.now;
        this.nextBlink = this.now + (this.rnd() < 0.25 ? 0.3 : 3 + this.rnd() * 5);
      }
      p.gx = this.sgx.step(p.gx, dt);
      p.gy = this.sgy.step(p.gy, dt);
      p.scale = this.ssc.step(p.scale, dt);
      let m = blinkMul(this.now, [this.blinkAt]);
      if (!live) m = Math.min(m, blinkMul(t, blinks));
      p.sy *= m;
      p.sx *= 1 + 0.15 * (1 - m) / (1 - P.BLINK_MIN);
      if (this.calm && this.now < this.calm.until) {
        const left = (this.calm.until - this.now) / 0.62;
        const e = left * left;
        const f = this.calm.from;
        p.lidT = (p.lidT || 0) + (f.lidT - (p.lidT || 0)) * e;
        p.lidA = (p.lidA || 0) + (f.lidA - (p.lidA || 0)) * e;
        p.sy = p.sy + (f.sy - p.sy) * e;
        p.sx = p.sx + (f.sx - p.sx) * e;
        const smile = Math.sin(Math.PI * Math.max(0, Math.min(1, 1 - left)));
        p.happy = Math.max(p.happy || 0, smile);
        if (ring && ring[0]) {
          const mix2 = (a, b) => a + (b - a) * e;
          const base = ring[0];
          ring = [[mix2(base[0], 255), mix2(base[1], 18), mix2(base[2], 8)], (ring[1] || 0) * (1 - e) + 0.85 * e, ring[2], e > 0.35 ? "angry" : ring[3]];
        }
      } else if (this.calm) this.calm = null;
      this.pose = p;
      this.ring = ring;
      return p;
    }
  };

  // web/namen.js
  var KURZ = {
    schlafen: "01_schlafen",
    hallo: "02_hallo",
    idle: "03_idle",
    blicke: "04_blicke",
    zuhoeren: "05_zuhoeren",
    nachdenken: "06_nachdenken",
    verstanden: "07_verstanden",
    erledigt: "08_erledigt",
    nicht_verstanden: "09_nicht_verstanden",
    fehler: "10_fehler",
    lachen: "11_lachen",
    musik_an: "12_musik_an",
    licht_an: "13_licht_an",
    licht_aus: "14_licht_aus",
    angry: "15_angry"
  };
  var KURZ_VON_CLIP = Object.fromEntries(Object.entries(KURZ).map(([kurz, clip]) => [clip, kurz]));

  // web/ha.js
  var ALIAS = {
    idle: "idle",
    idle_wach: "idle",
    wach: "idle",
    neutral: "idle",
    blicke: "blicke",
    blicke_oben_unten_links_rechts: "blicke",
    zuhoeren: "zuhoeren",
    zuhoren: "zuhoeren",
    listening: "zuhoeren",
    zuhoeren_listening: "zuhoeren",
    nachdenken: "nachdenken",
    nachdenken_processing: "nachdenken",
    processing: "nachdenken",
    denken: "nachdenken",
    verstanden: "verstanden",
    erledigt: "erledigt",
    erledigt_danke: "erledigt",
    danke: "erledigt",
    nicht_verstanden: "nicht_verstanden",
    nichtverstanden: "nicht_verstanden",
    confused: "nicht_verstanden",
    fehler: "fehler",
    error: "fehler",
    schlafen: "schlafen",
    sleep: "schlafen",
    sleeping: "schlafen",
    hallo: "hallo",
    wake: "hallo",
    wake_hallo: "hallo",
    lachen: "lachen",
    laugh: "lachen",
    musik_an: "musik_an",
    musik_ein: "musik_an",
    music_on: "musik_an",
    musik_aus: "idle",
    musik_off: "idle",
    music_off: "idle",
    licht_an: "licht_an",
    licht_ein: "licht_an",
    light_on: "licht_an",
    lights_on: "licht_an",
    licht_aus: "licht_aus",
    light_off: "licht_aus",
    lights_off: "licht_aus",
    thinking: "nachdenken",
    understood: "verstanden",
    got_it: "verstanden",
    done: "erledigt",
    thanks: "erledigt",
    hello: "hallo",
    hi: "hallo",
    sprechen: "sprechen",
    speaking: "sprechen",
    not_understood: "nicht_verstanden",
    didnt_understand: "nicht_verstanden",
    gaze: "blicke",
    look: "blicke",
    looking: "blicke",
    unavailable: null,
    unknown: null,
    none: null,
    null: null
  };
  function normZustand(raw) {
    return String(raw != null ? raw : "").trim().toLowerCase().replace(/ö/g, "oe").replace(/ä/g, "ae").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[()]/g, " ").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }
  var MELDUNG_BEKANNT = {
    tokenRejected: 1,
    statesUnreadable: 1,
    entityMissing: 1,
    entityMissingConfig: 1,
    callFailed: 1,
    connectFailed: 1,
    notSet: 1,
    eyesOnly: 1,
    eyesOnlyOffline: 1,
    tokenMissing: 1,
    connectionTrouble: 1
  };
  function sichereMeldung(raw) {
    const text = String(raw != null ? raw : "").trim();
    if (!text) return "";
    if (text.startsWith("called:")) {
      const name = text.slice(7);
      return /^[a-z0-9_./-]{1,80}$/i.test(name) ? text : "callFailed";
    }
    if (MELDUNG_BEKANNT[text]) return text;
    if (/token|unauthorized|invalid access/i.test(text)) return "tokenRejected";
    if (/not found|\bentity\b/i.test(text)) return "entityMissing";
    return "connectionTrouble";
  }
  function mapHaState(raw) {
    const n = normZustand(raw);
    if (!n) return null;
    if (Object.prototype.hasOwnProperty.call(ALIAS, n)) return ALIAS[n];
    if (KURZ_VON_CLIP[n]) return KURZ_VON_CLIP[n];
    if (KURZ[n]) return n;
    return null;
  }
  function normalisiereHaUrl(url) {
    const roh = String(url != null ? url : "").trim();
    if (!roh || roh.length > 500) return "";
    let x = roh;
    if (/^https:\/\//i.test(x)) x = "wss://" + x.slice("https://".length);
    else if (/^http:\/\//i.test(x)) x = "ws://" + x.slice("http://".length);
    if (!/^wss?:\/\//i.test(x)) return "";
    let parsed;
    try {
      parsed = new URL(x);
    } catch (e) {
      return "";
    }
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") return "";
    if (parsed.username || parsed.password) return "";
    parsed.hash = "";
    parsed.searchParams.delete("token");
    parsed.searchParams.delete("access_token");
    if (!parsed.pathname.includes("/api/websocket")) parsed.pathname = "/api/websocket";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/api/websocket";
    return parsed.toString();
  }
  function gueltigeEntity(id) {
    return /^[a-z0-9_]+\.[a-z0-9_]+$/.test(String(id != null ? id : "").trim());
  }
  var DIENST_TEIL = /^[a-z0-9_]+$/;
  function dienstAus(spec) {
    const s = String(spec != null ? spec : "").trim().toLowerCase();
    if (!s || s.length > 180) return null;
    if (s.includes("/")) {
      const teile = s.split("/");
      if (teile.length !== 2) return null;
      const parts = teile[0].trim().split(".");
      const ziel = teile[1].trim();
      if (parts.length !== 2 || !DIENST_TEIL.test(parts[0]) || !DIENST_TEIL.test(parts[1])) return null;
      if (!gueltigeEntity(ziel)) return null;
      return { domain: parts[0], service: parts[1], target: { entity_id: ziel } };
    }
    const entity_id = s.includes(".") ? s : `script.${s}`;
    if (!gueltigeEntity(entity_id)) return null;
    return { domain: "script", service: "turn_on", target: { entity_id } };
  }
  function skriptAufruf(id, spec) {
    const dienst = dienstAus(spec);
    if (!dienst) return null;
    return { id, type: "call_service", domain: dienst.domain, service: dienst.service, target: dienst.target };
  }
  function dienstAufruf(id, spec, data) {
    const msg = skriptAufruf(id, spec);
    if (!msg) return null;
    if (data && typeof data === "object") msg.service_data = data;
    return msg;
  }
  function startNachrichten(entityId, id0 = 1) {
    return [
      { id: id0, type: "get_states" },
      { id: id0 + 1, type: "subscribe_events", event_type: "state_changed" }
    ];
  }
  function deuteHa(data, entityId, art = null, mediaId = "") {
    var _a, _b, _c, _d;
    if (!data || typeof data !== "object") return [];
    if (data.type === "auth_required") return [{ typ: "auth_required" }];
    if (data.type === "auth_ok") return [{ typ: "auth_ok" }];
    if (data.type === "auth_invalid") return [{ typ: "auth_invalid", meldung: sichereMeldung(data.message || "tokenRejected") }];
    if (data.type === "result" && art === "get_states") {
      if (!data.success || !Array.isArray(data.result)) {
        return [{ typ: "fehler", meldung: sichereMeldung(((_a = data.error) == null ? void 0 : _a.message) || "statesUnreadable") }];
      }
      const out = [];
      const hit = data.result.find((e) => e && e.entity_id === entityId);
      if (!hit) out.push({ typ: "hinweis", meldung: "entityMissing" });
      else out.push({ typ: "zustand", zustand: hit.state, quelle: "snapshot", ton: false });
      if (mediaId && mediaId !== entityId) {
        const media = data.result.find((e) => e && e.entity_id === mediaId);
        if (media && media.state && media.state !== "unavailable" && media.state !== "unknown") {
          out.push({ typ: "medien", state: media.state, attr: media.attributes || {}, quelle: "snapshot" });
        } else out.push({ typ: "medien", state: "unavailable", attr: {}, quelle: "snapshot" });
      }
      return out;
    }
    if (data.type === "result" && data.success === false) {
      return [{ typ: "fehler", meldung: sichereMeldung(((_b = data.error) == null ? void 0 : _b.message) || "callFailed") }];
    }
    if (data.type === "event") {
      const ev = data.event || {};
      const neu = ev.data;
      if (mediaId && mediaId !== entityId && neu && neu.entity_id === mediaId) {
        const lebend = neu.new_state && neu.new_state.state && neu.new_state.state !== "unavailable" && neu.new_state.state !== "unknown";
        if (!lebend) return [{ typ: "medien", state: "unavailable", attr: {}, quelle: "event" }];
        return [{ typ: "medien", state: neu.new_state.state, attr: neu.new_state.attributes || {}, quelle: "event" }];
      }
      if (neu && neu.entity_id === entityId && neu.new_state && typeof neu.new_state.state === "string") {
        return [{ typ: "zustand", zustand: neu.new_state.state, quelle: "event", ton: true }];
      }
      const trig = (_d = (_c = ev.variables) == null ? void 0 : _c.trigger) == null ? void 0 : _d.to_state;
      if (trig && typeof trig.state === "string" && (!trig.entity_id || trig.entity_id === entityId)) {
        return [{ typ: "zustand", zustand: trig.state, quelle: "trigger", ton: true }];
      }
    }
    return [];
  }
  function mappe(aktion) {
    if (aktion.typ !== "zustand") return aktion;
    const kurz = mapHaState(aktion.zustand);
    if (!kurz) return null;
    return __spreadProps(__spreadValues({}, aktion), { zustand: kurz, roh: aktion.zustand });
  }
  function zustandsliste(data, art) {
    if (!data || typeof data !== "object") return null;
    if (data.type === "result" && art === "get_states" && data.success && Array.isArray(data.result)) {
      return data.result.filter((e) => e && e.entity_id).map((e) => ({
        entity_id: e.entity_id,
        state: e.state,
        attributes: e.attributes || {}
      }));
    }
    if (data.type === "event") {
      const neu = data.event && data.event.data;
      if (neu && neu.entity_id && neu.new_state) {
        return [{ entity_id: neu.entity_id, state: neu.new_state.state, attributes: neu.new_state.attributes || {} }];
      }
    }
    return null;
  }
  function verbindeHa(opts) {
    const {
      url,
      token,
      entityId,
      mediaEntity = "",
      onZustand,
      onMedien,
      onStatus,
      onStates,
      socketFactory = (u) => new WebSocket(u),
      reconnect = true
    } = opts;
    let stopped = false;
    let ws = null;
    let naechsteId = 1;
    let timer = null;
    const wartet = /* @__PURE__ */ new Map();
    const antworten = /* @__PURE__ */ new Map();
    const status = (name, extra) => onStatus == null ? void 0 : onStatus(__spreadValues({ status: name }, extra));
    const send = (msg, art) => {
      if (msg.id == null) msg.id = naechsteId++;
      else naechsteId = Math.max(naechsteId, msg.id + 1);
      if (art) wartet.set(msg.id, art);
      ws.send(JSON.stringify(msg));
    };
    const behandle = (data) => {
      const art = data && data.id != null ? wartet.get(data.id) : null;
      let angefragt = false;
      if (data && data.id != null && antworten.has(data.id)) {
        angefragt = true;
        const loesen = antworten.get(data.id);
        antworten.delete(data.id);
        loesen(data.success === false ? null : data.result || data);
      }
      if (data && data.id != null) wartet.delete(data.id);
      const liste2 = zustandsliste(data, art);
      if (liste2 && onStates) onStates(liste2);
      for (const roh of deuteHa(data, entityId, art, mediaEntity)) {
        if (angefragt && (roh.typ === "fehler" || roh.typ === "hinweis")) continue;
        const aktion = mappe(roh);
        if (!aktion) continue;
        if (aktion.typ === "auth_required") {
          ws.send(JSON.stringify({ type: "auth", access_token: token }));
        } else if (aktion.typ === "auth_ok") {
          status("verbunden");
          const [stati, abo] = startNachrichten(entityId, naechsteId);
          send(stati, "get_states");
          send(abo, "subscribe");
        } else if (aktion.typ === "auth_invalid") {
          status("auth_ungueltig", { meldung: aktion.meldung });
          stopped = true;
          try {
            ws.close();
          } catch (e) {
          }
        } else if (aktion.typ === "zustand") {
          onZustand == null ? void 0 : onZustand(aktion);
        } else if (aktion.typ === "medien") {
          onMedien == null ? void 0 : onMedien(aktion);
        } else if (aktion.typ === "fehler") {
          status("fehler", { meldung: aktion.meldung });
        } else if (aktion.typ === "hinweis") {
          status("verbunden", { meldung: aktion.meldung });
        }
      }
    };
    const connect = () => {
      if (stopped) return;
      status("verbinde");
      try {
        ws = socketFactory(url);
      } catch (e) {
        status("fehler", { meldung: (e == null ? void 0 : e.message) || "connectFailed" });
        schedule();
        return;
      }
      ws.onopen = () => status("offen");
      ws.onmessage = (m) => {
        let data;
        try {
          data = JSON.parse(typeof m.data === "string" ? m.data : "");
        } catch (e) {
          return;
        }
        behandle(data);
      };
      ws.onerror = () => {
      };
      ws.onclose = () => {
        wartet.clear();
        if (stopped) return;
        status("getrennt");
        schedule();
      };
    };
    const schedule = () => {
      if (stopped || !reconnect) return;
      clearTimeout(timer);
      timer = setTimeout(connect, 5e3);
    };
    connect();
    return {
      stop() {
        stopped = true;
        clearTimeout(timer);
        try {
          ws == null ? void 0 : ws.close();
        } catch (e) {
        }
      },
      callScript(spec) {
        return this.callService(spec);
      },
      callService(spec, data) {
        const msg = dienstAufruf(naechsteId, spec, data);
        if (!msg || !ws || ws.readyState !== 1) return false;
        send(msg, "call");
        return true;
      },
      anfragen(msg) {
        return new Promise((resolve) => {
          if (!msg || !ws || ws.readyState !== 1) {
            resolve(null);
            return;
          }
          const id = naechsteId++;
          antworten.set(id, resolve);
          try {
            ws.send(JSON.stringify(__spreadProps(__spreadValues({}, msg), { id })));
          } catch (e) {
            antworten.delete(id);
            resolve(null);
            return;
          }
          setTimeout(() => {
            if (!antworten.has(id)) return;
            antworten.delete(id);
            resolve(null);
          }, 8e3);
        });
      }
    };
  }
  function mockHa(onZustand, onStatus, onMedien, opt) {
    const extra = typeof opt === "function" ? { onStates: opt } : opt || {};
    onStatus == null ? void 0 : onStatus({ status: "mock" });
    if (extra.onStates && extra.states) extra.onStates(Object.values(extra.states));
    return {
      mock: true,
      stop() {
      },
      einspeisenMedien(state, attr) {
        onMedien == null ? void 0 : onMedien({ typ: "medien", state, attr: attr || {}, quelle: "mock" });
      },
      callScript(spec) {
        return this.callService(spec);
      },
      callService(spec, data) {
        var _a;
        const msg = dienstAufruf(1, spec, data);
        onStatus == null ? void 0 : onStatus({
          status: "mock",
          letzterAufruf: ((_a = msg == null ? void 0 : msg.target) == null ? void 0 : _a.entity_id) || "",
          aufrufOk: !!msg,
          serviceData: (msg == null ? void 0 : msg.service_data) || null
        });
        return !!msg;
      },
      anfragen(msg) {
        const id = msg && (msg.target && msg.target.entity_id);
        if (msg && msg.domain === "calendar" && msg.service === "get_events") {
          const events = extra.events && extra.events[id] || [];
          return Promise.resolve({ service_response: { [id]: { events } } });
        }
        if (msg && msg.domain === "weather" && msg.service === "get_forecasts") {
          const forecast = [{ temperature: 6, templow: 1 }];
          return Promise.resolve({ service_response: { [id]: { forecast } } });
        }
        return Promise.resolve(null);
      },
      einspeisen(roh) {
        const zustand = mapHaState(roh);
        if (!zustand) return false;
        onZustand == null ? void 0 : onZustand({ typ: "zustand", zustand, roh: String(roh), quelle: "mock", ton: true });
        return true;
      }
    };
  }

  // web/dashboard.js
  var DASH_VORGABE = {
    weather: "weather.home",
    outdoorTemp: "sensor.outdoor_temperature",
    calendars: ["calendar.family"],
    waste: ["calendar.waste"],
    windows: ["binary_sensor.kitchen_window"],
    indoor: ["sensor.living_room_temperature"],
    rain: "binary_sensor.rain",
    wind: "sensor.wind_speed",
    brightness: "sensor.outdoor_brightness",
    allOff: "script.eye_all_off",
    guardToggle: "script.eye_guard_toggle",
    guard: "input_boolean.eye_guard",
    coldC: 5,
    buttons: [],
    contacts: "",
    contactsHeaderAttr: "header",
    contactGroups: [],
    wasteTomorrow: "",
    energyPv: "",
    energyDay: "",
    energyGrid: "",
    energyFeed: "",
    energyAutonomy: ""
  };
  var ENTITY = /^[a-z0-9_]+\.[a-z0-9_]+$/;
  function entity(id) {
    const v = String(id || "").trim().toLowerCase();
    return ENTITY.test(v) ? v : "";
  }
  function liste(value) {
    const roh = Array.isArray(value) ? value : String(value || "").split(/[\n,]+/);
    const out = [];
    for (const teil of roh) {
      const id = entity(teil);
      if (id && !out.includes(id)) out.push(id);
    }
    return out;
  }
  function knoepfe(raw) {
    const rows = Array.isArray(raw) ? raw : String(raw || "").split(/\n+/);
    const out = [];
    for (const row of rows) {
      if (out.length >= 12) break;
      if (row && typeof row === "object") {
        const label2 = String(row.label || "").trim().slice(0, 40);
        const ziel2 = String(row.ziel || row.service || "").trim().slice(0, 240);
        if (label2 && ziel2) out.push({ label: label2, ziel: ziel2 });
        continue;
      }
      const line = String(row || "").trim();
      const cut = line.indexOf("|");
      if (cut < 1) continue;
      const label = line.slice(0, cut).trim().slice(0, 40);
      const ziel = line.slice(cut + 1).trim().slice(0, 240);
      if (label && ziel) out.push({ label, ziel });
    }
    return out;
  }
  function normDash(raw) {
    const d = {
      weather: DASH_VORGABE.weather,
      outdoorTemp: DASH_VORGABE.outdoorTemp,
      calendars: DASH_VORGABE.calendars.slice(),
      waste: DASH_VORGABE.waste.slice(),
      windows: DASH_VORGABE.windows.slice(),
      indoor: DASH_VORGABE.indoor.slice(),
      rain: DASH_VORGABE.rain,
      wind: DASH_VORGABE.wind,
      brightness: DASH_VORGABE.brightness,
      allOff: DASH_VORGABE.allOff,
      guardToggle: DASH_VORGABE.guardToggle,
      guard: DASH_VORGABE.guard,
      coldC: DASH_VORGABE.coldC,
      buttons: [],
      contacts: "",
      contactsHeaderAttr: "header",
      contactGroups: [],
      wasteTomorrow: "",
      energyPv: "",
      energyDay: "",
      energyGrid: "",
      energyFeed: "",
      energyAutonomy: ""
    };
    if (!raw || typeof raw !== "object") return d;
    if ("weather" in raw) d.weather = entity(raw.weather);
    if ("outdoorTemp" in raw) d.outdoorTemp = entity(raw.outdoorTemp);
    if ("calendars" in raw) d.calendars = liste(raw.calendars);
    if ("waste" in raw) d.waste = liste(raw.waste);
    if ("windows" in raw) d.windows = liste(raw.windows);
    if ("indoor" in raw) d.indoor = liste(raw.indoor);
    if ("rain" in raw) d.rain = entity(raw.rain);
    if ("wind" in raw) d.wind = entity(raw.wind);
    if ("brightness" in raw) d.brightness = entity(raw.brightness);
    if ("allOff" in raw) d.allOff = entity(raw.allOff);
    if ("guardToggle" in raw) d.guardToggle = entity(raw.guardToggle);
    if ("guard" in raw) d.guard = entity(raw.guard);
    if ("coldC" in raw) {
      const n = Number(raw.coldC);
      d.coldC = Number.isFinite(n) ? Math.max(-40, Math.min(40, n)) : DASH_VORGABE.coldC;
    }
    if ("buttons" in raw) d.buttons = knoepfe(raw.buttons);
    if ("contacts" in raw) d.contacts = entity(raw.contacts);
    if ("contactsHeaderAttr" in raw) {
      const attr = String(raw.contactsHeaderAttr || "").trim().slice(0, 40);
      d.contactsHeaderAttr = /^[a-zA-Z0-9_]+$/.test(attr) ? attr : "header";
    }
    if ("contactGroups" in raw) d.contactGroups = liste(raw.contactGroups);
    if ("wasteTomorrow" in raw) d.wasteTomorrow = entity(raw.wasteTomorrow);
    if ("energyPv" in raw) d.energyPv = entity(raw.energyPv);
    if ("energyDay" in raw) d.energyDay = entity(raw.energyDay);
    if ("energyGrid" in raw) d.energyGrid = entity(raw.energyGrid);
    if ("energyFeed" in raw) d.energyFeed = entity(raw.energyFeed);
    if ("energyAutonomy" in raw) d.energyAutonomy = entity(raw.energyAutonomy);
    return d;
  }
  function entityDa(states, id) {
    if (!id || !states) return false;
    return Object.prototype.hasOwnProperty.call(states, id);
  }
  function istLeer(state) {
    const s = String(state != null ? state : "").trim().toLowerCase();
    return !s || s === "unavailable" || s === "unknown" || s === "none" || s === "null";
  }
  function nameAusId(id) {
    const obj = String(id || "").split(".")[1] || String(id || "");
    const wort = obj.replace(/^waste_/, "").replace(/_/g, " ");
    return wort.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }
  function freundlich(entityState, id) {
    const name = entityState && entityState.attributes && entityState.attributes.friendly_name;
    return String(name || nameAusId(id)).trim() || nameAusId(id);
  }
  function zahl(value) {
    if (value == null || String(value).trim() === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const n = Number(String(value).trim().replace(",", ".").replace(/[^\d.+-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  function kurzZahl(n) {
    const r = Math.round(n * 10) / 10;
    return String(r);
  }
  function parseDatum(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || "").trim());
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  function tagVonDatum(value, jetzt = /* @__PURE__ */ new Date()) {
    const tag = parseDatum(value);
    if (!tag) return null;
    const start = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate());
    const diff = Math.round((tag - start) / 864e5);
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    return null;
  }
  function wortTag(value) {
    const s = String(value || "").trim().toLowerCase();
    if (s === "today" || s === "heute") return "today";
    if (s === "tomorrow" || s === "morgen") return "tomorrow";
    return null;
  }
  function binAusTitel(summary) {
    let s = String(summary || "").replace(/\s+/g, " ").trim();
    s = s.replace(/^\d{4}-\d{2}-\d{2}\s*/, "");
    s = s.replace(/^(waste|bin|müll|muell|abfall|tonne)\s*[:\-]\s*/i, "");
    s = s.replace(/\b(abholung|collection|pickup|leerung|abfuhr)\b/ig, "");
    s = s.replace(/\s+/g, " ").replace(/^[,.:\-]+|[,.:\-]+$/g, "").trim();
    return s || String(summary || "").trim();
  }
  function wasteVonSensor(entityState, jetzt = /* @__PURE__ */ new Date()) {
    var _a, _b;
    if (!entityState || istLeer(entityState.state)) return null;
    const attr = entityState.attributes || {};
    const name = freundlich(entityState, entityState.entity_id);
    const werte = [entityState.state, attr.next_date, attr.next, attr.date];
    for (const wert of werte) {
      const when = tagVonDatum(wert, jetzt) || wortTag(wert);
      if (when) return { name, when };
    }
    if (attr.days != null || attr.days_to != null || attr.daysTo != null) {
      const n = Number((_b = (_a = attr.days) != null ? _a : attr.days_to) != null ? _b : attr.daysTo);
      if (n === 0) return { name, when: "today" };
      if (n === 1) return { name, when: "tomorrow" };
    }
    return null;
  }
  function zielEntity(spec) {
    const dienst = dienstAus(spec);
    return dienst && dienst.target && dienst.target.entity_id || "";
  }
  function vorhanden(states, id) {
    if (!id || !states[id]) return false;
    return !istLeer(states[id].state);
  }
  function istKalt(temp, condition, schwelle = 5) {
    const c = String(condition || "").toLowerCase();
    if (/snow|sleet|hail|ice|frost|schnee|hagel|eis/.test(c)) return true;
    const n = typeof temp === "number" ? temp : zahl(temp);
    const grenze = Number(schwelle);
    return Number.isFinite(n) && Number.isFinite(grenze) && n < grenze;
  }
  function ereignisseAus(result, entityId) {
    if (!result || typeof result !== "object") return [];
    const layer = result.service_response || result.response || result;
    if (!layer || typeof layer !== "object") return [];
    const block = entityId && layer[entityId] ? layer[entityId] : layer;
    const events = block && (block.events || (Array.isArray(block) ? block : null));
    return Array.isArray(events) ? events : [];
  }
  function kalenderNachricht(entityId, start, end) {
    return {
      type: "call_service",
      domain: "calendar",
      service: "get_events",
      target: { entity_id: entityId },
      service_data: { start_date_time: start, end_date_time: end },
      return_response: true
    };
  }
  function wetterNachricht(entityId) {
    return {
      type: "call_service",
      domain: "weather",
      service: "get_forecasts",
      target: { entity_id: entityId },
      service_data: { type: "daily" },
      return_response: true
    };
  }
  function uhrzeit(value) {
    const m = /T(\d{2}:\d{2})/.exec(String(value || ""));
    return m ? m[1] : "";
  }
  function messung(states, id) {
    if (!id || !states[id] || istLeer(states[id].state)) return null;
    const e = states[id];
    const n = zahl(e.state);
    const unit = e.attributes && e.attributes.unit_of_measurement || "";
    const text = n == null ? String(e.state) : `${kurzZahl(n)}${unit ? ` ${unit}` : ""}`;
    return { name: freundlich(e, id), text };
  }
  function baueDashboard(states, dash, extras = {}) {
    var _a, _b, _c, _d;
    const map = states || {};
    const cfg = normDash(dash || DASH_VORGABE);
    const jetzt = extras.jetzt || /* @__PURE__ */ new Date();
    const events = extras.events || {};
    const w = cfg.weather && map[cfg.weather];
    const tempE = cfg.outdoorTemp && map[cfg.outdoorTemp];
    const wOk = !!(w && !istLeer(w.state));
    const tOk = !!(tempE && !istLeer(tempE.state) && zahl(tempE.state) != null);
    let weather = null;
    if (wOk || tOk) {
      const attr = w && w.attributes || {};
      const tag = extras.forecast && extras.forecast[0] || attr.forecast && attr.forecast[0] || {};
      weather = {
        condition: wOk ? String(w.state) : "",
        temp: tOk ? zahl(tempE.state) : attr.temperature != null ? zahl(attr.temperature) : null,
        high: zahl((_b = (_a = tag.temperature) != null ? _a : tag.high) != null ? _b : attr.forecast_max),
        low: zahl((_d = (_c = tag.templow) != null ? _c : tag.low) != null ? _d : attr.forecast_min),
        unit: tempE && tempE.attributes && tempE.attributes.unit_of_measurement || attr.temperature_unit || "\xB0C"
      };
    }
    const wasteIds = new Set(cfg.waste.filter((id) => id.startsWith("calendar.")));
    const termine = [];
    for (const id of cfg.calendars) {
      if (wasteIds.has(id)) continue;
      const listeE = events[id] || [];
      const ent = map[id];
      if ((!ent || istLeer(ent.state)) && !listeE.length) continue;
      for (const ev of listeE) {
        const when = tagVonDatum(ev.start || ev.start_time, jetzt);
        if (!when) continue;
        const summary = String(ev.summary || ev.title || "").trim();
        if (!summary) continue;
        termine.push({ summary, when, time: uhrzeit(ev.start || ev.start_time) });
      }
    }
    const waste = /* @__PURE__ */ new Map();
    const merk = (item) => {
      if (!item || !item.name) return;
      const alt = waste.get(item.name);
      if (!alt || alt.when === "tomorrow" && item.when === "today") waste.set(item.name, item);
    };
    for (const id of cfg.waste) {
      if (id.startsWith("calendar.")) {
        for (const ev of events[id] || []) {
          const when = tagVonDatum(ev.start || ev.start_time, jetzt);
          if (!when) continue;
          merk({ name: binAusTitel(ev.summary || ev.title || ""), when });
        }
      } else merk(wasteVonSensor(map[id], jetzt));
    }
    const windows = [];
    for (const id of cfg.windows) {
      const e = map[id];
      if (!e || istLeer(e.state)) continue;
      if (e.state === "on" || e.state === "open") windows.push(freundlich(e, id));
    }
    const indoor = [];
    for (const id of cfg.indoor) {
      const m = messung(map, id);
      if (m && zahl(map[id].state) != null) indoor.push(m);
    }
    const rainE = cfg.rain && map[cfg.rain];
    const rain = rainE && !istLeer(rainE.state) ? { name: freundlich(rainE, cfg.rain), on: rainE.state === "on" } : null;
    const buttons = [];
    if (vorhanden(map, cfg.allOff)) buttons.push({ id: "all_off", ziel: cfg.allOff, kind: "all_off" });
    let guard = null;
    if (vorhanden(map, cfg.guardToggle) && vorhanden(map, cfg.guard)) {
      guard = map[cfg.guard].state === "on";
      buttons.push({ id: "guard", ziel: cfg.guardToggle, kind: "guard", on: guard });
    }
    for (const knopf2 of cfg.buttons) {
      const ziel = zielEntity(knopf2.ziel);
      if (!ziel || !vorhanden(map, ziel)) continue;
      buttons.push({ id: "extra", label: knopf2.label, ziel: knopf2.ziel, kind: "extra" });
    }
    return {
      weather,
      events: termine,
      waste: [...waste.values()],
      windows,
      indoor,
      rain,
      wind: messung(map, cfg.wind),
      brightness: messung(map, cfg.brightness),
      guard,
      cold: istKalt(weather && weather.temp, weather && weather.condition, cfg.coldC),
      buttons
    };
  }
  function isoTag(jetzt, offset) {
    const d = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + offset);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }
  function mockZustaende() {
    return {
      "weather.home": { entity_id: "weather.home", state: "snowy", attributes: { temperature: 3, temperature_unit: "\xB0C", friendly_name: "Home" } },
      "sensor.outdoor_temperature": { entity_id: "sensor.outdoor_temperature", state: "3.0", attributes: { unit_of_measurement: "\xB0C", friendly_name: "Outdoor" } },
      "calendar.family": { entity_id: "calendar.family", state: "off", attributes: { friendly_name: "Family" } },
      "calendar.waste": { entity_id: "calendar.waste", state: "off", attributes: { friendly_name: "Waste" } },
      "binary_sensor.kitchen_window": { entity_id: "binary_sensor.kitchen_window", state: "on", attributes: { friendly_name: "Kitchen window" } },
      "sensor.living_room_temperature": { entity_id: "sensor.living_room_temperature", state: "21.5", attributes: { unit_of_measurement: "\xB0C", friendly_name: "Living room" } },
      "binary_sensor.rain": { entity_id: "binary_sensor.rain", state: "on", attributes: { friendly_name: "Rain" } },
      "sensor.wind_speed": { entity_id: "sensor.wind_speed", state: "18", attributes: { unit_of_measurement: "km/h", friendly_name: "Wind" } },
      "sensor.outdoor_brightness": { entity_id: "sensor.outdoor_brightness", state: "4200", attributes: { unit_of_measurement: "lx", friendly_name: "Brightness" } },
      "script.eye_all_off": { entity_id: "script.eye_all_off", state: "off", attributes: {} },
      "script.eye_guard_toggle": { entity_id: "script.eye_guard_toggle", state: "off", attributes: {} },
      "input_boolean.eye_guard": { entity_id: "input_boolean.eye_guard", state: "off", attributes: { friendly_name: "Guard" } },
      "binary_sensor.front_door": { entity_id: "binary_sensor.front_door", state: "off", attributes: { friendly_name: "Front door" } },
      "camera.courtyard": { entity_id: "camera.courtyard", state: "idle", attributes: { friendly_name: "Courtyard" } }
    };
  }
  function mockEreignisse(jetzt = /* @__PURE__ */ new Date()) {
    return {
      "calendar.family": [{ summary: "School", start: `${isoTag(jetzt, 0)}T15:00:00` }],
      "calendar.waste": [
        { summary: "Paper bin collection", start: isoTag(jetzt, 0) },
        { summary: "Bio", start: isoTag(jetzt, 1) },
        { summary: "Rest", start: isoTag(jetzt, 3) }
      ]
    };
  }
  function zeichneDashboard(root, model, t, onPress) {
    const doc = root.ownerDocument;
    root.replaceChildren();
    const block = (title, node) => {
      if (!node) return;
      const h = doc.createElement("h2");
      h.textContent = title;
      root.append(h, node);
    };
    const zeile2 = (text) => {
      const p = doc.createElement("p");
      p.textContent = text;
      return p;
    };
    if (model.weather) {
      const w = model.weather;
      const bits = [];
      if (w.condition) bits.push(w.condition);
      if (w.temp != null) bits.push(`${kurzZahl(w.temp)} ${w.unit}`);
      const extra = [];
      if (w.high != null) extra.push(`${t("dash.high")} ${kurzZahl(w.high)}\xB0`);
      if (w.low != null) extra.push(`${t("dash.low")} ${kurzZahl(w.low)}\xB0`);
      const wrap2 = doc.createElement("div");
      wrap2.append(zeile2(bits.join(" \xB7 ") || t("dash.weather")));
      if (extra.length) wrap2.append(zeile2(extra.join("  ")));
      block(t("dash.weather"), wrap2);
    }
    if (model.events.length) {
      const ul = doc.createElement("ul");
      for (const ev of model.events) {
        const li = doc.createElement("li");
        const wann = t(ev.when === "tomorrow" ? "dash.tomorrow" : "dash.today");
        li.textContent = ev.time ? `${ev.summary} \xB7 ${wann} ${ev.time}` : `${ev.summary} \xB7 ${wann}`;
        ul.append(li);
      }
      block(t("dash.calendar"), ul);
    }
    if (model.waste.length) {
      const ul = doc.createElement("ul");
      for (const bin of model.waste) {
        const li = doc.createElement("li");
        li.textContent = `${bin.name} \xB7 ${t(bin.when === "tomorrow" ? "dash.tomorrow" : "dash.today")}`;
        ul.append(li);
      }
      block(t("dash.waste"), ul);
    }
    if (model.windows.length) block(t("dash.windows"), zeile2(model.windows.join(", ")));
    if (model.indoor.length) {
      const grid = doc.createElement("div");
      grid.className = "dash-grid";
      for (const raum of model.indoor) {
        const cell = doc.createElement("span");
        cell.textContent = `${raum.name} ${raum.text}`;
        grid.append(cell);
      }
      block(t("dash.indoor"), grid);
    }
    const aussen = [];
    if (model.rain) aussen.push(`${model.rain.name} \xB7 ${t(model.rain.on ? "dash.rainOn" : "dash.rainOff")}`);
    if (model.wind) aussen.push(`${model.wind.name} ${model.wind.text}`);
    if (model.brightness) aussen.push(`${model.brightness.name} ${model.brightness.text}`);
    if (aussen.length) {
      const grid = doc.createElement("div");
      grid.className = "dash-grid";
      for (const text of aussen) {
        const cell = doc.createElement("span");
        cell.textContent = text;
        grid.append(cell);
      }
      block(t("dash.outdoor"), grid);
    }
    if (model.buttons.length) {
      const row = doc.createElement("div");
      row.className = "dash-actions";
      for (const knopf2 of model.buttons) {
        const b = doc.createElement("button");
        b.type = "button";
        if (knopf2.kind === "all_off") b.textContent = t("dash.allOff");
        else if (knopf2.kind === "guard") b.textContent = t(knopf2.on ? "dash.guardOn" : "dash.guardOff");
        else b.textContent = knopf2.label;
        b.addEventListener("click", () => onPress(knopf2));
        row.append(b);
      }
      root.append(row);
    }
  }

  // web/gesten.js
  var ECK = 128;
  var ADMIN_TAPS = 5;
  var ADMIN_FENSTER_MS = 2e3;
  var TAP_WARTE_MS = 350;
  var HALTEN_MS = 800;
  function eckName(x, y, w, h, size = ECK, inset = null) {
    if (!(w > 0) || !(h > 0)) return null;
    if (x < 0 || y < 0 || x > w || y > h) return null;
    const ins = inset || {};
    const links = x < (ins.l || 0) + size;
    const rechts = x > w - (ins.r || 0) - size;
    const oben = y < (ins.t || 0) + size;
    const unten = y > h - (ins.b || 0) - size;
    if (links && oben) return "tl";
    if (rechts && oben) return "tr";
    if (links && unten) return "bl";
    if (rechts && unten) return "br";
    return null;
  }
  function zoneFuer(x, y, w, h, size = ECK, inset = null) {
    if (eckName(x, y, w, h, size, inset) || w <= 0 || h <= 0) return null;
    if (x < w * 0.22) return y < h * 0.5 ? "musik_an" : "musik_aus";
    if (x > w * 0.78) return y < h * 0.5 ? "licht_an" : "licht_aus";
    return null;
  }
  function wisch(dx, dy, schwelle = 70) {
    if (Math.hypot(dx, dy) < schwelle) return null;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy < 0 ? "up" : "down";
  }
  function randUnten(h, insetBottom = 0) {
    return Math.min(120, Math.max(72, (insetBottom || 0) + 56));
  }
  function wischAktion(dx, dy, startY, h, insetBottom = 0) {
    const dir = wisch(dx, dy);
    if (dir === "up" && h > 0 && startY >= h - randUnten(h, insetBottom)) return "settings";
    return dir;
  }
  function createAdminTaps(opt = {}) {
    var _a, _b, _c, _d, _e;
    const fenster = (_a = opt.fenster) != null ? _a : ADMIN_FENSTER_MS;
    const warte = (_b = opt.warte) != null ? _b : TAP_WARTE_MS;
    const ziel = (_c = opt.ziel) != null ? _c : ADMIN_TAPS;
    const setzen = (_d = opt.setzen) != null ? _d : setTimeout;
    const loeschen = (_e = opt.loeschen) != null ? _e : clearTimeout;
    let taps = [];
    let timer = null;
    return {
      tipp(jetzt, onAdmin, onPrimary) {
        taps = taps.filter((t) => jetzt - t <= fenster);
        taps.push(jetzt);
        if (timer != null) loeschen(timer);
        timer = null;
        if (taps.length >= ziel) {
          taps = [];
          onAdmin();
          return "admin";
        }
        const n = taps.length;
        timer = setzen(() => {
          timer = null;
          taps = [];
          onPrimary(n);
        }, warte);
        return "wait";
      },
      abbruch() {
        if (timer != null) loeschen(timer);
        timer = null;
        taps = [];
      }
    };
  }

  // web/strings.js
  var CAPTION_TIMING = { boredAfterMs: 18e3 };
  var CAPTIONS = {
    en: {
      idle: { text: "I'm bored." },
      hallo: { text: "Hi." },
      blicke: { text: "Just looking." },
      zuhoeren: { text: "Listening\u2026" },
      nachdenken: { text: "Thinking", dots: true },
      verstanden: { text: "Got it." },
      erledigt: { text: "All done." },
      nicht_verstanden: { text: "Come again?" },
      fehler: { text: "That broke." },
      angry: { text: "Intruder?" },
      sprechen: { text: "Speaking\u2026" },
      stoerung: { text: "One moment." },
      schlafen: { text: "Going quiet." },
      lachen: { text: "Ha." },
      musik_an: { text: "Music on." },
      licht_an: { text: "Lights on." },
      licht_aus: { text: "Lights out." }
    },
    de: {
      idle: { text: "Bin gelangweilt." },
      hallo: { text: "Hi." },
      blicke: { text: "Ich schau nur." },
      zuhoeren: { text: "H\xF6r zu\u2026" },
      nachdenken: { text: "Denke nach", dots: true },
      verstanden: { text: "Verstanden." },
      erledigt: { text: "Erledigt." },
      nicht_verstanden: { text: "Wie bitte?" },
      fehler: { text: "Das ging schief." },
      angry: { text: "Wer da?" },
      sprechen: { text: "Spreche\u2026" },
      stoerung: { text: "Einen Moment." },
      schlafen: { text: "Ich d\xF6se." },
      lachen: { text: "Haha." },
      musik_an: { text: "Musik an." },
      licht_an: { text: "Licht an." },
      licht_aus: { text: "Licht aus." }
    }
  };
  var DETAILS = {
    en: {
      idle: "Waiting quietly.",
      hallo: "Saying hello.",
      blicke: "Looking around.",
      zuhoeren: "Listening for what comes next.",
      nachdenken: "Working on an answer.",
      verstanden: "Showing that it understood.",
      erledigt: "Showing that the task is finished.",
      nicht_verstanden: "Asking for that again.",
      fehler: "Showing that something failed.",
      angry: "Warning that someone may be at the door.",
      sprechen: "Talking, with the speaking light.",
      stoerung: "The connection needs a moment.",
      schlafen: "Resting until the next tap.",
      lachen: "Laughing.",
      musik_an: "Starting the music.",
      licht_an: "Turning the lights on.",
      licht_aus: "Turning the lights off."
    },
    de: {
      idle: "Wartet still.",
      hallo: "Sagt hallo.",
      blicke: "Schaut sich um.",
      zuhoeren: "H\xF6rt auf das N\xE4chste.",
      nachdenken: "Arbeitet an einer Antwort.",
      verstanden: "Zeigt, dass es verstanden hat.",
      erledigt: "Zeigt, dass die Aufgabe fertig ist.",
      nicht_verstanden: "Bittet darum, es zu wiederholen.",
      fehler: "Zeigt, dass etwas schiefging.",
      angry: "Warnt, dass jemand an der T\xFCr sein k\xF6nnte.",
      sprechen: "Spricht, mit dem Sprechlicht.",
      stoerung: "Die Verbindung braucht einen Moment.",
      schlafen: "Ruht, bis wieder jemand tippt.",
      lachen: "Lacht.",
      musik_an: "Startet die Musik.",
      licht_an: "Schaltet das Licht ein.",
      licht_aus: "Schaltet das Licht aus."
    }
  };
  var UI = {
    en: {
      "app.title": "Grok Bot Home Assistant UI",
      "app.shortTitle": "Grok Bot",
      "app.canvas": "Animated eyes",
      "settings.title": "Settings",
      "settings.intro": "Five taps in the top-left corner open settings. The token stays in this browser.",
      "settings.profilePhone": "Phone",
      "settings.profileTablet": "Tablet",
      "settings.disclaimer": "Unofficial community project. Not affiliated with xAI or Home Assistant.",
      "status.aus": "Not set up",
      "status.verbinde": "Connecting\u2026",
      "status.offen": "Socket open",
      "status.verbunden": "Connected",
      "status.getrennt": "Disconnected, retrying",
      "status.auth_ungueltig": "Token rejected",
      "status.fehler": "Error",
      "status.mock": "Preview, no Home Assistant",
      "detail.tokenRejected": "Token was rejected",
      "detail.statesUnreadable": "Could not read states",
      "detail.entityMissing": "Entity not found",
      "detail.entityMissingConfig": "Entity missing",
      "detail.callFailed": "Call failed",
      "detail.connectFailed": "Connection failed",
      "detail.called": "Called {name}",
      "detail.notSet": "Command is not set",
      "detail.eyesOnly": "Not connected. Eyes only.",
      "detail.eyesOnlyOffline": "Home Assistant is not set up. Eyes only.",
      "detail.tokenMissing": "Token missing",
      "detail.connectionTrouble": "Connection needs a moment",
      "group.connection": "Home Assistant",
      "group.commands": "Commands",
      "group.display": "Display",
      "group.states": "States",
      "ha.url": "Address",
      "ha.token": "Long-lived token",
      "ha.forget": "Delete the saved token",
      "ha.entity": "State entity",
      "ph.url": "ws://homeassistant.local:8123/api/websocket",
      "ph.tokenReplace": "Saved. Fill in only to replace it.",
      "ph.tokenEmpty": "Long-lived token from the Home Assistant profile",
      "ph.entity": "input_select.eye_ui_state",
      "cmd.help": "A script entity, or a service and a target, such as script.eye_music_on or light.turn_on/light.living_room.",
      "cmd.musicOn": "Music on",
      "cmd.musicOff": "Music off",
      "cmd.lightsOn": "Lights on",
      "cmd.lightsOff": "Lights off",
      "display.language": "Language",
      "display.mode": "View",
      "display.sleep": "Sleep after minutes (0 = never)",
      "display.sound": "Sound",
      "display.stateName": "State name",
      "display.caption": "Status line",
      "display.captionHelp": "A short line under the eyes. Tap it for details. When it is off, a faint mark at the bottom brings it back.",
      "display.clock": "Clock",
      "display.nowPlaying": "Now playing",
      "np.entity": "Media player",
      "np.help": "Optional. While this player is playing, the line shows the title and artist. A year is added only when the player sends one. Leave it empty, or if the player is unavailable, the line stays hidden.",
      "ph.media": "media_player.living_room",
      "ph.service": "light.toggle/light.living_room",
      "gesture.group": "Gestures",
      "gesture.help": "Each swipe and the long press runs the action shown beside it. A swipe up that starts at the bottom edge still opens settings.",
      "gesture.left": "Swipe left",
      "gesture.right": "Swipe right",
      "gesture.up": "Swipe up",
      "gesture.down": "Swipe down",
      "gesture.long": "Long press",
      "gesture.act.none": "None",
      "gesture.act.music_toggle": "Music on/off",
      "gesture.act.light_toggle": "Lights on/off",
      "gesture.act.service": "Home Assistant service",
      "gesture.act.clock": "Toggle clock",
      "gesture.act.caption": "Toggle caption",
      "gesture.act.sheet": "Open quick sheet",
      "gesture.act.settings": "Open settings",
      "gesture.act.demo": "Demo mode",
      "gesture.act.view": "Next theme",
      "gesture.act.dashboard": "Home mode",
      "corner.group": "Corners",
      "corner.help": "Five taps in the top-left corner open settings.",
      "corner.tl": "Top left",
      "corner.tr": "Top right",
      "corner.bl": "Bottom left",
      "corner.br": "Bottom right",
      "corner.tap": "Tap",
      "corner.hold": "Hold",
      "sheet.details": "Details",
      "sheet.quick": "Quick settings",
      "sheet.state": "State",
      "sheet.since": "Since",
      "sheet.doing": "Doing",
      "sheet.connection": "Connection",
      "sheet.command": "Last command",
      "sheet.forSeconds": "for {n} seconds",
      "sheet.forSecond": "for 1 second",
      "sheet.forMinutes": "for {n} minutes",
      "sheet.forMinute": "for 1 minute",
      "sheet.noCommand": "None yet",
      "sheet.notSent": "not sent",
      "sheet.full": "All settings",
      "sheet.sleep": "Sleep timer, minutes",
      "caption.restore": "Show the status line",
      "credit.madeBy": "Made by",
      "lang.auto": "System",
      "lang.en": "English",
      "lang.de": "Deutsch",
      "mode.2d": "Cube",
      "mode.cute": "Cube",
      "mode.cube": "Cube",
      "mode.full": "Bold",
      "mode.bold": "Bold",
      "mode.led": "Fortune",
      "mode.fortune": "Fortune",
      "dim.after": "Dim after seconds",
      "dim.level": "Dim to percent",
      "dim.lead": "Minutes before sleep",
      "door.entity": "Door",
      "camera.entity": "Camera",
      "ph.door": "binary_sensor.front_door",
      "ph.camera": "camera.courtyard",
      "day.title": "My day",
      "day.empty": "Nothing else today",
      "cam.courtyard": "Courtyard",
      "np.prev": "Previous",
      "np.play": "Play",
      "np.pause": "Pause",
      "np.next": "Next",
      "np.upNext": "Up next",
      "demo.link": "Demo",
      "led.pitch": "Pitch",
      "led.gap": "Gap to diffuser",
      "led.cover": "Cover",
      "led.grid": "Show the LED grid",
      "help.gestures": "Swipes and the long press follow the gesture settings. The left edge is still music on and off, the right edge is still lights on and off. A tap in the middle only wakes the eyes. A swipe up from the bottom edge opens settings.",
      "help.keys": "Keys 1\u20130, then q, w, e, r, play the states. Arrow keys run the swipe actions. Space plays every state, m switches the view, i opens settings.",
      "help.keysSummary": "Keyboard, for a desktop",
      "help.external": "Help. Opens in a new tab.",
      "help.tip.ready": "These eyes follow a finger. A tap blinks them.",
      "help.tip.display": "Language, the theme, the clock, and the status line. Cube, Fortune, and Bold.",
      "help.tip.sound": "Sound plays after the first tap. The music state can play a demo track when no player is set.",
      "help.tip.ha": "The address, the token, and the entity that drives the eyes. The token stays on this device.",
      "help.tip.media": "Leave the player empty and the music state plays Orbit Drift. A player that is missing stays quiet.",
      "help.tip.gestures": "Swipe, or press and hold the eyes. Custom actions are a label plus a Home Assistant service.",
      "help.tip.corners": "Each corner has a tap and a hold. The hit area is larger, and it shows while this section is open.",
      "help.tip.commands": "Scripts for music and lights, or a service and a target.",
      "help.tip.states": "Tap a state to preview it here. Captions, color, and sound live under Advanced.",
      "help.tip.security": "A convenience lock. It is not real security. ?lock=reset on this device clears it.",
      "help.tip.demo": "Demo mode cycles the states with their lines and sounds.",
      "help.tip.advanced": "A caption in each language, a color, and a sound. Reset brings the originals back.",
      "custom.title": "Custom actions",
      "custom.help": "Label and service, such as light.toggle/light.hallway.",
      "custom.label": "Label",
      "custom.service": "Service",
      "custom.add": "Add action",
      "custom.remove": "Remove",
      "security.group": "Security",
      "security.lock": "Ask before opening settings",
      "security.help": "On this device only. ?lock=reset clears it.",
      "security.pin": "PIN or password",
      "security.again": "Repeat it",
      "security.mismatch": "Those two do not match.",
      "security.short": "Use at least four characters.",
      "security.unlock": "Unlock",
      "security.prompt": "Settings are locked on this device.",
      "security.wrong": "That does not match.",
      "demo.toggle": "Demo mode",
      "demo.help": "Loops the emotions, ends on music for 30 seconds, then starts again until you tap.",
      "demo.locked": "disabled in the demo",
      "advanced.summary": "Advanced",
      "advanced.help": "Caption, color, and sound for each state. Empty fields keep the original.",
      "advanced.corner": "Corner size",
      "advanced.captionEn": "English line",
      "advanced.captionDe": "German line",
      "advanced.color": "Color",
      "advanced.sound": "Sound",
      "advanced.defaultSound": "Original sound",
      "advanced.reset": "Reset states",
      "credits.open": "Credits",
      "credits.title": "Credits",
      "credits.short": "Credits and notices are on the project page.",
      "credits.page": "Project page",
      "credits.maintainer": "Maintainer",
      "credits.idea": "The first idea",
      "credits.repo": "Source code",
      "credits.support": "Support",
      "credits.soon": "coming soon",
      "credits.hvuz": "HERRVONUNDZU",
      "credits.licenses": "Licenses",
      "credits.mit": "The page is MIT, except the mark and the code of conduct.",
      "credits.mark": "The HVUZ mark is not under MIT.",
      "credits.track": "Orbit Drift is original and dedicated under CC0.",
      "credits.close": "Close",
      "version.label": "Version",
      "err.url": "Use a ws://, wss://, http://, or https:// address for Home Assistant.",
      "err.entity": "Write the entity as domain.object, for example input_select.eye_ui_state.",
      "action.save": "Save",
      "action.close": "Close",
      "action.tour": "Play all states",
      "action.fullscreen": "Fullscreen",
      "zone.settings": "Settings",
      "zone.musicOn": "Music on",
      "zone.musicOff": "Music off",
      "zone.lightsOn": "Lights on",
      "zone.lightsOff": "Lights out",
      "state.schlafen": "Sleep",
      "state.hallo": "Hi",
      "state.idle": "Idle",
      "state.blicke": "Glance",
      "state.zuhoeren": "Listen",
      "state.nachdenken": "Think",
      "state.verstanden": "Understood",
      "state.erledigt": "Done",
      "state.nicht_verstanden": "Pardon",
      "state.fehler": "Error",
      "state.lachen": "Laugh",
      "state.musik_an": "Music",
      "state.licht_an": "Lights on",
      "state.licht_aus": "Lights out",
      "state.angry": "Angry",
      "state.sprechen": "Speaking",
      "set.display": "Display",
      "set.sleep": "Sound and sleep",
      "set.gestures": "Gestures and corners",
      "set.views": "Views",
      "set.ha": "Home Assistant",
      "set.advanced": "Advanced",
      "set.security": "Security",
      "set.back": "Settings",
      "set.never": "never",
      "light.profile": "Edge light",
      "alarm.label": "Alarm intensity",
      "alarm.normal": "Normal",
      "alarm.strong": "Strong",
      "light.ruhig": "Quiet",
      "light.lebhaft": "Lively",
      "view.day": "My day",
      "view.home": "Home",
      "view.energy": "Energy",
      "view.climate": "Climate",
      "view.music": "Music",
      "view.status": "Status",
      "view.timer": "Timer",
      "view.allShut": "All shut",
      "view.allShutSentence": "All shut.",
      "view.openCount": "{n} open",
      "view.openUnit": "windows and doors open",
      "view.openWord": "open",
      "view.noWaste": "No waste tomorrow",
      "view.wasteTomorrow": "Waste tomorrow",
      "view.empty": "\u2013",
      "view.night": "Night.",
      "view.nightMeta": "The inverter is asleep \xB7 {n} kWh today",
      "view.nightQuiet": "The inverter is asleep",
      "view.sunShare": "The sun covers {n} %",
      "view.grid": "Grid",
      "view.feed": "Export",
      "view.autonomy": "Self-use",
      "view.roomsPaused": "Room values are paused",
      "view.quiet": "Quiet just now.",
      "view.noPlayer": "No player connected",
      "view.timerIdle": "Not running",
      "view.plus1": "+1 min",
      "view.plus5": "+5 min",
      "view.stop": "Stop",
      "dash.contacts": "Open contacts",
      "dash.contactGroups": "Contact groups",
      "dash.energyPv": "PV power",
      "dash.energyDay": "Energy today",
      "dash.energyGrid": "Grid import",
      "dash.energyFeed": "Grid export",
      "dash.energyAutonomy": "Self-use",
      "dash.group": "Home mode",
      "dash.help": "Tiles hide themselves when the entity is missing. Waste can be a sensor or a calendar. Add a button as Label|service on its own line.",
      "dash.weather": "Weather",
      "dash.high": "High",
      "dash.low": "Low",
      "dash.calendar": "Calendar",
      "dash.waste": "Waste",
      "dash.windows": "Open",
      "dash.indoor": "Indoors",
      "dash.outdoor": "Outside",
      "dash.rainOn": "on",
      "dash.rainOff": "off",
      "dash.allOff": "All off",
      "dash.guardOn": "Guard on",
      "dash.guardOff": "Guard off",
      "dash.today": "today",
      "dash.tomorrow": "tomorrow",
      "dash.brrr": "Brrrr...",
      "dash.buttons": "More buttons",
      "dash.cal": "Calendars",
      "dash.wasteList": "Waste",
      "dash.windowList": "Windows",
      "dash.indoorList": "Indoor temperatures",
      "dash.rain": "Rain",
      "dash.wind": "Wind",
      "dash.bright": "Brightness",
      "help.tip.dashboard": "Weather, calendars, waste, open windows, and a few buttons. Missing entities stay hidden."
    },
    de: {
      "app.title": "Grok Bot Home Assistant UI",
      "app.shortTitle": "Grok Bot",
      "app.canvas": "Animierte Augen",
      "settings.title": "Einstellungen",
      "settings.intro": "F\xFCnfmal oben links tippen \xF6ffnet die Einstellungen. Der Token bleibt in diesem Browser.",
      "settings.profilePhone": "Telefon",
      "settings.profileTablet": "Tablet",
      "settings.disclaimer": "Inoffizielles Community-Projekt. Nicht verbunden mit xAI oder Home Assistant.",
      "status.aus": "Nicht eingerichtet",
      "status.verbinde": "Verbinde\u2026",
      "status.offen": "Socket offen",
      "status.verbunden": "Verbunden",
      "status.getrennt": "Getrennt, neuer Versuch",
      "status.auth_ungueltig": "Token abgelehnt",
      "status.fehler": "Fehler",
      "status.mock": "Vorschau, kein Home Assistant",
      "detail.tokenRejected": "Token wurde abgelehnt",
      "detail.statesUnreadable": "Zust\xE4nde nicht lesbar",
      "detail.entityMissing": "Entity nicht gefunden",
      "detail.entityMissingConfig": "Entity fehlt",
      "detail.callFailed": "Aufruf fehlgeschlagen",
      "detail.connectFailed": "Verbindung fehlgeschlagen",
      "detail.called": "Aufgerufen: {name}",
      "detail.notSet": "Befehl ist nicht gesetzt",
      "detail.eyesOnly": "Nicht verbunden. Nur die Augen.",
      "detail.eyesOnlyOffline": "Home Assistant ist nicht eingerichtet. Nur die Augen.",
      "detail.tokenMissing": "Token fehlt",
      "detail.connectionTrouble": "Verbindung braucht einen Moment",
      "group.connection": "Home Assistant",
      "group.commands": "Befehle",
      "group.display": "Anzeige",
      "group.states": "Zust\xE4nde",
      "ha.url": "Adresse",
      "ha.token": "Langzeit-Token",
      "ha.forget": "Gespeicherten Token l\xF6schen",
      "ha.entity": "Zustands-Entity",
      "ph.url": "ws://homeassistant.local:8123/api/websocket",
      "ph.tokenReplace": "Gespeichert. Nur ausf\xFCllen, um ihn zu ersetzen.",
      "ph.tokenEmpty": "Langzeit-Token aus dem Home-Assistant-Profil",
      "ph.entity": "input_select.eye_ui_state",
      "cmd.help": "Eine Skript-Entity oder ein Dienst mit Ziel, zum Beispiel script.eye_music_on oder light.turn_on/light.living_room.",
      "cmd.musicOn": "Musik an",
      "cmd.musicOff": "Musik aus",
      "cmd.lightsOn": "Licht an",
      "cmd.lightsOff": "Licht aus",
      "display.language": "Sprache",
      "display.mode": "Ansicht",
      "display.sleep": "Einschlafen nach Minuten (0 = nie)",
      "display.sound": "Ton",
      "display.stateName": "Zustandsname",
      "display.caption": "Statuszeile",
      "display.captionHelp": "Eine kurze Zeile unter den Augen. Tippen \xF6ffnet die Details. Ist sie aus, holt eine schwache Markierung unten sie zur\xFCck.",
      "display.clock": "Uhr",
      "display.nowPlaying": "Jetzt l\xE4uft",
      "np.entity": "Mediaplayer",
      "np.help": "Optional. W\xE4hrend dieser Player spielt, zeigt die Zeile Titel und Interpret. Ein Jahr kommt nur dazu, wenn der Player eines sendet. Leer oder nicht verf\xFCgbar bleibt die Zeile aus.",
      "ph.media": "media_player.living_room",
      "ph.service": "light.toggle/light.living_room",
      "gesture.group": "Gesten",
      "gesture.help": "Jede Wischgeste und das lange Dr\xFCcken f\xFChrt die Aktion daneben aus. Ein Wisch von der unteren Kante nach oben \xF6ffnet weiter die Einstellungen.",
      "gesture.left": "Wischen links",
      "gesture.right": "Wischen rechts",
      "gesture.up": "Wischen hoch",
      "gesture.down": "Wischen runter",
      "gesture.long": "Langes Dr\xFCcken",
      "gesture.act.none": "Nichts",
      "gesture.act.music_toggle": "Musik an/aus",
      "gesture.act.light_toggle": "Licht an/aus",
      "gesture.act.service": "Home-Assistant-Dienst",
      "gesture.act.clock": "Uhr umschalten",
      "gesture.act.caption": "Statuszeile umschalten",
      "gesture.act.sheet": "Kurzmen\xFC \xF6ffnen",
      "gesture.act.settings": "Einstellungen \xF6ffnen",
      "gesture.act.demo": "Demo",
      "gesture.act.view": "N\xE4chstes Thema",
      "gesture.act.dashboard": "Hausmodus",
      "corner.group": "Ecken",
      "corner.help": "F\xFCnfmal oben links tippen \xF6ffnet die Einstellungen.",
      "corner.tl": "Oben links",
      "corner.tr": "Oben rechts",
      "corner.bl": "Unten links",
      "corner.br": "Unten rechts",
      "corner.tap": "Tippen",
      "corner.hold": "Halten",
      "sheet.details": "Details",
      "sheet.quick": "Schnell",
      "sheet.state": "Zustand",
      "sheet.since": "Seit",
      "sheet.doing": "Gerade",
      "sheet.connection": "Verbindung",
      "sheet.command": "Letzter Befehl",
      "sheet.forSeconds": "seit {n} Sekunden",
      "sheet.forSecond": "seit 1 Sekunde",
      "sheet.forMinutes": "seit {n} Minuten",
      "sheet.forMinute": "seit 1 Minute",
      "sheet.noCommand": "Noch keiner",
      "sheet.notSent": "nicht gesendet",
      "sheet.full": "Alle Einstellungen",
      "sheet.sleep": "Schlafzeit, Minuten",
      "caption.restore": "Statuszeile zeigen",
      "credit.madeBy": "Gemacht von",
      "lang.auto": "System",
      "lang.en": "English",
      "lang.de": "Deutsch",
      "mode.2d": "Cube",
      "mode.cute": "Cube",
      "mode.cube": "Cube",
      "mode.full": "Bold",
      "mode.bold": "Bold",
      "mode.led": "Fortune",
      "mode.fortune": "Fortune",
      "dim.after": "Abdunkeln nach Sekunden",
      "dim.level": "Abdunkeln auf Prozent",
      "dim.lead": "Minuten vor dem Schlaf",
      "door.entity": "T\xFCr",
      "camera.entity": "Kamera",
      "ph.door": "binary_sensor.front_door",
      "ph.camera": "camera.courtyard",
      "day.title": "Mein Tag",
      "day.empty": "Heute nichts weiter",
      "cam.courtyard": "Hof",
      "np.prev": "Zur\xFCck",
      "np.play": "Play",
      "np.pause": "Pause",
      "np.next": "Weiter",
      "np.upNext": "Als N\xE4chstes",
      "demo.link": "Demo",
      "led.pitch": "Raster",
      "led.gap": "Abstand zum Diffusor",
      "led.cover": "Abdeckung",
      "led.grid": "LED-Raster zeigen",
      "help.gestures": "Wischen und langes Dr\xFCcken folgen den Gesten. Die linke Kante bleibt Musik an und aus, die rechte Kante Licht an und aus. Tippen in der Mitte weckt nur. Von der unteren Kante nach oben wischen \xF6ffnet die Einstellungen.",
      "help.keys": "Tasten 1\u20130, dann q, w, e, r f\xFCr die Zust\xE4nde. Pfeile l\xF6sen die Wischaktionen aus. Leertaste spielt alle, m wechselt die Ansicht, i \xF6ffnet die Einstellungen.",
      "help.keysSummary": "Tastatur, f\xFCr den Schreibtisch",
      "help.external": "Hilfe. \xD6ffnet einen neuen Tab.",
      "help.tip.ready": "Die Augen folgen dem Finger. Tippen l\xE4sst sie blinzeln.",
      "help.tip.display": "Sprache, Thema, Uhr und Statuszeile. Cube, Fortune und Bold.",
      "help.tip.sound": "Ton kommt nach dem ersten Tipp. Ohne Player spielt der Musik-Zustand ein Demost\xFCck.",
      "help.tip.ha": "Adresse, Token und die Entity f\xFCr die Augen. Der Token bleibt auf diesem Ger\xE4t.",
      "help.tip.media": "Bleibt der Player leer, spielt der Musik-Zustand Orbit Drift. Fehlt er, bleibt die Zeile still.",
      "help.tip.gestures": "Wischen oder die Augen halten. Eigene Aktionen sind ein Name plus ein Home-Assistant-Dienst.",
      "help.tip.corners": "Jede Ecke hat Tippen und Halten. Die Fl\xE4che ist gr\xF6\xDFer und zeigt sich, solange dieser Abschnitt offen ist.",
      "help.tip.commands": "Skripte f\xFCr Musik und Licht, oder ein Dienst mit Ziel.",
      "help.tip.states": "Ein Zustand zeigt ihn hier. Zeile, Farbe und Ton stehen unter Erweitert.",
      "help.tip.security": "Nur eine Sperre zur Bequemlichkeit, keine echte Sicherheit. ?lock=reset auf diesem Ger\xE4t hebt sie auf.",
      "help.tip.demo": "Die Demo l\xE4uft durch die Zust\xE4nde, mit Zeile und Ton.",
      "help.tip.advanced": "Eine Zeile je Sprache, eine Farbe und ein Ton. Zur\xFCcksetzen holt die Originale.",
      "custom.title": "Eigene Aktionen",
      "custom.help": "Name und Dienst, zum Beispiel light.toggle/light.hallway.",
      "custom.label": "Name",
      "custom.service": "Dienst",
      "custom.add": "Aktion hinzuf\xFCgen",
      "custom.remove": "Entfernen",
      "security.group": "Schutz",
      "security.lock": "Vor den Einstellungen fragen",
      "security.help": "Nur auf diesem Ger\xE4t. ?lock=reset hebt sie auf.",
      "security.pin": "PIN oder Passwort",
      "security.again": "Wiederholen",
      "security.mismatch": "Die beiden stimmen nicht \xFCberein.",
      "security.short": "Mindestens vier Zeichen.",
      "security.unlock": "\xD6ffnen",
      "security.prompt": "Die Einstellungen sind auf diesem Ger\xE4t gesperrt.",
      "security.wrong": "Das stimmt nicht.",
      "demo.toggle": "Demo",
      "demo.help": "Spielt die Stimmungen, endet bei Musik f\xFCr 30 Sekunden und beginnt dann von vorn, bis jemand tippt.",
      "demo.locked": "in der Demo deaktiviert",
      "advanced.summary": "Erweitert",
      "advanced.help": "Zeile, Farbe und Ton je Zustand. Leere Felder behalten das Original.",
      "advanced.captionEn": "Englische Zeile",
      "advanced.captionDe": "Deutsche Zeile",
      "advanced.color": "Farbe",
      "advanced.sound": "Ton",
      "advanced.defaultSound": "Originalton",
      "advanced.reset": "Zust\xE4nde zur\xFCcksetzen",
      "credits.open": "Nachweise",
      "credits.title": "Nachweise",
      "credits.short": "Nachweise und Hinweise stehen auf der Projektseite.",
      "credits.page": "Projektseite",
      "credits.maintainer": "Betreuung",
      "credits.idea": "Die erste Idee",
      "credits.repo": "Quelltext",
      "credits.support": "Unterst\xFCtzen",
      "credits.soon": "kommt bald",
      "credits.hvuz": "HERRVONUNDZU",
      "credits.licenses": "Lizenzen",
      "credits.mit": "Die Seite ist MIT, au\xDFer der Marke und dem Verhaltenskodex.",
      "credits.mark": "Die HVUZ-Marke steht nicht unter MIT.",
      "credits.track": "Orbit Drift ist eigen und unter CC0 gewidmet.",
      "credits.close": "Schlie\xDFen",
      "version.label": "Version",
      "err.url": "Die Adresse muss ws://, wss://, http:// oder https:// von Home Assistant sein.",
      "err.entity": "Die Entity als domain.objekt schreiben, zum Beispiel input_select.eye_ui_state.",
      "action.save": "Speichern",
      "action.close": "Schlie\xDFen",
      "action.tour": "Alle Zust\xE4nde",
      "action.fullscreen": "Vollbild",
      "zone.settings": "Einstellungen",
      "zone.musicOn": "Musik an",
      "zone.musicOff": "Musik aus",
      "zone.lightsOn": "Licht an",
      "zone.lightsOff": "Licht aus",
      "state.schlafen": "Schlafen",
      "state.hallo": "Hi",
      "state.idle": "Ruhe",
      "state.blicke": "Blick",
      "state.zuhoeren": "Zuh\xF6ren",
      "state.nachdenken": "Nachdenken",
      "state.verstanden": "Verstanden",
      "state.erledigt": "Erledigt",
      "state.nicht_verstanden": "Wie bitte",
      "state.fehler": "Fehler",
      "state.lachen": "Lachen",
      "state.musik_an": "Musik",
      "state.licht_an": "Licht an",
      "state.licht_aus": "Licht aus",
      "state.angry": "W\xFCtend",
      "state.sprechen": "Spreche",
      "set.display": "Anzeige",
      "set.sleep": "Ton und Schlaf",
      "set.gestures": "Gesten und Ecken",
      "set.views": "Ansichten",
      "set.ha": "Home Assistant",
      "set.advanced": "Erweitert",
      "set.security": "Sicherheit",
      "set.back": "Einstellungen",
      "set.never": "nie",
      "light.profile": "Kantenlicht",
      "alarm.label": "Alarmst\xE4rke",
      "alarm.normal": "Normal",
      "alarm.strong": "Stark",
      "light.ruhig": "Ruhig",
      "light.lebhaft": "Lebhaft",
      "view.day": "Mein Tag",
      "view.home": "Zuhause",
      "view.energy": "Energie",
      "view.climate": "Klima",
      "view.music": "Musik",
      "view.status": "Status",
      "view.timer": "Timer",
      "view.allShut": "Alles zu",
      "view.allShutSentence": "Alles zu.",
      "view.openCount": "{n} offen",
      "view.openUnit": "Fenster und T\xFCren offen",
      "view.openWord": "offen",
      "view.noWaste": "Kein M\xFCll morgen",
      "view.wasteTomorrow": "M\xFCll morgen",
      "view.empty": "\u2013",
      "view.night": "Nacht.",
      "view.nightMeta": "Wechselrichter schl\xE4ft \xB7 heute {n} kWh",
      "view.nightQuiet": "Wechselrichter schl\xE4ft",
      "view.sunShare": "Sonne deckt {n} %",
      "view.grid": "Netz",
      "view.feed": "Einspeisung",
      "view.autonomy": "Autarkie",
      "view.roomsPaused": "Raumwerte pausiert",
      "view.quiet": "Gerade still.",
      "view.noPlayer": "Kein Player verbunden",
      "view.timerIdle": "L\xE4uft nicht",
      "view.plus1": "+1 min",
      "view.plus5": "+5 min",
      "view.stop": "Stop",
      "dash.contacts": "Offene Kontakte",
      "dash.contactGroups": "Kontaktgruppen",
      "dash.energyPv": "PV-Leistung",
      "dash.energyDay": "Energie heute",
      "dash.energyGrid": "Netzbezug",
      "dash.energyFeed": "Einspeisung",
      "dash.energyAutonomy": "Autarkie",
      "dash.group": "Hausmodus",
      "dash.help": "Kacheln verschwinden, wenn die Entity fehlt. Abfall kann ein Sensor oder ein Kalender sein. Ein weiterer Knopf ist eine Zeile Name|Dienst.",
      "dash.weather": "Wetter",
      "dash.high": "Max",
      "dash.low": "Min",
      "dash.calendar": "Kalender",
      "dash.waste": "Abfall",
      "dash.windows": "Offen",
      "dash.indoor": "Drinnen",
      "dash.outdoor": "Drau\xDFen",
      "dash.rainOn": "an",
      "dash.rainOff": "aus",
      "dash.allOff": "Alles aus",
      "dash.guardOn": "Wache an",
      "dash.guardOff": "Wache aus",
      "dash.today": "heute",
      "dash.tomorrow": "morgen",
      "dash.brrr": "Brrrr...",
      "dash.buttons": "Weitere Kn\xF6pfe",
      "dash.cal": "Kalender",
      "dash.wasteList": "Abfall",
      "dash.windowList": "Fenster",
      "dash.indoorList": "Innentemperaturen",
      "dash.rain": "Regen",
      "dash.wind": "Wind",
      "dash.bright": "Helligkeit",
      "help.tip.dashboard": "Wetter, Kalender, Abfall, offene Fenster und ein paar Kn\xF6pfe. Fehlende Entities bleiben verborgen.",
      "advanced.corner": "Eckengr\xF6\xDFe"
    }
  };
  function localeCode(value) {
    const v = String(value != null ? value : "").trim().toLowerCase().replace(/_/g, "-");
    if (v === "de" || v.startsWith("de-")) return "de";
    if (v === "en" || v.startsWith("en-")) return "en";
    return "";
  }
  function resolveLocale({ query, stored, nav } = {}) {
    return localeCode(query) || localeCode(stored) || (String(nav || "").toLowerCase().startsWith("de") ? "de" : "en");
  }
  function translate(locale, key, vars) {
    var _a;
    const lang = UI[locale] ? locale : "en";
    let text = (_a = UI[lang][key]) != null ? _a : UI.en[key];
    if (text == null) return "";
    if (vars) {
      for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  }
  function textOrServer(locale, value, vars) {
    if (!value) return "";
    const key = `detail.${value}`;
    if (UI.en[key] == null) return String(value);
    return translate(locale, key, vars);
  }
  function captionLine(locale, state, states) {
    var _a;
    const lang = CAPTIONS[locale] ? locale : "en";
    const base = CAPTIONS[lang][state] || CAPTIONS.en[state] || null;
    const over = (_a = states == null ? void 0 : states[state]) == null ? void 0 : _a[lang === "de" ? "de" : "en"];
    if (over) return { text: over, dots: !!(base == null ? void 0 : base.dots) };
    return base;
  }
  function detailLine(locale, state) {
    const lang = DETAILS[locale] ? locale : "en";
    return DETAILS[lang][state] || DETAILS.en[state] || "";
  }
  function stateLabel(locale, state) {
    return translate(locale, `state.${state}`);
  }

  // web/konfig.js
  var DEMO_HOST = "grok-bot-ui.herrvonundzu.eu";
  function istDemoHost(host) {
    return String(host || "").replace(/\.+$/, "").toLowerCase() === DEMO_HOST;
  }
  function demoSperre(host) {
    return istDemoHost(host);
  }
  function demoBesuch(konfig, ort, params) {
    const p = params instanceof URLSearchParams ? params : new URLSearchParams(params || "");
    if (p.get("demo") === "0") return false;
    if (p.get("demo") === "1") return true;
    const host = ort && (ort.hostname || ort.host) || "";
    if (istDemoHost(host)) return true;
    const protocol = ort && ort.protocol || "";
    const url = konfig && String(konfig.haUrl || "").trim();
    const token = konfig && String(konfig.haToken || "").trim();
    return protocol === "https:" && !url && !token;
  }
  function vergissToken(storage) {
    const s = speicher(storage);
    if (!s) return;
    try {
      s.removeItem(ALT_TOKEN);
    } catch (e) {
    }
    const raw = lesen(s, KEY);
    if (!raw) return;
    try {
      const daten = JSON.parse(raw) || {};
      if ((daten.v === 3 || daten.v === 4) && daten.profiles) {
        let geaendert = false;
        for (const name of ["phone", "tablet"]) {
          if (daten.profiles[name] && daten.profiles[name].haToken) {
            daten.profiles[name].haToken = "";
            geaendert = true;
          }
        }
        if (geaendert) s.setItem(KEY, JSON.stringify(daten));
        return;
      }
      if (!daten.haToken) return;
      daten.haToken = "";
      s.setItem(KEY, JSON.stringify(daten));
    } catch (e) {
    }
  }
  var VORGABE = {
    haUrl: "",
    haToken: "",
    haEntity: "input_select.eye_ui_state",
    mediaEntity: "",
    scriptMusikAn: "script.eye_music_on",
    scriptMusikAus: "script.eye_music_off",
    scriptLichtAn: "script.eye_light_on",
    scriptLichtAus: "script.eye_light_off",
    schlafSekunden: 15 * 60,
    dimNachSekunden: 60,
    dimStufe: 0.3,
    dimVorMinuten: 15,
    tuer: "",
    kamera: "",
    ton: true,
    label: false,
    caption: true,
    uhr: false,
    nowPlaying: true,
    demo: true,
    lang: "",
    modus: "",
    gesten: GESTEN_VORGABE,
    ecken: normEcken(ECKEN_VORGABE),
    gestenStand: 2,
    eckGroesse: ECK,
    lichtProfil: "lebhaft",
    alarmStaerke: "stark",
    dash: normDash(null),
    eigene: [],
    states: {},
    lockOn: false,
    lockSalt: "",
    lockHash: ""
  };
  var STATE_KEYS = Object.keys(KURZ);
  var SOUND_OK = /^[0-9]{2}_[a-z0-9_]+$/;
  function normStates(raw) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    for (const key of STATE_KEYS) {
      const item = raw[key];
      if (!item || typeof item !== "object") continue;
      const en = String(item.en || "").trim().slice(0, 80);
      const de = String(item.de || "").trim().slice(0, 80);
      const color = /^#[0-9a-f]{6}$/i.test(item.color || "") ? String(item.color).toLowerCase() : "";
      const sound = SOUND_OK.test(item.sound || "") ? item.sound : "";
      if (en || de || color || sound) out[key] = { en, de, color, sound };
    }
    return out;
  }
  var KEY = "eye_ui_config";
  var ALT_CONFIG = "gk_konfig";
  var ALT_TOKEN = "gk_ha_token";
  function geraeteKlasse(info = {}) {
    const w = Number(info.width) || 0;
    const h = Number(info.height) || 0;
    if (!info.touch) return "tablet";
    return Math.min(w, h) >= 600 ? "tablet" : "phone";
  }
  var klasse = "tablet";
  function setzeKlasse(name) {
    klasse = name === "phone" ? "phone" : "tablet";
  }
  function aktiveKlasse() {
    return klasse;
  }
  var MODUS_ALIAS = {
    cute: "2d",
    cube: "2d",
    fortune: "led",
    bold: "vollbild",
    "2d": "2d",
    vollbild: "vollbild",
    led: "led"
  };
  function normModus(value) {
    const v = String(value || "").trim().toLowerCase();
    return MODUS_ALIAS[v] || "";
  }
  function waehleModus(urlModus, gespeichert) {
    const url = normModus(urlModus);
    if (url) return url;
    const saved = normModus(gespeichert);
    if (saved) return saved;
    return "vollbild";
  }
  function siteNachKonfig(datei) {
    if (!datei || typeof datei !== "object" || Array.isArray(datei)) return {};
    const src = __spreadValues({}, datei);
    const dateiToken = typeof src.haToken === "string" && src.haToken.trim() ? src.haToken.trim() : typeof src.token === "string" && src.token.trim() ? src.token.trim() : "";
    delete src.haToken;
    delete src.token;
    delete src.access_token;
    if (dateiToken) src.haToken = dateiToken;
    if (src.theme || src.modus) src.modus = normModus(src.theme || src.modus);
    delete src.theme;
    if (src.door && !src.tuer) src.tuer = src.door;
    if (src.doorEntity && !src.tuer) src.tuer = src.doorEntity;
    delete src.door;
    delete src.doorEntity;
    if (src.camera && !src.kamera) src.kamera = src.camera;
    delete src.camera;
    if (src.dimAfter != null && src.dimNachSekunden == null) src.dimNachSekunden = src.dimAfter;
    delete src.dimAfter;
    if (src.dimLevel != null && src.dimStufe == null) src.dimStufe = src.dimLevel;
    delete src.dimLevel;
    if (src.dimLead != null && src.dimVorMinuten == null) src.dimVorMinuten = src.dimLead;
    delete src.dimLead;
    if (src.language && !src.lang) src.lang = src.language;
    delete src.language;
    if (src.cornerSize != null && src.eckGroesse == null) src.eckGroesse = src.cornerSize;
    delete src.cornerSize;
    if (src.dashboard && !src.dash) src.dash = src.dashboard;
    delete src.dashboard;
    if (src.licht_profil && !src.lichtProfil) src.lichtProfil = src.licht_profil;
    delete src.licht_profil;
    if (src.alarm && !src.alarmStaerke) src.alarmStaerke = src.alarm;
    delete src.alarm;
    if (src.haUrl) {
      const url = normalisiereHaUrl(src.haUrl);
      if (url) src.haUrl = url;
      else delete src.haUrl;
    }
    return src;
  }
  function speicher(vorgegeben) {
    if (vorgegeben) return vorgegeben;
    try {
      if (typeof localStorage !== "undefined") return localStorage;
    } catch (e) {
    }
    return null;
  }
  function lesen(storage, key) {
    var _a;
    try {
      return (_a = storage == null ? void 0 : storage.getItem(key)) != null ? _a : null;
    } catch (e) {
      return null;
    }
  }
  function nurBekannte(obj) {
    const out = {};
    if (!obj || typeof obj !== "object") return out;
    for (const key of Object.keys(VORGABE)) if (key in obj) out[key] = obj[key];
    if ("schlafSekunden" in out) out.schlafSekunden = Math.max(0, Number(out.schlafSekunden) || 0);
    if ("dimNachSekunden" in out) out.dimNachSekunden = Math.max(0, Math.min(3600, Math.round(Number(out.dimNachSekunden) || 0)));
    if ("dimStufe" in out) {
      let n = Number(out.dimStufe);
      if (n > 1) n /= 100;
      out.dimStufe = Math.max(0.05, Math.min(1, Number.isFinite(n) ? n : 0.3));
    }
    if ("dimVorMinuten" in out) out.dimVorMinuten = Math.max(0, Math.min(180, Math.round(Number(out.dimVorMinuten) || 0)));
    if ("tuer" in out) {
      const id = String(out.tuer || "").trim().toLowerCase();
      out.tuer = id && gueltigeEntity(id) ? id : "";
    }
    if ("kamera" in out) {
      const id = String(out.kamera || "").trim().toLowerCase();
      out.kamera = id && gueltigeEntity(id) ? id : "";
    }
    if ("ton" in out) out.ton = !!out.ton;
    if ("label" in out) out.label = !!out.label;
    if ("caption" in out) out.caption = !!out.caption;
    if ("uhr" in out) out.uhr = !!out.uhr;
    if ("nowPlaying" in out) out.nowPlaying = !!out.nowPlaying;
    if ("mediaEntity" in out) {
      const media = String(out.mediaEntity || "").trim().toLowerCase();
      out.mediaEntity = media && gueltigeEntity(media) ? media : "";
    }
    if ("demo" in out) out.demo = !!out.demo;
    if ("lockOn" in out) out.lockOn = !!out.lockOn;
    if (typeof out.lockSalt !== "string") delete out.lockSalt;
    if (typeof out.lockHash !== "string") delete out.lockHash;
    if ("eigene" in obj) out.eigene = normEigene(obj.eigene);
    if ("states" in obj) out.states = normStates(obj.states);
    const eigene = out.eigene || normEigene(obj.eigene);
    if ("gesten" in obj) out.gesten = normGesten(obj.gesten, eigene);
    if ("ecken" in obj) out.ecken = normEcken(obj.ecken, eigene);
    if ("dash" in obj) out.dash = normDash(obj.dash);
    if ("eckGroesse" in out) {
      const n = Math.round(Number(out.eckGroesse));
      out.eckGroesse = n >= 96 && n <= 160 ? n : ECK;
    }
    if ("gestenStand" in out) out.gestenStand = Math.max(0, Math.round(Number(out.gestenStand) || 0));
    if (out.lang !== "en" && out.lang !== "de") delete out.lang;
    if ("modus" in out) {
      const modus = normModus(out.modus);
      if (modus) out.modus = modus;
      else delete out.modus;
    }
    if ("lichtProfil" in out) {
      const profil = String(out.lichtProfil || "").trim().toLowerCase();
      if (profil === "ruhig" || profil === "lebhaft") out.lichtProfil = profil;
      else delete out.lichtProfil;
    }
    if ("alarmStaerke" in out) {
      const stufe = String(out.alarmStaerke || "").trim().toLowerCase();
      out.alarmStaerke = stufe === "normal" || stufe === "norm" ? "normal" : "stark";
    }
    if (typeof out.haToken !== "string") delete out.haToken;
    return out;
  }
  function tokenVon(obj) {
    if (!obj || typeof obj !== "object") return "";
    for (const key of ["haToken", "token", "access_token"]) {
      if (typeof obj[key] === "string" && obj[key].trim()) return obj[key].trim();
    }
    return "";
  }
  function lesePaket(s) {
    let raw = lesen(s, KEY);
    if (!raw) raw = lesen(s, ALT_CONFIG);
    let obj = {};
    try {
      obj = JSON.parse(raw || "{}") || {};
    } catch (e) {
      obj = {};
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};
    const v = Number(obj.v) || 0;
    if ((v === 3 || v === 4) && obj.profiles && typeof obj.profiles === "object") {
      return {
        neu: true,
        v,
        top: obj,
        phone: obj.profiles.phone && typeof obj.profiles.phone === "object" ? obj.profiles.phone : {},
        tablet: obj.profiles.tablet && typeof obj.profiles.tablet === "object" ? obj.profiles.tablet : {}
      };
    }
    return { neu: false, v: 0, flat: obj, top: obj, phone: {}, tablet: {} };
  }
  function schreibePaket(s, profiles, opt) {
    s.setItem(KEY, JSON.stringify({ v: 4, profiles }));
    s.removeItem(ALT_CONFIG);
    const hatToken = tokenVon(profiles.phone) || tokenVon(profiles.tablet);
    if (hatToken || opt && opt.tokenLoeschen) s.removeItem(ALT_TOKEN);
  }
  function speichereKonfig(konfig, storage, opt) {
    const s = speicher(storage);
    if (!s) return;
    const tokenLoeschen = !!(opt && opt.tokenLoeschen);
    const paket2 = lesePaket(s);
    const profiles = {
      phone: paket2.neu ? __spreadValues({}, paket2.phone) : {},
      tablet: paket2.neu ? __spreadValues({}, paket2.tablet) : {}
    };
    const bekannt = nurBekannte(konfig);
    const gespeichertToken = tokenVon(profiles[klasse]);
    if (tokenLoeschen) bekannt.haToken = "";
    else if (!String(bekannt.haToken || "").trim() && gespeichertToken) bekannt.haToken = gespeichertToken;
    profiles[klasse] = bekannt;
    try {
      schreibePaket(s, profiles, { tokenLoeschen });
    } catch (e) {
    }
  }
  function ladeKonfig(params, storage, datei, ort) {
    const s = speicher(storage);
    const paket2 = lesePaket(s);
    const host = ort && (ort.hostname || ort.host) || "";
    const demoHost = istDemoHost(host);
    let gespeichert = {};
    let migrated = false;
    if (paket2.neu) gespeichert = paket2[klasse] || {};
    else gespeichert = paket2.flat || {};
    if (!paket2.neu && (lesen(s, KEY) || lesen(s, ALT_CONFIG))) migrated = true;
    if (paket2.neu && paket2.v < 4) migrated = true;
    if (lesen(s, ALT_CONFIG) || lesen(s, ALT_TOKEN)) migrated = true;
    const ausDatei = nurBekannte(siteNachKonfig(datei));
    const dateiToken = demoHost ? "" : String(ausDatei.haToken || "").trim();
    delete ausDatei.haToken;
    if (demoHost) delete ausDatei.haUrl;
    const stand = Number(gespeichert.gestenStand) || 0;
    const migriereGesten = stand < 2 && istAltesLayout(gespeichert.gesten, gespeichert.ecken);
    const k = __spreadValues(__spreadValues(__spreadValues({}, VORGABE), ausDatei), nurBekannte(gespeichert));
    if (!demoHost && ausDatei.haUrl) k.haUrl = ausDatei.haUrl;
    if (migriereGesten) {
      k.gesten = normGesten(GESTEN_VORGABE, k.eigene);
      k.ecken = normEcken(ECKEN_VORGABE, k.eigene);
      k.gestenStand = 2;
      migrated = true;
    }
    k.eigene = normEigene(k.eigene);
    k.states = normStates(k.states);
    k.gesten = normGesten(k.gesten, k.eigene);
    k.ecken = normEcken(k.ecken, k.eigene);
    k.uhr = !!k.uhr;
    k.nowPlaying = !!k.nowPlaying;
    k.demo = !!k.demo;
    k.lockOn = !!(k.lockOn && k.lockSalt && k.lockHash);
    k.lockSalt = k.lockOn ? String(k.lockSalt) : "";
    k.lockHash = k.lockOn ? String(k.lockHash) : "";
    k.mediaEntity = gueltigeEntity(k.mediaEntity) ? String(k.mediaEntity).trim().toLowerCase() : "";
    if (!String(k.haToken || "").trim()) {
      const geliehen = tokenVon(paket2.phone) || tokenVon(paket2.tablet) || tokenVon(paket2.flat) || tokenVon(paket2.top) || String(lesen(s, ALT_TOKEN) || "").trim();
      if (geliehen) {
        k.haToken = geliehen;
        migrated = true;
      } else if (dateiToken) {
        k.haToken = dateiToken;
        migrated = true;
      }
    }
    if (!demoHost && ausDatei.haUrl && ausDatei.haUrl !== String(gespeichert.haUrl || "")) migrated = true;
    if (migrated) speichereKonfig(k, s);
    const p = params instanceof URLSearchParams ? params : new URLSearchParams(params || "");
    if (p.get("lock") === "reset") speichereKonfig(__spreadProps(__spreadValues({}, k), { lockOn: false, lockSalt: "", lockHash: "" }), s);
    return mitUrl(k, params);
  }
  function mitUrl(konfig, params) {
    const p = params instanceof URLSearchParams ? params : new URLSearchParams(params || "");
    const n = __spreadValues({}, konfig);
    const ha = p.get("ha");
    if (ha && ha !== "mock") {
      const url = normalisiereHaUrl(ha);
      if (url) n.haUrl = url;
    }
    if (p.get("entity")) n.haEntity = p.get("entity").trim().toLowerCase();
    const schlaf = p.has("sleep") ? p.get("sleep") : p.get("schlaf");
    if (schlaf != null && schlaf !== "" && !Number.isNaN(+schlaf)) {
      n.schlafSekunden = Math.max(0, +schlaf);
    }
    const skripte = [
      ["music_on", "musik_an", "scriptMusikAn"],
      ["music_off", "musik_aus", "scriptMusikAus"],
      ["light_on", "licht_an", "scriptLichtAn"],
      ["light_off", "licht_aus", "scriptLichtAus"]
    ];
    for (const [en, de, key] of skripte) {
      const wert = p.get(en) || p.get(de);
      if (wert) n[key] = wert.trim().toLowerCase();
    }
    if (p.get("label") === "0") n.label = false;
    if (p.get("label") === "1") n.label = true;
    if (p.get("ton") === "0") n.ton = false;
    if (p.get("ton") === "1") n.ton = true;
    const modus = normModus(p.get("mode") || p.get("modus") || p.get("theme"));
    if (modus) n.modus = modus;
    const licht = String(p.get("licht_profil") || p.get("light") || "").trim().toLowerCase();
    if (licht === "ruhig" || licht === "lebhaft") n.lichtProfil = licht;
    const alarm = String(p.get("alarm") || p.get("alarm_intensity") || "").trim().toLowerCase();
    if (alarm === "normal" || alarm === "norm") n.alarmStaerke = "normal";
    if (alarm === "strong" || alarm === "stark") n.alarmStaerke = "stark";
    const lang = localeCode(p.get("lang"));
    if (lang) n.lang = lang;
    if (p.get("caption") === "0") n.caption = false;
    if (p.get("caption") === "1") n.caption = true;
    if (p.get("clock") === "0") n.uhr = false;
    if (p.get("clock") === "1") n.uhr = true;
    if (p.get("np") === "0") n.nowPlaying = false;
    if (p.get("np") === "1") n.nowPlaying = true;
    const tuer = p.get("door");
    if (tuer && gueltigeEntity(tuer.trim().toLowerCase())) n.tuer = tuer.trim().toLowerCase();
    const kamera = p.get("camera");
    if (kamera && gueltigeEntity(kamera.trim().toLowerCase())) n.kamera = kamera.trim().toLowerCase();
    if (p.get("dim") != null && p.get("dim") !== "" && !Number.isNaN(+p.get("dim"))) {
      n.dimNachSekunden = Math.max(0, Math.min(3600, Math.round(+p.get("dim"))));
    }
    if (p.get("media")) {
      const media = p.get("media").trim().toLowerCase();
      if (gueltigeEntity(media)) n.mediaEntity = media;
    }
    if (p.get("demo") === "1") n.demo = true;
    if (p.get("demo") === "0") n.demo = false;
    if (p.get("lock") === "reset") {
      n.lockOn = false;
      n.lockSalt = "";
      n.lockHash = "";
    }
    return n;
  }

  // web/siteconfig.js
  function ladeSiteConfig(timeoutMs = 2500) {
    return new Promise((resolve) => {
      let fertig = false;
      const ende = (wert) => {
        if (fertig) return;
        fertig = true;
        resolve(wert && typeof wert === "object" ? wert : null);
      };
      const timer = setTimeout(() => ende(null), timeoutMs);
      const ausText = (text, status) => {
        clearTimeout(timer);
        if (status !== 200 || !text) {
          ende(null);
          return;
        }
        try {
          ende(JSON.parse(text));
        } catch (e) {
          ende(null);
        }
      };
      const xhr = () => {
        try {
          const req = new XMLHttpRequest();
          req.open("GET", "config.local.json", true);
          req.onload = () => ausText(req.status === 200 ? req.responseText : "", req.status);
          req.onerror = () => {
            clearTimeout(timer);
            ende(null);
          };
          req.send();
        } catch (e) {
          clearTimeout(timer);
          ende(null);
        }
      };
      if (typeof fetch === "function") {
        try {
          fetch("config.local.json", { cache: "no-store" }).then((res) => {
            if (!res.ok) {
              clearTimeout(timer);
              ende(null);
              return null;
            }
            return res.text();
          }).then((text) => {
            if (typeof text === "string") ausText(text, 200);
          }).catch(() => xhr());
        } catch (e) {
          xhr();
        }
        return;
      }
      xhr();
    });
  }

  // web/ansichten.js
  var REIHEN = ["day", "home", "energy", "climate", "music", "status", "timer"];
  var ENERGIE_MERK = "eye_energy_today";
  var timerBis = 0;
  function timerAdd(minuten) {
    const now = Date.now();
    const basis = timerBis > now ? timerBis : now;
    timerBis = basis + Math.max(1, minuten) * 6e4;
  }
  function timerStop() {
    timerBis = 0;
  }
  function timerStand(now = Date.now()) {
    if (!timerBis || timerBis <= now) return { rest: 0, ziel: null, an: false };
    return { rest: timerBis - now, ziel: new Date(timerBis), an: true };
  }
  function leerZustand(entityState) {
    return !entityState || istLeer(entityState.state);
  }
  function zahl2(value) {
    if (value == null || String(value).trim() === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const n = Number(String(value).replace(",", ".").replace(/[^\d.+-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  function textZahl(n, locale) {
    if (n == null || !Number.isFinite(Number(n))) return "\u2013";
    const r = Math.round(Number(n) * 10) / 10;
    const s = String(r);
    return locale === "de" ? s.replace(".", ",") : s;
  }
  function freundlich2(entityState, id) {
    const name = entityState && entityState.attributes && entityState.attributes.friendly_name;
    if (name) return String(name);
    const tail = String(id || "").split(".")[1] || String(id || "");
    return tail.replace(/_/g, " ");
  }
  function offen(entityState) {
    if (leerZustand(entityState)) return false;
    const s = String(entityState.state).toLowerCase();
    return s === "on" || s === "open" || s === "true";
  }
  function merkEnergie(kwh) {
    try {
      localStorage.setItem(ENERGIE_MERK, JSON.stringify({ kwh, at: Date.now() }));
    } catch (e) {
    }
  }
  function letzteEnergie() {
    try {
      const raw = JSON.parse(localStorage.getItem(ENERGIE_MERK) || "null");
      if (raw && Number.isFinite(Number(raw.kwh))) return raw;
    } catch (e) {
    }
    return null;
  }
  function bereit(name, ctx) {
    const d = ctx && ctx.dash || {};
    const s = ctx && ctx.states || {};
    if (name === "day" || name === "status" || name === "timer") return true;
    if (name === "home") {
      if (entityDa(s, d.weather) || entityDa(s, d.contacts)) return true;
      for (const id of d.contactGroups || []) if (entityDa(s, id)) return true;
      for (const id of d.windows || []) if (entityDa(s, id)) return true;
      return false;
    }
    if (name === "energy") return !!(d.energyPv && entityDa(s, d.energyPv));
    if (name === "climate") {
      if (entityDa(s, d.outdoorTemp) || entityDa(s, d.wind) || entityDa(s, d.rain)) return true;
      for (const id of d.indoor || []) if (entityDa(s, id)) return true;
      return false;
    }
    if (name === "music") return !!(ctx && (ctx.mediaEntity || ctx.scriptMusikAn || ctx.scriptMusikAus));
    return false;
  }
  function sichtbareAnsichten(ctx) {
    return REIHEN.filter((name) => bereit(name, ctx));
  }
  function el(doc, tag, klasse2, text) {
    const node = doc.createElement(tag);
    if (klasse2) node.className = klasse2;
    if (text != null) node.textContent = text;
    return node;
  }
  function knopf(doc, text, onPress, primaer) {
    const b = el(doc, "button", primaer ? "knopf is-primaer" : "knopf", text);
    b.type = "button";
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onPress();
    });
    return b;
  }
  function rahmen(doc, label, kontext) {
    const root = el(doc, "div", "ansicht");
    const kopf = el(doc, "div", "kopf");
    kopf.append(el(doc, "div", "t-label", label), el(doc, "div", "t-meta", kontext || ""));
    const stage = el(doc, "div", "buehne");
    const actions = el(doc, "div", "aktionen");
    const fuss = el(doc, "div", "fuss t-meta");
    root.append(kopf, stage, actions, fuss);
    return { root, stage, actions, fuss };
  }
  function fakt(doc, label, wert) {
    const cell = el(doc, "div", "fakt");
    cell.append(el(doc, "div", "t-label", label), el(doc, "div", "t-body", wert || "\u2013"));
    return cell;
  }
  function zeile(doc, links, rechts) {
    const row = el(doc, "div", "liste-zeile");
    row.append(el(doc, "span", "", links), el(doc, "span", "t-body", rechts));
    return row;
  }
  function uhrKurz(date, locale) {
    const loc = locale === "de" ? "de-DE" : "en-GB";
    try {
      return new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
    } catch (e) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
  }
  function datumLang(date, locale) {
    const loc = locale === "de" ? "de-DE" : "en-GB";
    try {
      return new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long" }).format(date);
    } catch (e) {
      return date.toDateString();
    }
  }
  function dWaste(ctx) {
    const id = ctx.dash && ctx.dash.wasteTomorrow;
    const e = id && ctx.states && ctx.states[id];
    const item = e ? wasteVonSensor(e, ctx.jetzt || /* @__PURE__ */ new Date()) : null;
    return item ? [item] : [];
  }
  function wetterSatz(w, locale) {
    if (!w) return "";
    const bits = [];
    if (w.condition) bits.push(w.condition);
    if (w.temp != null) bits.push(`${textZahl(w.temp, locale)}\xB0`);
    const extra = [];
    if (w.high != null) extra.push(`${textZahl(w.high, locale)}\xB0`);
    if (w.low != null) extra.push(`${textZahl(w.low, locale)}\xB0`);
    return extra.length ? `${bits.join(" ")} \xB7 ${extra.join(" / ")}` : bits.join(" ");
  }
  function zeichneTag(host, ctx) {
    const doc = host.ownerDocument;
    const jetzt = ctx.jetzt || /* @__PURE__ */ new Date();
    const view = rahmen(doc, ctx.t("view.day"), datumLang(jetzt, ctx.locale));
    const uhr = el(doc, "div", "t-display", ctx.uhr || uhrKurz(jetzt, ctx.locale));
    view.stage.append(uhr);
    const raster = el(doc, "div", "fakten");
    const modell = ctx.model || {};
    const heute = wetterSatz(modell.weather, ctx.locale);
    if (heute) raster.append(fakt(doc, ctx.t("dash.today"), heute));
    const morgen = ctx.forecast && ctx.forecast[1];
    if (morgen) {
      const bits = [];
      if (morgen.condition) bits.push(morgen.condition);
      if (morgen.temperature != null) bits.push(`${textZahl(morgen.temperature, ctx.locale)}\xB0`);
      if (morgen.templow != null) bits.push(`${textZahl(morgen.templow, ctx.locale)}\xB0`);
      raster.append(fakt(doc, ctx.t("dash.tomorrow"), bits.join(" ") || "\u2013"));
    }
    const extra = dWaste(ctx);
    const waste = extra.concat((modell.waste || []).filter((bin) => bin.when === "tomorrow" || bin.when === "today"));
    const morgenWaste = waste.filter((bin) => bin.when === "tomorrow");
    const zeig = morgenWaste.length ? morgenWaste : waste.filter((bin) => bin.when === "today");
    raster.append(fakt(doc, ctx.t("dash.waste"), zeig.length ? zeig.map((b) => b.name).join(", ") : ctx.t("view.noWaste")));
    view.stage.append(raster);
    const wetter = ctx.dash && ctx.states && ctx.states[ctx.dash.weather];
    const quelle = wetter && wetter.attributes && wetter.attributes.friendly_name;
    view.fuss.textContent = quelle ? `${quelle} \xB7 ${uhrKurz(jetzt, ctx.locale)}` : "";
    host.replaceChildren(view.root);
  }
  function offeneNamen(ctx) {
    const d = ctx.dash || {};
    const s = ctx.states || {};
    const namen = [];
    const ids = [...d.contactGroups || [], ...d.windows || []];
    for (const id of ids) {
      const e = s[id];
      if (offen(e)) namen.push(freundlich2(e, id));
    }
    return namen;
  }
  function zeichneZuhause(host, ctx) {
    const doc = host.ownerDocument;
    const d = ctx.dash || {};
    const s = ctx.states || {};
    const namen = offeneNamen(ctx);
    const kontakt = d.contacts && s[d.contacts];
    const kopfAttr = kontakt && kontakt.attributes && kontakt.attributes[d.contactsHeaderAttr || "header"];
    let zahlOffen = namen.length;
    if (kontakt && !leerZustand(kontakt) && zahl2(kontakt.state) != null) zahlOffen = zahl2(kontakt.state);
    const kontext = kopfAttr ? String(kopfAttr) : zahlOffen > 0 ? ctx.t("view.openCount", { n: zahlOffen }) : ctx.t("view.allShut");
    const view = rahmen(doc, ctx.t("view.home"), kontext);
    const hatKontakte = !!(kontakt || (d.contactGroups || []).some((id) => entityDa(s, id)) || (d.windows || []).some((id) => entityDa(s, id)));
    if (!hatKontakte) {
      const w = wetterSatz(ctx.model && ctx.model.weather, ctx.locale);
      view.stage.append(el(doc, "div", "t-hero", w || ctx.t("view.empty")));
    } else if (zahlOffen <= 0) {
      view.stage.append(el(doc, "div", "t-hero", ctx.t("view.allShutSentence")));
    } else {
      const gross = el(doc, "div", "wert");
      gross.append(el(doc, "span", "t-display", String(zahlOffen)), el(doc, "span", "t-body", ` ${ctx.t("view.openUnit")}`));
      view.stage.append(gross);
      const liste2 = el(doc, "div", "liste");
      const gezeigt = namen.slice(0, 4);
      for (const name of gezeigt) liste2.append(zeile(doc, name, ctx.t("view.openWord")));
      if (namen.length > 4) liste2.append(zeile(doc, `+${namen.length - 4}`, ""));
      view.stage.append(liste2);
    }
    const fakten = el(doc, "div", "fakten");
    const aussen = d.outdoorTemp && s[d.outdoorTemp];
    if (aussen && !leerZustand(aussen)) fakten.append(fakt(doc, ctx.t("dash.outdoor"), `${textZahl(zahl2(aussen.state), ctx.locale)}\xB0`));
    const waste = (ctx.model && ctx.model.waste || []).filter((bin) => bin.when === "tomorrow");
    if (waste.length) fakten.append(fakt(doc, ctx.t("view.wasteTomorrow"), waste.map((b) => b.name).join(", ")));
    if (fakten.childNodes.length) view.stage.append(fakten);
    const guard = d.guard && s[d.guard];
    if (guard) {
      const an = guard.state === "on";
      view.actions.append(knopf(doc, ctx.t(an ? "dash.guardOn" : "dash.guardOff"), () => ctx.onAction({ type: "guard" }), an));
    }
    host.replaceChildren(view.root);
  }
  function zeichneEnergie(host, ctx) {
    const doc = host.ownerDocument;
    const d = ctx.dash || {};
    const s = ctx.states || {};
    const pv = s[d.energyPv];
    const nacht = leerZustand(pv);
    const jetztW = pv && zahl2(pv.state);
    const tag = d.energyDay && s[d.energyDay];
    const tagZahl = tag && !leerZustand(tag) ? zahl2(tag.state) : null;
    if (tagZahl != null) merkEnergie(tagZahl);
    const netz = d.energyGrid && s[d.energyGrid];
    const speisung = d.energyFeed && s[d.energyFeed];
    const auto = d.energyAutonomy && s[d.energyAutonomy];
    const autoZahl = auto && !leerZustand(auto) ? zahl2(auto.state) : null;
    const kontext = autoZahl != null ? ctx.t("view.sunShare", { n: textZahl(autoZahl, ctx.locale) }) : "";
    const view = rahmen(doc, ctx.t("view.energy"), kontext);
    if (nacht) {
      view.stage.append(el(doc, "div", "t-hero", ctx.t("view.night")));
      const merk = letzteEnergie();
      const line = merk ? ctx.t("view.nightMeta", { n: textZahl(merk.kwh, ctx.locale) }) : ctx.t("view.nightQuiet");
      view.stage.append(el(doc, "div", "t-meta", line));
    } else {
      const gross = el(doc, "div", "wert");
      gross.append(el(doc, "span", "t-display", textZahl(jetztW, ctx.locale)), el(doc, "span", "t-body", " kW"));
      view.stage.append(gross);
    }
    const fakten = el(doc, "div", "fakten");
    if (tagZahl != null) fakten.append(fakt(doc, ctx.t("dash.today"), `${textZahl(tagZahl, ctx.locale)} kWh`));
    const bezug = netz && !leerZustand(netz) ? zahl2(netz.state) : null;
    const ein = speisung && !leerZustand(speisung) ? zahl2(speisung.state) : null;
    if (bezug != null && (ein == null || bezug >= ein)) fakten.append(fakt(doc, ctx.t("view.grid"), `${textZahl(bezug, ctx.locale)} kW`));
    else if (ein != null) fakten.append(fakt(doc, ctx.t("view.feed"), `${textZahl(ein, ctx.locale)} kW`));
    if (autoZahl != null) {
      fakten.append(fakt(doc, ctx.t("view.autonomy"), `${textZahl(autoZahl, ctx.locale)} %`));
      const bar = el(doc, "div", "balken");
      const fill = el(doc, "i");
      const pct = Math.max(0, Math.min(100, autoZahl));
      fill.style.width = `${pct}%`;
      bar.append(fill);
      view.stage.append(fakten, bar);
    } else if (fakten.childNodes.length) view.stage.append(fakten);
    host.replaceChildren(view.root);
  }
  function zeichneKlima(host, ctx) {
    var _a;
    const doc = host.ownerDocument;
    const d = ctx.dash || {};
    const s = ctx.states || {};
    const bits = [];
    const aussen = d.outdoorTemp && s[d.outdoorTemp];
    if (aussen && !leerZustand(aussen)) bits.push(`${textZahl(zahl2(aussen.state), ctx.locale)}\xB0`);
    const wind = d.wind && s[d.wind];
    if (wind && !leerZustand(wind)) bits.push(freundlich2(wind, d.wind) ? `${textZahl((_a = zahl2(wind.state)) != null ? _a : wind.state, ctx.locale)}` : "");
    const regen = d.rain && s[d.rain];
    if (regen && !leerZustand(regen)) {
      const an = offen(regen);
      bits.push(an ? ctx.t("dash.rainOn") : zahl2(regen.state) != null ? textZahl(zahl2(regen.state), ctx.locale) : ctx.t("dash.rainOff"));
    }
    const view = rahmen(doc, ctx.t("view.climate"), bits.filter(Boolean).join(" \xB7 "));
    const raeume = (d.indoor || []).filter((id) => entityDa(s, id));
    const werte = raeume.map((id) => ({ id, e: s[id], n: leerZustand(s[id]) ? null : zahl2(s[id].state) }));
    const erster = werte.find((r) => r.n != null) || werte[0];
    if (!erster || erster.n == null) {
      view.stage.append(el(doc, "div", "t-hero leer", "\u2013"));
      view.stage.append(el(doc, "div", "t-meta", ctx.t("view.roomsPaused")));
    } else {
      const gross = el(doc, "div", "wert");
      gross.append(el(doc, "span", "t-hero", `${textZahl(erster.n, ctx.locale)}\xB0`), el(doc, "span", "t-body", ` ${freundlich2(erster.e, erster.id)}`));
      view.stage.append(gross);
      const liste2 = el(doc, "div", "liste zwei");
      for (const raum of werte) {
        if (raum === erster) continue;
        const wert = raum.n == null ? "\u2013" : `${textZahl(raum.n, ctx.locale)}\xB0`;
        liste2.append(zeile(doc, freundlich2(raum.e, raum.id), wert));
      }
      if (liste2.childNodes.length) view.stage.append(liste2);
    }
    host.replaceChildren(view.root);
  }
  function zeichneMusik(host, ctx) {
    const doc = host.ownerDocument;
    const still = !ctx.titel && !ctx.spielt;
    const view = rahmen(doc, ctx.t("view.music"), still ? "" : ctx.quelle || "");
    const cover = el(doc, "div", "cover", "\u266A");
    if (ctx.cover) {
      cover.style.backgroundImage = `url("${ctx.cover}")`;
      cover.textContent = "";
    }
    view.stage.append(cover);
    view.stage.append(el(doc, "div", "t-title", still ? ctx.t("view.quiet") : ctx.titel || ctx.t("view.quiet")));
    view.stage.append(el(doc, "div", "t-meta", still ? ctx.t("view.noPlayer") : ctx.interpret || ""));
    if (ctx.mediaEntity) {
      view.actions.append(knopf(doc, ctx.t("np.prev"), () => ctx.onAction({ type: "music", which: "prev" })));
      view.actions.append(knopf(doc, ctx.t(ctx.spielt ? "np.pause" : "np.play"), () => ctx.onAction({ type: "music", which: "play" }), true));
      view.actions.append(knopf(doc, ctx.t("np.next"), () => ctx.onAction({ type: "music", which: "next" })));
    } else if (ctx.scriptMusikAn || ctx.scriptMusikAus) {
      const laeuft = !!(ctx.spielt || ctx.musikAn);
      view.actions.append(knopf(doc, ctx.t(laeuft ? "zone.musicOff" : "zone.musicOn"), () => ctx.onAction({ type: "music", which: "toggle" }), true));
    }
    const eintraege = ctx.naechste || [];
    if (eintraege.length) {
      const block = el(doc, "div", "liste");
      block.append(el(doc, "div", "t-label", ctx.t("np.upNext")));
      for (let i = 0; i < eintraege.length; i++) {
        const row = knopf(doc, eintraege[i].label, () => ctx.onAction({ type: "music", which: "queue", index: i }));
        row.classList.add("liste-zeile");
        block.append(row);
      }
      view.stage.append(block);
    }
    host.replaceChildren(view.root);
  }
  function schalterKachel(doc, label, an, onPress) {
    const b = el(doc, "button", an ? "schalter-kachel is-an" : "schalter-kachel");
    b.type = "button";
    b.append(el(doc, "span", "t-body", label), el(doc, "span", "t-meta", an ? "on" : "off"));
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onPress();
    });
    return b;
  }
  function segment(doc, wert, optionen, onPick) {
    const wrap2 = el(doc, "div", "segment");
    for (const opt of optionen) {
      const b = el(doc, "button", opt.value === wert ? "is-an" : "", opt.label);
      b.type = "button";
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        onPick(opt.value);
      });
      wrap2.append(b);
    }
    return wrap2;
  }
  function zeichneStatus(host, ctx) {
    const doc = host.ownerDocument;
    const view = rahmen(doc, ctx.t("view.status"), ctx.version ? `v${ctx.version}` : "");
    view.stage.append(el(doc, "div", "t-hero", ctx.stateName || ""));
    view.stage.append(el(doc, "div", "t-meta", ctx.seit || ""));
    const conn = el(doc, "div", "verbindung");
    const punkt = el(doc, "i", ctx.verbunden ? "is-an" : "");
    conn.append(punkt, el(doc, "span", "t-meta", ctx.verbindung || ""));
    view.stage.append(conn);
    if (ctx.befehl) view.stage.append(el(doc, "div", "t-meta", ctx.befehl));
    const raster = el(doc, "div", "kacheln");
    raster.append(schalterKachel(doc, ctx.t("display.caption"), !!ctx.caption, () => ctx.onAction({ type: "toggle", key: "caption" })));
    raster.append(schalterKachel(doc, ctx.t("display.sound"), !!ctx.ton, () => ctx.onAction({ type: "toggle", key: "ton" })));
    raster.append(schalterKachel(doc, ctx.t("display.clock"), !!ctx.clockOn, () => ctx.onAction({ type: "toggle", key: "uhr" })));
    raster.append(schalterKachel(doc, ctx.t("display.nowPlaying"), !!ctx.nowPlaying, () => ctx.onAction({ type: "toggle", key: "np" })));
    view.stage.append(raster);
    view.stage.append(segment(doc, ctx.modus, [
      { value: "vollbild", label: ctx.t("mode.bold") },
      { value: "2d", label: ctx.t("mode.cube") },
      { value: "led", label: ctx.t("mode.fortune") }
    ], (value) => ctx.onAction({ type: "mode", value })));
    view.stage.append(segment(doc, ctx.lang || "auto", [
      { value: "de", label: "DE" },
      { value: "en", label: "EN" }
    ], (value) => ctx.onAction({ type: "lang", value })));
    view.actions.append(knopf(doc, ctx.t("sheet.full"), () => ctx.onAction({ type: "settings" })));
    view.actions.append(knopf(doc, ctx.t("demo.link"), () => ctx.onAction({ type: "demo" })));
    host.replaceChildren(view.root);
  }
  function restText(ms) {
    const sec = Math.max(0, Math.ceil(ms / 1e3));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  function zeichneTimer(host, ctx) {
    const doc = host.ownerDocument;
    const stand = timerStand(ctx.jetztMs || Date.now());
    const ziel = stand.ziel ? uhrKurz(stand.ziel, ctx.locale) : "\u2013";
    const view = rahmen(doc, ctx.t("view.timer"), stand.an ? ziel : ctx.t("view.timerIdle"));
    view.stage.append(el(doc, "div", "t-display", stand.an ? restText(stand.rest) : "0:00"));
    if (stand.an) view.stage.append(el(doc, "div", "t-meta", ziel));
    view.actions.append(knopf(doc, ctx.t("view.plus1"), () => ctx.onAction({ type: "timer", delta: 1 })));
    view.actions.append(knopf(doc, ctx.t("view.plus5"), () => ctx.onAction({ type: "timer", delta: 5 })));
    view.actions.append(knopf(doc, ctx.t("view.stop"), () => ctx.onAction({ type: "timer", delta: 0 })));
    host.replaceChildren(view.root);
  }
  var ZEICHNER = {
    day: zeichneTag,
    home: zeichneZuhause,
    energy: zeichneEnergie,
    climate: zeichneKlima,
    music: zeichneMusik,
    status: zeichneStatus,
    timer: zeichneTimer
  };
  function zeichneAnsicht(host, name, ctx) {
    const fn = ZEICHNER[name] || zeichneTag;
    fn(host, ctx || {});
  }

  // web/audio.js
  function createAudio(clips, extra = []) {
    let ac = null;
    const buf = {};
    const roh = {};
    let tonAn = true;
    let lauf = null;
    function prefetch() {
      const namen = new Set(extra.filter(Boolean));
      for (const c of clips) if (c.sound) namen.add(c.sound);
      for (const name of namen) {
        if (roh[name]) continue;
        roh[name] = fetch(`sounds/${name}.wav`).then((r) => {
          if (!r.ok) throw new Error(name);
          return r.arrayBuffer();
        }).catch(() => null);
      }
    }
    function unlock() {
      return __async(this, null, function* () {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        if (navigator.audioSession) {
          try {
            navigator.audioSession.type = "playback";
          } catch (e) {
          }
        }
        if (!ac) ac = new AC();
        if (ac.state === "suspended" && typeof ac.resume === "function") yield ac.resume();
        const still = ac.createBuffer(1, 1, 22050);
        const s = ac.createBufferSource();
        s.buffer = still;
        s.connect(ac.destination);
        try {
          s.start(0);
        } catch (e) {
        }
        if (!lauf) lauf = dekodiere();
        yield lauf;
        return ac.state === "running";
      });
    }
    function decode(context, data) {
      return new Promise((resolve, reject) => {
        let settled = false;
        const ok = (audio) => {
          if (!settled) {
            settled = true;
            resolve(audio);
          }
        };
        const bad = (err) => {
          if (!settled) {
            settled = true;
            reject(err);
          }
        };
        const pending = context.decodeAudioData(data, ok, bad);
        if (pending && typeof pending.then === "function") pending.then(ok, bad);
      });
    }
    function dekodiere() {
      return __async(this, null, function* () {
        yield Promise.all(Object.keys(roh).map((name) => __async(null, null, function* () {
          if (buf[name]) return;
          const data = yield roh[name];
          if (!data || !ac) return;
          try {
            buf[name] = yield decode(ac, data.slice(0));
          } catch (e) {
          }
        })));
      });
    }
    function ton(clip) {
      if (!tonAn || !ac || ac.state !== "running" || !(clip == null ? void 0 : clip.sound) || !buf[clip.sound]) return;
      const s = ac.createBufferSource();
      s.buffer = buf[clip.sound];
      const gain = typeof clip.gain === "number" ? Math.max(0, Math.min(1, clip.gain)) : 1;
      if (gain < 0.99 && ac.createGain) {
        const g = ac.createGain();
        g.gain.value = gain;
        s.connect(g);
        g.connect(ac.destination);
      } else s.connect(ac.destination);
      s.start(ac.currentTime + (clip.s_off > 0 ? clip.s_off : 0));
    }
    function status() {
      return { freigegeben: !!ac && ac.state === "running", geladen: Object.keys(buf).length };
    }
    prefetch();
    return {
      unlock,
      ton,
      context() {
        return ac;
      },
      setTon(an) {
        tonAn = !!an;
      },
      status
    };
  }

  // web/schlaf.js
  function createWaechter(nachSekunden, jetzt = () => Date.now() / 1e3) {
    let letzte = jetzt();
    let schlaeft = false;
    let pausiert = false;
    let frist = Number(nachSekunden) || 0;
    return {
      setNach(s) {
        frist = Number(s) || 0;
      },
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
      einschlafen() {
        schlaeft = true;
      },
      tick() {
        if (pausiert) return schlaeft ? "schlafen" : "wach";
        if (schlaeft) return "schlafen";
        if (!(frist > 0)) return "wach";
        if (jetzt() - letzte >= frist) {
          schlaeft = true;
          return "einschlafen";
        }
        return "wach";
      },
      ruhe() {
        if (pausiert) return 0;
        return Math.max(0, jetzt() - letzte);
      },
      get schlaeft() {
        return schlaeft;
      }
    };
  }

  // web/befehle.js
  var BEFEHLE = {
    musik_an: { zustand: "musik_an", scriptKey: "scriptMusikAn", label: "Music on" },
    musik_aus: { zustand: "idle", scriptKey: "scriptMusikAus", label: "Music off" },
    licht_an: { zustand: "licht_an", scriptKey: "scriptLichtAn", label: "Lights on" },
    licht_aus: { zustand: "licht_aus", scriptKey: "scriptLichtAus", label: "Lights out" }
  };

  // web/zwei_d.js
  var LOOK = {
    BG_IN: [23, 22, 23],
    BG_OUT: [7, 7, 8],
    VIGNETTE: 0.55,
    SHEEN: 0.075,
    EYE: 0.68,
    EYE_GLOW: 0.34,
    GLOW_SIGMA: 0.03,
    EYE_TINT: [1, 0.965, 0.92],
    CORNER: 0.055,
    RING_TAU: 0.04,
    RING_LINE: 0.01,
    RING_LINE_W: 35e-4,
    RING_TOP: 0.28,
    FLOOR: 0.85,
    RIM: 0.1
  };
  var BOLD = {
    BG_IN: [8, 8, 8],
    BG_OUT: [0, 0, 0],
    VIGNETTE: 0.08,
    SHEEN: 0,
    EYE: 1,
    EYE_GLOW: 0,
    GLOW_SIGMA: 0,
    EYE_TINT: [1, 1, 1],
    CORNER: 0,
    RING_TAU: 0,
    RING_LINE: 0,
    RING_LINE_W: 0,
    RING_TOP: 0,
    FLOOR: 0,
    RIM: 0
  };
  var sst = (a, b, x) => {
    const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  var canvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  function portraitEyeScale(aspect) {
    if (!(aspect > 0) || aspect >= 1) return 1;
    const fit = (aspect - 0.12) / 0.45;
    return Math.max(0.62, Math.min(1, fit));
  }
  var Szene2D = class {
    constructor(W, H, opt) {
      this.W = W;
      this.H = H;
      this.aspect = W / H;
      this.R = H / 2;
      this.bold = !!(opt && opt.bold);
      this.cheap = !!(opt && opt.cheap) || this.bold;
      const basis = this.bold ? BOLD : LOOK;
      this.look = opt && opt.cube ? __spreadProps(__spreadValues({}, basis), { CORNER: 0, RING_TAU: 0, RING_LINE: 0, RING_LINE_W: 0, FLOOR: 0, RIM: 0 }) : basis;
      const q = this.cheap || W * H > 15e5 ? 2 : 1, w = Math.round(W / q), h = Math.round(H / q), L2 = this.look, A = this.aspect;
      this.bg = canvas(w, h);
      this.mask = canvas(w, h);
      const bgI = this.bg.getContext("2d").createImageData(w, h), mI = this.mask.getContext("2d").createImageData(w, h);
      const cr = L2.CORNER * h;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const nx = (i + 0.5 - w / 2) / (h / 2), ny = (j + 0.5 - h / 2) / (h / 2), rr = Math.hypot(nx / A, ny);
        const g = Math.exp(-__pow(rr / 0.95, 2)), vig = 1 - L2.VIGNETTE * sst(0.55, 1.45, rr);
        let sheen = Math.exp(-(__pow((nx + 0.62 * A) / 0.55, 2) + __pow((ny + 0.62) / 0.22, 2))) * L2.SHEEN;
        sheen += Math.exp(-(__pow((nx + 0.55 * A) / 1.1, 2) + __pow((ny + 0.55) / 0.5, 2))) * L2.SHEEN * 0.25;
        const qx = Math.abs(i + 0.5 - w / 2) - (w / 2 - cr), qy = Math.abs(j + 0.5 - h / 2) - (h / 2 - cr);
        const out = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cr, d = Math.max(-out, 0), inside = out < 0 ? 1 : 0;
        const tau = L2.RING_TAU * h;
        const lineW = L2.RING_LINE_W * h;
        const edge = (tau > 0 ? Math.exp(-d / tau) * 0.42 : 0) + (lineW > 0 ? Math.exp(-__pow((d - L2.RING_LINE * h) / lineW, 2)) * 0.4 : 0);
        const wy = L2.RING_TOP + (1 - L2.RING_TOP) * sst(-0.9, 0.95, ny);
        const floor = Math.exp(-(__pow(nx / (0.62 * A), 2) + __pow((ny - 1.04) / 0.2, 2))) * L2.FLOOR;
        const rim = Math.exp(-__pow((d - 4e-3 * h) / (25e-4 * h), 2)) * L2.RIM * (1 - sst(-1, 0.2, ny)) * (0.6 + 0.4 * Math.exp(-__pow((nx + 0.5 * A) / A, 2)));
        const k = 4 * (j * w + i), tint = [0.92, 0.93, 0.95];
        const dither = (i * 17 + j * 29 & 15) / 16 - 0.5;
        for (let c = 0; c < 3; c++) {
          const bo = L2.BG_OUT[c] / 255, bi = L2.BG_IN[c] / 255;
          const shade = inside * Math.min(1, (bo + (bi - bo) * g) * vig + sheen * tint[c] + rim);
          bgI.data[k + c] = Math.max(0, Math.min(255, Math.round(255 * shade + dither * 0.65)));
        }
        bgI.data[k + 3] = 255;
        const glow = inside * (edge * wy + floor);
        const knee = glow / (1 + glow * 0.42);
        mI.data[k] = mI.data[k + 1] = mI.data[k + 2] = 255;
        mI.data[k + 3] = Math.max(0, Math.min(255, Math.round(255 * knee + dither)));
      }
      this.bg.getContext("2d").putImageData(bgI, 0, 0);
      this.mask.getContext("2d").putImageData(mI, 0, 0);
      this.tint = canvas(w, h);
      this.bgFull = canvas(W, H);
      const bc = this.bgFull.getContext("2d");
      bc.imageSmoothingQuality = "high";
      bc.drawImage(this.bg, 0, 0, W, H);
      this.gq = 4;
      if (!this.cheap) {
        this.glow = canvas(Math.ceil(W / this.gq), Math.ceil(H / this.gq));
        this.small = canvas(this.glow.width, this.glow.height);
      }
    }
    // Draw the eyes directly (additive). The lid and the "^^" cut are an even-odd clip, so no extra buffer is needed.
    drawEyes(c, prims, color, sc = 1) {
      const R = this.R * sc, cx = this.W * sc / 2, cy = this.H * sc / 2, X = (p) => cx + p[0] * R, Y = (p) => cy - p[1] * R, BIG = 1e5;
      for (const e of prims) {
        c.save();
        if (e.lid) {
          const [l1, l2, up] = e.lid;
          let nx = -(l2[1] - l1[1]), ny = l2[0] - l1[0];
          const nl = Math.hypot(nx, ny);
          nx /= nl;
          ny /= nl;
          if ((up[0] - l1[0]) * nx + (up[1] - l1[1]) * ny < 0) {
            nx = -nx;
            ny = -ny;
          }
          const big = 0.6, q1 = [l1[0] + nx * big, l1[1] + ny * big], q2 = [l2[0] + nx * big, l2[1] + ny * big];
          c.beginPath();
          c.rect(-BIG, -BIG, 2 * BIG, 2 * BIG);
          c.moveTo(X(l1), Y(l1));
          c.lineTo(X(l2), Y(l2));
          c.lineTo(X(q2), Y(q2));
          c.lineTo(X(q1), Y(q1));
          c.closePath();
          c.clip("evenodd");
        }
        if (e.cut) {
          c.beginPath();
          c.rect(-BIG, -BIG, 2 * BIG, 2 * BIG);
          c.arc(X(e.cut[0]), Y(e.cut[0]), e.cut[1] * R, 0, 2 * Math.PI);
          c.clip("evenodd");
        }
        c.strokeStyle = color;
        c.lineCap = "round";
        c.lineWidth = 2 * e.r * R;
        c.beginPath();
        c.moveTo(X(e.p1), Y(e.p1));
        c.lineTo(X(e.p2) + 0.01 * sc, Y(e.p2));
        c.stroke();
        c.restore();
      }
    }
    render(ctx, pose, ring, box, eyesOnly) {
      var _a, _b;
      const { W, H, aspect } = this, L2 = this.look;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      if (!eyesOnly) {
        ctx.globalCompositeOperation = "copy";
        ctx.globalAlpha = 1;
        ctx.drawImage(this.bgFull, 0, 0);
        const t = this.tint.getContext("2d"), tw = this.tint.width, th = this.tint.height, [r, g, b] = ring[0].map((x) => Math.round(Math.max(0, Math.min(255, x))));
        t.globalCompositeOperation = "copy";
        t.drawImage(this.mask, 0, 0);
        t.globalCompositeOperation = "source-in";
        t.fillStyle = `rgb(${r},${g},${b})`;
        t.fillRect(0, 0, tw, th);
        if (ring[2] !== null && ring[2] !== void 0) {
          const gr = t.createLinearGradient(0, 0, tw, 0);
          for (let k = 0; k <= 32; k++) {
            const u = -1 + 2 * k / 32;
            gr.addColorStop(k / 32, `rgba(0,0,0,${0.35 + 0.65 * Math.exp(-__pow(u - ring[2], 2) * 6)})`);
          }
          t.globalCompositeOperation = "destination-in";
          t.fillStyle = gr;
          t.fillRect(0, 0, tw, th);
        }
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.max(0, Math.min(1, ring[1]));
        ctx.drawImage(this.tint, 0, 0, W, H);
      }
      ctx.globalCompositeOperation = "source-over";
      const prims = poseToPrims2d(pose, aspect), br = Math.max(0, Math.min(1, (_b = (_a = prims[0]) == null ? void 0 : _a.bright) != null ? _b : 1));
      const T = `rgb(${L2.EYE_TINT.map((x) => Math.round(255 * x)).join(",")})`;
      const eyeScale = box && box.size > 0 ? 1 : portraitEyeScale(aspect);
      if (eyeScale < 1) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(eyeScale, eyeScale);
        ctx.translate(-W / 2, -H / 2);
      }
      if (box && box.size > 0) {
        const k = box.size / H;
        ctx.save();
        ctx.translate(box.x + box.size / 2, box.y + box.size / 2);
        ctx.scale(k, k);
        ctx.translate(-W / 2, -H / 2);
      }
      if (this.cheap) {
        ctx.globalAlpha = Math.min(1, (L2.EYE + L2.EYE_GLOW * 0.35) * br);
        this.drawEyes(ctx, prims, T);
        if (box) ctx.restore();
        if (eyeScale < 1) ctx.restore();
        ctx.restore();
        return;
      }
      const gc = this.glow.getContext("2d"), gw = this.glow.width, gh = this.glow.height, q = this.gq, off = gw + 50;
      const sc_ = this.small.getContext("2d");
      sc_.clearRect(0, 0, gw, gh);
      this.drawEyes(sc_, prims, T, 1 / q);
      gc.clearRect(0, 0, gw, gh);
      gc.save();
      gc.shadowColor = T;
      gc.shadowBlur = 2 * L2.GLOW_SIGMA * H / q;
      gc.shadowOffsetX = off;
      gc.drawImage(this.small, -off, 0);
      gc.restore();
      let x0 = 1e9, x1 = -1e9, yA = 1e9, yB = -1e9;
      for (const e of prims) for (const p of [e.p1, e.p2]) {
        x0 = Math.min(x0, p[0] - e.r);
        x1 = Math.max(x1, p[0] + e.r);
        yA = Math.min(yA, p[1] - e.r);
        yB = Math.max(yB, p[1] + e.r);
      }
      const pad = 4 * L2.GLOW_SIGMA * 2, sx0 = Math.max(0, Math.floor((W / 2 + (x0 - pad) * this.R) / q)), sx1 = Math.min(gw, Math.ceil((W / 2 + (x1 + pad) * this.R) / q));
      const sy0 = Math.max(0, Math.floor((H / 2 - (yB + pad) * this.R) / q)), sy1 = Math.min(gh, Math.ceil((H / 2 - (yA - pad) * this.R) / q));
      ctx.globalAlpha = L2.EYE_GLOW * br;
      if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(this.glow, sx0, sy0, sx1 - sx0, sy1 - sy0, sx0 * q, sy0 * q, (sx1 - sx0) * q, (sy1 - sy0) * q);
      ctx.globalAlpha = L2.EYE * br;
      this.drawEyes(ctx, prims, T);
      if (box) ctx.restore();
      if (eyeScale < 1) ctx.restore();
      ctx.restore();
    }
  };

  // web/led.js
  var L = {
    R_GLAS: 60,
    R_DIFF: 56.5,
    R_LED: 52,
    CAP: 60,
    PITCH: 2.5,
    EYE_W: 17.5,
    EYE_H: 31.5,
    SEP: 36,
    REST_POLAR: 30,
    YAW: 60,
    UP: 28,
    DOWN: 10,
    T_GLAS: 0.15,
    CAM_EL: 24
  };
  var rad2 = (d) => d * Math.PI / 180;
  var K_MM = () => L.SEP / P.SEP;
  function ledPositions(pitch, R, cap) {
    const pts = [[0, 1, 0]];
    for (let k = 1; k * pitch / R <= rad2(cap) + 1e-9; k++) {
      const th = k * pitch / R, n = Math.max(1, Math.round(2 * Math.PI * R * Math.sin(th) / pitch));
      for (let j = 0; j < n; j++) {
        const ph = 2 * Math.PI * (j + 0.5 * (k % 2)) / n;
        pts.push([Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)]);
      }
    }
    return pts;
  }
  function axes() {
    const p0 = rad2(L.REST_POLAR);
    return { c0: [0, Math.cos(p0), Math.sin(p0)], er: [1, 0, 0], eu: [0, Math.sin(p0), -Math.cos(p0)] };
  }
  var dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function sdf(prims, u, v) {
    let d = 1e9;
    for (const e of prims) {
      const [ax, ay] = e.p1, [bx, by] = e.p2, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
      const t = L2 > 1e-12 ? Math.min(1, Math.max(0, ((u - ax) * dx + (v - ay) * dy) / L2)) : 0;
      let de = Math.hypot(u - ax - t * dx, v - ay - t * dy) - e.r;
      if (e.lid) {
        const [[l1x, l1y], [l2x, l2y], [ux, uy]] = e.lid;
        let nx = -(l2y - l1y), ny = l2x - l1x;
        const nl = Math.hypot(nx, ny);
        nx /= nl;
        ny /= nl;
        if ((ux - l1x) * nx + (uy - l1y) * ny < 0) {
          nx = -nx;
          ny = -ny;
        }
        de = Math.max(de, (u - l1x) * nx + (v - l1y) * ny);
      }
      if (e.cut) {
        const [[cx, cy], rc] = e.cut;
        de = Math.max(de, rc - Math.hypot(u - cx, v - cy));
      }
      d = Math.min(d, de);
    }
    return d;
  }
  function ledLevels(pose, V, pitch) {
    const q = __spreadValues(__spreadValues({}, DEFAULT), pose), rr = rad2(q.roll), cr = Math.cos(rr), sr = Math.sin(rr), K2 = K_MM();
    const scr = (u, v) => [u * cr - v * sr + q.dx * K2, u * sr + v * cr + q.dy * K2];
    const prims = buildEyes(q, L.EYE_W * q.scale * q.sx, L.EYE_H * q.scale * q.sy, L.SEP * q.sep, 0, scr);
    const yaw = rad2(q.gx * L.YAW), pit = rad2(q.gy * (q.gy > 0 ? L.UP : L.DOWN));
    const { c0, er, eu } = axes(), out = new Float32Array(V.length);
    const cyw = Math.cos(-yaw), syw = Math.sin(-yaw), cp = Math.cos(-pit), sp = Math.sin(-pit);
    for (let i = 0; i < V.length; i++) {
      let [x, y, z] = V[i];
      [x, z] = [x * cyw + z * syw, -x * syw + z * cyw];
      [y, z] = [y * cp + z * sp, -y * sp + z * cp];
      const W = [x, y, z], ct = Math.max(-1, Math.min(1, dot(W, c0))), th = Math.acos(ct);
      const t = [x - ct * c0[0], y - ct * c0[1], z - ct * c0[2]], tl = Math.hypot(...t) + 1e-12, f = th * L.R_LED / tl;
      out[i] = Math.min(1, Math.max(0, 0.5 - sdf(prims, dot(t, er) * f, dot(t, eu) * f) / pitch)) * q.bright;
    }
    return out;
  }
  var LedScene = class {
    constructor(size, opt = {}) {
      var _a, _b, _c;
      this.size = size;
      this.pitch = (_a = opt.pitch) != null ? _a : L.PITCH;
      this.h = (_b = opt.h) != null ? _b : L.R_DIFF - L.R_LED;
      this.T = (_c = opt.T) != null ? _c : L.T_GLAS;
      this.grid = !!opt.grid;
      this.build();
    }
    build() {
      const S = this.size, px = this.px = S * 0.4 / L.R_GLAS, cx = this.cx = S / 2, cy = this.cy = S * 0.47;
      this.V = ledPositions(this.pitch, L.R_LED, L.CAP);
      const el2 = rad2(L.CAM_EL);
      this.right = [1, 0, 0];
      this.up = [0, Math.cos(el2), -Math.sin(el2)];
      this.view = [0, Math.sin(el2), Math.cos(el2)];
      const N = S * S, Rd = L.R_DIFF, Rg = L.R_GLAS, cosCap = Rd * Math.cos(rad2(L.CAP + 1));
      this.D = new Float32Array(N * 3);
      this.cap = new Uint8Array(N);
      this.inG = new Float32Array(N);
      this.glass = new Float32Array(N);
      this.Yn = new Float32Array(N);
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        const k = j * S + i, X = (i + 0.5 - cx) / px, Y = (cy - j - 0.5) / px, r2 = X * X + Y * Y;
        const zc = Math.sqrt(Math.max(0, Rd * Rd - r2));
        const Dx = X, Dy = Y * this.up[1] + zc * this.view[1], Dz = Y * this.up[2] + zc * this.view[2];
        this.D[k * 3] = Dx;
        this.D[k * 3 + 1] = Dy;
        this.D[k * 3 + 2] = Dz;
        this.cap[k] = r2 < Rd * Rd && Dy >= cosCap ? 1 : 0;
        const rho = Math.sqrt(r2) / Rg;
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, rho * rho)));
        const u = rho <= 0.84 ? 1 : rho >= 1.05 ? 0 : (1.05 - rho) / 0.21;
        const inG = u * u * (3 - 2 * u);
        this.inG[k] = inG;
        this.glass[k] = (0.012 + 0.02 * (1 - nz) * (1 - nz)) * inG;
        this.Yn[k] = Y / Rg;
      }
      this.ledXY = this.V.map((v) => [cx + dot(v, this.right) * L.R_LED * px, cy - dot(v, this.up) * L.R_LED * px]);
      this.lum = new Float32Array(N);
    }
    render(img, pose, ring) {
      const S = this.size, lv = ledLevels(pose, this.V, this.pitch), lum = this.lum.fill(0);
      const radius = Math.max(1.4, this.pitch * this.px * 0.58);
      const win = Math.ceil(radius + 1.4);
      for (let n = 0; n < lv.length; n++) {
        if (lv[n] <= 0.05) continue;
        const [x, y] = this.ledXY[n];
        const x0 = Math.max(0, Math.floor(x - win)), x1 = Math.min(S, Math.ceil(x + win));
        const y0 = Math.max(0, Math.floor(y - win)), y1 = Math.min(S, Math.ceil(y + win));
        for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) {
          const k = j * S + i;
          if (!this.cap[k]) continue;
          const dist = Math.hypot(i + 0.5 - x, j + 0.5 - y);
          if (dist >= radius + 1.2) continue;
          const cover = dist <= radius - 0.6 ? 1 : (radius + 1.2 - dist) / 1.8;
          const v = lv[n] * cover;
          if (v > lum[k]) lum[k] = v;
        }
      }
      const col = ring[0].map((c) => c / 255 * ring[1]), yb = this.cy + L.R_GLAS * this.px * 0.97, wR = L.R_GLAS * this.px * 0.85;
      const d = img.data;
      for (let j = 0; j < S; j++) {
        const gy = __pow((j - yb) / 16, 2);
        for (let i = 0; i < S; i++) {
          const k = j * S + i, inG = this.inG[k];
          const dim = Math.max(0.4, Math.min(1, this.T / 0.15));
          const shaped = lum[k] <= 0.12 ? 0 : lum[k] >= 0.72 ? 1 : (lum[k] - 0.12) / 0.6;
          const eye = shaped * dim;
          const capg = 0.012 * this.cap[k];
          const u = (i - this.cx) / wR;
          let g = Math.exp(-(u * u + gy) * 2.2);
          if (ring[2] !== null && ring[2] !== void 0) g *= 0.35 + 0.65 * Math.exp(-__pow(u - ring[2], 2) * 6);
          const rf = __pow(Math.min(1, Math.max(0, (-this.Yn[k] - 0.55) / 0.45)), 2) * inG * 0.45;
          const base = 0.045 * (1 - inG) + this.glass[k], gl = g * (1 - 0.7 * inG);
          d[k * 4] = 255 * Math.min(1, base + (eye * 1 + capg) * inG + col[0] * (gl + rf));
          d[k * 4 + 1] = 255 * Math.min(1, base + (eye * 0.98 + capg) * inG + col[1] * (gl + rf));
          d[k * 4 + 2] = 255 * Math.min(1, base + (eye * 0.95 + capg) * inG + col[2] * (gl + rf));
          d[k * 4 + 3] = 255;
        }
      }
      if (this.grid) for (let n = 0; n < this.V.length; n++) {
        if (dot(this.V[n], this.view) <= 0) continue;
        const i = Math.floor(this.ledXY[n][0]), j = Math.floor(this.ledXY[n][1]);
        if (i < 0 || j < 0 || i >= S || j >= S) continue;
        const k = (j * S + i) * 4;
        for (let c = 0; c < 3; c++) d[k + c] = Math.max(d[k + c], 41);
      }
    }
  };

  // web/licht.js
  var STATES = {
    idle: { rgb: [255, 106, 0], gain: 1, label: "Idle", lo: 0.2, hi: 0.32, T: 4 },
    zuhoeren: { rgb: [0, 200, 255], gain: 0.85, label: "Zuh\xF6ren", lo: 0.55, hi: 1, T: 1.2 },
    nachdenken: { rgb: [138, 60, 255], gain: 1.1, label: "Nachdenken", lo: 0.5, hi: 0.9, T: 1 },
    sprechen: { rgb: [255, 176, 102], gain: 0.9, label: "Sprechen", lo: 0.45, hi: 0.85, T: 0.9 },
    bestaetigt: { rgb: [43, 255, 136], gain: 0.7, label: "Best\xE4tigt", lo: 0.3, hi: 1, T: 1.6 },
    fehler: { rgb: [255, 26, 26], gain: 1.05, label: "Fehler", lo: 0.25, hi: 1, T: 2.2 },
    schlafen: { rgb: [58, 21, 0], gain: 1, label: "Schlafen", lo: 0.15, hi: 0.35, T: 4.5 },
    musik: { rgb: [255, 122, 0], gain: 0.95, label: "Musik", lo: 0.5, hi: 0.9, T: 1 }
    // RING musik; in B wie nachdenken
  };
  var GEO = {
    RIM_SIGMA: 7e-3,
    RIM_MIN: 3,
    // Kernlinie (Gauss)
    RIM_A: 0.38,
    TAU: 0.06,
    TAU_MIN: 26,
    // Innenschein (Exponential), "dünnes" Profil
    THICK: 2.6,
    // "dickes" Profil: TAU * 2.2 (Wellenberg)
    BLOOM_A: 0.55,
    HAZE_SIGMA: 0.21,
    HAZE_MIN: 95,
    HAZE_A: 0.16,
    PNORM: 6,
    // Isolinien am Rand fast eckig, nach innen runder
    TOP: 0.4,
    // Grundgewicht oben (unten 1.0), LED-Ring-Gefühl
    PART_K: 0.07,
    // Weichheit der Kantenzuordnung
    DEPTH: 0.5,
    // Randlicht blendet zwischen 0.30 m und 0.50 m weich (smoothstep) auf 0
    SECTORS: 24
    // Umfang in 24 weich überlappende Sektoren (Partition der Eins)
  };
  var WAVE = {
    FLOOR: 0.25,
    // Grundglut wie Original
    SIGMA: 0.075,
    // Breite des Wellenbergs (Anteil Umfang). Original: σ = √2 LED von 12 = 0.118, hier etwas schlanker
    PERIOD: 2.4,
    // s pro Umlauf (Original 1.0 s auf 12-cm-Ring; auf 1024 px Bildschirm wirkt 2.4 s gleich ruhig)
    TRAIL: 0.45,
    // zweiter, schwächerer Berg (gegenüber, 0.5 Umfang versetzt), gibt organischen Fluss
    WOBBLE: 0.22
    // langsame Amplituden-/Dickenschwankung (Rauschen aus 3 Sinus), "lebendig"
  };
  function sst2(a, b, x) {
    var u = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  }
  function sdfSigned(x, y, W, H, R) {
    var qx = Math.abs(x - W / 2) - (W / 2 - R), qy = Math.abs(y - H / 2) - (H / 2 - R);
    return -(Math.sqrt(Math.max(qx, 0) * Math.max(qx, 0) + Math.max(qy, 0) * Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R);
  }
  function edgeDist(x, y, W, H, R, P3) {
    var dx = Math.max(1e-3, W / 2 - Math.abs(x - W / 2)), dy = Math.max(1e-3, H / 2 - Math.abs(y - H / 2));
    var d = Math.pow(Math.pow(dx, -P3) + Math.pow(dy, -P3), -1 / P3);
    if (R > 0) {
      var dr = Math.max(0, sdfSigned(x, y, W, H, R)), k = R / 3, hh = Math.max(0, Math.min(1, 0.5 + 0.5 * (dr - d) / k));
      d = dr + (d - dr) * hh - k * hh * (1 - hh);
    }
    return Math.max(0, d);
  }
  function perimS(x, y, W, H, k) {
    var P3 = 2 * (W + H);
    var sB = W / 2 - x, sL = W / 2 + (H - y), sT = W / 2 + H + x, sR = W / 2 + H + W + y;
    var e = [Math.exp(-(H - y) / k), Math.exp(-x / k), Math.exp(-y / k), Math.exp(-(W - x) / k)], ss = [sB, sL, sT, sR];
    var best = 0;
    for (var i = 1; i < 4; i++) if (e[i] > e[best]) best = i;
    var ref = ss[best], sum = 0, acc = 0;
    for (var j = 0; j < 4; j++) {
      var v = ss[j];
      while (v - ref > P3 / 2) v -= P3;
      while (v - ref < -P3 / 2) v += P3;
      acc += e[j] * v;
      sum += e[j];
    }
    var s = acc / sum / P3;
    s -= Math.floor(s);
    return s;
  }
  function rngFactory(seed) {
    return function() {
      seed = seed * 1103515245 + 12345 & 2147483647;
      return seed / 2147483647;
    };
  }
  function buildField(W, H, opt) {
    opt = opt || {};
    var s = opt.scale || 1, w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s)), m = Math.min(w, h), G = GEO, N = G.SECTORS;
    var R = (opt.cornerR || 0) * s;
    var rimS = Math.max(G.RIM_SIGMA * m, G.RIM_MIN * s), tau = Math.max(G.TAU * m, G.TAU_MIN * s), hazeS = Math.max(G.HAZE_SIGMA * m, G.HAZE_MIN * s);
    var k = G.PART_K * m, depth = G.DEPTH * m;
    var rnd = rngFactory(1234567);
    var hazeC = document.createElement("canvas");
    hazeC.width = w;
    hazeC.height = h;
    var hzImg = hazeC.getContext("2d").createImageData(w, h), HZ = hzImg.data;
    var thin = [], thick = [], box = [];
    for (var q = 0; q < N; q++) {
      thin.push(new Uint8ClampedArray(w * h));
      thick.push(new Uint8ClampedArray(w * h));
      box.push([w, h, -1, -1]);
    }
    for (var j = 0; j < h; j++) {
      var y = j + 0.5, ny = (y - h / 2) / (h / 2), wy = G.TOP + (1 - G.TOP) * sst2(-0.9, 0.95, ny);
      for (var i = 0; i < w; i++) {
        var x = i + 0.5, d = edgeDist(x, y, w, h, R, G.PNORM), p = j * w + i;
        var outC = R > 0 ? -sdfSigned(x, y, w, h, R) : 0, clip = outC > 0 ? Math.exp(-Math.pow(outC / (1.5 * s), 2)) : 1;
        var hz = G.HAZE_A * Math.exp(-(d / hazeS) * (d / hazeS)) * wy * clip * (1 - sst2(0.35 * m, 0.62 * m, d)) * 255 + rnd() + rnd() - 1;
        HZ[4 * p] = HZ[4 * p + 1] = HZ[4 * p + 2] = 255;
        HZ[4 * p + 3] = hz < 0 ? 0 : hz > 255 ? 255 : hz;
        if (d > depth) continue;
        var fade = (1 - sst2(depth * 0.6, depth, d)) * clip * wy;
        var rim = G.RIM_A * Math.exp(-(d / rimS) * (d / rimS));
        var vThin = (rim + G.BLOOM_A * Math.exp(-d / tau)) * fade, vThick = (rim + G.BLOOM_A * Math.exp(-d / (tau * G.THICK))) * fade;
        var sp = perimS(x, y, w, h, k) * N, q0 = Math.floor(sp), f = sp - q0, w1 = 0.5 - 0.5 * Math.cos(Math.PI * f), w0 = 1 - w1;
        var qs = [q0 % N, (q0 + 1) % N], ws = [w0, w1];
        for (var u = 0; u < 2; u++) {
          var qq = qs[u], a1 = 255 * vThin * ws[u] + rnd() + rnd() - 1, a2 = 255 * vThick * ws[u] + rnd() + rnd() - 1;
          if (a1 < 0.5 && a2 < 0.5) continue;
          thin[qq][p] = a1;
          thick[qq][p] = a2;
          var b = box[qq];
          if (i < b[0]) b[0] = i;
          if (j < b[1]) b[1] = j;
          if (i > b[2]) b[2] = i;
          if (j > b[3]) b[3] = j;
        }
      }
    }
    hazeC.getContext("2d").putImageData(hzImg, 0, 0);
    function toCanvas(arr, b2) {
      var bw = b2[2] - b2[0] + 1, bh = b2[3] - b2[1] + 1, c = document.createElement("canvas");
      c.width = bw;
      c.height = bh;
      var g = c.getContext("2d"), img = g.createImageData(bw, bh), D = img.data;
      for (var yy = 0; yy < bh; yy++) for (var xx = 0; xx < bw; xx++) {
        var src = (yy + b2[1]) * w + xx + b2[0], o = 4 * (yy * bw + xx);
        D[o] = D[o + 1] = D[o + 2] = 255;
        D[o + 3] = arr[src];
      }
      g.putImageData(img, 0, 0);
      return c;
    }
    var sectors = [];
    for (var z = 0; z < N; z++) {
      var bb = box[z];
      if (bb[2] < 0) continue;
      sectors.push({ x: bb[0], y: bb[1], s: z / N, thin: toCanvas(thin[z], bb), thick: toCanvas(thick[z], bb) });
    }
    return { w, h, scale: s, haze: hazeC, sectors };
  }
  function wrap(x) {
    x -= Math.floor(x);
    return x > 0.5 ? x - 1 : x;
  }
  function gauss(ds, sg) {
    return Math.exp(-(ds * ds) / (2 * sg * sg));
  }
  function noise3(t, a) {
    return (Math.sin(t * 0.73 + a * 6.28) + Math.sin(t * 1.37 + a * 12.1 + 1.7) + Math.sin(t * 2.11 + a * 3.9 + 4.2)) / 3;
  }
  function breath(t, T) {
    var ph = t / T % 1, inh = 0.45;
    return ph < inh ? 0.5 - 0.5 * Math.cos(Math.PI * ph / inh) : 0.5 + 0.5 * Math.cos(Math.PI * (ph - inh) / (1 - inh));
  }
  function easeOutCubic(u) {
    return 1 - Math.pow(1 - u, 3);
  }
  function level(st, t) {
    var S = STATES[st];
    if (st === "bestaetigt" || st === "fehler") {
      var cyc = S.T + 1.2, u = t % cyc / S.T;
      if (u > 1) return S.lo;
      if (st === "fehler") {
        var tt = t % cyc;
        return tt < 0.12 || tt > 0.17 && tt < 0.39 ? S.hi : S.lo + (S.hi - S.lo) * 0.25 * (1 - sst2(0.4, 1.4, tt));
      }
      return S.lo + (S.hi - S.lo) * (u < 0.06 ? easeOutCubic(u / 0.06) : 1 - sst2(0.5, 1, u));
    }
    if (st === "sprechen") {
      var v = 0.5 + 0.22 * Math.sin(t * 7.3) + 0.17 * Math.sin(t * 11.9 + 1.3) + 0.11 * Math.sin(t * 3.1);
      return S.lo + (S.hi - S.lo) * Math.max(0, Math.min(1, v));
    }
    if (st === "nachdenken" || st === "musik") return S.hi;
    return S.lo + (S.hi - S.lo) * breath(t, S.T);
  }
  function wave(st, s, t) {
    var W = WAVE, a, th;
    switch (st) {
      case "musik":
      case "nachdenken": {
        var pos = t / W.PERIOD, g1 = gauss(wrap(s - pos), W.SIGMA * (1 + 0.25 * noise3(t, 0.1))), g2 = gauss(wrap(s - pos - 0.5), W.SIGMA * 1.6);
        var wob = 1 + W.WOBBLE * noise3(t * 1.3, s);
        a = (W.FLOOR + (1.25 - W.FLOOR) * Math.min(1, g1 + W.TRAIL * g2)) * wob;
        th = Math.min(1, g1 + 0.5 * g2);
        break;
      }
      case "zuhoeren": {
        var st3 = 0.5 + 0.5 * Math.cos(2 * Math.PI * (3 * s) + t * 1.1);
        a = 0.7 + 0.3 * st3 * (1 + 0.5 * noise3(t, s));
        th = 0.35 * st3;
        break;
      }
      case "sprechen": {
        var ph = t / 1.4 % 1, gl = gauss(wrap(s - ph * 0.5), 0.09), gr = gauss(wrap(s + ph * 0.5), 0.09);
        a = 0.55 + 0.45 * Math.min(1, gl + gr) * (1 - 0.6 * ph);
        th = 0.6 * Math.min(1, gl + gr);
        break;
      }
      case "bestaetigt": {
        var u = Math.min(1, t % (STATES.bestaetigt.T + 1.2) / 0.8), front = u * 0.5, dist = Math.abs(wrap(s));
        a = 0.35 + 0.65 * sst2(front + 0.06, front - 0.04, dist);
        th = gauss(dist - front, 0.05);
        break;
      }
      case "fehler":
        a = 1;
        th = 0.3;
        break;
      default: {
        a = 0.88 + 0.12 * Math.cos(2 * Math.PI * (s - t / 14)) + 0.05 * noise3(t * 0.5, s);
        th = 0.15 + 0.1 * Math.cos(2 * Math.PI * (s - t / 14));
      }
    }
    return [a, th];
  }
  function toLin(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function toSrgb(l) {
    var c = l <= 31308e-7 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
    return Math.round(255 * Math.max(0, Math.min(1, c)));
  }
  function mixLin(a, b, u) {
    return [0, 1, 2].map(function(i) {
      return toSrgb(toLin(a[i]) + (toLin(b[i]) - toLin(a[i])) * u);
    });
  }
  function opacity(st, lv) {
    return Math.min(1, STATES[st].gain * (0.15 + 0.85 * Math.pow(lv, 0.8)));
  }
  var RUHIG = {
    K: 10,
    LINE_SIGMA: 0.026,
    LINE_MIN: 6,
    LINE_A: 0.18,
    // weiche Kernlinie (Gauss), kein Strich
    TAU: 0.085,
    TAU_MIN: 34,
    GLOW_A: 0.72,
    // Innenschein (Exponential)
    FADE0: 0.3,
    FADE1: 0.58,
    // Randlicht blendet zwischen 0.30 m und 0.58 m weich aus
    KURZ_H: 0.32,
    // kurz: Licht nur bis 0.32 m über dem unteren Rand (smoothstep), gleich auf iPad und iPhone
    LANG_TOP: 0.04,
    LANG_EXP: 1.5,
    // lang: Gewicht = TOP + (1-TOP)*ny^EXP, ny = 0 oben .. 1 unten
    RAHMEN_SIGMA: 0.035,
    RAHMEN_MIN: 12,
    RAHMEN_TOP: 0.6,
    DITHER: 3,
    T_STATE: 0.9,
    // s, Farbe/Pegel/Shift, easeInOutSine
    T_MODUS: 1.8
    // s, kurz <-> lang, smoothstep
  };
  var RUHIG_STATES = {
    idle: { modus: "kurz", lo: 0.32, hi: 0.42, T: 6, rahmen: [0.025, 0.06], shift: { T: 16, amp: 0.14, sigma: 0.32, base: 0.72 } },
    zuhoeren: { modus: "kurz", lo: 0.58, hi: 0.72, T: 3.6, rahmen: [0.04, 0.08], shift: { T: 8, amp: 0.2, sigma: 0.28, base: 0.58 } },
    sprechen: { modus: "kurz", lo: 0.52, hi: 0.68, T: 2.8, rahmen: [0.04, 0.08], shift: { T: 7, amp: 0.18, sigma: 0.3, base: 0.62 } },
    bestaetigt: { modus: "kurz", lo: 0.3, hi: 0.8, T: 3.2, rahmen: [0.04, 0.1], shift: { T: 10, amp: 0, sigma: 0.38, base: 0.55 }, puls: "einmal" },
    fehler: { modus: "kurz", lo: 0.3, hi: 0.85, T: 3.4, rahmen: [0.05, 0.12], shift: { T: 10, amp: 0, sigma: 0.4, base: 1 }, puls: "zweimal" },
    schlafen: { modus: "kurz", lo: 0.26, hi: 0.36, T: 8, rahmen: [0.015, 0.035], shift: { T: 20, amp: 0.1, sigma: 0.34, base: 0.75 } },
    nachdenken: { modus: "lang", lo: 0.72, hi: 0.84, T: 5, rahmen: [0.05, 0.08], shift: { T: 8, amp: 0.3, sigma: 0.24, base: 0.38 } },
    musik: { modus: "lang", lo: 0.66, hi: 0.82, T: 3, rahmen: [0.05, 0.08], shift: { T: 6, amp: 0.32, sigma: 0.24, base: 0.4 } }
  };
  function sinBreath(t, T) {
    return 0.5 - 0.5 * Math.cos(2 * Math.PI * t / T);
  }
  function easeInOutSine(u) {
    return 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)));
  }
  function levelRuhig(st, t) {
    var R = RUHIG_STATES[st], v;
    if (R.puls === "einmal") {
      var tt = t % R.T;
      v = tt < 0.5 ? Math.sin(Math.PI / 2 * tt / 0.5) : 1 - sst2(0.6, 2.4, tt);
    } else if (R.puls === "zweimal") {
      var t2 = t % R.T, pl = function(s0) {
        var x = (t2 - s0) / 0.6;
        return x > 0 && x < 1 ? Math.pow(Math.sin(Math.PI * x), 2) : 0;
      };
      v = Math.max(pl(0), 0.8 * pl(0.75));
    } else v = sinBreath(t, R.T);
    return R.lo + (R.hi - R.lo) * v;
  }
  function rahmenRuhig(st, t) {
    var R = RUHIG_STATES[st];
    return R.rahmen[0] + (R.rahmen[1] - R.rahmen[0]) * sinBreath(t, Math.max(5, R.T));
  }
  function shiftRuhig(st, u, t) {
    var h = RUHIG_STATES[st].shift, p = 0.5 + h.amp * (0.8 * Math.sin(2 * Math.PI * t / h.T) + 0.2 * Math.sin(2 * Math.PI * t / (1.618 * h.T) + 1));
    return h.base + (1 - h.base) * Math.exp(-(u - p) * (u - p) / (2 * h.sigma * h.sigma));
  }
  function buildRuhig(W, H, opt) {
    opt = opt || {};
    var s = opt.scale || 1, w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s)), m = Math.min(w, h), Q = RUHIG, K2 = Q.K;
    var R = (opt.cornerR || 0) * s, rnd = rngFactory(7654321), A = Q.DITHER;
    var ls = Math.max(Q.LINE_SIGMA * m, Q.LINE_MIN * s), tau = Math.max(Q.TAU * m, Q.TAU_MIN * s), rs = Math.max(Q.RAHMEN_SIGMA * m, Q.RAHMEN_MIN * s);
    var f0 = Q.FADE0 * m, f1 = Q.FADE1 * m;
    var rahmenC = document.createElement("canvas");
    rahmenC.width = w;
    rahmenC.height = h;
    var rImg = rahmenC.getContext("2d").createImageData(w, h), RD = rImg.data;
    var kurz = [], lang = [], bk = [], bl = [], q;
    for (q = 0; q < K2; q++) {
      kurz.push(new Uint8ClampedArray(w * h));
      lang.push(new Uint8ClampedArray(w * h));
      bk.push([w, h, -1, -1]);
      bl.push([w, h, -1, -1]);
    }
    function grow(b, i2, j2) {
      if (i2 < b[0]) b[0] = i2;
      if (j2 < b[1]) b[1] = j2;
      if (i2 > b[2]) b[2] = i2;
      if (j2 > b[3]) b[3] = j2;
    }
    for (var j = 0; j < h; j++) {
      var y = j + 0.5, ny = y / h;
      var wk = 1 - sst2(0, Q.KURZ_H * m, h - y), wl = Q.LANG_TOP + (1 - Q.LANG_TOP) * Math.pow(ny, Q.LANG_EXP), wr = Q.RAHMEN_TOP + (1 - Q.RAHMEN_TOP) * ny;
      for (var i = 0; i < w; i++) {
        var x = i + 0.5, d = edgeDist(x, y, w, h, R, G_PNORM), p = j * w + i;
        var outC = R > 0 ? -sdfSigned(x, y, w, h, R) : 0, clip = outC > 0 ? Math.exp(-Math.pow(outC / (1.5 * s), 2)) : 1;
        var vr = 255 * Math.exp(-d / rs) * (1 - sst2(0.12 * m, 0.3 * m, d)) * wr * clip + A * (rnd() + rnd() - 1);
        RD[4 * p] = RD[4 * p + 1] = RD[4 * p + 2] = 255;
        RD[4 * p + 3] = vr < 0 ? 0 : vr > 255 ? 255 : vr;
        if (d > f1) continue;
        var v = (Q.LINE_A * Math.exp(-(d / ls) * (d / ls)) + Q.GLOW_A * Math.exp(-d / tau)) * (1 - sst2(f0, f1, d)) * clip;
        var gx = x / w * (K2 - 1), k0 = Math.min(K2 - 2, Math.floor(gx)), fx = gx - k0, w1 = 0.5 - 0.5 * Math.cos(Math.PI * fx), ks = [k0, k0 + 1], wx = [1 - w1, w1];
        for (var u = 0; u < 2; u++) {
          var kk = ks[u], a1 = 255 * v * wk * wx[u] + A * (rnd() + rnd() - 1), a2 = 255 * v * wl * wx[u] + A * (rnd() + rnd() - 1);
          if (a1 >= 0.5) {
            kurz[kk][p] = a1;
            grow(bk[kk], i, j);
          }
          if (a2 >= 0.5) {
            lang[kk][p] = a2;
            grow(bl[kk], i, j);
          }
        }
      }
    }
    rahmenC.getContext("2d").putImageData(rImg, 0, 0);
    function toCanvas(arr, b) {
      var bw = b[2] - b[0] + 1, bh = b[3] - b[1] + 1, c = document.createElement("canvas");
      c.width = bw;
      c.height = bh;
      var g = c.getContext("2d"), img = g.createImageData(bw, bh), D = img.data;
      for (var yy = 0; yy < bh; yy++) for (var xx = 0; xx < bw; xx++) {
        var src = (yy + b[1]) * w + xx + b[0], o = 4 * (yy * bw + xx);
        D[o] = D[o + 1] = D[o + 2] = 255;
        D[o + 3] = arr[src];
      }
      g.putImageData(img, 0, 0);
      return c;
    }
    var streifen = [];
    for (q = 0; q < K2; q++) streifen.push({
      u: q / (K2 - 1),
      kurz: bk[q][2] < 0 ? null : { x: bk[q][0], y: bk[q][1], c: toCanvas(kurz[q], bk[q]) },
      lang: bl[q][2] < 0 ? null : { x: bl[q][0], y: bl[q][1], c: toCanvas(lang[q], bl[q]) }
    });
    return { w, h, scale: s, rahmen: rahmenC, streifen };
  }
  var G_PNORM = GEO.PNORM;
  STATES.schlafen.rgb = [96, 40, 10];
  STATES.schlafen.gain = 1.2;
  RUHIG_STATES.schlafen.lo = 0.42;
  RUHIG_STATES.schlafen.hi = 0.56;
  RUHIG_STATES.schlafen.rahmen = [0.045, 0.08];
  function keyOf(st) {
    return RUHIG_STATES[st] ? st : "idle";
  }
  function ruhigStart(st) {
    var key = keyOf(st);
    return { state: key, prev: key, named: st, tState: -1e9, colFrom: STATES[key].rgb, col: STATES[key].rgb, wl: RUHIG_STATES[key].modus === "lang" ? 1 : 0, last: 0, rgb: null };
  }
  function zielFarbe(S, st) {
    return S.rgb || STATES[st].rgb;
  }
  function ruhigSet(S, st, now, rgb) {
    var key = keyOf(st);
    S.rgb = rgb && rgb.length ? rgb : null;
    if (key === S.state && S.named === st) return;
    S.colFrom = S.col;
    S.prev = S.state;
    S.state = key;
    S.named = st;
    S.tState = now;
  }
  function ruhigFrame(ctx, F, S, now, tFix) {
    var fixed = tFix !== void 0 && tFix !== null, t = fixed ? tFix : now / 1e3, dt = fixed ? 10 : Math.min(0.1, Math.max(0, (now - S.last) / 1e3));
    S.last = now;
    var ue = fixed ? 1 : easeInOutSine((now - S.tState) / 1e3 / RUHIG.T_STATE);
    var st = S.state, pv = S.prev, gain = STATES[st].gain * ue + STATES[pv].gain * (1 - ue);
    var ziel = zielFarbe(S, st);
    S.col = ue < 1 ? mixLin(S.colFrom, ziel, ue) : ziel;
    var target = RUHIG_STATES[st].modus === "lang" ? 1 : 0, step = dt / RUHIG.T_MODUS;
    S.wl = S.wl < target ? Math.min(target, S.wl + step) : Math.max(target, S.wl - step);
    var wlE = sst2(0, 1, S.wl);
    var lv = levelRuhig(st, t) * ue + levelRuhig(pv, t) * (1 - ue), ra = rahmenRuhig(st, t) * ue + rahmenRuhig(pv, t) * (1 - ue);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, F.w, F.h);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(1, ra * gain);
    ctx.drawImage(F.rahmen, 0, 0);
    for (var k = 0; k < F.streifen.length; k++) {
      var sk = F.streifen[k], a = gain * lv * (shiftRuhig(st, sk.u, t) * ue + shiftRuhig(pv, sk.u, t) * (1 - ue));
      var ak = Math.min(1, a * (1 - wlE)), al = Math.min(1, a * wlE);
      if (sk.kurz && ak > 3e-3) {
        ctx.globalAlpha = ak;
        ctx.drawImage(sk.kurz.c, sk.kurz.x, sk.kurz.y);
      }
      if (sk.lang && al > 3e-3) {
        ctx.globalAlpha = al;
        ctx.drawImage(sk.lang.c, sk.lang.x, sk.lang.y);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "rgb(" + S.col.join(",") + ")";
    ctx.fillRect(0, 0, F.w, F.h);
    ctx.globalCompositeOperation = "source-over";
  }
  function lebhaftStart(st) {
    return { state: keyOf(st), prev: keyOf(st), named: st, tState: -1e9, colFrom: STATES[keyOf(st)].rgb, col: STATES[keyOf(st)].rgb, lv: level(keyOf(st), 0), last: 0, rgb: null };
  }
  function lebhaftSet(S, st, now, rgb) {
    var key = keyOf(st);
    S.rgb = rgb && rgb.length ? rgb : null;
    if (key === S.state && S.named === st) return;
    S.colFrom = S.col;
    S.prev = S.state;
    S.state = key;
    S.named = st;
    S.tState = now;
  }
  function lebhaftFrame(ctx, F, S, now, tFix) {
    var fixed = tFix !== void 0 && tFix !== null, t = fixed ? tFix : now / 1e3, dt = fixed ? 0.016 : Math.min(0.1, Math.max(0, (now - S.last) / 1e3));
    S.last = now;
    var ue = fixed ? 1 : easeOutCubic(Math.max(0, Math.min(1, (now - S.tState) / 450)));
    var st = S.state, pv = S.prev;
    var zielLv = level(st, t) * ue + level(pv, t) * (1 - ue);
    S.lv += (zielLv - S.lv) * (1 - Math.exp(-dt / 0.12));
    var ziel = zielFarbe(S, st);
    S.col = ue < 1 ? mixLin(S.colFrom, ziel, ue) : ziel;
    var o = Math.min(1, opacity(st, S.lv) * ue + opacity(pv, S.lv) * (1 - ue));
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, F.w, F.h);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(1, o * 0.6);
    ctx.drawImage(F.haze, 0, 0);
    var sectors = F.sectors;
    for (var i = 0; i < sectors.length; i++) {
      var sec = sectors[i];
      var wA = wave(st, sec.s, t), wB = wave(pv, sec.s, t);
      var hell = wA[0] * ue + wB[0] * (1 - ue), dick = wA[1] * ue + wB[1] * (1 - ue);
      var thinA = Math.min(1, o * hell * (1 - dick)), thickA = Math.min(1, o * hell * dick);
      if (thinA > 3e-3) {
        ctx.globalAlpha = thinA;
        ctx.drawImage(sec.thin, sec.x, sec.y);
      }
      if (thickA > 3e-3) {
        ctx.globalAlpha = thickA;
        ctx.drawImage(sec.thick, sec.x, sec.y);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "rgb(" + S.col.join(",") + ")";
    ctx.fillRect(0, 0, F.w, F.h);
    ctx.globalCompositeOperation = "source-over";
  }
  function lichtZustandVon(kurz) {
    if (kurz === "zuhoeren") return "zuhoeren";
    if (kurz === "sprechen") return "sprechen";
    if (kurz === "nachdenken") return "nachdenken";
    if (kurz === "verstanden" || kurz === "erledigt") return "bestaetigt";
    if (kurz === "fehler" || kurz === "nicht_verstanden") return "fehler";
    if (kurz === "schlafen") return "schlafen";
    if (kurz === "musik_an") return "musik";
    return "idle";
  }
  var ALARM_STARK = [255, 12, 8];
  var ALARM_NORMAL = [214, 32, 22];
  function lichtBefehl(kurz, opt) {
    opt = opt || {};
    var fest = opt.fest || "";
    var alarmStark2 = opt.alarmStark !== false;
    if (!fest && kurz === "angry") {
      return { name: "alarm", alarm: true, rgb: alarmStark2 ? ALARM_STARK.slice() : ALARM_NORMAL.slice() };
    }
    var name = fest || lichtZustandVon(kurz);
    if (!RUHIG_STATES[name]) name = "idle";
    return { name, alarm: false, rgb: null };
  }

  // web/renderer.js
  function alarmAlpha(dist, band) {
    if (!(band > 0)) return 0;
    const u = Math.max(0, Math.min(1, dist / band));
    const s = u * u * (3 - 2 * u);
    return 1 - s;
  }
  var LED_VORGABE = { pitch: 2.5, anzahl: 1330, leitungen: 4 };
  var Buehne = class {
    constructor(canvas2) {
      this.cv = canvas2;
      this.ctx = canvas2.getContext("2d");
      this.mode = "vollbild";
      this.scale = 1;
      this.ledOpt = { pitch: LED_VORGABE.pitch, h: 4.5, T: 0.15, grid: false };
      this.szene2d = null;
      this.led = null;
      this.ledImg = null;
      this.ledCanvas = document.createElement("canvas");
      this.preview = null;
      this.lichtProfil = "ruhig";
      this.lichtT = null;
      this.lichtZustand = "idle";
      this.lichtRgb = null;
      this.lichtFeld = null;
      this.lichtCv = document.createElement("canvas");
      this.lichtCtx = this.lichtCv.getContext("2d");
      this.lichtMaschine = null;
      this.lichtKey = "";
    }
    // CSS pixels. Null draws the eyes at full size. The 2D vignette stays full either way.
    setPreview(box) {
      this.preview = box && box.size > 0 ? box : null;
    }
    previewPx() {
      if (!this.preview) return null;
      const dpr = this.cv.width / Math.max(1, window.innerWidth || 1);
      const b = this.preview;
      return { x: b.x * dpr, y: b.y * dpr, size: b.size * dpr };
    }
    setMode(mode) {
      this.mode = mode;
      this.resize();
    }
    resize() {
      const dpr = this.sparsam ? 1 : Math.min(2, window.devicePixelRatio || 1);
      const W = Math.max(1, Math.floor(window.innerWidth * dpr));
      const H = Math.max(1, Math.floor(window.innerHeight * dpr));
      this.cv.width = W;
      this.cv.height = H;
      if (this.mode === "2d") {
        const side = Math.max(1, Math.min(W, H));
        this.szene2d = new Szene2D(side, side, { cheap: !!this.sparsam, cube: true });
        this.cubeFrame = document.createElement("canvas");
      } else if (this.mode === "vollbild") {
        this.szene2d = new Szene2D(W, H, { cheap: true, bold: true });
      }
      if (this.mode === "led") {
        const opt = this.ledOpt;
        const cap = this.sparsam ? 300 : 480;
        const s = Math.min(cap, Math.floor(Math.min(W, H) * 0.92 / 2) * 2);
        this.led = new LedScene(s, { pitch: opt.pitch, h: opt.h, T: opt.T, grid: opt.grid });
        this.ledCanvas.width = this.ledCanvas.height = s;
        this.ledImg = this.ledCanvas.getContext("2d").createImageData(s, s);
      }
    }
    setLicht(opt) {
      const o = opt || {};
      if (o.profil === "ruhig" || o.profil === "lebhaft") this.lichtProfil = o.profil;
      if ("t" in o) this.lichtT = o.t === "" || o.t == null ? null : Number(o.t);
      if (o.zustand) this.lichtZustand = o.zustand;
      if ("rgb" in o) this.lichtRgb = o.rgb && o.rgb.length ? o.rgb : null;
      if ("alarmStark" in o) this.alarmStark = o.alarmStark !== false;
    }
    // Screen-edge light under the eyes. Bold only flashes it while a tap is acknowledged.
    // The name "alarm" is the red rim, and only while the state is angry. Every other name is the 1.4.3 Quiet or Lively field.
    zeichneLicht(name, rgb, force) {
      if (name === "alarm") {
        this.zeichneAlarm(rgb);
        return;
      }
      const dauer = this.mode === "2d" || this.mode === "led" || force;
      if (!dauer) return;
      const W = this.cv.width, H = this.cv.height;
      if (W < 2 || H < 2) return;
      const cssMin = Math.min(window.innerWidth || W, window.innerHeight || H);
      const phone = cssMin < 600;
      const scale = phone ? 1 : this.sparsam ? 0.33 : 0.5;
      const cornerR = phone ? 47 : 0;
      const key = `${this.lichtProfil}:${W}x${H}:${scale}:${cornerR}`;
      if (this.lichtKey !== key) {
        const opt = { scale, cornerR };
        this.lichtFeld = this.lichtProfil === "lebhaft" ? buildField(W, H, opt) : buildRuhig(W, H, opt);
        this.lichtCv.width = this.lichtFeld.w;
        this.lichtCv.height = this.lichtFeld.h;
        this.lichtMaschine = this.lichtProfil === "lebhaft" ? lebhaftStart("idle") : ruhigStart("idle");
        this.lichtKey = key;
      }
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const st = name || "idle";
      if (this.lichtProfil === "lebhaft") lebhaftSet(this.lichtMaschine, st, now, rgb);
      else ruhigSet(this.lichtMaschine, st, now, rgb);
      const frameFn = this.lichtProfil === "lebhaft" ? lebhaftFrame : ruhigFrame;
      frameFn(this.lichtCtx, this.lichtFeld, this.lichtMaschine, now, this.lichtT);
      const ctx = this.ctx;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(this.lichtCv, 0, 0, W, H);
      ctx.restore();
    }
    render(pose, ring) {
      if (!this.cv.width || !this.cv.height) return;
      if ((this.mode === "2d" || this.mode === "vollbild") && !this.szene2d) return;
      if (this.mode === "led" && !this.led) return;
      const ctx = this.ctx;
      ctx.save();
      try {
        if (this.mode === "led") this.drawLed(pose, ring);
        else if (this.mode === "2d") this.drawCube(pose, ring);
        else if (this.mode === "vollbild") {
          this.szene2d.render(ctx, pose, [ring[0], 0, null], this.previewPx());
          if (this.lichtZustand === "alarm") this.zeichneAlarm(this.lichtRgb || ring && ring[0]);
          if (this.ackAlpha() > 0) this.zeichneLicht("bestaetigt", this.ackRgb, true);
        } else this.drawVollbild(pose, ring);
      } finally {
        ctx.restore();
      }
    }
    acknowledge(rgb) {
      this.ackRgb = rgb && rgb.length >= 3 ? rgb : [255, 236, 214];
      this.ackUntil = (typeof performance !== "undefined" ? performance.now() : Date.now()) + 900;
    }
    ackAlpha() {
      if (!this.ackUntil) return 0;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const left = this.ackUntil - now;
      if (left <= 0) return 0;
      return Math.min(1, left / 900);
    }
    // Alarm replaces Quiet and Lively only while the state is angry. One distance field, so corners are not doubled.
    zeichneAlarm(rgb) {
      const ctx = this.ctx;
      const W = this.cv.width, H = this.cv.height;
      if (W < 2 || H < 2) return;
      const farbe = rgb && rgb.length >= 3 ? rgb : this.lichtRgb || [255, 12, 8];
      const [r, g, b] = farbe.map((x) => Math.round(Math.max(0, Math.min(255, x))));
      const stark = this.alarmStark !== false;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const pulse2 = 0.5 + 0.5 * Math.sin(2 * Math.PI * now / (stark ? 700 : 1200));
      const a = stark ? 0.78 + 0.22 * pulse2 : 0.4 + 0.22 * pulse2;
      const band = Math.min(W, H) * (stark ? 0.11 : 0.07);
      const kurz = Math.min(W, H);
      const scale = kurz > 280 ? 280 / kurz : 1;
      const w = Math.max(2, Math.round(W * scale));
      const h = Math.max(2, Math.round(H * scale));
      const bandS = band * (w / W);
      if (!this.alarmCv) {
        this.alarmCv = document.createElement("canvas");
        this.alarmCtx = this.alarmCv.getContext("2d");
      }
      if (this.alarmCv.width !== w || this.alarmCv.height !== h) {
        this.alarmCv.width = w;
        this.alarmCv.height = h;
      }
      const img = this.alarmCtx.createImageData(w, h);
      const data = img.data;
      const deck = Math.max(0, Math.min(1, a));
      for (let y = 0; y < h; y++) {
        const dy = Math.min(y + 0.5, h - (y + 0.5));
        for (let x = 0; x < w; x++) {
          const dx = Math.min(x + 0.5, w - (x + 0.5));
          const alpha = alarmAlpha(Math.min(dx, dy), bandS) * deck;
          const o = (y * w + x) * 4;
          data[o] = r;
          data[o + 1] = g;
          data[o + 2] = b;
          data[o + 3] = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
        }
      }
      this.alarmCtx.putImageData(img, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(this.alarmCv, 0, 0, W, H);
      ctx.restore();
    }
    drawAck() {
      const a = this.ackAlpha();
      if (!(a > 0)) return;
      const ctx = this.ctx;
      const W = this.cv.width, H = this.cv.height;
      const [r, g, b] = this.ackRgb.map((x) => Math.round(Math.max(0, Math.min(255, x))));
      const cx = W / 2, cy = H * 0.46;
      const rad3 = Math.min(W, H) * 0.42;
      const gr = ctx.createRadialGradient(cx, cy, rad3 * 0.25, cx, cy, rad3);
      gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
      gr.addColorStop(0.62, `rgba(${r},${g},${b},${0.05 * a})`);
      gr.addColorStop(1, `rgba(${r},${g},${b},${0.62 * a})`);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    drawCube(pose, ring) {
      const ctx = this.ctx;
      const W = this.cv.width, H = this.cv.height;
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      const box = this.previewPx();
      if (!box) {
        const side = this.szene2d.W;
        const frame = this.cubeFrame;
        if (frame.width !== side || frame.height !== side) {
          frame.width = side;
          frame.height = side;
        }
        this.szene2d.render(frame.getContext("2d"), pose, [ring[0], 0, null], null, false);
        ctx.drawImage(frame, (W - side) / 2, (H - side) / 2);
      } else this.szene2d.render(ctx, pose, [ring[0], 0, null], box, true);
      ctx.restore();
      const farbe = this.lichtRgb || (this.lichtZustand === "schlafen" ? null : ring && ring[0]);
      this.zeichneLicht(this.lichtZustand, farbe);
    }
    drawVollbild(pose, ring) {
      const ctx = this.ctx;
      const W = this.cv.width, H = this.cv.height;
      const R = 0.47 * Math.min(W, H) * (this.scale || 1) * portraitEyeScale(W / Math.max(1, H));
      const cx = W / 2, cy = H / 2;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      const [r, g, b] = ring[0].map(Math.round), a = Math.min(1, ring[1]);
      const k = 0.25;
      const gr = ctx.createRadialGradient(W / 2, H * 1.02 / k, 0, W / 2, H * 1.02 / k, Math.max(W, H) * 0.32);
      gr.addColorStop(0, `rgba(${r},${g},${b},${0.9 * a})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.scale(1, k);
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H / k);
      ctx.restore();
      const X = (p) => cx + p[0] * R, Y = (p) => cy - p[1] * R;
      for (const e of poseToPrims(pose)) {
        const v = Math.round(255 * Math.max(0, Math.min(1, e.bright)));
        ctx.strokeStyle = ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.lineCap = "round";
        ctx.lineWidth = 2 * e.r * R;
        ctx.beginPath();
        ctx.moveTo(X(e.p1), Y(e.p1));
        ctx.lineTo(X(e.p2) + 0.01, Y(e.p2));
        ctx.stroke();
        ctx.fillStyle = "#000";
        if (e.lid) {
          const [l1, l2, up] = e.lid;
          let nx = -(l2[1] - l1[1]), ny = l2[0] - l1[0];
          const nl = Math.hypot(nx, ny);
          nx /= nl;
          ny /= nl;
          if ((up[0] - l1[0]) * nx + (up[1] - l1[1]) * ny < 0) {
            nx = -nx;
            ny = -ny;
          }
          const big = 0.6;
          const q1 = [l1[0] + nx * big, l1[1] + ny * big], q2 = [l2[0] + nx * big, l2[1] + ny * big];
          ctx.beginPath();
          ctx.moveTo(X(l1), Y(l1));
          ctx.lineTo(X(l2), Y(l2));
          ctx.lineTo(X(q2), Y(q2));
          ctx.lineTo(X(q1), Y(q1));
          ctx.fill();
        }
        if (e.cut) {
          ctx.beginPath();
          ctx.arc(X(e.cut[0]), Y(e.cut[0]), e.cut[1] * R, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
    drawLed(pose, ring) {
      const ctx = this.ctx;
      this.led.render(this.ledImg, pose, ring);
      this.ledCanvas.getContext("2d").putImageData(this.ledImg, 0, 0);
      const W = this.cv.width, H = this.cv.height;
      const s = Math.min(W, H) * 0.95 * portraitEyeScale(W / Math.max(1, H));
      ctx.fillStyle = "rgb(11,11,11)";
      ctx.fillRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      if ("webkitImageSmoothingEnabled" in ctx) ctx.webkitImageSmoothingEnabled = false;
      const box = this.previewPx();
      if (box) ctx.drawImage(this.ledCanvas, box.x, box.y, box.size, box.size);
      else ctx.drawImage(this.ledCanvas, (W - s) / 2, (H - s) / 2, s, s);
      const farbe = this.lichtRgb || (this.lichtZustand === "schlafen" ? null : ring && ring[0]);
      this.zeichneLicht(this.lichtZustand, farbe);
    }
  };

  // web/zeiger.js
  function hatPointer() {
    return typeof window !== "undefined" && typeof window.PointerEvent === "function";
  }
  function paket(e, touch) {
    return {
      clientX: touch ? touch.clientX : e.clientX,
      clientY: touch ? touch.clientY : e.clientY,
      pointerId: touch ? touch.identifier : 1,
      target: e.target,
      currentTarget: e.currentTarget,
      preventDefault() {
        try {
          e.preventDefault();
        } catch (e2) {
        }
      },
      stopPropagation() {
        e.stopPropagation();
      }
    };
  }
  function onZeiger(target, kind, handler, capture) {
    if (!target || typeof handler !== "function") return;
    const cap = !!capture;
    if (hatPointer()) {
      const name = { down: "pointerdown", move: "pointermove", up: "pointerup", cancel: "pointercancel", over: "pointerover" }[kind];
      if (name) target.addEventListener(name, handler, cap);
      return;
    }
    let touched = false;
    const note = () => {
      touched = true;
      setTimeout(() => {
        touched = false;
      }, 800);
    };
    if (kind === "down") {
      target.addEventListener("touchstart", (e) => {
        note();
        const t = e.changedTouches && e.changedTouches[0];
        if (t) handler(paket(e, t));
      }, cap);
      target.addEventListener("mousedown", (e) => {
        if (touched) return;
        handler(paket(e, null));
      }, cap);
    } else if (kind === "move") {
      target.addEventListener("touchmove", (e) => {
        const t = e.changedTouches && e.changedTouches[0] || e.touches && e.touches[0];
        if (t) handler(paket(e, t));
      }, cap);
      target.addEventListener("mousemove", (e) => {
        if (touched) return;
        handler(paket(e, null));
      }, cap);
    } else if (kind === "up") {
      target.addEventListener("touchend", (e) => {
        const t = e.changedTouches && e.changedTouches[0];
        if (t) handler(paket(e, t));
      }, cap);
      target.addEventListener("mouseup", (e) => {
        if (touched) return;
        handler(paket(e, null));
      }, cap);
    } else if (kind === "cancel") {
      target.addEventListener("touchcancel", (e) => {
        const t = e.changedTouches && e.changedTouches[0];
        handler(t ? paket(e, t) : { pointerId: -1, target: e.target });
      }, cap);
    } else if (kind === "over") {
      target.addEventListener("mouseover", (e) => handler(paket(e, null)), cap);
    }
  }

  // web/power.js
  function istAltgeraet(env2) {
    const nav = env2 && env2.nav || (typeof navigator !== "undefined" ? navigator : {});
    const win = env2 && env2.win || (typeof window !== "undefined" ? window : {});
    if (nav.deviceMemory && nav.deviceMemory <= 1) return true;
    const ua = String(nav.userAgent || "");
    const ios = /(?:CPU )?OS (\d+)[._]/.exec(ua);
    if (/iPad|iPhone|iPod/.test(ua) && ios && Number(ios[1]) <= 10) return true;
    if (typeof win.PointerEvent !== "function") return true;
    return false;
  }

  // web/demo.js
  var DEMO_REIHE = [
    "hallo",
    "zuhoeren",
    "nachdenken",
    "verstanden",
    "erledigt",
    "lachen",
    "nicht_verstanden",
    "angry",
    "schlafen",
    "blicke",
    "fehler",
    "musik_an"
  ];
  var DEMO_SCHRITT_MS = 4e3;
  var DEMO_MUSIK_MS = 3e4;
  function demoSchritt(index) {
    const n = DEMO_REIHE.length;
    const i = (index % n + n) % n;
    const kurz = DEMO_REIHE[i];
    const musik = kurz === "musik_an";
    return {
      index: i,
      kurz,
      ms: musik ? DEMO_MUSIK_MS : DEMO_SCHRITT_MS,
      musik,
      naechster: (i + 1) % n
    };
  }

  // web/nowplaying.js
  var JAHR_KEYS = [
    "media_year",
    "media_album_year",
    "media_release_year",
    "media_album_release_year",
    "year",
    "media_release_date",
    "media_album_release_date",
    "release_date",
    "media_album_date",
    "media_date"
  ];
  function jahrAusWert(value) {
    if (typeof value === "number" && Number.isInteger(value) && value >= 1900 && value <= 2099) return String(value);
    if (typeof value !== "string" && typeof value !== "number") return null;
    const text = String(value).trim();
    if (!text || text.length > 40) return null;
    if (/^(19|20)\d{2}$/.test(text)) return text;
    const iso = text.match(/^((?:19|20)\d{2})-\d{2}-\d{2}(?:$|T)/);
    if (iso) return iso[1];
    const dmy = text.match(/^\d{1,2}[./]\d{1,2}[./]((?:19|20)\d{2})$/);
    if (dmy) return dmy[1];
    return null;
  }
  function jahrAusAttributen(attr) {
    if (!attr || typeof attr !== "object") return null;
    for (const key of JAHR_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(attr, key)) continue;
      const year = jahrAusWert(attr[key]);
      if (year) return year;
    }
    return null;
  }
  var MUSIK_RUHE_MS = 2e4;
  var QUEUE_KEYS = [
    "queue",
    "media_queue",
    "media_queue_items",
    "queue_items",
    "spotifyplus_queue",
    "spotifyplus_track_queue",
    "upcoming_media",
    "up_next"
  ];
  var PLAYLIST_KEYS = ["playlists", "playlist_list", "media_playlists", "spotifyplus_playlists"];
  function alsListe(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim().charAt(0) === "[") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
      }
    }
    return null;
  }
  function ersteListe(attr, keys) {
    for (let i = 0; i < keys.length; i++) {
      const liste2 = alsListe(attr[keys[i]]);
      if (liste2 && liste2.length) return liste2;
    }
    return null;
  }
  function textVon(item) {
    if (item == null) return "";
    if (typeof item === "string" || typeof item === "number") return String(item).trim();
    const title = item.media_title || item.title || item.name || item.song || item.track || "";
    const artist = item.media_artist || item.artist || "";
    return [String(title).trim(), String(artist).trim()].filter(Boolean).join(" \u2014 ");
  }
  function eintragVon(item, artFallback) {
    if (item == null) return null;
    if (typeof item === "string" || typeof item === "number") {
      const label2 = String(item).trim();
      if (!label2) return null;
      if (/^spotify:/.test(label2) || label2.indexOf("://") >= 0) {
        return { label: label2, art: "media", contentId: label2, contentType: "music" };
      }
      if (artFallback === "media") return { label: label2, art: "media", contentId: label2, contentType: "music" };
      return { label: label2, art: "source", source: label2 };
    }
    if (typeof item !== "object") return null;
    const label = textVon(item);
    const id = item.media_content_id || item.uri || item.media_id || item.id || "";
    const type = item.media_content_type || item.content_type || (id ? "music" : "");
    if (id) {
      return {
        label: label || String(id),
        art: "media",
        contentId: String(id),
        contentType: String(type || "music")
      };
    }
    const source = item.source || item.name || label;
    if (!source) return null;
    if (artFallback === "media") {
      return { label: label || String(source), art: "media", contentId: String(source), contentType: "music" };
    }
    return { label: label || String(source), art: "source", source: String(source) };
  }
  function naechsteEintraege(attr, limit = 5) {
    const max = Math.max(0, Math.min(5, Number(limit) || 5));
    if (!attr || typeof attr !== "object" || !max) return [];
    const out = [];
    const push = (item, art) => {
      if (out.length >= max) return;
      const eintrag = eintragVon(item, art);
      if (!eintrag) return;
      if (eintrag.art === "media" && attr.media_content_id && eintrag.contentId === String(attr.media_content_id)) return;
      out.push(eintrag);
    };
    const queue = ersteListe(attr, QUEUE_KEYS);
    if (queue) {
      for (let i = 0; i < queue.length; i++) push(queue[i], "media");
      return out;
    }
    const lists = ersteListe(attr, PLAYLIST_KEYS);
    if (lists) {
      for (let i = 0; i < lists.length; i++) push(lists[i], "media");
      return out;
    }
    const sources = alsListe(attr.source_list);
    if (sources) {
      for (let i = 0; i < sources.length; i++) push(sources[i], "source");
    }
    return out;
  }
  function sollMusikOeffnen(eye, mediaState, quelle) {
    if (!quelle || quelle === "snapshot") return false;
    if (eye === "musik_an") return true;
    return String(mediaState || "") === "playing" && (eye === "nachdenken" || eye === "verstanden");
  }
  function wiedergabeLaeuft(state) {
    const s = String(state || "").trim().toLowerCase();
    return s === "playing" || s === "buffering";
  }
  function jetztLaeuft(state, attr) {
    var _a, _b;
    if (String(state != null ? state : "").trim().toLowerCase() !== "playing") return null;
    const title = String((_a = attr == null ? void 0 : attr.media_title) != null ? _a : "").trim();
    const artist = String((_b = attr == null ? void 0 : attr.media_artist) != null ? _b : "").trim();
    if (!title && !artist) return null;
    let text = title && artist ? `${title}, ${artist}` : title || artist;
    const year = jahrAusAttributen(attr);
    if (year) text += ` (${year})`;
    return text;
  }

  // web/demotrack.js
  var DEMO_LINE = "Orbit Drift, HVUZ Demo (2026)";
  var DEMO_BPM = 96;
  var DEMO_BARS = 32;
  var BEAT = 60 / DEMO_BPM;
  var DEMO_SECONDS = DEMO_BARS * 4 * BEAT;
  var PROG = [62, 58, 65, 60, 62, 55, 58, 57];
  function midi(note) {
    return 440 * __pow(2, (note - 69) / 12);
  }
  function noise(i) {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
  function env(t, attack, hold, release) {
    if (t < 0) return 0;
    if (t < attack) return t / attack;
    if (t < attack + hold) return 1;
    return Math.max(0, 1 - (t - attack - hold) / release);
  }
  function demoSample(t) {
    const barLen = 4 * BEAT;
    const bar = Math.floor(t / barLen) % 8;
    const root = PROG[bar];
    const beat = t / BEAT % 4;
    let s = 0;
    const kick = beat % 2;
    if (kick < 0.2) {
      const k = kick / 0.2;
      s += Math.sin(2 * Math.PI * (78 + 90 * (1 - k)) * t) * __pow(1 - k, 2) * 0.42;
    }
    const hat = beat % 0.5;
    if (hat < 0.028) {
      s += (noise(Math.floor(t * 22050)) * 2 - 1) * (1 - hat / 0.028) * 0.055;
    }
    const step = Math.floor(beat * 2) % 8;
    const bassMidi = [root - 12, root - 12, root - 5, root - 12, root - 12, root, root - 5, root - 7][step];
    const bt = beat * 2 % 1;
    s += Math.sin(2 * Math.PI * midi(bassMidi) * t) * env(bt * BEAT * 0.5, 8e-3, 0.06, 0.14) * 0.24;
    for (const interval of [0, 3, 7, 10]) {
      const f = midi(root + interval);
      s += Math.sin(2 * Math.PI * f * t) * 0.03;
      s += Math.sin(2 * Math.PI * f * 1.004 * t) * 0.016;
    }
    const lead = [0, 3, 7, 12, 10, 7, 3, 0][step];
    const phrase = bar % 2 === 0 ? lead : [0, 7, 12, 15, 12, 7, 3, -2][step];
    const lt = bt;
    s += Math.sin(2 * Math.PI * midi(root + 12 + phrase) * t) * env(lt * 0.28, 0.015, 0.08, 0.16) * 0.07;
    return Math.max(-1, Math.min(1, s));
  }
  function renderDemoBuffer(ac, rate = 22050) {
    const n = Math.floor(DEMO_SECONDS * rate);
    const buf = ac.createBuffer(1, n, rate);
    const data = buf.getChannelData(0);
    const edge = Math.floor(rate * 0.02);
    for (let i = 0; i < n; i++) {
      let g = 1;
      if (i < edge) g = i / edge;
      else if (i > n - edge) g = (n - i) / edge;
      data[i] = demoSample(i / rate) * g;
    }
    return buf;
  }
  function createDemoMusic() {
    let ac = null;
    let gain = null;
    let src = null;
    let buf = null;
    let job = null;
    let playing = false;
    function ensure(context) {
      ac = context;
      if (!buf && !job) job = Promise.resolve(renderDemoBuffer(ac));
      return job.then((ready) => {
        buf = ready;
        return buf;
      });
    }
    function start(context) {
      return __async(this, null, function* () {
        if (!context) return false;
        yield ensure(context);
        if (playing) return true;
        playing = true;
        gain = ac.createGain();
        const now = ac.currentTime;
        gain.gain.setValueAtTime(1e-4, now);
        gain.gain.exponentialRampToValueAtTime(0.8, now + 1.35);
        gain.connect(ac.destination);
        src = ac.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(gain);
        src.start();
        return true;
      });
    }
    function stop() {
      if (!playing || !ac || !gain) {
        playing = false;
        return;
      }
      playing = false;
      const now = ac.currentTime;
      const oldGain = gain;
      const oldSrc = src;
      try {
        oldGain.gain.cancelScheduledValues(now);
        oldGain.gain.setValueAtTime(Math.max(1e-4, oldGain.gain.value), now);
        oldGain.gain.exponentialRampToValueAtTime(1e-4, now + 1.5);
      } catch (e) {
      }
      setTimeout(() => {
        try {
          oldSrc.stop();
        } catch (e) {
        }
        try {
          oldSrc.disconnect();
          oldGain.disconnect();
        } catch (e) {
        }
      }, 1700);
    }
    return {
      start,
      stop,
      get playing() {
        return playing;
      }
    };
  }
  function tonKurz(ac, freq, dauer, laut, typ) {
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = typ || "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(1e-4, now);
    gain.gain.exponentialRampToValueAtTime(laut, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(1e-4, now + dauer);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dauer + 0.02);
  }
  function playAck(ac) {
    if (!ac) return;
    const now = ac.currentTime;
    [523, 659].forEach((freq, i) => {
      const t0 = now + i * 0.07;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(1e-4, t0);
      gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(1e-4, t0 + 0.09);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + 0.1);
    });
  }
  function playChirps(ac) {
    if (!ac) return;
    const now = ac.currentTime;
    [698, 880, 784, 1046, 1318].forEach((freq, i) => {
      const t0 = now + i * 0.075;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(1e-4, t0);
      gain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.018);
      gain.gain.exponentialRampToValueAtTime(1e-4, t0 + 0.11);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + 0.12);
    });
  }
  function playNudge(ac) {
    tonKurz(ac, 196, 0.09, 0.04, "triangle");
  }
  function playSigh(ac) {
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(494, now);
    osc.frequency.exponentialRampToValueAtTime(311, now + 0.42);
    gain.gain.setValueAtTime(1e-4, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.48);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }
  function playSettingsChime(ac) {
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(494, now);
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.32);
    gain.gain.setValueAtTime(1e-4, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.42);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // web/dimmen.js
  function helligkeit(idleSek, schlafSek, opt = {}) {
    var _a, _b;
    const idle = Math.max(0, Number(idleSek) || 0);
    const nach = Math.max(0, Number((_a = opt.dimNachSekunden) != null ? _a : 60) || 0);
    let stufe = Number(opt.dimStufe);
    if (!Number.isFinite(stufe)) stufe = 0.3;
    if (stufe > 1) stufe /= 100;
    stufe = Math.max(0.05, Math.min(1, stufe));
    void schlafSek;
    let level2 = 1;
    if (nach > 0 && idle >= nach) level2 = stufe;
    if (opt.planSekunden == null || opt.planSekunden === "") return level2;
    const left = Math.max(0, Number(opt.planSekunden) || 0);
    const vor = Math.max(0, Number((_b = opt.dimVorMinuten) != null ? _b : 15) || 0) * 60;
    if (!(vor > 0)) return Math.min(level2, left <= 0 ? stufe : 1);
    if (left >= vor) return level2;
    const ramp = stufe + (1 - stufe) * (left / vor);
    return Math.min(level2, ramp);
  }
  function offen2(state) {
    const s = String(state != null ? state : "").trim().toLowerCase();
    return s === "on" || s === "open";
  }
  function tuerKante(vorher, state) {
    if (vorher == null || vorher === "") return false;
    return offen2(state) && !offen2(vorher);
  }

  // web/version.js
  var VERSION = "1.0.1";
  var REPO_PUBLIC = false;

  // web/hilfe.js
  var HILFE_BASIS = "https://www.herrvonundzu.eu/grok-bot-universal-home-assistant-ui/";
  var HILFE_ANKER = ["display", "sound", "home-assistant", "gestures", "corners", "states", "security", "demo", "credits", "requirements", "dashboard", "phone"];
  var GITHUB = {
    maintainer: "https://github.com/stefanvr82",
    repo: "https://github.com/stefanvr82/grok-bot-home-assistant-ui",
    sponsors: "https://github.com/sponsors/stefanvr82"
  };
  function repoLinks(offen3 = REPO_PUBLIC) {
    if (offen3) {
      return {
        public: true,
        maintainer: GITHUB.maintainer,
        repo: GITHUB.repo,
        sponsors: GITHUB.sponsors,
        repoLabel: "GitHub",
        supportLabel: "GitHub Sponsors"
      };
    }
    return {
      public: false,
      maintainer: "",
      repo: "",
      sponsors: "",
      repoLabel: "",
      supportLabel: ""
    };
  }
  var github = repoLinks();
  var LINKS = {
    changelog: `${HILFE_BASIS}#changelog`,
    credits: `${HILFE_BASIS}#credits`,
    hvuz: "https://www.herrvonundzu.eu/digitalisierung-automatisierung-4",
    idea: "https://x.com/Texas_Twins_Dad/status/2114196344025878632"
  };
  if (github.maintainer) LINKS.maintainer = github.maintainer;
  if (github.repo) LINKS.repo = github.repo;
  if (github.sponsors) LINKS.sponsors = github.sponsors;
  function hilfeUrl(anker) {
    const id = HILFE_ANKER.includes(anker) ? anker : "display";
    return `${HILFE_BASIS}#${id}`;
  }

  // web/lock.js
  function bytesOf(text) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text);
    const out = [];
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 128) out.push(c);
      else if (c < 2048) out.push(192 | c >> 6, 128 | c & 63);
      else out.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
    }
    return Uint8Array.from(out);
  }
  function rotr(x, n) {
    return x >>> n | x << 32 - n;
  }
  var K = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ];
  function sha256Hex(bytes) {
    const bitLen = bytes.length * 8;
    const padded = new Uint8Array(bytes.length + 9 + 63 >> 6 << 6);
    padded.set(bytes);
    padded[bytes.length] = 128;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 4, bitLen >>> 0, false);
    let h0 = 1779033703, h1 = 3144134277, h2 = 1013904242, h3 = 2773480762;
    let h4 = 1359893119, h5 = 2600822924, h6 = 528734635, h7 = 1541459225;
    const w = new Uint32Array(64);
    for (let i = 0; i < padded.length; i += 64) {
      for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ w[t - 15] >>> 3;
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ w[t - 2] >>> 10;
        w[t] = w[t - 16] + s0 + w[t - 7] + s1 >>> 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = e & f ^ ~e & g;
        const t1 = h + S1 + ch + K[t] + w[t] >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = a & b ^ a & c ^ b & c;
        const t2 = S0 + maj >>> 0;
        h = g;
        g = f;
        f = e;
        e = d + t1 >>> 0;
        d = c;
        c = b;
        b = a;
        a = t1 + t2 >>> 0;
      }
      h0 = h0 + a >>> 0;
      h1 = h1 + b >>> 0;
      h2 = h2 + c >>> 0;
      h3 = h3 + d >>> 0;
      h4 = h4 + e >>> 0;
      h5 = h5 + f >>> 0;
      h6 = h6 + g >>> 0;
      h7 = h7 + h >>> 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map((n) => n.toString(16).padStart(8, "0")).join("");
  }
  function webCrypto() {
    try {
      return typeof crypto !== "undefined" ? crypto : null;
    } catch (e) {
      return null;
    }
  }
  function hashLock(secret, salt) {
    return __async(this, null, function* () {
      const data = bytesOf(`eye-ui-lock:${salt}:${secret}`);
      const subtle = webCrypto() && webCrypto().subtle;
      if (subtle && typeof subtle.digest === "function") {
        try {
          const digest = yield subtle.digest("SHA-256", data);
          return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
        } catch (e) {
        }
      }
      return sha256Hex(data);
    });
  }
  function newSalt() {
    const bytes = new Uint8Array(16);
    const c = webCrypto();
    if (c && c.getRandomValues) c.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function pruefeLock(secret, salt, hash) {
    return __async(this, null, function* () {
      if (!salt || !hash || !secret) return false;
      const next = yield hashLock(secret, salt);
      return next === hash;
    });
  }

  // web/app.js
  function __legacyBoot() {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
      const TICKLE = "13_kitzel";
      const q = new URLSearchParams(location.search);
      const ON = yield (yield fetch("onsets.json")).json();
      const siteDatei = yield ladeSiteConfig();
      const CLIPS = makeClips(ON);
      const BY = Object.fromEntries(CLIPS.map((c) => [c.name, c]));
      const MODI = ["2d", "led", "vollbild"];
      const ABL_FPS = 60;
      function geraetJetzt() {
        const touch = navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
        return geraeteKlasse({ width: window.innerWidth, height: window.innerHeight, touch });
      }
      setzeKlasse(geraetJetzt());
      const konfig = ladeKonfig(q, void 0, siteDatei, location);
      setAlarmStaerke(konfig.alarmStaerke);
      if (istDemoHost(location.hostname)) {
        konfig.haToken = "";
        vergissToken();
      }
      if (demoBesuch(konfig, location, q)) {
        konfig.demo = true;
        if (istStandardEcken(konfig.ecken)) konfig.ecken = normEcken(ECKEN_DEMO, konfig.eigene);
      }
      let locale = resolveLocale({ stored: konfig.lang, nav: navigator.language });
      const SOUND_IDS = ["01_hallo", "02_zuhoeren", "03_verstanden", "04_erledigt_danke", "05_lachen", "06_nicht_verstanden", "07_nachdenken", "08_schlafen", "09_fehler", "10_musik_an", "11_licht_an", "12_licht_aus", "13_kitzel", "14_angry"];
      const audio = createAudio(CLIPS, [TICKLE]);
      audio.setTon(konfig.ton);
      const demoMusik = createDemoMusic();
      const augen = new Augen(CLIPS);
      const waechter = createWaechter(konfig.schlafSekunden);
      const renderer = new Buehne(document.getElementById("c"));
      renderer.scale = +q.get("r") || 1;
      renderer.sparsam = q.get("power") === "full" ? false : q.get("power") === "low" || istAltgeraet();
      document.documentElement.classList.toggle("is-low", renderer.sparsam);
      const adminTaps = createAdminTaps();
      const ui = { label: konfig.label };
      let ablauf = null;
      let ha = null;
      let haStatus = "aus";
      let haMeldung = "";
      let letzterKurz = "idle";
      let letzterWechsel = performance.now();
      let seit = Date.now();
      let letzterBefehl = null;
      let einstellungenOffen = false;
      let blattOffen = false;
      let boredTimer = 0;
      let seitTimer = 0;
      let captionState = "";
      let jetztText = "";
      let medienZustand = null;
      let musikAn = false;
      let lichtAn = false;
      let gestenGebaut = false;
      let eckenGebaut = false;
      let bildKurz = "idle";
      let vorschau = false;
      let entsperrt = false;
      let lookX = 0;
      let lookY = 0;
      let lookTX = 0;
      let lookTY = 0;
      let dashOffen = false;
      let dashStates = {};
      let dashEvents = {};
      let dashForecast = null;
      let ansicht = "normal";
      let detailArt = "";
      let tuerStand = null;
      let schauTimer = 0;
      let schauFest = false;
      let schauLaeuft = false;
      let schauIndex = 0;
      let schauSeit = 0;
      let stoerungAn = false;
      let aktionFeld = null;
      let dimIst = 1;
      let medienAttr = null;
      let medienState = "";
      let musikRuheTimer = 0;
      let npEintraege = [];
      let zonenTimer = 0;
      let blinkAt = -10;
      const stageQuery = window.matchMedia("(orientation: landscape) and (min-width: 840px)");
      function el2(id) {
        return document.getElementById(id);
      }
      function param(...names) {
        for (const name of names) if (q.has(name)) return q.get(name);
        return null;
      }
      function t(key, vars) {
        return translate(locale, key, vars);
      }
      function startModus() {
        return waehleModus(param("mode", "modus") || param("theme"), konfig.modus);
      }
      function feldWert(node) {
        if (!node) return "";
        if (node.classList && node.classList.contains("wahl")) return node.dataset.value || "";
        return node.value;
      }
      function aktionBeschriftung(art, ziel) {
        const name = aktionsName(art || "none");
        const extra = art === "service" ? String(ziel || "").trim() : "";
        if (!extra) return name;
        const kurz = extra.length > 22 ? `${extra.slice(0, 20)}\u2026` : extra;
        return `${name} \xB7 ${kurz}`;
      }
      function feldSetze(node, value) {
        var _a2;
        if (!node) return;
        if (node.classList && node.classList.contains("wahl")) {
          node.dataset.value = value;
          const aktuell = node.querySelector(".aktion-aktuell");
          if (aktuell) {
            const ziel = node.id ? ((_a2 = el2(`${node.id}-ziel`)) == null ? void 0 : _a2.value) || "" : "";
            aktuell.textContent = aktionBeschriftung(value, ziel);
            return;
          }
          const buttons = node.querySelectorAll("button");
          for (let i = 0; i < buttons.length; i++) {
            buttons[i].setAttribute("aria-pressed", buttons[i].dataset.value === value ? "true" : "false");
          }
          return;
        }
        node.value = value;
      }
      function setModus(mode) {
        if (!MODI.includes(mode)) return;
        renderer.setMode(mode);
        document.body.dataset.theme = mode === "2d" ? "cube" : mode === "led" ? "fortune" : "bold";
        document.body.classList.toggle("is-bold", mode === "vollbild");
        document.body.classList.toggle("is-cube", mode === "2d");
        document.body.classList.toggle("is-fortune", mode === "led");
        const ledopt = el2("ledopt");
        if (ledopt) ledopt.hidden = mode !== "led";
        const sel = el2("modus");
        if (sel && feldWert(sel) !== mode) feldSetze(sel, mode);
      }
      function statusText() {
        const basis = t(`status.${haStatus}`) || haStatus;
        if (!haMeldung) return basis;
        let extra = haMeldung;
        if (haMeldung.startsWith("called:")) extra = textOrServer(locale, "called", { name: haMeldung.slice(7) });
        else extra = textOrServer(locale, haMeldung);
        return extra ? `${basis} \u2014 ${extra}` : basis;
      }
      const STOERUNG_KEYS = {
        tokenRejected: 1,
        statesUnreadable: 1,
        entityMissing: 1,
        callFailed: 1,
        connectFailed: 1,
        tokenMissing: 1,
        connectionTrouble: 1
      };
      function istStoerung() {
        if (haStatus === "fehler" || haStatus === "auth_ungueltig" || haStatus === "getrennt") return true;
        return !!STOERUNG_KEYS[haMeldung];
      }
      function syncStoerung() {
        var _a2;
        if (schauLaeuft) return;
        if (istStoerung()) {
          const leise2 = (_a2 = el2("caption")) == null ? void 0 : _a2.classList.contains("is-quiet");
          if (stoerungAn && leise2) return;
          stoerungAn = true;
          wendeZustand("nicht_verstanden", { ton: false, erzwingen: true, zeile: false });
          zeigeZeile("stoerung", { halten: true, leise: true });
          return;
        }
        if (!stoerungAn) return;
        stoerungAn = false;
        const node = el2("caption");
        const leise = node && node.classList.contains("is-quiet");
        if (leise) hideCaption();
        if (konfig.caption && letzterKurz && letzterKurz !== "idle") showCaption(letzterKurz);
        else scheduleBored();
      }
      function setStatus(s) {
        if (s.status) haStatus = s.status;
        if (s.meldung) haMeldung = sichereMeldung(s.meldung);
        else if (s.letzterAufruf) haMeldung = s.aufrufOk ? `called:${s.letzterAufruf}` : "notSet";
        else if (s.status === "verbinde" || s.status === "offen" || s.status === "verbunden" || s.status === "aus" || s.status === "getrennt" || s.status === "mock") haMeldung = "";
        if (haMeldung) haMeldung = sichereMeldung(haMeldung);
        const wrap2 = el2("ha-status");
        if (wrap2) wrap2.dataset.state = haStatus;
        const ziel = el2("ha-status-text");
        if (ziel) ziel.textContent = statusText();
        if (blattOffen) aktualisiereDetails();
        syncStoerung();
      }
      function aktionsWerte() {
        return [...AKTIONEN, ...(konfig.eigene || []).map((item) => `own:${item.id}`)];
      }
      function aktionsName(art) {
        if (art.startsWith("own:")) {
          const item = (konfig.eigene || []).find((eintrag) => eintrag.id === art.slice(4));
          return (item == null ? void 0 : item.label) || art;
        }
        return t(`gesture.act.${art}`);
      }
      function fuelleAktionSelect(select) {
        if (!select) return;
        const werte = aktionsWerte();
        const bisher = feldWert(select);
        const wert = werte.includes(bisher) ? bisher : "none";
        if (!select.querySelector(".aktion-aktuell")) {
          select.replaceChildren();
          select.classList.add("picker", "wahl", "aktion-wahl");
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "aktion-aktuell";
          btn.addEventListener("click", () => oeffneAktionPop(select));
          select.append(btn);
        }
        select.dataset.value = wert;
        feldSetze(select, wert);
      }
      function sichereAktionPop() {
        let pop = el2("aktion-pop");
        if (pop) return pop;
        pop = document.createElement("div");
        pop.id = "aktion-pop";
        pop.hidden = true;
        const karte = document.createElement("div");
        karte.className = "aktion-pop-karte";
        karte.setAttribute("role", "dialog");
        const titel = document.createElement("p");
        titel.id = "aktion-pop-titel";
        titel.className = "aktion-pop-titel";
        const liste2 = document.createElement("div");
        liste2.id = "aktion-pop-liste";
        liste2.className = "aktion-pop-liste";
        const zeile2 = document.createElement("label");
        zeile2.id = "aktion-pop-ziel-zeile";
        zeile2.className = "aktion-pop-ziel";
        zeile2.hidden = true;
        const span = document.createElement("span");
        span.textContent = t("custom.service");
        const input = document.createElement("input");
        input.id = "aktion-pop-ziel";
        input.type = "text";
        input.autocapitalize = "off";
        input.autocorrect = "off";
        input.spellcheck = false;
        input.placeholder = t("ph.service");
        input.addEventListener("input", () => {
          if (!aktionFeld) return;
          const ziel = el2(`${aktionFeld.id}-ziel`);
          if (ziel) ziel.value = input.value;
          feldSetze(aktionFeld, feldWert(aktionFeld));
          gesteGeaendert();
        });
        zeile2.append(span, input);
        karte.append(titel, liste2, zeile2);
        pop.append(karte);
        pop.addEventListener("click", (e) => {
          if (e.target === pop) schliesseAktionPop();
        });
        document.body.append(pop);
        return pop;
      }
      function oeffneAktionPop(select) {
        const pop = sichereAktionPop();
        aktionFeld = select;
        const titel = el2("aktion-pop-titel");
        const label = document.querySelector(`label[for="${select.id}"]`);
        if (titel) titel.textContent = label ? label.textContent : "";
        const liste2 = el2("aktion-pop-liste");
        liste2.replaceChildren();
        const wert = feldWert(select);
        for (const art of aktionsWerte()) {
          const opt = document.createElement("button");
          opt.type = "button";
          opt.textContent = aktionsName(art);
          opt.setAttribute("aria-pressed", art === wert ? "true" : "false");
          opt.addEventListener("click", () => {
            feldSetze(select, art);
            const zielZeile2 = el2("aktion-pop-ziel-zeile");
            if (zielZeile2) zielZeile2.hidden = art !== "service";
            const knoepfe2 = liste2.querySelectorAll("button");
            for (let i = 0; i < knoepfe2.length; i++) {
              knoepfe2[i].setAttribute("aria-pressed", knoepfe2[i] === opt ? "true" : "false");
            }
            gesteGeaendert();
            if (art !== "service") schliesseAktionPop();
          });
          liste2.append(opt);
        }
        const ziel = el2(`${select.id}-ziel`);
        const zielInput = el2("aktion-pop-ziel");
        const zielZeile = el2("aktion-pop-ziel-zeile");
        if (zielInput) {
          zielInput.value = ziel ? ziel.value : "";
          zielInput.readOnly = demoSperre(location.hostname);
        }
        if (zielZeile) zielZeile.hidden = wert !== "service";
        pop.hidden = false;
      }
      function schliesseAktionPop() {
        const pop = el2("aktion-pop");
        if (pop) pop.hidden = true;
        aktionFeld = null;
      }
      function baueGestenFelder() {
        const wrap2 = el2("gesten-felder");
        if (!wrap2) return;
        if (!gestenGebaut) {
          for (const key of GESTEN_KEYS) {
            const row = document.createElement("div");
            row.className = "geste";
            const label = document.createElement("label");
            label.htmlFor = `g-${key}`;
            label.dataset.i18n = `gesture.${key}`;
            const select = document.createElement("div");
            select.id = `g-${key}`;
            select.className = "picker wahl";
            const input = document.createElement("input");
            input.id = `g-${key}-ziel`;
            input.type = "text";
            input.hidden = true;
            input.autocapitalize = "off";
            input.autocorrect = "off";
            input.spellcheck = false;
            input.placeholder = t("ph.service");
            input.addEventListener("change", gesteGeaendert);
            row.append(label, select, input);
            wrap2.append(row);
          }
          gestenGebaut = true;
        }
        for (const key of GESTEN_KEYS) {
          fuelleAktionSelect(el2(`g-${key}`));
          const input = el2(`g-${key}-ziel`);
          if (input) input.placeholder = t("ph.service");
        }
      }
      function baueEckenFelder() {
        const wrap2 = el2("ecken-felder");
        if (!wrap2) return;
        if (!eckenGebaut) {
          for (const key of ECK_KEYS) {
            const block = document.createElement("div");
            block.className = "ecke";
            const name = document.createElement("p");
            name.className = "ecke-name";
            name.dataset.i18n = `corner.${key}`;
            block.append(name);
            for (const art of ["tap", "hold"]) {
              const row = document.createElement("div");
              row.className = "geste";
              const label = document.createElement("label");
              label.htmlFor = `c-${key}-${art}`;
              label.dataset.eckLabel = art;
              const select = document.createElement("div");
              select.id = `c-${key}-${art}`;
              select.className = "picker wahl";
              const input = document.createElement("input");
              input.id = `c-${key}-${art}-ziel`;
              input.type = "text";
              input.hidden = true;
              input.autocapitalize = "off";
              input.autocorrect = "off";
              input.spellcheck = false;
              input.addEventListener("change", gesteGeaendert);
              row.append(label, select, input);
              block.append(row);
            }
            wrap2.append(block);
          }
          eckenGebaut = true;
        }
        for (const key of ECK_KEYS) {
          for (const art of ["tap", "hold"]) {
            fuelleAktionSelect(el2(`c-${key}-${art}`));
            const input = el2(`c-${key}-${art}-ziel`);
            if (input) input.placeholder = t("ph.service");
            const label = wrap2.querySelector(`label[for="c-${key}-${art}"]`);
            if (label) label.textContent = t(art === "tap" ? "corner.tap" : "corner.hold");
          }
        }
      }
      function applyI18n() {
        var _a2;
        document.documentElement.lang = locale;
        document.title = t("app.title");
        const apple = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (apple) apple.content = t("app.shortTitle");
        const canvas2 = el2("c");
        if (canvas2) canvas2.setAttribute("aria-label", t("app.canvas"));
        baueGestenFelder();
        baueEckenFelder();
        for (const node of document.querySelectorAll("[data-i18n]")) node.textContent = t(node.dataset.i18n);
        for (const node of document.querySelectorAll("[data-i18n-placeholder]")) {
          node.placeholder = t(node.dataset.i18nPlaceholder);
        }
        const token = el2("ha-token");
        if (token) token.placeholder = konfig.haToken ? t("ph.tokenReplace") : t("ph.tokenEmpty");
        for (const button of ((_a2 = el2("zust")) == null ? void 0 : _a2.querySelectorAll("button")) || []) {
          button.textContent = stateLabel(locale, button.dataset.state);
        }
        const sprache = el2("sprache");
        if (sprache) feldSetze(sprache, konfig.lang || "auto");
        const ruhe = el2("caption-ruhe");
        if (ruhe) ruhe.setAttribute("aria-label", t("caption.restore"));
        for (const a of document.querySelectorAll("a.ext-help")) {
          a.href = hilfeUrl(a.dataset.help);
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.setAttribute("aria-label", t("help.external"));
        }
        const version = el2("version");
        if (version) {
          version.textContent = `v${VERSION}`;
          version.href = LINKS.changelog;
        }
        const projekt = el2("link-projekt");
        if (projekt) projekt.href = LINKS.credits;
        const profil = el2("profil-name");
        if (profil) profil.textContent = t(aktiveKlasse() === "phone" ? "settings.profilePhone" : "settings.profileTablet");
        const idea = el2("link-idea");
        if (idea) idea.href = LINKS.idea;
        syncRepoLinks();
        const hvuz = el2("link-hvuz");
        if (hvuz) hvuz.href = LINKS.hvuz;
        syncDemoHinweis();
        syncDemoSperre();
        zeichneEigene();
        zeichneStates();
        syncLang();
        syncUhr();
        setStatus({ status: haStatus, meldung: haMeldung });
        if (blattOffen) aktualisiereDetails();
        if (captionState === "track" && jetztText) zeigeZeile("track", { halten: true });
        else if (captionState && captionState !== "track" && (el2("caption").classList.contains("is-on") || el2("caption").classList.contains("is-hold"))) {
          zeigeZeile(captionState, { halten: captionState === "stoerung" || captionState === "zuhoeren", leise: captionState === "stoerung" });
        }
      }
      const SPERRE_FELDER = ["ha-url", "ha-token", "ha-entity", "media-entity", "tuer-entity", "kamera-entity", "sk-musik-an", "sk-musik-aus", "sk-licht-an", "sk-licht-aus", "eigene-label", "eigene-ziel", "dash-weather", "dash-temp", "dash-cal", "dash-waste", "dash-windows", "dash-indoor", "dash-rain", "dash-wind", "dash-bright", "dash-alloff", "dash-guard-toggle", "dash-guard", "dash-contacts", "dash-groups", "dash-energy", "dash-energy-day", "dash-energy-grid", "dash-energy-feed", "dash-energy-auto", "dash-buttons"];
      function syncDemoSperre() {
        const an = demoSperre(location.hostname);
        for (const id of SPERRE_FELDER) {
          const node = el2(id);
          if (node) node.readOnly = an;
        }
        const note = el2("demo-sperre");
        if (note) {
          note.hidden = !an;
          note.textContent = t("demo.locked");
        }
        const popZiel = el2("aktion-pop-ziel");
        if (popZiel) popZiel.readOnly = an;
      }
      function clearBored() {
        clearTimeout(boredTimer);
        boredTimer = 0;
      }
      function syncRuhe() {
        const ruhe = el2("caption-ruhe");
        const node = el2("caption");
        if (!ruhe || !node) return;
        const sichtbar = node.classList.contains("is-on") || node.classList.contains("is-hold");
        ruhe.hidden = einstellungenOffen || blattOffen || sichtbar;
      }
      function syncCaptionPlatz() {
        const node = el2("caption");
        const an = !!(node && (node.classList.contains("is-on") || node.classList.contains("is-hold")));
        document.body.classList.toggle("caption-live", an);
      }
      function hideCaption() {
        var _a2;
        const node = el2("caption");
        if (!node) return;
        node.classList.remove("is-on", "is-hold", "is-alarm", "is-quiet");
        (_a2 = el2("caption-hit")) == null ? void 0 : _a2.replaceChildren();
        node.removeAttribute("aria-label");
        captionState = "";
        syncRuhe();
        syncCaptionPlatz();
      }
      function zeigeZeile(state, { halten = false, leise = false } = {}) {
        const line = state === "track" ? { text: jetztText } : captionLine(locale, state, konfig.states);
        const node = el2("caption");
        const hit = el2("caption-hit");
        if (!(line == null ? void 0 : line.text) || !node || !hit) return;
        hit.replaceChildren(document.createTextNode(line.text));
        if (line.dots) {
          const dots = document.createElement("span");
          dots.className = "punkte";
          dots.setAttribute("aria-hidden", "true");
          for (let i = 0; i < 3; i++) dots.appendChild(document.createElement("i"));
          hit.append(dots);
        }
        node.setAttribute("aria-label", line.dots ? `${line.text}\u2026` : line.text);
        node.classList.remove("is-on", "is-hold");
        node.classList.toggle("is-alarm", state === "angry");
        node.classList.toggle("is-quiet", !!leise);
        void node.offsetWidth;
        node.classList.add(halten ? "is-hold" : "is-on");
        captionState = state;
        syncRuhe();
        syncCaptionPlatz();
      }
      function ersetzeKnoten(node, neu) {
        if (node !== neu && node.parentNode) node.parentNode.replaceChild(neu, node);
        return neu;
      }
      function syncRepoLinks() {
        const links = repoLinks();
        const maintainer = el2("link-maintainer");
        if (maintainer) {
          if (links.maintainer) {
            const a = maintainer.tagName === "A" ? maintainer : document.createElement("a");
            a.id = "link-maintainer";
            a.href = links.maintainer;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = "stefanvr82";
            ersetzeKnoten(maintainer, a);
          } else {
            const span = maintainer.tagName === "SPAN" ? maintainer : document.createElement("span");
            span.id = "link-maintainer";
            span.textContent = "stefanvr82";
            ersetzeKnoten(maintainer, span);
          }
        }
        const paare = [
          ["link-repo", links.repo, links.repoLabel],
          ["link-sponsors", links.sponsors, links.supportLabel]
        ];
        for (const [id, href, label] of paare) {
          const node = el2(id);
          if (!node) continue;
          if (href) {
            const a = node.tagName === "A" ? node : document.createElement("a");
            a.id = id;
            a.href = href;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.removeAttribute("data-i18n");
            a.textContent = label;
            ersetzeKnoten(node, a);
          } else {
            const span = node.tagName === "SPAN" ? node : document.createElement("span");
            span.id = id;
            span.dataset.i18n = "credits.soon";
            span.textContent = t("credits.soon");
            ersetzeKnoten(node, span);
          }
        }
      }
      function showCaption(state) {
        if (einstellungenOffen || blattOffen) return;
        if (state === "idle") {
          if (jetztText) zeigeZeile("track", { halten: true });
          else if (konfig.caption) zeigeZeile("idle");
          return;
        }
        if (state === "hallo") {
          zeigeZeile("hallo");
          return;
        }
        if (!konfig.caption) {
          if (captionState === "hallo") hideCaption();
          return;
        }
        zeigeZeile(state, { halten: state === "zuhoeren" });
      }
      function scheduleBored() {
        clearBored();
        if (jetztText || !konfig.caption) return;
        boredTimer = setTimeout(() => {
          if (letzterKurz === "idle" && !ablauf && konfig.caption && !jetztText) showCaption("idle");
        }, CAPTION_TIMING.boredAfterMs);
      }
      function captionFuer(kurz) {
        if (kurz === "idle") scheduleBored();
        else {
          clearBored();
          showCaption(kurz);
        }
      }
      function setTrack(text) {
        const vorher = jetztText;
        jetztText = text || "";
        if (einstellungenOffen || blattOffen) {
          syncRuhe();
          return;
        }
        if (jetztText) {
          const zeile2 = el2("caption");
          const sichtbar = zeile2 && (zeile2.classList.contains("is-on") || zeile2.classList.contains("is-hold"));
          const aktiv = captionState && captionState !== "idle" && captionState !== "track" && captionState !== "tickle" && sichtbar;
          if (!aktiv) zeigeZeile("track", { halten: true });
          else syncRuhe();
        } else if (vorher && captionState === "track") {
          hideCaption();
          if (konfig.caption && letzterKurz !== "idle") showCaption(letzterKurz);
          else scheduleBored();
        } else syncRuhe();
      }
      function onMedien(aktion) {
        try {
          medienZustand = aktion || null;
          medienAttr = (aktion == null ? void 0 : aktion.attr) || null;
          medienState = (aktion == null ? void 0 : aktion.state) || "";
          if (sollMusikOeffnen(letzterKurz, aktion == null ? void 0 : aktion.state, aktion == null ? void 0 : aktion.quelle)) oeffneMusikAnsicht();
          planeMusikRuhe(aktion == null ? void 0 : aktion.state, aktion == null ? void 0 : aktion.quelle);
          const urlVorschau = (aktion == null ? void 0 : aktion.quelle) === "url" || (aktion == null ? void 0 : aktion.quelle) === "api";
          if (!konfig.nowPlaying || !urlVorschau && !konfig.mediaEntity) {
            if (jetztText && jetztText !== DEMO_LINE) setTrack("");
            if (detailArt === "music") syncMusikPanel();
            return;
          }
          setTrack(jetztLaeuft(aktion == null ? void 0 : aktion.state, aktion == null ? void 0 : aktion.attr) || "");
          if (detailArt === "music") syncMusikPanel();
        } catch (e) {
          setTrack("");
        }
      }
      function syncLang() {
        const de = el2("sheet-de");
        const en = el2("sheet-en");
        if (de) de.setAttribute("aria-pressed", locale === "de" ? "true" : "false");
        if (en) en.setAttribute("aria-pressed", locale === "en" ? "true" : "false");
      }
      function syncUhr() {
        const node = el2("uhr");
        if (!node) return;
        node.hidden = !konfig.uhr;
        if (konfig.uhr) node.textContent = uhrText();
        const gross = el2("day-clock");
        if (gross && detailArt === "day") gross.textContent = uhrText();
      }
      function syncSoundHint() {
      }
      function seitText() {
        const sec = Math.max(0, Math.round((Date.now() - seit) / 1e3));
        if (sec < 60) return sec === 1 ? t("sheet.forSecond") : t("sheet.forSeconds", { n: sec });
        const min = Math.max(1, Math.round(sec / 60));
        return min === 1 ? t("sheet.forMinute") : t("sheet.forMinutes", { n: min });
      }
      function befehlText() {
        if (!letzterBefehl) return t("sheet.noCommand");
        let name = letzterBefehl.spec || "";
        if (letzterBefehl.id === "musik_an") name = t("cmd.musicOn");
        else if (letzterBefehl.id === "musik_aus") name = t("cmd.musicOff");
        else if (letzterBefehl.id === "licht_an") name = t("cmd.lightsOn");
        else if (letzterBefehl.id === "licht_aus") name = t("cmd.lightsOff");
        if (!letzterBefehl.ok) name = `${name} \u2014 ${t("sheet.notSent")}`;
        return name;
      }
      function aktualisiereDetails() {
        var _a2;
        const state = el2("sheet-state");
        if (!state) return;
        state.textContent = stateLabel(locale, letzterKurz);
        el2("sheet-since").textContent = seitText();
        el2("sheet-doing").textContent = detailLine(locale, letzterKurz);
        el2("sheet-ha").textContent = stoerungAn ? ((_a2 = captionLine(locale, "stoerung")) == null ? void 0 : _a2.text) || "" : statusText();
        el2("sheet-cmd").textContent = befehlText();
      }
      function schreibeSchalter() {
        const paar = [
          ["caption-an", konfig.caption],
          ["sheet-caption", konfig.caption],
          ["ton", konfig.ton],
          ["sheet-ton", konfig.ton],
          ["uhr-an", konfig.uhr],
          ["sheet-uhr", konfig.uhr],
          ["np-an", konfig.nowPlaying],
          ["sheet-np", konfig.nowPlaying]
        ];
        for (const [id, an] of paar) {
          const node = el2(id);
          if (node) node.checked = !!an;
        }
      }
      function setCaption(an) {
        konfig.caption = !!an;
        speichereKonfig(konfig);
        schreibeSchalter();
        if (!konfig.caption) {
          clearBored();
          if (captionState !== "track") hideCaption();
          if (jetztText) zeigeZeile("track", { halten: true });
        } else if (jetztText) zeigeZeile("track", { halten: true });
        else if (letzterKurz === "idle") scheduleBored();
        else showCaption(letzterKurz);
        syncRuhe();
      }
      function setTonAn(an) {
        konfig.ton = !!an;
        audio.setTon(konfig.ton);
        speichereKonfig(konfig);
        schreibeSchalter();
        syncSoundHint();
      }
      function setUhr(an) {
        konfig.uhr = !!an;
        speichereKonfig(konfig);
        schreibeSchalter();
        syncUhr();
      }
      function setNowPlaying(an) {
        konfig.nowPlaying = !!an;
        speichereKonfig(konfig);
        schreibeSchalter();
        if (!konfig.nowPlaying) setTrack("");
        else if (medienZustand) onMedien(medienZustand);
        else syncRuhe();
      }
      function setLang(code) {
        konfig.lang = code === "de" || code === "en" ? code : "";
        locale = resolveLocale({ stored: konfig.lang, nav: navigator.language });
        speichereKonfig(konfig);
        applyI18n();
      }
      function oeffneBlatt() {
        if (aktiveKlasse() !== "phone" && el2("stapel")) {
          oeffneDetail("status");
          return;
        }
        if (einstellungenOffen) schliesseEinstellungen();
        blattOffen = true;
        hideCaption();
        const sheet2 = el2("sheet");
        schreibeSchalter();
        const schlaf = el2("sheet-schlaf");
        if (schlaf) schlaf.value = String(Math.round(konfig.schlafSekunden / 60));
        syncLang();
        aktualisiereDetails();
        sheet2.hidden = false;
        requestAnimationFrame(() => sheet2.classList.add("is-open"));
        clearInterval(seitTimer);
        seitTimer = setInterval(() => {
          if (blattOffen) aktualisiereDetails();
        }, 1e3);
        syncRuhe();
      }
      function schliesseBlatt() {
        if (!blattOffen) return;
        blattOffen = false;
        clearInterval(seitTimer);
        const sheet2 = el2("sheet");
        const card2 = el2("sheet-card");
        if (card2) card2.style.transform = "";
        sheet2.classList.remove("is-open");
        const fertig = () => {
          if (sheet2.classList.contains("is-open")) return;
          sheet2.hidden = true;
        };
        const ende = (ev) => {
          if (ev && ev.target !== sheet2) return;
          sheet2.removeEventListener("transitionend", ende);
          fertig();
        };
        sheet2.addEventListener("transitionend", ende);
        setTimeout(fertig, 420);
        if (jetztText) zeigeZeile("track", { halten: true });
        else if (konfig.caption && letzterKurz !== "idle") showCaption(letzterKurz);
        else scheduleBored();
        syncRuhe();
      }
      function kitzeln() {
        const canvas2 = el2("c");
        if (!document.body.classList.contains("stage-split")) {
          canvas2.classList.remove("kitzel");
          void canvas2.offsetWidth;
          canvas2.classList.add("kitzel");
        }
        audio.unlock().then(() => {
          audio.ton({ sound: TICKLE, s_off: 0 });
          syncSoundHint();
        }).catch(() => {
        });
      }
      function blitz(name) {
        const node = el2("eck-blitz");
        if (!node) return;
        node.classList.remove("is-on");
        node.dataset.eck = name;
        void node.offsetWidth;
        node.classList.add("is-on");
      }
      function stopAblauf() {
        if (!ablauf) return;
        ablauf = null;
        waechter.setPause(false);
      }
      function merkeSchalter(kurz) {
        if (kurz === "musik_an") musikAn = true;
        if (kurz === "licht_an") lichtAn = true;
        if (kurz === "licht_aus") lichtAn = false;
      }
      function wendeZustand(roh, { ton = true, erzwingen = false, zeile: zeile2 = true } = {}) {
        const kurz = mapHaState(roh);
        if (kurz === "sprechen") {
          const alter2 = performance.now() - letzterWechsel;
          if (!erzwingen && letzterKurz === "sprechen" && (ton === false || alter2 < 4e3)) {
            waechter.beruehrt();
            return false;
          }
          stopAblauf();
          stopAlarmTon();
          waechter.beruehrt();
          augen.set(KURZ.idle);
          bildKurz = "sprechen";
          if (!einstellungenOffen) letzterKurz = "sprechen";
          else vorschau = true;
          letzterWechsel = performance.now();
          seit = Date.now();
          const farbe2 = augen.ring && augen.ring[0] || [255, 236, 214];
          renderer.acknowledge(farbe2);
          if (zeile2) captionFuer("sprechen");
          if (blattOffen) aktualisiereDetails();
          syncDemoTrack();
          syncTip();
          return true;
        }
        if (!kurz || !KURZ[kurz]) return false;
        const alter = performance.now() - letzterWechsel;
        if (!erzwingen && kurz === letzterKurz && (ton === false || alter < 4e3)) {
          if (kurz === "schlafen") waechter.einschlafen();
          else waechter.beruehrt();
          return false;
        }
        stopAblauf();
        if (kurz === "schlafen") waechter.einschlafen();
        else waechter.beruehrt();
        augen.set(KURZ[kurz]);
        bildKurz = kurz;
        if (!einstellungenOffen) letzterKurz = kurz;
        else vorschau = true;
        letzterWechsel = performance.now();
        seit = Date.now();
        merkeSchalter(kurz);
        if (ton) tonFuer(kurz);
        const farbe = augen.ring && augen.ring[0] || [255, 236, 214];
        renderer.acknowledge(farbe);
        if (zeile2) captionFuer(kurz);
        if (blattOffen) aktualisiereDetails();
        syncDemoTrack();
        syncTip();
        return true;
      }
      let alarmPuls = 0;
      let alarmLeise = 0;
      function stopAlarmTon() {
        clearInterval(alarmPuls);
        clearTimeout(alarmLeise);
        alarmPuls = 0;
        alarmLeise = 0;
      }
      function starteAlarmTon(clip) {
        stopAlarmTon();
        const stark = konfig.alarmStaerke !== "normal";
        const n = stark ? 3 : 2;
        const gap = 0.48;
        const laut = stark ? 1 : 0.62;
        const leise = stark ? 0.22 : 0.14;
        for (let i = 0; i < n; i++) audio.ton({ sound: clip.sound, s_off: (clip.s_off || 0) + i * gap, gain: laut });
        alarmLeise = setTimeout(() => {
          if (bildKurz !== "angry") return;
          audio.ton({ sound: clip.sound, s_off: 0, gain: leise });
          alarmPuls = setInterval(() => {
            if (bildKurz !== "angry") {
              stopAlarmTon();
              return;
            }
            audio.ton({ sound: clip.sound, s_off: 0, gain: leise });
          }, 3400);
        }, (n * gap + 1.8) * 1e3);
      }
      function tonFuer(kurz) {
        var _a2, _b2;
        const clip = BY[KURZ[kurz]];
        if (kurz !== "angry") stopAlarmTon();
        if (!clip) return;
        if (kurz === "angry" && clip.sound) {
          starteAlarmTon(clip);
          return;
        }
        const sound = (_b2 = (_a2 = konfig.states) == null ? void 0 : _a2[kurz]) == null ? void 0 : _b2.sound;
        audio.ton(sound ? __spreadProps(__spreadValues({}, clip), { sound }) : clip);
      }
      function hexZuRgb(hex) {
        const m = /^#([0-9a-f]{6})$/i.exec(hex || "");
        if (!m) return null;
        const n = parseInt(m[1], 16);
        return [n >> 16 & 255, n >> 8 & 255, n & 255];
      }
      function ringGefaerbt(ring, kurz) {
        var _a2, _b2;
        const rgb = hexZuRgb((_b2 = (_a2 = konfig.states) == null ? void 0 : _a2[kurz]) == null ? void 0 : _b2.color);
        if (!rgb || !ring) return ring;
        const next = [rgb, ring[1], ring[2]];
        if (ring.length > 3) next.push(ring[3]);
        return next;
      }
      function settingsRing(now) {
        const breath2 = 0.14 + 0.045 * (0.5 + 0.5 * Math.sin(now / 1e3 * (Math.PI * 2 / 9)));
        return [[176, 198, 206], breath2, null];
      }
      function syncDemoTrack() {
        var _a2;
        const gezeigt = ablauf ? KURZ_VON_CLIP[(_a2 = ablauf.c) == null ? void 0 : _a2.name] : bildKurz === "settings" ? letzterKurz : bildKurz;
        const kurz = gezeigt;
        const spielen = kurz === "musik_an" && !konfig.mediaEntity && konfig.ton;
        if (spielen) {
          audio.unlock().then(() => demoMusik.start(audio.context())).catch(() => {
          });
          if (jetztText !== DEMO_LINE) setTrack(DEMO_LINE);
        } else if (demoMusik.playing) {
          demoMusik.stop();
          if (jetztText === DEMO_LINE) setTrack("");
        }
      }
      augen.onEnde = () => {
        if (ablauf || schauLaeuft) return;
        letzterKurz = "idle";
        letzterWechsel = performance.now();
        seit = Date.now();
        scheduleBored();
        if (blattOffen) aktualisiereDetails();
      };
      function eingang(aktion) {
        if (schauLaeuft) return;
        const stimmeHallo = aktion.zustand === "hallo";
        const ok = wendeZustand(aktion.zustand, { ton: aktion.ton !== false && !stimmeHallo });
        if (ok && stimmeHallo && aktion.ton !== false && konfig.ton) {
          audio.unlock().then(() => playChirps(audio.context())).catch(() => {
          });
        }
        if (sollMusikOeffnen(aktion.zustand, medienState, aktion.quelle)) oeffneMusikAnsicht();
      }
      function feuereBefehl(id) {
        var _a2;
        const befehl = BEFEHLE[id];
        if (!befehl) return false;
        const gezeigt = wendeZustand(befehl.zustand, { ton: true, erzwingen: true });
        const spec = konfig[befehl.scriptKey];
        const ok = (_a2 = ha == null ? void 0 : ha.callScript(spec)) != null ? _a2 : false;
        if (!(ha == null ? void 0 : ha.mock)) {
          setStatus({
            status: haStatus,
            meldung: ok ? `called:${spec}` : ha ? "eyesOnly" : "eyesOnlyOffline"
          });
        }
        letzterBefehl = { id, spec, ok, gezeigt };
        if (blattOffen) aktualisiereDetails();
        return ok;
      }
      function rufeDienst(spec) {
        var _a2;
        const ok = (_a2 = ha == null ? void 0 : ha.callScript(spec)) != null ? _a2 : false;
        letzterBefehl = { id: "service", spec, ok, gezeigt: false };
        if (!(ha == null ? void 0 : ha.mock)) {
          setStatus({
            status: haStatus,
            meldung: ok ? `called:${spec}` : ha ? "eyesOnly" : "eyesOnlyOffline"
          });
        } else if (blattOffen) aktualisiereDetails();
        if (waechter.schlaeft) aufwachen();
        else waechter.beruehrt();
        return ok;
      }
      function aufwachen() {
        if (!waechter.schlaeft) {
          waechter.beruehrt();
          return;
        }
        wendeZustand("hallo", { ton: true, erzwingen: true });
      }
      function musikUmschalten() {
        musikAn = !musikAn;
        feuereBefehl(musikAn ? "musik_an" : "musik_aus");
      }
      function lichtUmschalten() {
        lichtAn = !lichtAn;
        feuereBefehl(lichtAn ? "licht_an" : "licht_aus");
      }
      function fuehreAktion(aktion) {
        if (!aktion || aktion.art === "none") {
          if (waechter.schlaeft) aufwachen();
          else waechter.beruehrt();
          return false;
        }
        if (aktion.art === "music_toggle") {
          toggleMusik();
          return true;
        }
        if (aktion.art === "light_toggle") {
          lichtUmschalten();
          return true;
        }
        if (aktion.art === "service") {
          rufeDienst(aktion.ziel);
          bestaetige();
          return true;
        }
        if (aktion.art === "clock") {
          setUhr(!konfig.uhr);
          waechter.beruehrt();
          bestaetige();
          return true;
        }
        if (aktion.art === "caption") {
          setCaption(!konfig.caption);
          waechter.beruehrt();
          bestaetige();
          return true;
        }
        if (aktion.art === "sheet") {
          oeffneBlatt();
          waechter.beruehrt();
          bestaetige();
          return true;
        }
        if (aktion.art === "settings") {
          oeffneEinstellungen();
          return true;
        }
        if (aktion.art === "demo") {
          toggleDemo();
          bestaetige();
          return true;
        }
        if (aktion.art === "view") {
          const i = MODI.indexOf(renderer.mode);
          const next = MODI[(i + 1) % MODI.length];
          konfig.modus = next;
          setModus(next);
          speichereKonfig(konfig);
          waechter.beruehrt();
          bestaetige();
          return true;
        }
        if (aktion.art === "dashboard") {
          toggleHome();
          return true;
        }
        if (aktion.art.startsWith("own:")) {
          const item = (konfig.eigene || []).find((eintrag) => eintrag.id === aktion.art.slice(4));
          if (item) rufeDienst(item.ziel);
          bestaetige();
          return true;
        }
        return false;
      }
      function toggleDemo() {
        if (schauLaeuft || schauFest) {
          konfig.demo = false;
          stoppeSchau();
        } else {
          konfig.demo = true;
          starteSchau();
        }
        const box = el2("demo-an");
        if (box) box.checked = !!(schauLaeuft || konfig.demo);
        speichereKonfig(konfig);
      }
      function nextClip() {
        ablauf.idx++;
        if (ablauf.idx >= CLIPS.length) {
          ablauf = null;
          waechter.setPause(false);
          wendeZustand("idle", { ton: false, erzwingen: true });
          return;
        }
        const c = CLIPS[ablauf.idx];
        ablauf.c = c;
        ablauf.gen = clipPoses(c, ABL_FPS);
        ablauf.acc = 0;
        ablauf.cur = ablauf.gen.next().value;
        const kurz = KURZ_VON_CLIP[c.name];
        bildKurz = kurz || bildKurz;
        if (kurz) tonFuer(kurz);
        else audio.ton(c);
        syncDemoTrack();
        syncTip();
        if (kurz && kurz !== "idle") {
          clearBored();
          showCaption(kurz);
        }
      }
      function startAblauf() {
        stopAblauf();
        ablauf = { idx: -1 };
        waechter.setPause(true);
        nextClip();
      }
      const GLYPH = {
        idle: ["", ""],
        schlafen: ["", ""],
        musik_an: ["\u266A", "is-note"],
        nachdenken: ["...", "is-dots"],
        zuhoeren: ["~", "is-wave"],
        hallo: ["Hi", ""],
        blicke: ["..", ""],
        verstanden: ["OK", ""],
        erledigt: ["OK", ""],
        nicht_verstanden: ["?", ""],
        fehler: ["!", ""],
        lachen: ["Ha", ""],
        licht_an: ["On", ""],
        licht_aus: ["Off", ""],
        angry: ["!!", ""]
      };
      function syncGlyph() {
        const node = el2("state-glyph");
        if (!node) return;
        const paar = GLYPH[bildKurz] || ["", ""];
        const an = !!(ui.label && paar[0] && !einstellungenOffen && !blattOffen && !dashOffen);
        node.hidden = !an;
        if (!an) return;
        if (node.textContent !== paar[0]) node.textContent = paar[0];
        node.className = paar[1] || "";
      }
      function syncSchlafZeile() {
        const node = el2("caption");
        const hit = el2("caption-hit");
        if (!node || !hit) return;
        const zeigen = bildKurz === "schlafen" && !einstellungenOffen && !blattOffen && !dashOffen;
        if (!zeigen) {
          if (node.classList.contains("is-sleep")) {
            node.classList.remove("is-sleep", "is-hold");
            hit.textContent = "";
            syncCaptionPlatz();
            syncRuhe();
          }
          return;
        }
        if (node.classList.contains("is-sleep") && hit.childNodes.length) return;
        hit.textContent = "";
        const wort = "Zzzzzz...";
        for (let i = 0; i < wort.length; i++) {
          const letter = document.createElement("i");
          letter.textContent = wort.charAt(i);
          letter.style.animationDelay = `${i * 0.12}s`;
          hit.appendChild(letter);
        }
        node.classList.remove("is-on");
        node.classList.add("is-hold", "is-sleep");
        syncCaptionPlatz();
        syncRuhe();
      }
      function syncDemoHinweis() {
        document.body.classList.toggle("is-demo", demoBesuch(konfig, location, q));
      }
      function syncEck() {
        const n = konfig.eckGroesse || 128;
        document.documentElement.style.setProperty("--eck", `${n}px`);
      }
      function safeInset() {
        const s = getComputedStyle(document.documentElement);
        const n = (name) => {
          const v = parseFloat(s.getPropertyValue(name));
          return Number.isFinite(v) ? v : 0;
        };
        return { t: n("--sat"), r: n("--sar"), b: n("--sab"), l: n("--sal") };
      }
      function eckHier(x, y) {
        return eckName(x, y, window.innerWidth, window.innerHeight, konfig.eckGroesse || 128, safeInset());
      }
      let last = performance.now();
      let lastDraw = 0;
      function frame(now) {
        var _a2, _b2;
        tickSchau(now);
        const dt = Math.min(0.1, (now - last) / 1e3);
        last = now;
        let pose;
        let ring;
        let text = "";
        if (ablauf) {
          ablauf.acc += dt;
          while (ablauf && ablauf.acc >= 1 / ABL_FPS) {
            ablauf.acc -= 1 / ABL_FPS;
            const n = ablauf.gen.next();
            if (n.done) nextClip();
            else ablauf.cur = n.value;
          }
          if (ablauf) {
            [pose, ring] = ablauf.cur;
            text = stateLabel(locale, KURZ_VON_CLIP[ablauf.c.name] || "");
            ring = ringGefaerbt(ring, KURZ_VON_CLIP[ablauf.c.name]);
          }
        }
        if (!pose) {
          pose = augen.tick(dt);
          ring = augen.ring;
          text = stateLabel(locale, KURZ_VON_CLIP[(_a2 = augen.c) == null ? void 0 : _a2.name] || letzterKurz);
          if (!einstellungenOffen && waechter.tick() === "einschlafen") wendeZustand("schlafen", { ton: true });
          if (einstellungenOffen && !ablauf && bildKurz === "settings") ring = settingsRing(now);
          else ring = ringGefaerbt(ring, bildKurz);
        } else augen.tick(dt);
        const folgt = document.body.classList.contains("stage-split") || document.body.classList.contains("dash");
        if (folgt) {
          lookX += (lookTX - lookX) * Math.min(1, dt * 7);
          lookY += (lookTY - lookY) * Math.min(1, dt * 7);
          const m = blinkMul(now / 1e3, [blinkAt]);
          pose = __spreadProps(__spreadValues({}, pose), { gx: lookX, gy: lookY, sy: pose.sy * m, sx: pose.sx * (1 + 0.15 * (1 - m) / (1 - P.BLINK_MIN)) });
        }
        syncGlyph();
        syncSchlafZeile();
        syncDim(dt);
        if (pose && ring && renderer.sparsam && now - lastDraw < 50) {
          requestAnimationFrame(frame);
          return;
        }
        lastDraw = now;
        const lichtKurz = ablauf ? KURZ_VON_CLIP[(_b2 = ablauf.c) == null ? void 0 : _b2.name] || bildKurz : bildKurz;
        const lichtWahl = param("licht_zustand", "light_state");
        const lichtFest = /^(idle|zuhoeren|sprechen|bestaetigt|fehler|schlafen|nachdenken|musik)$/.test(lichtWahl || "") ? lichtWahl : "";
        const alarmStark2 = konfig.alarmStaerke !== "normal";
        const befehl = lichtBefehl(lichtKurz, { fest: lichtFest, alarmStark: alarmStark2 });
        const lichtName = befehl.name;
        const lichtRgb = befehl.alarm ? befehl.rgb : lichtFest || lichtName === "schlafen" || lichtName === "sprechen" ? null : ring && ring[0];
        if (lichtRgb) {
          document.documentElement.style.setProperty("--accent", `rgb(${lichtRgb[0]}, ${lichtRgb[1]}, ${lichtRgb[2]})`);
        }
        const lichtFix = param("licht_t");
        const lichtProfil = param("licht_profil") || param("light") || konfig.lichtProfil || "ruhig";
        renderer.setLicht({
          profil: lichtProfil === "lebhaft" ? "lebhaft" : "ruhig",
          zustand: lichtName,
          rgb: lichtRgb,
          alarmStark: alarmStark2,
          t: lichtFix == null || lichtFix === "" ? null : Number(lichtFix)
        });
        renderer.render(pose, ring);
        requestAnimationFrame(frame);
      }
      function ledAusForm() {
        renderer.ledOpt = {
          pitch: +el2("pitch").value,
          h: +el2("abst").value,
          T: +el2("glas").value / 100,
          grid: el2("raster").checked
        };
        for (const id of ["pitch", "abst", "glas"]) {
          const anzeige = el2(id + "v");
          if (anzeige) anzeige.textContent = el2(id).value;
        }
        if (renderer.mode === "led") renderer.resize();
      }
      function leseGesten() {
        var _a2;
        const raw = {};
        for (const key of GESTEN_KEYS) {
          raw[key] = { art: feldWert(el2(`g-${key}`)), ziel: ((_a2 = el2(`g-${key}-ziel`)) == null ? void 0 : _a2.value) || "" };
        }
        return normGesten(raw);
      }
      function leseEcken() {
        var _a2, _b2;
        const raw = {};
        for (const key of ECK_KEYS) {
          raw[key] = {
            tap: { art: feldWert(el2(`c-${key}-tap`)), ziel: ((_a2 = el2(`c-${key}-tap-ziel`)) == null ? void 0 : _a2.value) || "" },
            hold: { art: feldWert(el2(`c-${key}-hold`)), ziel: ((_b2 = el2(`c-${key}-hold-ziel`)) == null ? void 0 : _b2.value) || "" }
          };
        }
        return normEcken(raw);
      }
      function gesteGeaendert() {
        if (!gestenGebaut || !eckenGebaut) return;
        konfig.gesten = leseGesten();
        konfig.ecken = leseEcken();
        speichereKonfig(konfig);
      }
      function schreibeGesten() {
        for (const key of GESTEN_KEYS) {
          const select = el2(`g-${key}`);
          const input = el2(`g-${key}-ziel`);
          if (!select || !input) continue;
          input.value = konfig.gesten[key].ziel;
          input.hidden = true;
          feldSetze(select, konfig.gesten[key].art);
        }
        for (const key of ECK_KEYS) {
          for (const art of ["tap", "hold"]) {
            const select = el2(`c-${key}-${art}`);
            const input = el2(`c-${key}-${art}-ziel`);
            if (!select || !input) continue;
            input.value = konfig.ecken[key][art].ziel;
            input.hidden = true;
            feldSetze(select, konfig.ecken[key][art].art);
          }
        }
      }
      function fuelleFormular() {
        var _a2, _b2, _c2;
        el2("ha-url").value = konfig.haUrl || "";
        el2("ha-token").value = "";
        el2("token-loeschen").checked = false;
        el2("ha-entity").value = konfig.haEntity || "";
        el2("media-entity").value = konfig.mediaEntity || "";
        el2("sk-musik-an").value = konfig.scriptMusikAn || "";
        el2("sk-musik-aus").value = konfig.scriptMusikAus || "";
        el2("sk-licht-an").value = konfig.scriptLichtAn || "";
        el2("sk-licht-aus").value = konfig.scriptLichtAus || "";
        feldSetze(el2("modus"), renderer.mode);
        feldSetze(el2("licht-profil"), konfig.lichtProfil === "lebhaft" ? "lebhaft" : "ruhig");
        feldSetze(el2("alarm-staerke"), konfig.alarmStaerke === "normal" ? "normal" : "stark");
        const dimNach = el2("dim-nach");
        if (dimNach) dimNach.value = String((_a2 = konfig.dimNachSekunden) != null ? _a2 : 60);
        const dimStufe = el2("dim-stufe");
        if (dimStufe) dimStufe.value = String(Math.round(((_b2 = konfig.dimStufe) != null ? _b2 : 0.3) * 100));
        const dimVor = el2("dim-vor");
        if (dimVor) dimVor.value = String((_c2 = konfig.dimVorMinuten) != null ? _c2 : 15);
        const tuer = el2("tuer-entity");
        if (tuer) tuer.value = konfig.tuer || "";
        const kamera = el2("kamera-entity");
        if (kamera) kamera.value = konfig.kamera || "";
        el2("schlaf-min").value = String(Math.round(konfig.schlafSekunden / 60));
        el2("label").checked = ui.label;
        schreibeSchalter();
        schreibeGesten();
        el2("form-fehler").textContent = "";
        el2("ha-token").placeholder = konfig.haToken ? t("ph.tokenReplace") : t("ph.tokenEmpty");
        const demoBox = el2("demo-an");
        if (demoBox) demoBox.checked = !!konfig.demo;
        const lockBox = el2("lock-an");
        if (lockBox) lockBox.checked = !!konfig.lockOn;
        const lockNeu = el2("lock-neu");
        if (lockNeu) lockNeu.hidden = !(lockBox == null ? void 0 : lockBox.checked);
        zeichneEigene();
        zeichneStates();
        schreibeDash();
        feldSetze(el2("sprache"), konfig.lang || "auto");
      }
      function zeichneEigene() {
        const wrap2 = el2("eigene-liste");
        if (!wrap2) return;
        wrap2.replaceChildren();
        for (const item of konfig.eigene || []) {
          const row = document.createElement("div");
          row.className = "eigene-zeile";
          const name = document.createElement("span");
          name.textContent = `${item.label} \xB7 ${item.ziel}`;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = t("custom.remove");
          btn.addEventListener("click", () => {
            konfig.eigene = (konfig.eigene || []).filter((eintrag) => eintrag.id !== item.id);
            konfig.gesten = normGesten(konfig.gesten, konfig.eigene);
            konfig.ecken = normEcken(konfig.ecken, konfig.eigene);
            speichereKonfig(konfig);
            zeichneEigene();
            baueGestenFelder();
            baueEckenFelder();
            schreibeGesten();
          });
          row.append(name, btn);
          wrap2.append(row);
        }
      }
      function merkeState(kurz) {
        var _a2, _b2;
        const color = el2(`st-${kurz}-color`);
        const item = {
          en: ((_a2 = el2(`st-${kurz}-en`)) == null ? void 0 : _a2.value) || "",
          de: ((_b2 = el2(`st-${kurz}-de`)) == null ? void 0 : _b2.value) || "",
          color: (color == null ? void 0 : color.dataset.custom) === "1" ? color.value : "",
          sound: feldWert(el2(`st-${kurz}-sound`)) || ""
        };
        konfig.states = normStates(__spreadProps(__spreadValues({}, konfig.states || {}), { [kurz]: item }));
        syncTip();
      }
      function zeichneStates() {
        var _a2, _b2, _c2;
        const wrap2 = el2("state-editor");
        if (!wrap2) return;
        wrap2.replaceChildren();
        for (const kurz of Object.keys(KURZ)) {
          const saved = ((_a2 = konfig.states) == null ? void 0 : _a2[kurz]) || {};
          const row = document.createElement("div");
          row.className = "state-row";
          const title = document.createElement("strong");
          title.textContent = stateLabel(locale, kurz);
          const grid = document.createElement("div");
          grid.className = "state-grid";
          const en = document.createElement("input");
          en.id = `st-${kurz}-en`;
          en.type = "text";
          en.value = saved.en || "";
          en.placeholder = ((_b2 = captionLine("en", kurz)) == null ? void 0 : _b2.text) || "";
          en.addEventListener("input", () => merkeState(kurz));
          const de = document.createElement("input");
          de.id = `st-${kurz}-de`;
          de.type = "text";
          de.value = saved.de || "";
          de.placeholder = ((_c2 = captionLine("de", kurz)) == null ? void 0 : _c2.text) || "";
          de.addEventListener("input", () => merkeState(kurz));
          const color = document.createElement("input");
          color.id = `st-${kurz}-color`;
          color.type = "color";
          color.value = saved.color || "#ff6a00";
          if (saved.color) color.dataset.custom = "1";
          color.addEventListener("input", () => {
            color.dataset.custom = "1";
            merkeState(kurz);
          });
          const sound = document.createElement("div");
          sound.id = `st-${kurz}-sound`;
          sound.className = "wahl";
          const original = document.createElement("button");
          original.type = "button";
          original.dataset.value = "";
          original.textContent = t("advanced.defaultSound");
          sound.append(original);
          for (const id of SOUND_IDS) {
            const opt = document.createElement("button");
            opt.type = "button";
            opt.dataset.value = id;
            opt.textContent = id;
            sound.append(opt);
          }
          ruesteWahl(sound, () => merkeState(kurz));
          feldSetze(sound, saved.sound || "");
          for (const [input, key] of [[en, "advanced.captionEn"], [de, "advanced.captionDe"], [color, "advanced.color"], [sound, "advanced.sound"]]) {
            const label = document.createElement("label");
            label.textContent = t(key);
            label.append(input);
            grid.append(label);
          }
          row.append(title, grid);
          wrap2.append(row);
        }
      }
      function syncStage() {
        document.body.classList.toggle("is-settings", einstellungenOffen);
        document.body.classList.toggle("is-phone", aktiveKlasse() === "phone");
        document.body.classList.toggle("stage-split", einstellungenOffen && stageQuery.matches && aktiveKlasse() !== "phone");
        const tip = el2("bot-tip");
        if (tip) tip.hidden = !document.body.classList.contains("stage-split");
        augenVorschau();
        syncTip();
      }
      function hilfeIcon() {
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.setAttribute("aria-hidden", "true");
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute("cx", "12");
        circle.setAttribute("cy", "12");
        circle.setAttribute("r", "8.25");
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", "currentColor");
        circle.setAttribute("stroke-width", "1.75");
        const path = document.createElementNS(ns, "path");
        path.setAttribute("fill", "currentColor");
        path.setAttribute("d", "M11 10.2h2V17h-2zM11 7h2v2h-2z");
        svg.append(circle, path);
        return svg;
      }
      function ruesteHilfe() {
        for (const a of document.querySelectorAll("a.ext-help")) {
          a.replaceChildren(hilfeIcon());
          a.addEventListener("click", (e) => e.stopPropagation());
        }
      }
      function klappeAbschnitte() {
        const telefon = aktiveKlasse() === "phone";
        for (const fs of document.querySelectorAll("#form-body > fieldset")) {
          if (fs.closest("details.abschnitt")) continue;
          const details = document.createElement("details");
          details.className = "abschnitt";
          details.open = !telefon;
          const summary = document.createElement("summary");
          const legend = fs.querySelector("legend");
          if (legend) {
            while (legend.firstChild) summary.appendChild(legend.firstChild);
            legend.remove();
          }
          details.appendChild(summary);
          fs.parentNode.insertBefore(details, fs);
          details.appendChild(fs);
        }
      }
      function augenVorschau() {
        const split = document.body.classList.contains("stage-split");
        const detail = document.body.classList.contains("detail");
        if (!split && !detail) {
          renderer.setPreview(null);
          return;
        }
        const w = window.innerWidth;
        const h = window.innerHeight;
        const size = Math.round(detail ? Math.min(w, h) * 0.34 : Math.min(w * 0.32, h * 0.46));
        const margin = 28;
        const x = Math.max(0, w - size - margin);
        const y = Math.max(0, h - size - margin);
        renderer.setPreview({ x, y, size });
        const root = document.documentElement.style;
        root.setProperty("--preview-x", `${x}px`);
        root.setProperty("--preview-y", `${y}px`);
        root.setProperty("--preview-size", `${size}px`);
      }
      function platziereAugen() {
        augenVorschau();
      }
      function syncTip(key) {
        var _a2;
        const tip = el2("bot-tip");
        if (!tip || !document.body.classList.contains("stage-split")) return;
        if (key) {
          tip.textContent = t(key);
          return;
        }
        if (vorschau || ablauf) {
          const kurz = ablauf ? KURZ_VON_CLIP[(_a2 = ablauf.c) == null ? void 0 : _a2.name] || bildKurz : bildKurz;
          const line = captionLine(locale, kurz, konfig.states);
          const detail = detailLine(locale, kurz);
          tip.textContent = [line == null ? void 0 : line.text, detail].filter(Boolean).join(" ");
          return;
        }
        tip.textContent = t("help.tip.ready");
      }
      function tipKey(node) {
        var _a2, _b2, _c2, _d2, _e2, _f2;
        const help = (_b2 = (_a2 = node == null ? void 0 : node.closest) == null ? void 0 : _a2.call(node, "[data-tip]")) == null ? void 0 : _b2.dataset.tip;
        if (help) return help;
        const id = (node == null ? void 0 : node.id) || "";
        if (id.startsWith("g-") || id.startsWith("eigene")) return "help.tip.gestures";
        if (id.startsWith("c-")) return "help.tip.corners";
        if (id.startsWith("sk-")) return "help.tip.commands";
        if (id.startsWith("ha-") || id === "media-entity" || id === "token-loeschen") return id === "media-entity" ? "help.tip.media" : "help.tip.ha";
        if (id === "ton" || id.startsWith("lock")) return id.startsWith("lock") ? "help.tip.security" : "help.tip.sound";
        if (id === "demo-an") return "help.tip.demo";
        if (id === "eck-groesse") return "help.tip.corners";
        if (id.startsWith("dash-") || ((_c2 = node == null ? void 0 : node.closest) == null ? void 0 : _c2.call(node, "#dash-group"))) return "help.tip.dashboard";
        if (id.startsWith("st-") || ((_d2 = node == null ? void 0 : node.closest) == null ? void 0 : _d2.call(node, "#advanced"))) return "help.tip.advanced";
        if ((_e2 = node == null ? void 0 : node.closest) == null ? void 0 : _e2.call(node, "#zust, #states-group")) return "help.tip.states";
        if ((_f2 = node == null ? void 0 : node.closest) == null ? void 0 : _f2.call(node, "fieldset")) return "help.tip.display";
        return "help.tip.ready";
      }
      function oeffneEinstellungen() {
        var _a2;
        if (blattOffen) schliesseBlatt();
        fuelleFormular();
        const panel = el2("einstellungen");
        panel.hidden = false;
        einstellungenOffen = true;
        vorschau = !!ablauf || schauLaeuft;
        if (!schauLaeuft) hideCaption();
        if (!ablauf && !schauLaeuft) {
          augen.set("03_idle");
          bildKurz = "settings";
        }
        syncStage();
        zeigeEinstSeite("");
        if (document.body.classList.contains("stage-split")) {
          el2("c").classList.add("is-nudge");
          if (konfig.ton) audio.unlock().then(() => playNudge(audio.context())).catch(() => {
          });
        }
        const gesperrt = konfig.lockOn && !entsperrt;
        const gate = el2("lock-gate");
        const body = el2("form-body");
        if (gate) gate.hidden = !gesperrt;
        if (body) body.hidden = gesperrt;
        audio.unlock().then(() => {
          playSettingsChime(audio.context());
          syncSoundHint();
        }).catch(() => {
        });
        requestAnimationFrame(() => panel.classList.add("is-open"));
        (_a2 = gesperrt ? el2("lock-pin") : el2("schliessen")) == null ? void 0 : _a2.focus();
        syncRuhe();
      }
      function schliesseEinstellungen() {
        const back = letzterKurz;
        const geschoben = document.body.classList.contains("stage-split");
        const panel = el2("einstellungen");
        panel.classList.remove("is-open");
        einstellungenOffen = false;
        entsperrt = false;
        vorschau = false;
        syncStage();
        if (geschoben) {
          el2("c").classList.add("is-sigh");
          if (konfig.ton) audio.unlock().then(() => playSigh(audio.context())).catch(() => {
          });
        }
        const fertig = () => {
          if (panel.classList.contains("is-open")) return;
          panel.hidden = true;
        };
        const ende = (ev) => {
          if (ev && ev.target !== panel) return;
          panel.removeEventListener("transitionend", ende);
          fertig();
        };
        panel.addEventListener("transitionend", ende);
        setTimeout(fertig, 360);
        if (!konfig.demo) {
          stopAblauf();
          if (schauLaeuft || schauFest) stoppeSchau();
          else wendeZustand(back || "idle", { ton: false, erzwingen: true });
        }
        if (jetztText) zeigeZeile("track", { halten: true });
        else if (konfig.caption && letzterKurz !== "idle") showCaption(letzterKurz);
        else scheduleBored();
        syncRuhe();
      }
      function speichern(event) {
        return __async(this, null, function* () {
          var _a2, _b2, _c2, _d2, _e2;
          event.preventDefault();
          const fehler = el2("form-fehler");
          const urlRoh = el2("ha-url").value.trim();
          const url = urlRoh ? normalisiereHaUrl(urlRoh) : "";
          if (urlRoh && urlRoh !== "mock" && !url) {
            fehler.textContent = t("err.url");
            return;
          }
          const entity2 = el2("ha-entity").value.trim().toLowerCase();
          if (entity2 && !gueltigeEntity(entity2)) {
            fehler.textContent = t("err.entity");
            return;
          }
          const media = el2("media-entity").value.trim().toLowerCase();
          if (media && !gueltigeEntity(media)) {
            fehler.textContent = t("err.entity");
            return;
          }
          const tuerId = el2("tuer-entity") ? el2("tuer-entity").value.trim().toLowerCase() : konfig.tuer;
          if (tuerId && !gueltigeEntity(tuerId)) {
            fehler.textContent = t("err.entity");
            return;
          }
          const kameraIdFeld = el2("kamera-entity") ? el2("kamera-entity").value.trim().toLowerCase() : konfig.kamera;
          if (kameraIdFeld && !gueltigeEntity(kameraIdFeld)) {
            fehler.textContent = t("err.entity");
            return;
          }
          const lockWanted = !!((_a2 = el2("lock-an")) == null ? void 0 : _a2.checked);
          const pin = ((_b2 = el2("lock-neu-pin")) == null ? void 0 : _b2.value) || "";
          const again = ((_c2 = el2("lock-neu-wieder")) == null ? void 0 : _c2.value) || "";
          if (lockWanted && (pin || again || !konfig.lockHash)) {
            if (pin.length < 4) {
              fehler.textContent = t("security.short");
              return;
            }
            if (pin !== again) {
              fehler.textContent = t("security.mismatch");
              return;
            }
          }
          const gesperrt = demoSperre(location.hostname);
          const tokenLoeschen = gesperrt || !!((_d2 = el2("token-loeschen")) == null ? void 0 : _d2.checked);
          if (!gesperrt) {
            konfig.haUrl = url;
            konfig.haEntity = entity2;
            konfig.mediaEntity = media;
            if (tokenLoeschen) konfig.haToken = "";
            else if (el2("ha-token").value.trim()) konfig.haToken = el2("ha-token").value.trim();
            konfig.scriptMusikAn = el2("sk-musik-an").value.trim().toLowerCase();
            konfig.scriptMusikAus = el2("sk-musik-aus").value.trim().toLowerCase();
            konfig.scriptLichtAn = el2("sk-licht-an").value.trim().toLowerCase();
            konfig.scriptLichtAus = el2("sk-licht-aus").value.trim().toLowerCase();
          }
          konfig.schlafSekunden = Math.max(0, Math.round(+el2("schlaf-min").value * 60) || 0);
          konfig.ton = el2("ton").checked;
          konfig.label = el2("label").checked;
          konfig.caption = el2("caption-an").checked;
          konfig.uhr = el2("uhr-an").checked;
          konfig.nowPlaying = el2("np-an").checked;
          konfig.demo = !!((_e2 = el2("demo-an")) == null ? void 0 : _e2.checked);
          if (lockWanted && (pin || again || !konfig.lockHash)) {
            konfig.lockSalt = newSalt();
            konfig.lockHash = yield hashLock(pin, konfig.lockSalt);
            konfig.lockOn = true;
          } else if (!lockWanted) {
            konfig.lockOn = false;
            konfig.lockSalt = "";
            konfig.lockHash = "";
          }
          if (el2("lock-neu-pin")) el2("lock-neu-pin").value = "";
          if (el2("lock-neu-wieder")) el2("lock-neu-wieder").value = "";
          konfig.modus = feldWert(el2("modus")) || renderer.mode;
          const lichtWahl = feldWert(el2("licht-profil"));
          if (lichtWahl === "ruhig" || lichtWahl === "lebhaft") konfig.lichtProfil = lichtWahl;
          const alarmWahl = feldWert(el2("alarm-staerke"));
          konfig.alarmStaerke = alarmWahl === "normal" ? "normal" : "stark";
          setAlarmStaerke(konfig.alarmStaerke);
          konfig.gesten = leseGesten();
          konfig.ecken = leseEcken();
          if (!gesperrt) konfig.dash = leseDash();
          const eckFeld = el2("eck-groesse");
          if (eckFeld) {
            const n = Math.round(Number(eckFeld.value));
            konfig.eckGroesse = n >= 96 && n <= 160 ? n : 128;
          }
          if (!gesperrt) {
            konfig.tuer = tuerId && gueltigeEntity(tuerId) ? tuerId : "";
            konfig.kamera = kameraIdFeld && gueltigeEntity(kameraIdFeld) ? kameraIdFeld : "";
          }
          tuerStand = null;
          if (el2("dim-nach")) konfig.dimNachSekunden = Math.max(0, Math.min(3600, Math.round(+el2("dim-nach").value) || 0));
          if (el2("dim-stufe")) konfig.dimStufe = Math.max(0.05, Math.min(1, (Math.round(+el2("dim-stufe").value) || 30) / 100));
          if (el2("dim-vor")) konfig.dimVorMinuten = Math.max(0, Math.min(180, Math.round(+el2("dim-vor").value) || 0));
          const gewaehlt = feldWert(el2("sprache"));
          konfig.lang = gewaehlt === "auto" ? "" : gewaehlt;
          locale = resolveLocale({ stored: konfig.lang, nav: navigator.language });
          ui.label = konfig.label;
          audio.setTon(konfig.ton);
          waechter.setNach(konfig.schlafSekunden);
          setModus(konfig.modus);
          speichereKonfig(konfig, void 0, { tokenLoeschen });
          applyI18n();
          schreibeSchalter();
          syncUhr();
          syncSoundHint();
          el2("ha-token").value = "";
          starteHa();
          syncEck();
          syncDemoHinweis();
          if (dashOffen) {
            dashEvents = {};
            ladeDashDaten();
            syncDash();
          }
          if (konfig.demo && !schauLaeuft) starteSchau();
          if (!konfig.demo && (schauLaeuft || schauFest)) stoppeSchau();
          if (!konfig.demo && ablauf) stopAblauf();
          if (!konfig.nowPlaying && jetztText !== DEMO_LINE) setTrack("");
          else if (medienZustand) onMedien(medienZustand);
          schliesseEinstellungen();
          if (konfig.caption && letzterKurz === "idle" && !jetztText) scheduleBored();
        });
      }
      function onDashStates(liste2) {
        if (!liste2) return;
        for (const e of liste2) {
          dashStates[e.entity_id] = e;
          if (konfig.tuer && e.entity_id === konfig.tuer) {
            const neu = e.state;
            if (tuerKante(tuerStand, neu)) gruesse();
            tuerStand = neu;
          }
        }
        if (dashOffen) syncDash();
      }
      function kameraId() {
        if (konfig.kamera) return konfig.kamera;
        if (demoBesuch(konfig, location, q)) return "camera.courtyard";
        return "";
      }
      function uhrText() {
        const loc = locale === "de" ? "de-DE" : "en-GB";
        try {
          return new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(/* @__PURE__ */ new Date());
        } catch (e) {
          const d = /* @__PURE__ */ new Date();
          return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        }
      }
      function titelTeile(text) {
        const raw = String(text || "");
        const cut = raw.indexOf(", ");
        if (cut < 0) return { title: raw, artist: "" };
        return { title: raw.slice(0, cut), artist: raw.slice(cut + 2) };
      }
      function dashModell() {
        return baueDashboard(dashStates, konfig.dash, { events: dashEvents, forecast: dashForecast, jetzt: /* @__PURE__ */ new Date() });
      }
      function syncDash() {
        const body = el2("dash-body");
        const when = el2("dash-when");
        if (!body || !dashOffen) return;
        const model = dashModell();
        if (when) {
          const jetzt = /* @__PURE__ */ new Date();
          when.textContent = jetzt.toLocaleString(locale === "de" ? "de" : "en", { weekday: "short", hour: "2-digit", minute: "2-digit" });
        }
        zeichneDashboard(body, model, t, (knopf2) => {
          if (knopf2 && knopf2.ziel) ha == null ? void 0 : ha.callScript(knopf2.ziel);
          if (knopf2 && knopf2.kind === "guard" && konfig.dash.guard && dashStates[konfig.dash.guard]) {
            dashStates[konfig.dash.guard] = __spreadProps(__spreadValues({}, dashStates[konfig.dash.guard]), { state: knopf2.on ? "off" : "on" });
            syncDash();
          }
        });
        syncKamera();
        if (detailArt === "day") syncTag(model);
        if (detailArt === "music") syncMusikPanel();
        if (document.body.classList.contains("use-stapel")) zeichneStapel();
      }
      function syncKamera() {
        const cam = el2("cam");
        if (!cam) return;
        const id = kameraId();
        const zeigen = detailArt === "home" && !!id;
        cam.hidden = !zeigen;
        if (!zeigen) return;
        const stand = dashStates[id];
        const name = el2("cam-name");
        const freund = stand && stand.attributes && stand.attributes.friendly_name;
        if (name) name.textContent = freund || (id.endsWith("courtyard") ? t("cam.courtyard") : id);
        const bild = stand && stand.attributes && stand.attributes.entity_picture;
        const img = el2("cam-img");
        const view = el2("cam-view");
        if (img && typeof bild === "string" && /^https?:/i.test(bild)) {
          img.hidden = false;
          img.src = bild;
          if (view) view.hidden = true;
          const gross = el2("cam-zoom-img");
          const grossView = el2("cam-zoom-view");
          if (gross) {
            gross.hidden = false;
            gross.src = bild;
          }
          if (grossView) grossView.hidden = true;
        }
      }
      function syncTag(model) {
        const clock = el2("day-clock");
        if (clock) clock.textContent = uhrText();
        const liste2 = el2("day-events");
        if (!liste2) return;
        const quelle = model || dashModell();
        const heute = (quelle.events || []).filter((ev) => ev.when === "today");
        liste2.replaceChildren();
        if (!heute.length) {
          const li = document.createElement("li");
          li.textContent = t("day.empty");
          liste2.appendChild(li);
          return;
        }
        for (const ev of heute) {
          const li = document.createElement("li");
          li.textContent = ev.time ? `${ev.time}  ${ev.summary}` : ev.summary;
          liste2.appendChild(li);
        }
      }
      function syncMusikPanel() {
        const teile = titelTeile(jetztText || (!konfig.mediaEntity && musikAn ? DEMO_LINE : ""));
        const title = el2("np-title");
        const artist = el2("np-artist");
        if (title) title.textContent = teile.title || t("display.nowPlaying");
        if (artist) artist.textContent = teile.artist;
        const play = el2("np-play");
        if (play) play.textContent = medienState === "playing" || demoMusik.playing ? t("np.pause") : t("np.play");
        const cover = el2("np-cover");
        const bild = medienAttr && medienAttr.entity_picture;
        if (cover && typeof bild === "string" && /^https?:/i.test(bild)) cover.style.backgroundImage = `url("${bild}")`;
        const wrap2 = el2("np-up");
        const liste2 = el2("np-queue");
        if (!wrap2 || !liste2) return;
        npEintraege = naechsteEintraege(medienAttr);
        liste2.replaceChildren();
        wrap2.hidden = npEintraege.length === 0;
        for (let i = 0; i < npEintraege.length; i++) {
          const li = document.createElement("li");
          const btn = document.createElement("button");
          btn.type = "button";
          btn.dataset.i = String(i);
          btn.textContent = npEintraege[i].label;
          li.appendChild(btn);
          liste2.appendChild(li);
        }
      }
      function spieleNaechstes(eintrag) {
        if (!eintrag || !konfig.mediaEntity || !ha || !ha.callService) return;
        const ziel = konfig.mediaEntity;
        if (eintrag.art === "source") ha.callService(`media_player.select_source/${ziel}`, { source: eintrag.source });
        else ha.callService(`media_player.play_media/${ziel}`, { media_content_id: eintrag.contentId, media_content_type: eintrag.contentType || "music" });
        bestaetige();
      }
      function ladeDashDaten() {
        return __async(this, null, function* () {
          if (!ha || !ha.anfragen) return;
          const ids = [];
          const dash = konfig.dash || {};
          for (const id of dash.calendars || []) ids.push(id);
          for (const id of dash.waste || []) if (String(id).startsWith("calendar.")) ids.push(id);
          const start = /* @__PURE__ */ new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date(start.getTime() + 2 * 864e5);
          const startIso = start.toISOString();
          const endIso = end.toISOString();
          for (const id of ids) {
            const res = yield ha.anfragen(kalenderNachricht(id, startIso, endIso));
            dashEvents[id] = ereignisseAus(res, id);
          }
          if (dash.weather) {
            const res = yield ha.anfragen(wetterNachricht(dash.weather));
            const block = res && (res.service_response && res.service_response[dash.weather] || res[dash.weather]);
            dashForecast = block && block.forecast ? block.forecast : null;
          }
          if (dashOffen) syncDash();
        });
      }
      function zeigeDetail(art) {
        detailArt = art;
        const home = el2("home-panel");
        const music = el2("music-panel");
        const day = el2("day-panel");
        if (home) home.hidden = art !== "home";
        if (music) music.hidden = art !== "music";
        if (day) day.hidden = art !== "day";
        const back = el2("day-back");
        if (back) back.hidden = art !== "day";
        if (art === "music") syncMusikPanel();
        if (art === "day" || art === "home") syncDash();
      }
      function oeffneDetail(art) {
        if (einstellungenOffen) schliesseEinstellungen();
        if (blattOffen) schliesseBlatt();
        dashOffen = true;
        detailArt = art;
        stapelWunsch = art;
        lookTX = -0.35;
        lookTY = 0.08;
        document.body.classList.add("dash", "detail", "use-stapel");
        const panel = el2("dash");
        const bot = el2("dash-bot");
        const stapel = el2("stapel");
        if (panel) panel.hidden = false;
        if (bot) bot.hidden = false;
        if (stapel) stapel.hidden = false;
        zeigeDetail(art);
        zeichneStapel();
        ladeDashDaten();
        platziereAugen();
        syncEckTreffer();
        waechter.beruehrt();
      }
      function oeffneDash() {
        ansicht = "home";
        oeffneDetail("home");
      }
      function schliesseDash() {
        if (!dashOffen && !detailArt) return;
        dashOffen = false;
        detailArt = "";
        clearTimeout(timerZeichnen);
        document.body.classList.remove("dash", "detail", "use-stapel");
        kameraZoom(false);
        for (const id of ["dash", "dash-close", "dash-bot", "day-back", "home-panel", "music-panel", "day-panel", "stapel"]) {
          const node = el2(id);
          if (node) node.hidden = true;
        }
        syncEckTreffer();
        platziereAugen();
      }
      let timerZeichnen = 0;
      let stapelWunsch = "";
      function stapelKontext() {
        const teile = titelTeile(jetztText || (!konfig.mediaEntity && musikAn ? DEMO_LINE : ""));
        const bild = medienAttr && medienAttr.entity_picture;
        return {
          dash: konfig.dash,
          states: dashStates,
          model: dashModell(),
          forecast: dashForecast,
          locale,
          t,
          jetzt: /* @__PURE__ */ new Date(),
          jetztMs: Date.now(),
          uhr: uhrText(),
          version: VERSION,
          mediaEntity: konfig.mediaEntity,
          scriptMusikAn: konfig.scriptMusikAn,
          scriptMusikAus: konfig.scriptMusikAus,
          titel: teile.title,
          interpret: teile.artist,
          quelle: medienAttr && (medienAttr.media_album_name || medienAttr.app_name || medienAttr.source || ""),
          cover: typeof bild === "string" && /^https?:/i.test(bild) ? bild : "",
          spielt: medienState === "playing" || demoMusik.playing,
          musikAn,
          naechste: npEintraege || [],
          stateName: stateLabel(locale, letzterKurz),
          seit: seitText(),
          verbindung: statusText(),
          verbunden: haStatus === "verbunden" || haStatus === "mock",
          befehl: befehlText(),
          caption: konfig.caption,
          ton: konfig.ton,
          clockOn: konfig.uhr,
          nowPlaying: konfig.nowPlaying,
          modus: renderer.mode,
          lang: konfig.lang || locale,
          onAction: stapelAktion
        };
      }
      function zeichneStapel() {
        const host = el2("stapel-inhalt");
        if (!host || !dashOffen) return;
        syncMusikPanel();
        const ctx = stapelKontext();
        const liste2 = sichtbareAnsichten(ctx);
        if (!liste2.length) return;
        const name = liste2.includes(stapelWunsch) ? stapelWunsch : liste2.includes(detailArt) ? detailArt : liste2[0];
        detailArt = name;
        stapelWunsch = name;
        zeichneAnsicht(host, name, ctx);
        clearTimeout(timerZeichnen);
        if (name === "timer") timerZeichnen = setTimeout(() => {
          if (dashOffen && detailArt === "timer") zeichneStapel();
        }, 1e3);
      }
      function schrittStapel(dir) {
        const liste2 = sichtbareAnsichten(stapelKontext());
        const i = liste2.indexOf(detailArt);
        if (i < 0 || liste2.length < 2) return;
        stapelWunsch = liste2[(i + dir + liste2.length) % liste2.length];
        detailArt = stapelWunsch;
        zeichneStapel();
      }
      function stapelAktion(aktion) {
        if (!aktion) return;
        if (aktion.type === "guard") {
          const ziel = konfig.dash && konfig.dash.guardToggle;
          if (ziel) ha == null ? void 0 : ha.callScript(ziel);
          const id = konfig.dash && konfig.dash.guard;
          if (id && dashStates[id]) {
            dashStates[id] = __spreadProps(__spreadValues({}, dashStates[id]), { state: dashStates[id].state === "on" ? "off" : "on" });
          }
          bestaetige();
          zeichneStapel();
          return;
        }
        if (aktion.type === "timer") {
          if (aktion.delta) timerAdd(aktion.delta);
          else timerStop();
          zeichneStapel();
          return;
        }
        if (aktion.type === "music") {
          if (aktion.which === "prev") musikBefehl("media_previous_track");
          else if (aktion.which === "next") musikBefehl("media_next_track");
          else if (aktion.which === "play") musikBefehl("media_play_pause");
          else if (aktion.which === "toggle") musikUmschalten();
          else if (aktion.which === "queue" && npEintraege[aktion.index]) spieleNaechstes(npEintraege[aktion.index]);
          return;
        }
        if (aktion.type === "toggle") {
          if (aktion.key === "caption") konfig.caption = !konfig.caption;
          if (aktion.key === "ton") {
            konfig.ton = !konfig.ton;
            audio.setTon(konfig.ton);
          }
          if (aktion.key === "uhr") konfig.uhr = !konfig.uhr;
          if (aktion.key === "np") konfig.nowPlaying = !konfig.nowPlaying;
          speichereKonfig(konfig);
          schreibeSchalter();
          syncUhr();
          bestaetige();
          zeichneStapel();
          return;
        }
        if (aktion.type === "mode") {
          konfig.modus = aktion.value;
          setModus(aktion.value);
          speichereKonfig(konfig);
          bestaetige();
          zeichneStapel();
          return;
        }
        if (aktion.type === "lang") {
          konfig.lang = aktion.value;
          locale = resolveLocale({ stored: konfig.lang, nav: navigator.language });
          speichereKonfig(konfig);
          applyI18n();
          zeichneStapel();
          return;
        }
        if (aktion.type === "settings") {
          schliesseDash();
          oeffneEinstellungen();
          return;
        }
        if (aktion.type === "demo") starteSchau();
      }
      function syncEckTreffer() {
        const box = el2("eck-treffer");
        if (!box) return;
        const an = document.body.classList.contains("detail");
        box.hidden = !an;
        const knoepfe2 = box.querySelectorAll("[data-eck]");
        for (let i = 0; i < knoepfe2.length; i++) {
          const btn = knoepfe2[i];
          const key = btn.getAttribute("data-eck");
          const aktion = konfig.ecken && konfig.ecken[key] && konfig.ecken[key].tap;
          const leer = !aktion || aktion.art === "none";
          btn.style.pointerEvents = !an || leer && key !== "tl" ? "none" : "auto";
        }
      }
      function kameraZoom(an) {
        const z = el2("cam-zoom");
        if (z) z.hidden = !an;
      }
      function normalesBild() {
        clearTimeout(musikRuheTimer);
        musikRuheTimer = 0;
        ansicht = "normal";
        schliesseDash();
      }
      function oeffneMusikAnsicht() {
        if (schauLaeuft) return;
        if (letzterKurz !== "musik_an") wendeZustand("musik_an", { ton: true, erzwingen: true });
        ansicht = "music";
        if (dashOffen && detailArt === "music") {
          syncMusikPanel();
          return;
        }
        oeffneDetail("music");
      }
      function planeMusikRuhe(state, quelle) {
        if (wiedergabeLaeuft(state)) {
          clearTimeout(musikRuheTimer);
          musikRuheTimer = 0;
          return;
        }
        if (ansicht !== "music" || !konfig.mediaEntity || quelle === "snapshot" || musikRuheTimer) return;
        musikRuheTimer = setTimeout(() => {
          musikRuheTimer = 0;
          if (ansicht === "music" && !wiedergabeLaeuft(medienState)) normalesBild();
        }, MUSIK_RUHE_MS);
      }
      function toggleHome() {
        if (ansicht === "home") {
          normalesBild();
          bestaetige();
          return;
        }
        ansicht = "home";
        if (dashOffen) schliesseDash();
        bestaetige();
      }
      function toggleMusik() {
        if (ansicht === "music") {
          normalesBild();
          if (musikAn) musikUmschalten();
          else bestaetige();
          return;
        }
        ansicht = "music";
        if (dashOffen && detailArt !== "music") schliesseDash();
        if (!musikAn) musikUmschalten();
        else bestaetige();
      }
      function starteTag() {
        ansicht = "day";
        oeffneDetail("day");
      }
      function wischRechts() {
        if (ansicht === "music" || ansicht === "home") {
          oeffneDetail(ansicht);
          return true;
        }
        return false;
      }
      function bestaetige() {
        const farbe = augen.ring && augen.ring[0] || [255, 236, 214];
        renderer.acknowledge(farbe);
        if (!konfig.ton) return;
        audio.unlock().then(() => playAck(audio.context())).catch(() => {
        });
      }
      function gruesse() {
        wendeZustand("hallo", { ton: true, erzwingen: true });
        if (!konfig.ton) return;
        audio.unlock().then(() => playChirps(audio.context())).catch(() => {
        });
      }
      function syncDim(dt) {
        const node = el2("dim");
        if (!node) return;
        const normal = ansicht === "normal" && !einstellungenOffen && !blattOffen && !dashOffen && !schauFest && !schauLaeuft;
        let ziel = 1;
        if (normal) {
          ziel = helligkeit(waechter.ruhe(), konfig.schlafSekunden, konfig);
          if (waechter.schlaeft) ziel = Math.min(ziel, konfig.dimStufe || 0.3);
        }
        dimIst += (ziel - dimIst) * Math.min(1, (dt || 0.016) * 2);
        node.style.opacity = String(Math.max(0, Math.min(0.92, 1 - dimIst)));
      }
      function sprungSchau(schritt) {
        wendeZustand(schritt.kurz, { ton: true, erzwingen: true });
        if (schritt.musik) {
          musikAn = true;
          syncDemoTrack();
        }
      }
      function starteSchau() {
        clearTimeout(schauTimer);
        schauTimer = 0;
        schauFest = false;
        stopAblauf();
        konfig.demo = true;
        if (einstellungenOffen) schliesseEinstellungen();
        if (blattOffen) schliesseBlatt();
        if (dashOffen) schliesseDash();
        if (ansicht !== "normal") normalesBild();
        schauLaeuft = true;
        schauIndex = 0;
        schauSeit = performance.now();
        waechter.setPause(true);
        const box = el2("demo-an");
        if (box) box.checked = true;
        sprungSchau(demoSchritt(0));
      }
      function tickSchau(now) {
        if (!schauLaeuft) return;
        const schritt = demoSchritt(schauIndex);
        if (now - schauSeit < schritt.ms) return;
        if (schritt.musik) {
          musikAn = false;
          if (demoMusik.playing) demoMusik.stop();
          if (jetztText === DEMO_LINE) setTrack("");
        }
        schauIndex = schritt.naechster;
        schauSeit = now;
        sprungSchau(demoSchritt(schauIndex));
      }
      function stoppeSchau(zurueck) {
        clearTimeout(schauTimer);
        schauTimer = 0;
        const war = schauFest || schauLaeuft;
        schauFest = false;
        schauLaeuft = false;
        if (zurueck === false) return;
        if (!war) return;
        musikAn = false;
        if (demoMusik.playing) demoMusik.stop();
        if (jetztText === DEMO_LINE) setTrack("");
        waechter.setPause(false);
        normalesBild();
        wendeZustand("idle", { ton: false, erzwingen: true });
        syncStoerung();
      }
      function zeigeZonenKurz() {
        const z = el2("zonen");
        if (!z) return;
        z.hidden = false;
        clearTimeout(zonenTimer);
        zonenTimer = setTimeout(() => {
          if (param("zones", "zonen") !== "1") z.hidden = true;
        }, 2200);
      }
      function listeFeld(id) {
        const node = el2(id);
        return node ? node.value : "";
      }
      function schreibeDash() {
        const d = konfig.dash || normDash(null);
        const set = (id, wert) => {
          const node = el2(id);
          if (node) node.value = wert;
        };
        set("dash-weather", d.weather || "");
        set("dash-temp", d.outdoorTemp || "");
        set("dash-cal", (d.calendars || []).join(", "));
        set("dash-waste", (d.waste || []).join(", "));
        set("dash-windows", (d.windows || []).join(", "));
        set("dash-indoor", (d.indoor || []).join(", "));
        set("dash-rain", d.rain || "");
        set("dash-wind", d.wind || "");
        set("dash-bright", d.brightness || "");
        set("dash-alloff", d.allOff || "");
        set("dash-guard-toggle", d.guardToggle || "");
        set("dash-guard", d.guard || "");
        set("dash-contacts", d.contacts || "");
        set("dash-groups", (d.contactGroups || []).join(", "));
        set("dash-energy", d.energyPv || "");
        set("dash-energy-day", d.energyDay || "");
        set("dash-energy-grid", d.energyGrid || "");
        set("dash-energy-feed", d.energyFeed || "");
        set("dash-energy-auto", d.energyAutonomy || "");
        set("dash-buttons", (d.buttons || []).map((b) => `${b.label}|${b.ziel}`).join("\n"));
        const eck = el2("eck-groesse");
        if (eck) eck.value = String(konfig.eckGroesse || 128);
      }
      function leseDash() {
        if (!el2("dash-weather")) return konfig.dash;
        return normDash({
          weather: listeFeld("dash-weather"),
          outdoorTemp: listeFeld("dash-temp"),
          calendars: listeFeld("dash-cal"),
          waste: listeFeld("dash-waste"),
          windows: listeFeld("dash-windows"),
          indoor: listeFeld("dash-indoor"),
          rain: listeFeld("dash-rain"),
          wind: listeFeld("dash-wind"),
          brightness: listeFeld("dash-bright"),
          allOff: listeFeld("dash-alloff"),
          guardToggle: listeFeld("dash-guard-toggle"),
          guard: listeFeld("dash-guard"),
          contacts: listeFeld("dash-contacts"),
          contactsHeaderAttr: konfig.dash ? konfig.dash.contactsHeaderAttr : "header",
          contactGroups: listeFeld("dash-groups"),
          wasteTomorrow: konfig.dash ? konfig.dash.wasteTomorrow : "",
          energyPv: listeFeld("dash-energy"),
          energyDay: listeFeld("dash-energy-day"),
          energyGrid: listeFeld("dash-energy-grid"),
          energyFeed: listeFeld("dash-energy-feed"),
          energyAutonomy: listeFeld("dash-energy-auto"),
          coldC: konfig.dash ? konfig.dash.coldC : void 0,
          buttons: listeFeld("dash-buttons")
        });
      }
      function starteHa() {
        ha == null ? void 0 : ha.stop();
        ha = null;
        dashStates = {};
        dashEvents = {};
        dashForecast = null;
        if (q.get("ha") === "mock" || demoBesuch(konfig, location, q)) {
          ha = mockHa(eingang, setStatus, onMedien, {
            onStates: onDashStates,
            states: mockZustaende(),
            events: mockEreignisse()
          });
          return;
        }
        if (!konfig.haUrl) {
          setStatus({ status: "aus" });
          return;
        }
        if (!konfig.haToken) {
          setStatus({ status: "aus", meldung: "tokenMissing" });
          return;
        }
        if (!gueltigeEntity(konfig.haEntity)) {
          setStatus({ status: "aus", meldung: "entityMissingConfig" });
          return;
        }
        ha = verbindeHa({
          url: konfig.haUrl,
          token: konfig.haToken,
          entityId: konfig.haEntity,
          mediaEntity: konfig.mediaEntity,
          onZustand: eingang,
          onMedien,
          onStatus: setStatus,
          onStates: onDashStates
        });
      }
      let wake = null;
      function wachHalte() {
        return __async(this, null, function* () {
          var _a2;
          if (!("wakeLock" in navigator)) return;
          try {
            wake = yield navigator.wakeLock.request("screen");
            (_a2 = wake.addEventListener) == null ? void 0 : _a2.call(wake, "release", () => {
              wake = null;
            });
          } catch (e) {
          }
        });
      }
      function vollbild() {
        return __async(this, null, function* () {
          var _a2, _b2, _c2, _d2;
          try {
            if (!document.fullscreenElement) yield (_b2 = (_a2 = document.documentElement).requestFullscreen) == null ? void 0 : _b2.call(_a2);
          } catch (e) {
          }
          try {
            yield (_d2 = (_c2 = screen.orientation) == null ? void 0 : _c2.lock) == null ? void 0 : _d2.call(_c2, "landscape");
          } catch (e) {
          }
          yield wachHalte();
        });
      }
      function gesteFreigeben() {
        return __async(this, null, function* () {
          var _a2, _b2;
          try {
            yield audio.unlock();
          } catch (e) {
          }
          yield wachHalte();
          try {
            yield (_b2 = (_a2 = screen.orientation) == null ? void 0 : _a2.lock) == null ? void 0 : _b2.call(_a2, "landscape");
          } catch (e) {
          }
          syncSoundHint();
        });
      }
      const cv = el2("c");
      let ptr = null;
      let longTimer = 0;
      onZeiger(cv, "down", (e) => {
        if (e.preventDefault) e.preventDefault();
        if (einstellungenOffen) {
          if (document.body.classList.contains("stage-split")) {
            blinkAt = performance.now() / 1e3;
            kitzeln();
          }
          return;
        }
        if (blattOffen || ptr) return;
        const ecke = eckHier(e.clientX, e.clientY);
        ptr = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), id: e.pointerId, gehalten: false, ecke, schau: schauLaeuft || schauFest };
        try {
          cv.setPointerCapture(e.pointerId);
        } catch (e2) {
        }
        clearTimeout(longTimer);
        longTimer = setTimeout(() => {
          if (!ptr) return;
          ptr.gehalten = true;
          if (ptr.ecke === "tl") adminTaps.abbruch();
          if (waechter.schlaeft) {
            aufwachen();
            return;
          }
          if (ptr.ecke) {
            blitz(ptr.ecke);
            fuehreAktion(konfig.ecken[ptr.ecke].hold);
          } else fuehreAktion(konfig.gesten.long);
        }, HALTEN_MS);
      });
      onZeiger(cv, "move", (e) => {
        if (e.preventDefault) e.preventDefault();
        if (!ptr || e.pointerId !== ptr.id) return;
        ptr.lx = e.clientX;
        ptr.ly = e.clientY;
        if (Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y) > 24) clearTimeout(longTimer);
      });
      onZeiger(cv, "up", (e) => __async(null, null, function* () {
        if (!ptr || e.pointerId !== ptr.id) return;
        clearTimeout(longTimer);
        const start = ptr;
        ptr = null;
        yield gesteFreigeben();
        if (start.schau) {
          stoppeSchau();
          return;
        }
        if (start.gehalten || einstellungenOffen || blattOffen) return;
        let endX = e.clientX;
        let endY = e.clientY;
        if (endX === 0 && endY === 0) {
          endX = start.lx;
          endY = start.ly;
        }
        const dx = endX - start.x;
        const dy = endY - start.y;
        const richtung = wischAktion(dx, dy, start.y, window.innerHeight, safeInset().b);
        if (richtung === "settings") {
          if (start.ecke === "tl") adminTaps.abbruch();
          oeffneEinstellungen();
          return;
        }
        if (richtung) {
          if (start.ecke === "tl") adminTaps.abbruch();
          if (dashOffen && start.x < window.innerWidth / 2) {
            if (richtung === "left") {
              schliesseDash();
              return;
            }
            if (aktiveKlasse() !== "phone" && richtung === "up") {
              schrittStapel(1);
              return;
            }
            if (aktiveKlasse() !== "phone" && richtung === "down") {
              schrittStapel(-1);
              return;
            }
          }
          if (richtung === "right" && wischRechts()) return;
          fuehreAktion(konfig.gesten[richtung]);
          return;
        }
        const ecke = eckHier(endX, endY);
        if (start.ecke && start.ecke === ecke && Math.hypot(dx, dy) < 24) {
          if (ecke === "tl") {
            adminTaps.tipp(performance.now(), () => {
              blitz("tl");
              if (waechter.schlaeft) aufwachen();
              oeffneEinstellungen();
            }, () => {
              if (waechter.schlaeft) aufwachen();
              else {
                blitz("tl");
                fuehreAktion(konfig.ecken.tl.tap);
              }
            });
          } else if (waechter.schlaeft) aufwachen();
          else {
            blitz(ecke);
            fuehreAktion(konfig.ecken[ecke].tap);
          }
          return;
        }
        if (waechter.schlaeft) {
          aufwachen();
          return;
        }
        const zone = zoneFuer(endX, endY, window.innerWidth, window.innerHeight, konfig.eckGroesse || 128, safeInset());
        if (zone) feuereBefehl(zone);
        else waechter.beruehrt();
      }));
      onZeiger(cv, "cancel", () => {
        ptr = null;
        clearTimeout(longTimer);
      });
      function passivFalsch(target, name, fn) {
        let modern = false;
        try {
          const probe = {};
          Object.defineProperty(probe, "passive", { get() {
            modern = true;
            return false;
          } });
          window.addEventListener("passive-probe", null, probe);
          window.removeEventListener("passive-probe", null, probe);
        } catch (e) {
          modern = false;
        }
        if (modern) target.addEventListener(name, fn, { passive: false });
        else target.addEventListener(name, fn);
      }
      passivFalsch(document, "touchstart", (e) => {
        const t2 = e.touches && e.touches[0];
        if (!t2 || e.touches.length !== 1) return;
        const node = e.target;
        if (node && node.closest && node.closest("#einstellungen, #sheet, #dash-card, #credits-card, #day-back, #cam-zoom, #info-ecke")) return;
        if (t2.clientX > 28 && t2.clientX < window.innerWidth - 28) return;
        if (e.cancelable) e.preventDefault();
      });
      passivFalsch(cv, "touchmove", (e) => {
        if (e.cancelable) e.preventDefault();
      });
      try {
        history.pushState({ eyeUi: 1 }, "", location.href);
        window.addEventListener("popstate", () => {
          try {
            history.pushState({ eyeUi: 1 }, "", location.href);
          } catch (e) {
          }
        });
      } catch (e) {
      }
      cv.addEventListener("animationend", (e) => {
        if (e.animationName === "kitzel" || e.animationName === "nudge" || e.animationName === "sigh") {
          cv.classList.remove("kitzel", "is-nudge", "is-sigh");
        }
      });
      addEventListener("keydown", (e) => __async(null, null, function* () {
        var _a2;
        if (e.key === "Escape") {
          if (!((_a2 = el2("cam-zoom")) == null ? void 0 : _a2.hidden)) {
            kameraZoom(false);
            return;
          }
          if (ansicht === "day") {
            normalesBild();
            return;
          }
          if (dashOffen) schliesseDash();
          else if (blattOffen) schliesseBlatt();
          else schliesseEinstellungen();
          return;
        }
        if (einstellungenOffen || blattOffen || dashOffen) return;
        const ziel = e.target;
        if (ziel && (ziel.tagName === "INPUT" || ziel.tagName === "SELECT" || ziel.tagName === "TEXTAREA")) return;
        if (e.key === "i") {
          oeffneEinstellungen();
          return;
        }
        yield gesteFreigeben();
        const keys = Object.keys(KURZ);
        const i = "1234567890qwer".indexOf(e.key);
        if (i >= 0 && i < keys.length) wendeZustand(keys[i], { ton: true, erzwingen: true });
        else if (e.key === " ") {
          e.preventDefault();
          if (schauLaeuft || schauFest) stoppeSchau();
          else starteSchau();
        } else if (e.key === "m") setModus(MODI[(MODI.indexOf(renderer.mode) + 1) % MODI.length]);
        else if (e.key === "ArrowRight") {
          e.preventDefault();
          if (!wischRechts()) fuehreAktion(konfig.gesten.right);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          fuehreAktion(konfig.gesten.left);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          fuehreAktion(konfig.gesten.up);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          fuehreAktion(konfig.gesten.down);
        }
      }));
      function uebernehmeProfil() {
        const geladen = ladeKonfig(q, void 0, siteDatei, location);
        Object.assign(konfig, geladen);
        if (istDemoHost(location.hostname)) {
          konfig.haToken = "";
          vergissToken();
        }
        if (demoBesuch(konfig, location, q)) {
          konfig.demo = true;
          if (istStandardEcken(konfig.ecken)) konfig.ecken = normEcken(ECKEN_DEMO, konfig.eigene);
        }
      }
      function syncGeraet() {
        const neu = geraetJetzt();
        if (neu !== aktiveKlasse()) {
          setzeKlasse(neu);
          uebernehmeProfil();
          for (const node of document.querySelectorAll("details.abschnitt")) node.open = neu !== "phone";
          applyI18n();
          schreibeSchalter();
          setModus(startModus());
        }
        document.body.classList.toggle("is-phone", aktiveKlasse() === "phone");
        syncStage();
      }
      addEventListener("resize", () => {
        renderer.resize();
        syncGeraet();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          last = performance.now();
          wachHalte();
          syncUhr();
        }
      });
      document.addEventListener("contextmenu", (e) => e.preventDefault());
      document.addEventListener("gesturestart", (e) => e.preventDefault());
      onZeiger(document, "down", () => {
        gesteFreigeben();
      }, true);
      el2("caption").addEventListener("animationend", (e) => {
        if (e.animationName !== "caption-life") return;
        el2("caption").classList.remove("is-on");
        const fertig = captionState;
        captionState = "";
        syncCaptionPlatz();
        if (jetztText && !blattOffen && !einstellungenOffen) zeigeZeile("track", { halten: true });
        else if (fertig !== "idle" && letzterKurz === "idle" && !blattOffen && !einstellungenOffen) scheduleBored();
        else syncRuhe();
      });
      el2("caption-hit").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        kitzeln();
        oeffneBlatt();
      });
      el2("caption-ruhe").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!konfig.caption) {
          setCaption(true);
          kitzeln();
          return;
        }
        kitzeln();
        oeffneBlatt();
      });
      const sheet = el2("sheet");
      const card = el2("sheet-card");
      let zug = null;
      onZeiger(sheet, "down", (e) => {
        if (e.target === sheet) schliesseBlatt();
      });
      onZeiger(card, "down", (e) => {
        if (e.target.closest("input, select, textarea, button, a, label")) return;
        zug = { y: e.clientY, id: e.pointerId, sc: card.scrollTop };
      });
      onZeiger(card, "move", (e) => {
        if (!zug || zug.id !== e.pointerId) return;
        const dy = e.clientY - zug.y;
        if (zug.sc <= 0 && dy > 0) card.style.transform = `translateY(${dy}px)`;
      });
      function zugEnde(e) {
        if (!zug || e && zug.id !== e.pointerId) return;
        const dy = e ? e.clientY - zug.y : 0;
        zug = null;
        card.style.transform = "";
        if (dy > 72) schliesseBlatt();
      }
      onZeiger(card, "up", zugEnde);
      onZeiger(card, "cancel", () => {
        zug = null;
        card.style.transform = "";
      });
      el2("form").addEventListener("submit", speichern);
      el2("schliessen").addEventListener("click", schliesseEinstellungen);
      onZeiger(el2("einstellungen"), "down", (e) => {
        if (e.target === el2("einstellungen")) schliesseEinstellungen();
      });
      el2("ablauf").addEventListener("click", () => __async(null, null, function* () {
        yield gesteFreigeben();
        konfig.demo = true;
        const box = el2("demo-an");
        if (box) box.checked = true;
        if (!schauLaeuft) starteSchau();
      }));
      (_a = el2("demo-an")) == null ? void 0 : _a.addEventListener("change", () => {
        if (el2("demo-an").checked) {
          konfig.demo = true;
          speichereKonfig(konfig);
          if (!schauLaeuft) starteSchau();
        } else if (schauLaeuft || schauFest) toggleDemo();
        else {
          konfig.demo = false;
          speichereKonfig(konfig);
        }
      });
      (_b = el2("lock-an")) == null ? void 0 : _b.addEventListener("change", () => {
        const neu = el2("lock-neu");
        if (neu) neu.hidden = !el2("lock-an").checked;
        syncTip("help.tip.security");
      });
      (_c = el2("eigene-add")) == null ? void 0 : _c.addEventListener("click", () => {
        if (demoSperre(location.hostname)) return;
        const label = el2("eigene-label").value.trim();
        const ziel = el2("eigene-ziel").value.trim();
        if (!label || !ziel || !dienstAus(ziel)) return;
        konfig.eigene = normEigene([...konfig.eigene || [], { id: `a${Date.now().toString(36)}`, label, ziel }]);
        el2("eigene-label").value = "";
        el2("eigene-ziel").value = "";
        speichereKonfig(konfig);
        zeichneEigene();
        baueGestenFelder();
        baueEckenFelder();
        schreibeGesten();
      });
      (_d = el2("state-reset")) == null ? void 0 : _d.addEventListener("click", () => {
        konfig.states = {};
        speichereKonfig(konfig);
        zeichneStates();
        syncTip();
      });
      (_e = el2("lock-ok")) == null ? void 0 : _e.addEventListener("click", () => __async(null, null, function* () {
        const ok = yield pruefeLock(el2("lock-pin").value, konfig.lockSalt, konfig.lockHash);
        const fehler = el2("lock-fehler");
        if (!ok) {
          if (fehler) fehler.textContent = t("security.wrong");
          return;
        }
        entsperrt = true;
        el2("lock-pin").value = "";
        if (fehler) fehler.textContent = "";
        el2("lock-gate").hidden = true;
        el2("form-body").hidden = false;
      }));
      function oeffneCredits() {
        const node = el2("credits");
        if (node) node.hidden = false;
      }
      function schliesseCredits() {
        const node = el2("credits");
        if (node) node.hidden = true;
      }
      (_f = el2("credits-open")) == null ? void 0 : _f.addEventListener("click", oeffneCredits);
      (_g = el2("sheet-credits")) == null ? void 0 : _g.addEventListener("click", () => {
        schliesseBlatt();
        oeffneCredits();
      });
      (_h = el2("credits-close")) == null ? void 0 : _h.addEventListener("click", schliesseCredits);
      onZeiger(el2("credits"), "down", (e) => {
        if (e.target === el2("credits")) schliesseCredits();
      });
      (_i = el2("form")) == null ? void 0 : _i.addEventListener("focusin", (e) => syncTip(tipKey(e.target)));
      onZeiger(el2("form"), "over", (e) => {
        if (e.target.closest("input, select, button, label, summary, a")) syncTip(tipKey(e.target));
      });
      onZeiger(document, "move", (e) => {
        if (!document.body.classList.contains("stage-split") && !document.body.classList.contains("dash")) return;
        const r = el2("c").getBoundingClientRect();
        if (!r.width) return;
        lookTX = Math.max(-0.9, Math.min(0.9, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.45)));
        lookTY = Math.max(-0.75, Math.min(0.75, (r.top + r.height / 2 - e.clientY) / (r.height * 0.45)));
      });
      if (stageQuery.addEventListener) stageQuery.addEventListener("change", syncStage);
      else if (stageQuery.addListener) stageQuery.addListener(syncStage);
      const touchUi = "ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(hover: none), (pointer: coarse)").matches;
      document.documentElement.classList.toggle("is-touch", touchUi);
      el2("vollbild").addEventListener("click", vollbild);
      function ruesteWahl(node, onPick) {
        if (!node) return;
        const buttons = node.querySelectorAll("button");
        for (let i = 0; i < buttons.length; i++) {
          buttons[i].addEventListener("click", () => {
            feldSetze(node, buttons[i].dataset.value);
            if (onPick) onPick(buttons[i].dataset.value);
          });
        }
      }
      ruesteWahl(el2("modus"), (value) => {
        konfig.modus = value;
        setModus(value);
        speichereKonfig(konfig);
      });
      ruesteWahl(el2("sprache"), (value) => setLang(value === "auto" ? "" : value));
      ruesteWahl(el2("licht-profil"), (value) => {
        konfig.lichtProfil = value === "lebhaft" ? "lebhaft" : "ruhig";
        renderer.setLicht({ profil: konfig.lichtProfil });
        speichereKonfig(konfig);
      });
      ruesteWahl(el2("alarm-staerke"), (value) => {
        konfig.alarmStaerke = value === "normal" ? "normal" : "stark";
        setAlarmStaerke(konfig.alarmStaerke);
        speichereKonfig(konfig);
      });
      function zeigeEinstSeite(name) {
        const home = el2("einst-home");
        const back = el2("einst-back-row");
        const seiten = document.querySelectorAll("#form-body [data-seite]");
        if (home) home.hidden = !!name;
        if (back) back.hidden = !name;
        for (let i = 0; i < seiten.length; i++) seiten[i].hidden = seiten[i].getAttribute("data-seite") !== name;
        const abschnitte = document.querySelectorAll("#form-body details.abschnitt");
        for (let i = 0; i < abschnitte.length; i++) {
          const fs = abschnitte[i].querySelector("[data-seite]");
          const match = !!(name && fs && fs.getAttribute("data-seite") === name);
          abschnitte[i].hidden = !match;
          if (match) abschnitte[i].open = true;
          const summary = abschnitte[i].querySelector("summary");
          if (summary && !summary.textContent.trim()) summary.hidden = true;
        }
        const namen = {
          anzeige: "set.display",
          ton: "set.sleep",
          gesten: "set.gestures",
          ansichten: "set.views",
          ha: "set.ha",
          erweitert: "set.advanced",
          sicherheit: "set.security"
        };
        const titel = el2("einst-seite-titel");
        if (titel) titel.textContent = name && namen[name] ? t(namen[name]) : "";
        if (name) return;
        const set = (id, text) => {
          const n = el2(id);
          if (n) n.textContent = text || "";
        };
        const mode = renderer.mode === "2d" ? t("mode.cube") : renderer.mode === "led" ? t("mode.fortune") : t("mode.bold");
        const licht = konfig.lichtProfil === "lebhaft" ? t("light.lebhaft") : t("light.ruhig");
        set("einst-wert-anzeige", `${mode} \xB7 ${licht}`);
        set("einst-wert-ton", konfig.schlafSekunden ? `${Math.round(konfig.schlafSekunden / 60)} min` : t("set.never"));
        set("einst-wert-ha", t(`status.${haStatus}`) || "");
        set("einst-wert-sicherheit", konfig.lockOn ? t("security.lock") : "");
      }
      (_j = el2("einst-home")) == null ? void 0 : _j.addEventListener("click", (e) => {
        const btn = e.target.closest && e.target.closest("button");
        if (btn && btn.dataset.ziel) zeigeEinstSeite(btn.dataset.ziel);
      });
      (_k = el2("einst-back")) == null ? void 0 : _k.addEventListener("click", () => zeigeEinstSeite(""));
      el2("ton").addEventListener("change", () => setTonAn(el2("ton").checked));
      el2("sheet-ton").addEventListener("change", () => setTonAn(el2("sheet-ton").checked));
      el2("label").addEventListener("change", () => {
        ui.label = el2("label").checked;
        konfig.label = ui.label;
        speichereKonfig(konfig);
      });
      el2("caption-an").addEventListener("change", () => setCaption(el2("caption-an").checked));
      el2("sheet-caption").addEventListener("change", () => setCaption(el2("sheet-caption").checked));
      el2("uhr-an").addEventListener("change", () => setUhr(el2("uhr-an").checked));
      el2("sheet-uhr").addEventListener("change", () => setUhr(el2("sheet-uhr").checked));
      el2("np-an").addEventListener("change", () => setNowPlaying(el2("np-an").checked));
      el2("sheet-np").addEventListener("change", () => setNowPlaying(el2("sheet-np").checked));
      el2("sheet-de").addEventListener("click", () => setLang("de"));
      el2("sheet-en").addEventListener("click", () => setLang("en"));
      el2("sheet-schlaf").addEventListener("change", () => {
        konfig.schlafSekunden = Math.max(0, Math.round(+el2("sheet-schlaf").value * 60) || 0);
        waechter.setNach(konfig.schlafSekunden);
        speichereKonfig(konfig);
        el2("schlaf-min").value = String(Math.round(konfig.schlafSekunden / 60));
      });
      el2("sheet-mehr").addEventListener("click", () => {
        schliesseBlatt();
        oeffneEinstellungen();
      });
      (_l = el2("sheet-demo")) == null ? void 0 : _l.addEventListener("click", () => {
        schliesseBlatt();
        if (schauTimer || schauFest || schauLaeuft) stoppeSchau();
        else starteSchau();
      });
      (_m = el2("uhr")) == null ? void 0 : _m.addEventListener("click", () => {
        if (ansicht === "day") normalesBild();
        else starteTag();
      });
      (_n = el2("day-back")) == null ? void 0 : _n.addEventListener("click", () => normalesBild());
      (_o = el2("cam")) == null ? void 0 : _o.addEventListener("click", () => kameraZoom(true));
      (_p = el2("cam-zoom-hit")) == null ? void 0 : _p.addEventListener("click", () => kameraZoom(false));
      function musikBefehl(dienst) {
        if (konfig.mediaEntity) {
          ha == null ? void 0 : ha.callScript(`media_player.${dienst}/${konfig.mediaEntity}`);
          bestaetige();
          return;
        }
        if (dienst === "media_play_pause") {
          if (demoMusik.playing) demoMusik.stop();
          else audio.unlock().then(() => demoMusik.start(audio.context())).catch(() => {
          });
          syncMusikPanel();
        }
        bestaetige();
      }
      (_q = el2("np-prev")) == null ? void 0 : _q.addEventListener("click", () => musikBefehl("media_previous_track"));
      (_r = el2("np-play")) == null ? void 0 : _r.addEventListener("click", () => musikBefehl("media_play_pause"));
      (_s = el2("np-next")) == null ? void 0 : _s.addEventListener("click", () => musikBefehl("media_next_track"));
      (_t = el2("np-queue")) == null ? void 0 : _t.addEventListener("click", (e) => {
        let node = e.target;
        while (node && node !== e.currentTarget) {
          if (node.tagName === "BUTTON" && node.dataset && node.dataset.i != null) break;
          node = node.parentNode;
        }
        if (!node || node === e.currentTarget) return;
        const idx = parseInt(node.dataset.i, 10);
        if (npEintraege && npEintraege[idx]) spieleNaechstes(npEintraege[idx]);
      });
      for (const id of ["pitch", "abst", "glas", "raster"]) el2(id).addEventListener("input", ledAusForm);
      for (const kurz of Object.keys(KURZ)) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.state = kurz;
        button.textContent = stateLabel(locale, kurz);
        button.addEventListener("click", () => __async(null, null, function* () {
          yield gesteFreigeben();
          wendeZustand(kurz, { ton: true, erzwingen: true });
        }));
        el2("zust").appendChild(button);
      }
      if (param("zones", "zonen") === "1") el2("zonen").hidden = false;
      ruesteHilfe();
      klappeAbschnitte();
      document.body.classList.toggle("is-phone", aktiveKlasse() === "phone");
      setModus(startModus());
      applyI18n();
      schreibeSchalter();
      syncSoundHint();
      syncRuhe();
      starteHa();
      syncEck();
      syncDemoHinweis();
      (_u = el2("eck-treffer")) == null ? void 0 : _u.addEventListener("click", (e) => {
        const btn = e.target && e.target.getAttribute ? e.target : null;
        const key = btn && btn.getAttribute("data-eck");
        if (!key || !konfig.ecken[key]) return;
        if (key === "tl") {
          adminTaps.tipp(performance.now(), () => {
            blitz("tl");
            if (waechter.schlaeft) aufwachen();
            oeffneEinstellungen();
          }, () => {
            if (waechter.schlaeft) aufwachen();
            else {
              blitz("tl");
              fuehreAktion(konfig.ecken.tl.tap);
            }
          });
          return;
        }
        if (waechter.schlaeft) {
          aufwachen();
          return;
        }
        blitz(key);
        fuehreAktion(konfig.ecken[key].tap);
      });
      onZeiger(el2("dash-close"), "down", () => schliesseDash());
      onZeiger(el2("dash-bot"), "down", () => {
        blinkAt = performance.now() / 1e3;
        if (dashOffen) schliesseDash();
      });
      hoereStapel();
      function hoereStapel() {
        const node = el2("stapel");
        if (!node) return;
        let start = null;
        onZeiger(node, "down", (e) => {
          const ziel = e.target && e.target.closest && e.target.closest("button, a, input, textarea");
          if (ziel) return;
          start = { x: e.clientX, y: e.clientY, id: e.pointerId };
        });
        onZeiger(node, "up", (e) => {
          if (!start || e.pointerId != null && e.pointerId !== start.id) return;
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          start = null;
          if (Math.hypot(dx, dy) < 36) return;
          if (Math.abs(dx) > Math.abs(dy) && dx < -40) {
            schliesseDash();
            return;
          }
          if (aktiveKlasse() === "phone") return;
          if (dy < -40) schrittStapel(1);
          else if (dy > 40) schrittStapel(-1);
        });
      }
      (_v = el2("corners-group")) == null ? void 0 : _v.addEventListener("focusin", zeigeZonenKurz);
      if (q.get("dash") === "1") oeffneDash();
      const startState = param("state", "zustand");
      if (startState) wendeZustand(startState, { ton: false, erzwingen: true });
      else scheduleBored();
      const trackVorschau = param("track");
      if (trackVorschau && konfig.nowPlaying) {
        const [title, artist, year] = trackVorschau.split("|");
        const attr = { media_title: title || "", media_artist: artist || "" };
        if (year) attr.media_year = year;
        onMedien({ typ: "medien", state: "playing", attr, quelle: "url" });
      }
      const sequence = param("sequence", "sequenz");
      if (param("tour", "ablauf") || konfig.demo && !startState && !sequence) starteSchau();
      else if (sequence) {
        const namen = sequence.split(",").map((s) => s.trim()).filter(Boolean);
        const jede = Math.max(0.4, +param("sequence_s", "sequenz_s") || 3) * 1e3;
        const pause = Math.max(0, +param("sequence_pause", "sequenz_pause") || 0.4) * 1e3;
        let i = 0;
        const schritt = () => {
          if (!namen.length) return;
          const roh = namen[i % namen.length];
          i += 1;
          if (ha == null ? void 0 : ha.einspeisen) ha.einspeisen(roh);
          else wendeZustand(roh, { ton: true, erzwingen: true });
        };
        setTimeout(() => {
          schritt();
          setInterval(schritt, jede);
        }, pause);
      }
      if (param("shot") === "1") {
        const probe = {
          "sensor.open_contacts": { entity_id: "sensor.open_contacts", state: "2", attributes: { header: "2 open", friendly_name: "Open contacts" } },
          "binary_sensor.front_door": { entity_id: "binary_sensor.front_door", state: "on", attributes: { friendly_name: "Front door" } },
          "binary_sensor.kitchen_window": { entity_id: "binary_sensor.kitchen_window", state: "on", attributes: { friendly_name: "Kitchen window" } },
          "sensor.outdoor_temperature": { entity_id: "sensor.outdoor_temperature", state: "11", attributes: { unit_of_measurement: "\xB0C", friendly_name: "Outside" } },
          "sensor.living_room_temperature": { entity_id: "sensor.living_room_temperature", state: "21.4", attributes: { unit_of_measurement: "\xB0C", friendly_name: "Living room" } },
          "sensor.wind_speed": { entity_id: "sensor.wind_speed", state: "12", attributes: { unit_of_measurement: "km/h", friendly_name: "Wind" } },
          "binary_sensor.rain": { entity_id: "binary_sensor.rain", state: "off", attributes: { friendly_name: "Rain" } },
          "sensor.pv_power": { entity_id: "sensor.pv_power", state: "3.2", attributes: { unit_of_measurement: "kW", friendly_name: "PV" } },
          "sensor.energy_today": { entity_id: "sensor.energy_today", state: "12.4", attributes: { unit_of_measurement: "kWh", friendly_name: "Today" } },
          "sensor.self_use": { entity_id: "sensor.self_use", state: "78", attributes: { unit_of_measurement: "%", friendly_name: "Self-use" } },
          "input_boolean.eye_guard": { entity_id: "input_boolean.eye_guard", state: "off", attributes: { friendly_name: "Guard" } },
          "weather.home": { entity_id: "weather.home", state: "snowy", attributes: { temperature: 11, friendly_name: "Home" } }
        };
        Object.assign(dashStates, probe);
        konfig.dash = normDash(__spreadProps(__spreadValues({}, konfig.dash), {
          weather: "weather.home",
          contacts: "sensor.open_contacts",
          windows: [],
          contactGroups: ["binary_sensor.front_door", "binary_sensor.kitchen_window"],
          outdoorTemp: "sensor.outdoor_temperature",
          indoor: ["sensor.living_room_temperature"],
          wind: "sensor.wind_speed",
          rain: "binary_sensor.rain",
          energyPv: "sensor.pv_power",
          energyDay: "sensor.energy_today",
          energyAutonomy: "sensor.self_use"
        }));
        if (konfig.caption) zeigeZeile(bildKurz || "idle", { halten: true });
        window.__shot = {
          open(name) {
            oeffneDetail(name);
          },
          settings() {
            oeffneEinstellungen();
          },
          page(name) {
            zeigeEinstSeite(name);
          },
          sheet() {
            oeffneBlatt();
          },
          credits() {
            oeffneCredits();
          }
        };
      }
      setInterval(syncUhr, 1e3);
      const api = {
        zeige: (name) => wendeZustand(name, { ton: false, erzwingen: true }),
        haZustand: (roh) => (ha == null ? void 0 : ha.einspeisen) ? ha.einspeisen(roh) : wendeZustand(roh, { ton: false, erzwingen: true }),
        haState: (roh) => api.haZustand(roh),
        befehl: feuereBefehl,
        modus: setModus,
        einstellungen: oeffneEinstellungen,
        blatt: () => oeffneBlatt(),
        medien: (state, attr) => onMedien({ typ: "medien", state, attr: attr || {}, quelle: "api" }),
        uhr: (an) => setUhr(an !== false),
        status: () => ({
          ha: haStatus,
          meldung: haMeldung,
          text: statusText(),
          zustand: letzterKurz,
          schlaeft: waechter.schlaeft,
          modus: renderer.mode,
          lang: locale,
          caption: konfig.caption,
          uhr: konfig.uhr,
          nowPlaying: konfig.nowPlaying,
          track: jetztText,
          blatt: blattOffen
        }),
        audioStatus: () => audio.status(),
        get letzterBefehl() {
          return letzterBefehl;
        }
      };
      window.grokBot = api;
      if ("serviceWorker" in navigator) {
        const hatte = !!navigator.serviceWorker.controller;
        let neu = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!hatte || neu) return;
          neu = true;
          location.reload();
        });
        navigator.serviceWorker.register("sw.js").catch(() => {
        });
      }
      requestAnimationFrame(frame);
    });
  }
  __legacyBoot();
})();
