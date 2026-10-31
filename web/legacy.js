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
    const K = P2.K, hw = K * (P.SEP / 2 + P.EYE_W / 2), hh = K * P.EYE_H / 2;
    return [(aspect - P2.MARGIN - hw) * P2.FILL_X, (1 - P2.MARGIN - hh - K * P.Y0) * P2.FILL_Y];
  }
  function prims2dK(p, k, aspect) {
    const K = P2.K, [tx, ty] = travel2d(aspect), gx = p.gx * k, gy = p.gy * k;
    const fx = 1 - P2.PERSP_X * gx * gx, fy = 1 - P2.PERSP_Y * gy * gy;
    const rr = rad(p.roll), cr = Math.cos(rr), sr = Math.sin(rr), ox = gx * tx + K * p.dx, oy = gy * ty + K * p.dy;
    const scr = (u, v) => {
      const x = K * u * fx, y = K * v * fy;
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

  // web/wahl.js
  function waehleIndex(n, letzte, rnd) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    const menge = n > 1 ? n : 1;
    let pick = Math.floor(Number(zufall()) * menge);
    if (!(pick >= 0) || pick >= menge) pick = 0;
    if (letzte == null || pick !== letzte || menge === 1) return pick;
    let hop = Math.floor(Number(zufall()) * (menge - 1));
    if (!(hop >= 0) || hop >= menge - 1) hop = 0;
    return (letzte + hop + 1) % menge;
  }

  // web/blick.js
  var BLINK_ARTEN = ["einfach", "doppelt", "schlaf", "halb"];
  var GLANCES = ["links", "rechts", "oben", "obenlinks", "obenrechts"];
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function clamp012(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return clamp(n, 0, 1);
  }
  function waehleBlinzel(letzte, rnd) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    const r = Number(zufall());
    let art = "einfach";
    if (r > 0.84) art = "schlaf";
    else if (r > 0.68) art = "halb";
    else if (r > 0.48) art = "doppelt";
    if (art !== letzte) return art;
    const rest = [];
    for (let i = 0; i < BLINK_ARTEN.length; i++) if (BLINK_ARTEN[i] !== letzte) rest.push(BLINK_ARTEN[i]);
    return rest[waehleIndex(rest.length, null, zufall)];
  }
  function blinkPause(lebendigkeit, art, rnd) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    const live = clamp012(lebendigkeit);
    const lo = 4.8 - live * 2.8;
    const hi = 8.2 - live * 3.6;
    let t = lo + Number(zufall()) * (hi - lo);
    if (!(t > 0)) t = lo;
    if (art === "doppelt") t += 0.35;
    if (art === "schlaf") t += 0.8;
    return t;
  }
  function blickIntervall(lebendigkeit, rnd) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    const live = clamp012(lebendigkeit);
    const lo = 3.6 - live * 1.6;
    const hi = 8.2 - live * 3.2;
    const t = lo + Number(zufall()) * Math.max(0.2, hi - lo);
    return t > 0.4 ? t : 0.4;
  }
  function waehleBlick(letzte, rnd, lebendigkeit, hatMerker) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    const live = clamp012(lebendigkeit);
    const r = Number(zufall());
    const pRuhe = 0.68 - live * 0.36;
    const pSacc = pRuhe + 0.22 + live * 0.12;
    let art = "ruhe";
    if (r < pRuhe) art = "ruhe";
    else if (r < pSacc) art = "saccade";
    else if (hatMerker && r > 0.9 - live * 0.06) art = "gemerkt";
    else art = GLANCES[waehleIndex(GLANCES.length, null, zufall)];
    if (art !== "ruhe" && art === letzte) {
      const rest = ["links", "rechts", "oben", "obenlinks", "obenrechts", "saccade"];
      const i = rest.indexOf(art);
      const hop = waehleIndex(rest.length - 1, null, zufall);
      art = rest[(Math.max(0, i) + hop + 1) % rest.length];
    }
    return art;
  }
  function zielVon(art, rnd, merker) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    if (art === "gemerkt" && merker) {
      return {
        gx: merker.gx * 0.75,
        gy: merker.gy * 0.75,
        tilt: -merker.gx * 5,
        roll: merker.gx * 2.2,
        art
      };
    }
    if (art === "saccade") {
      const gx = (Number(zufall()) - 0.5) * 0.34;
      const gy = (Number(zufall()) - 0.35) * 0.28;
      return { gx, gy, tilt: gx * -6, roll: gx * 3, art };
    }
    const tabelle = {
      ruhe: [0, 0, 0, 0],
      links: [-0.64, 0.06, 6, -2.4],
      rechts: [0.64, 0.05, -6, 2.4],
      oben: [0.04, 0.58, 1.5, 0],
      obenlinks: [-0.46, 0.52, 7, -3],
      obenrechts: [0.48, 0.5, -7, 3]
    };
    const v = tabelle[art] || tabelle.ruhe;
    return { gx: v[0], gy: v[1], tilt: v[2], roll: v[3], art };
  }
  function drift(t, seed) {
    const s = Number(seed) || 0;
    const zeit = Number(t) || 0;
    return {
      gx: 0.028 * Math.sin(zeit * 0.31 + s),
      gy: 0.018 * Math.sin(zeit * 0.22 + s * 1.3)
    };
  }
  function blickZumPunkt(x, y, w, h) {
    const ww = w > 1 ? w : 1;
    const hh = h > 1 ? h : 1;
    const nx = (Number(x) / ww - 0.5) * 2;
    const ny = (Number(y) / hh - 0.5) * 2;
    return {
      gx: clamp(nx * 0.62, -0.78, 0.78),
      gy: clamp(-ny * 0.55, -0.5, 0.72)
    };
  }
  function createBlick(rnd) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    let lebendigkeit = 0.7;
    let naechster = 0.7 + Number(zufall()) * 0.8;
    let naechsterBlink = 2.2 + Number(zufall()) * 1.6;
    let letzteArt = "ruhe";
    let letzteBlink = null;
    let ziel = zielVon("ruhe", zufall, null);
    let tilt = 0;
    let roll = 0;
    let seed = Number(zufall()) * Math.PI * 2;
    let merker = null;
    const aus = { gx: 0, gy: 0, tilt: 0, roll: 0, art: "ruhe", blink: "" };
    return {
      setLebendigkeit(v) {
        lebendigkeit = clamp012(v);
      },
      merke(gx, gy, now) {
        merker = { gx, gy, bis: (Number(now) || 0) + 18 };
      },
      halte(bis) {
        if (bis > naechster) naechster = bis;
      },
      bis(zeit) {
        naechster = Number(zeit) || 0;
      },
      tick(now, dt) {
        const zeit = Number(now) || 0;
        const schritt = dt > 0 ? dt : 0.016;
        const frisch = !!(merker && zeit < merker.bis);
        if (zeit >= naechster) {
          const art = waehleBlick(letzteArt, zufall, lebendigkeit, frisch);
          letzteArt = art;
          ziel = zielVon(art, zufall, frisch ? merker : null);
          naechster = zeit + blickIntervall(lebendigkeit, zufall);
        }
        const live = 0.55 + lebendigkeit * 0.65;
        const d = drift(zeit, seed);
        aus.gx = clamp(ziel.gx + d.gx * live, -0.9, 0.9);
        aus.gy = clamp(ziel.gy + d.gy * live, -0.62, 0.82);
        const folgen = Math.min(1, schritt * 2.1);
        tilt += ((ziel.tilt || 0) - tilt) * folgen;
        roll += ((ziel.roll || 0) - roll) * folgen;
        aus.tilt = tilt;
        aus.roll = roll;
        aus.art = ziel.art || "ruhe";
        aus.blink = "";
        if (zeit >= naechsterBlink) {
          const art = waehleBlinzel(letzteBlink, zufall);
          letzteBlink = art;
          aus.blink = art;
          naechsterBlink = zeit + blinkPause(lebendigkeit, art, zufall);
        }
        return aus;
      }
    };
  }

  // web/engine.js
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
      this.blick = createBlick(rnd);
      this.blinks = [];
      this.halb = false;
      this.schlafBlink = -10;
      this.touch = null;
      this.lebendigkeit = 0.7;
      this.onEnde = null;
      this.set("03_idle");
    }
    setLebendigkeit(v) {
      this.lebendigkeit = v;
      if (this.blick) this.blick.setLebendigkeit(v);
    }
    // Look toward a touch. gx/gy are gaze targets, about -1..1. Angry and sleep ignore it.
    schau(gx, gy) {
      this.touch = { gx, gy, t0: this.now, dur: 1.25 };
      this.blick.halte(this.now + 1.25);
      this.blick.merke(gx, gy, this.now);
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
      let z = null;
      if (live) {
        p.scale = 1 + 0.02 * Math.sin(2 * Math.PI * t / 4.6);
        p.dy = 8e-3 * Math.sin(2 * Math.PI * t / 5.2) + 4e-3 * Math.sin(2 * Math.PI * t / 9.5);
        z = this.blick.tick(this.now, dt);
        p.gx = z.gx;
        p.gy = z.gy;
        p.tilt = z.tilt;
        p.roll = z.roll;
        if (Math.abs(z.tilt) > 1) {
          p.sx *= 1 + Math.min(0.06, Math.abs(z.tilt) * 8e-3);
          p.sy *= 1 - Math.min(0.04, Math.abs(z.tilt) * 4e-3);
        }
      }
      if (this.touch && this.c.name !== "15_angry" && this.c.name !== "01_schlafen") {
        const age = this.now - this.touch.t0;
        if (age >= 0 && age < this.touch.dur * 0.72) {
          p.gx = this.touch.gx;
          p.gy = this.touch.gy;
        } else if (age >= this.touch.dur) this.touch = null;
      }
      const loopy = live || ["05_zuhoeren", "06_nachdenken", "12_musik_an", "15_angry"].includes(this.c.name);
      if (live && z && z.blink) {
        this.halb = z.blink === "halb";
        if (z.blink === "doppelt") this.blinks = [this.now, this.now + 0.3];
        else if (z.blink === "schlaf") {
          this.blinks = [];
          this.schlafBlink = this.now;
        } else this.blinks = [this.now];
      } else if (!live && loopy && this.now > this.nextBlink) {
        this.blinks = [this.now];
        this.halb = false;
        this.nextBlink = this.now + (this.rnd() < 0.25 ? 0.3 : 3 + this.rnd() * 5);
      }
      p.gx = this.sgx.step(p.gx, dt);
      p.gy = this.sgy.step(p.gy, dt);
      p.scale = this.ssc.step(p.scale, dt);
      const zeiten = this.blinks;
      const hatte = this.blinkAt > -5;
      if (hatte) zeiten.push(this.blinkAt);
      let m = blinkMul(this.now, zeiten);
      if (hatte) zeiten.pop();
      if (live && this.halb) m = 1 - (1 - m) * 0.42;
      if (live && this.schlafBlink > 0) {
        const u = (this.now - this.schlafBlink) / 0.92;
        if (u >= 0 && u < 1) m = Math.min(m, 1 - 0.5 * Math.sin(Math.PI * u));
      }
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
    wake: "wake",
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
  var HA_PING_MS = 3e4;
  var HA_PONG_MS = 1e4;
  var HA_AUTH_RETRY_MS = 6e4;
  var HA_RETRY_MS = 5e3;
  function verbindeHa(opts) {
    const {
      url: url0,
      token: token0,
      entityId,
      mediaEntity = "",
      onZustand,
      onMedien,
      onStatus,
      onStates,
      socketFactory = (u) => new WebSocket(u),
      reconnect = true,
      liesZugang
    } = opts;
    const later = opts.setTimeout || setTimeout;
    const cancel = opts.clearTimeout || clearTimeout;
    const pingEvery = opts.pingEvery == null ? HA_PING_MS : opts.pingEvery;
    const pongWait = opts.pongWait == null ? HA_PONG_MS : opts.pongWait;
    const authRetryMs = opts.authRetryMs == null ? HA_AUTH_RETRY_MS : opts.authRetryMs;
    const retryMs = opts.retryMs == null ? HA_RETRY_MS : opts.retryMs;
    let url = url0;
    let token = token0;
    let stopped = false;
    let authPause = false;
    let ersetzt = false;
    let ws = null;
    let naechsteId = 1;
    let timer = null;
    let pingTimer = null;
    let pongTimer = null;
    const wartet = /* @__PURE__ */ new Map();
    const antworten = /* @__PURE__ */ new Map();
    const status = (name, extra) => onStatus == null ? void 0 : onStatus(__spreadValues({ status: name }, extra));
    const frisch = () => {
      if (typeof liesZugang !== "function") return;
      const zugang = liesZugang();
      if (!zugang || typeof zugang !== "object") return;
      if (typeof zugang.url === "string") url = zugang.url;
      if (typeof zugang.token === "string") token = zugang.token;
    };
    const clearPing = () => {
      if (pingTimer) {
        cancel(pingTimer);
        pingTimer = null;
      }
      if (pongTimer) {
        cancel(pongTimer);
        pongTimer = null;
      }
    };
    const armPing = () => {
      clearPing();
      pingTimer = later(() => {
        pingTimer = null;
        if (stopped || !ws || ws.readyState !== 1) return;
        const id = naechsteId++;
        wartet.set(id, "ping");
        try {
          ws.send(JSON.stringify({ id, type: "ping" }));
        } catch (e) {
          return;
        }
        pongTimer = later(() => {
          pongTimer = null;
          try {
            ws.close();
          } catch (e) {
          }
        }, pongWait);
      }, pingEvery);
    };
    const send = (msg, art) => {
      if (msg.id == null) msg.id = naechsteId++;
      else naechsteId = Math.max(naechsteId, msg.id + 1);
      if (art) wartet.set(msg.id, art);
      ws.send(JSON.stringify(msg));
    };
    const behandle = (data) => {
      const art = data && data.id != null ? wartet.get(data.id) : null;
      if (data && (data.type === "pong" || art === "ping")) {
        if (pongTimer) {
          cancel(pongTimer);
          pongTimer = null;
        }
        if (data.id != null) wartet.delete(data.id);
        armPing();
        return;
      }
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
          authPause = false;
          status("verbunden");
          const [stati, abo] = startNachrichten(entityId, naechsteId);
          send(stati, "get_states");
          send(abo, "subscribe");
          armPing();
        } else if (aktion.typ === "auth_invalid") {
          authPause = true;
          status("auth_ungueltig", { meldung: aktion.meldung });
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
      clearPing();
      frisch();
      if (!url || !token) {
        status("aus", { meldung: token ? "" : "tokenMissing" });
        schedule(authRetryMs);
        return;
      }
      status("verbinde");
      if (ws && ws.readyState < 2) {
        const alt = ws;
        alt.onclose = null;
        try {
          alt.close();
        } catch (e) {
        }
      }
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
        clearPing();
        if (stopped) return;
        if (!authPause) status("getrennt");
        schedule();
      };
    };
    const schedule = (ms) => {
      if (stopped || !reconnect) return;
      if (timer) cancel(timer);
      const wait = ms != null ? ms : authPause ? authRetryMs : retryMs;
      timer = later(connect, wait);
    };
    connect();
    return {
      stop() {
        stopped = true;
        if (timer) cancel(timer);
        timer = null;
        clearPing();
        try {
          if (ws) ws.close();
        } catch (e) {
        }
      },
      nudge() {
        if (stopped) return;
        authPause = false;
        if (ws && ws.readyState === 1) return;
        if (timer) {
          cancel(timer);
          timer = null;
        }
        connect();
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

  // web/gesten.js
  var ECK = 128;

  // web/strings.js
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
  var UI = {
    en: {
      "app.title": "Grok Bot Home Assistant UI",
      "app.shortTitle": "Grok Bot",
      "app.canvas": "Animated eyes",
      "settings.title": "Settings",
      "settings.intro": "Hold the top-left corner to open settings. The token stays in this browser.",
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
      "ha.door": "Front door",
      "ha.presence": "Presence",
      "ha.reminder": "Reminder",
      "ha.reminderAck": "Acknowledge reminder",
      "ph.url": "ws://homeassistant.local:8123/api/websocket",
      "ph.tokenReplace": "Saved. Fill in only to replace it.",
      "ph.tokenEmpty": "Long-lived token from the Home Assistant profile",
      "ph.entity": "input_select.eye_ui_state",
      "ph.presence": "binary_sensor.living_room_presence",
      "ph.reminder": "input_text.eye_hinweis",
      "ph.reminderAck": "script.eye_hinweis_quittieren",
      "hint.hear": "tap me to hear me",
      "hint.forget": "Don't forget",
      "hint.demo": "Paper bin",
      "hint.corner": "Hold the top corner, or tap five times.",
      "welcome.demo": "Start the demo",
      "welcome.intro": "Introduction",
      "intro.1": "I want this face to retire the tiles.",
      "intro.2": "A house run like KNX or Loxone should feel alive, not just switched.",
      "intro.3": "That needs a local link, a little learning, and a screen that stays simple.",
      "intro.4": "Voice and a few small gestures are the direction. This build does not listen yet.",
      "intro.5": "It should only speak up when something fits, and not take itself too seriously.",
      "intro.6": "Later it may change automations and think a step ahead. Not in this version.",
      "preview.summary": "Reactions",
      "preview.help": "A quiet list for trying each reaction. The first tap on the face unlocks the sound.",
      "cmd.help": "A script entity, or a service and a target, such as script.eye_music_on or light.turn_on/light.living_room.",
      "cmd.musicOn": "Music on",
      "cmd.musicOff": "Music off",
      "cmd.lightsOn": "Lights on",
      "cmd.lightsOff": "Lights off",
      "display.language": "Language",
      "display.mode": "View",
      "display.sleep": "Sleep after minutes (0 = never)",
      "display.sound": "Sound",
      "display.volume": "Volume",
      "display.liveliness": "Liveliness",
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
      "set.back": "Back to the face",
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
      "settings.intro": "Oben links halten \xF6ffnet die Einstellungen. Der Token bleibt in diesem Browser.",
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
      "ha.door": "Haust\xFCr",
      "ha.presence": "Anwesenheit",
      "ha.reminder": "Hinweis",
      "ha.reminderAck": "Hinweis quittieren",
      "ph.url": "ws://homeassistant.local:8123/api/websocket",
      "ph.tokenReplace": "Gespeichert. Nur ausf\xFCllen, um ihn zu ersetzen.",
      "ph.tokenEmpty": "Langzeit-Token aus dem Home-Assistant-Profil",
      "ph.entity": "input_select.eye_ui_state",
      "ph.presence": "binary_sensor.living_room_presence",
      "ph.reminder": "input_text.eye_hinweis",
      "ph.reminderAck": "script.eye_hinweis_quittieren",
      "hint.hear": "tipp mich an, dann h\xF6rst du mich",
      "hint.forget": "Nicht vergessen",
      "hint.demo": "Papiertonne",
      "hint.corner": "Oben links halten, oder f\xFCnfmal tippen.",
      "welcome.demo": "Demo starten",
      "welcome.intro": "Einf\xFChrung",
      "intro.1": "Ich m\xF6chte mit diesem Gesicht die Kacheln loswerden.",
      "intro.2": "Ein Haus wie mit KNX oder Loxone soll lebendig wirken, nicht nur schalten.",
      "intro.3": "Daf\xFCr braucht es die lokale Anbindung, ein bisschen Lernen, und eine einfache Fl\xE4che.",
      "intro.4": "Stimme und ein paar kleine Gesten sind die Richtung. Diese Fassung h\xF6rt noch nicht zu.",
      "intro.5": "Es soll nur etwas sagen, wenn es passt, und sich nicht zu wichtig nehmen.",
      "intro.6": "Sp\xE4ter kann es Automationen \xE4ndern und einen Schritt vorausdenken. Noch nicht hier.",
      "preview.summary": "Reaktionen",
      "preview.help": "Eine stille Liste, um jede Reaktion zu pr\xFCfen. Der erste Tipp auf das Gesicht schaltet den Ton frei.",
      "cmd.help": "Eine Skript-Entity oder ein Dienst mit Ziel, zum Beispiel script.eye_music_on oder light.turn_on/light.living_room.",
      "cmd.musicOn": "Musik an",
      "cmd.musicOff": "Musik aus",
      "cmd.lightsOn": "Licht an",
      "cmd.lightsOff": "Licht aus",
      "display.language": "Sprache",
      "display.mode": "Ansicht",
      "display.sleep": "Einschlafen nach Minuten (0 = nie)",
      "display.sound": "Ton",
      "display.volume": "Lautst\xE4rke",
      "display.liveliness": "Lebendigkeit",
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
      "set.back": "Zur\xFCck zum Gesicht",
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
  function captionLine(locale, state, states) {
    var _a;
    const lang = CAPTIONS[locale] ? locale : "en";
    const base = CAPTIONS[lang][state] || CAPTIONS.en[state] || null;
    const over = (_a = states == null ? void 0 : states[state]) == null ? void 0 : _a[lang === "de" ? "de" : "en"];
    if (over) return { text: over, dots: !!(base == null ? void 0 : base.dots) };
    return base;
  }

  // web/konfig.js
  var DEMO_HOST = "grok-bot-ui.herrvonundzu.eu";
  function istDemoHost(host) {
    return String(host || "").replace(/\.+$/, "").toLowerCase() === DEMO_HOST;
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
    presenceEntity: "",
    reminderEntity: "input_text.eye_hinweis",
    reminderAckScript: "script.eye_hinweis_quittieren",
    kamera: "",
    ton: true,
    lebendigkeit: 0.42,
    lautstaerke: 0.8,
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
    lichtProfil: "ruhig",
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
    if (src.presence && !src.presenceEntity) src.presenceEntity = src.presence;
    if (src.presence_entity && !src.presenceEntity) src.presenceEntity = src.presence_entity;
    delete src.presence;
    delete src.presence_entity;
    if (src.reminder && !src.reminderEntity) src.reminderEntity = src.reminder;
    if (src.reminder_entity && !src.reminderEntity) src.reminderEntity = src.reminder_entity;
    delete src.reminder;
    delete src.reminder_entity;
    if (src.reminderAck && !src.reminderAckScript) src.reminderAckScript = src.reminderAck;
    if (src.reminder_ack && !src.reminderAckScript) src.reminderAckScript = src.reminder_ack;
    delete src.reminderAck;
    delete src.reminder_ack;
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
  function einheit(v, fallback) {
    let n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    if (n > 1) n /= 100;
    return Math.max(0, Math.min(1, n));
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
    if ("presenceEntity" in out) {
      const id = String(out.presenceEntity || "").trim().toLowerCase();
      out.presenceEntity = id && gueltigeEntity(id) ? id : "";
    }
    if ("reminderEntity" in out) {
      const id = String(out.reminderEntity || "").trim().toLowerCase();
      out.reminderEntity = id && gueltigeEntity(id) ? id : "";
    }
    if ("reminderAckScript" in out) {
      const id = String(out.reminderAckScript || "").trim().toLowerCase();
      out.reminderAckScript = id && dienstAus(id) ? id : "";
    }
    if ("kamera" in out) {
      const id = String(out.kamera || "").trim().toLowerCase();
      out.kamera = id && gueltigeEntity(id) ? id : "";
    }
    if ("ton" in out) out.ton = !!out.ton;
    if ("lebendigkeit" in out) out.lebendigkeit = einheit(out.lebendigkeit, 0.42);
    if ("lautstaerke" in out) out.lautstaerke = einheit(out.lautstaerke, 0.8);
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
    const live = p.get("live") || p.get("liveliness") || p.get("lebendigkeit");
    if (live != null && live !== "" && !Number.isNaN(+live)) n.lebendigkeit = einheit(live, n.lebendigkeit);
    const vol = p.get("vol") || p.get("volume");
    if (vol != null && vol !== "" && !Number.isNaN(+vol)) n.lautstaerke = einheit(vol, n.lautstaerke);
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
    const presence = p.get("presence");
    if (presence && gueltigeEntity(presence.trim().toLowerCase())) n.presenceEntity = presence.trim().toLowerCase();
    const reminder = p.get("reminder");
    if (reminder && gueltigeEntity(reminder.trim().toLowerCase())) n.reminderEntity = reminder.trim().toLowerCase();
    const ack = p.get("reminder_ack") || p.get("reminderAck");
    if (ack && dienstAus(ack.trim().toLowerCase())) n.reminderAckScript = ack.trim().toLowerCase();
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
      this.flat = !!(opt && opt.flat);
      const basis = this.bold ? BOLD : LOOK;
      this.look = opt && (opt.cube || opt.flat) ? __spreadProps(__spreadValues({}, basis), { CORNER: 0, RING_TAU: 0, RING_LINE: 0, RING_LINE_W: 0, FLOOR: 0, RIM: 0, VIGNETTE: 0, SHEEN: 0, BG_IN: [0, 0, 0], BG_OUT: [0, 0, 0] }) : basis;
      if (this.flat) {
        this.gq = 4;
        if (!this.cheap) {
          this.glow = canvas(Math.ceil(W / this.gq), Math.ceil(H / this.gq));
          this.small = canvas(this.glow.width, this.glow.height);
        }
        return;
      }
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
    const q = __spreadValues(__spreadValues({}, DEFAULT), pose), rr = rad2(q.roll), cr = Math.cos(rr), sr = Math.sin(rr), K = K_MM();
    const scr = (u, v) => [u * cr - v * sr + q.dx * K, u * sr + v * cr + q.dy * K];
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
      const el = rad2(L.CAM_EL);
      this.right = [1, 0, 0];
      this.up = [0, Math.cos(el), -Math.sin(el)];
      this.view = [0, Math.sin(el), Math.cos(el)];
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
    var s = opt.scale || 1, w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s)), m = Math.min(w, h), Q = RUHIG, K = Q.K;
    var R = (opt.cornerR || 0) * s, rnd = rngFactory(7654321), A = Q.DITHER;
    var ls = Math.max(Q.LINE_SIGMA * m, Q.LINE_MIN * s), tau = Math.max(Q.TAU * m, Q.TAU_MIN * s), rs = Math.max(Q.RAHMEN_SIGMA * m, Q.RAHMEN_MIN * s);
    var f0 = Q.FADE0 * m, f1 = Q.FADE1 * m;
    var rahmenC = document.createElement("canvas");
    rahmenC.width = w;
    rahmenC.height = h;
    var rImg = rahmenC.getContext("2d").createImageData(w, h), RD = rImg.data;
    var kurz = [], lang = [], bk = [], bl = [], q;
    for (q = 0; q < K; q++) {
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
        var gx = x / w * (K - 1), k0 = Math.min(K - 2, Math.floor(gx)), fx = gx - k0, w1 = 0.5 - 0.5 * Math.cos(Math.PI * fx), ks = [k0, k0 + 1], wx = [1 - w1, w1];
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
    for (q = 0; q < K; q++) streifen.push({
      u: q / (K - 1),
      kurz: bk[q][2] < 0 ? null : { x: bk[q][0], y: bk[q][1], c: toCanvas(kurz[q], bk[q]) },
      lang: bl[q][2] < 0 ? null : { x: bl[q][0], y: bl[q][1], c: toCanvas(lang[q], bl[q]) }
    });
    return { w, h, scale: s, rahmen: rahmenC, streifen };
  }
  var G_PNORM = GEO.PNORM;
  function pegelAusHuelle(st, huelle, profil) {
    var tab = profil === "lebhaft" ? STATES : RUHIG_STATES;
    var R = tab[st] || tab.idle || RUHIG_STATES.idle;
    var u = Number(huelle);
    if (!(u > 0)) u = 0;
    if (u > 1) u = 1;
    return R.lo + (R.hi - R.lo) * u;
  }
  function glaettePegel(lv, ziel, dt) {
    var d = Number(dt);
    if (!(d > 0)) d = 0;
    return lv + (ziel - lv) * (1 - Math.exp(-d / 0.12));
  }
  function zielLvVon(st, pv, t, ue, profil, huelle) {
    if (huelle > 0) {
      return pegelAusHuelle(st, huelle, profil) * ue + pegelAusHuelle(pv, huelle, profil) * (1 - ue);
    }
    if (profil === "lebhaft") return level(st, t) * ue + level(pv, t) * (1 - ue);
    return levelRuhig(st, t) * ue + levelRuhig(pv, t) * (1 - ue);
  }
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
    var zielLv = zielLvVon(st, pv, t, ue, "ruhig", S.huelle);
    if (typeof S.lv !== "number") S.lv = zielLv;
    S.lv = glaettePegel(S.lv, zielLv, dt);
    var lv = S.lv, ra = rahmenRuhig(st, t) * ue + rahmenRuhig(pv, t) * (1 - ue);
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
    var zielLv = zielLvVon(st, pv, t, ue, "lebhaft", S.huelle);
    if (typeof S.lv !== "number") S.lv = zielLv;
    S.lv = glaettePegel(S.lv, zielLv, dt);
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
        this.szene2d = new Szene2D(W, H, { cheap: !!this.sparsam, flat: true });
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
      if ("huelle" in o) {
        const n = Number(o.huelle);
        this.lichtHuelle = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
      }
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
      this.lichtMaschine.huelle = this.lichtHuelle > 0 ? this.lichtHuelle : 0;
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
        else if (this.mode === "2d") this.drawFlach(pose, ring);
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
    // Eyes on a black screen. The only colour is the screen-edge glow, drawn afterwards.
    drawFlach(pose, ring) {
      const ctx = this.ctx;
      const W = this.cv.width, H = this.cv.height;
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      this.szene2d.render(ctx, pose, [ring[0], 0, null], this.previewPx(), true);
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
    "surprised",
    "startled",
    "zuhoeren",
    "curious",
    "nachdenken",
    "thinking",
    "verstanden",
    "nod",
    "erledigt",
    "happy",
    "pleased",
    "lachen",
    "shy",
    "nicht_verstanden",
    "confused",
    "sad",
    "angry",
    "relieved",
    "sleepy",
    "schlafen",
    "blicke",
    "grumpy",
    "content",
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

  // web/demotrack.js
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
  function offen(state) {
    const s = String(state != null ? state : "").trim().toLowerCase();
    return s === "on" || s === "open";
  }
  function tuerOffen(state) {
    return offen(state);
  }

  // web/wache.js
  var WAKE_SOUNDS = ["15_hmmm_a", "16_hmmm_b", "17_hmmm_c", "18_hmmm_d"];
  var WAKE_VARIANTS = [
    { gx: 0.62, gy: 0.14, hold: 0.85, blink: 0.28, sound: WAKE_SOUNDS[0] },
    { gx: -0.7, gy: 0.06, hold: 1.15, blink: 0.62, sound: WAKE_SOUNDS[1] },
    { gx: 0.18, gy: -0.42, hold: 0.62, blink: 0.16, sound: WAKE_SOUNDS[2] },
    { gx: -0.24, gy: 0.46, hold: 1.35, blink: 0.92, sound: WAKE_SOUNDS[3] }
  ];
  function anwesend(state) {
    const s = String(state != null ? state : "").trim().toLowerCase();
    return s === "on" || s === "home" || s === "open" || s === "detected" || s === "occupied";
  }
  function waehleVariante(letzte, rnd) {
    const n = WAKE_VARIANTS.length;
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    let pick = Math.floor(Number(zufall()) * n);
    if (!(pick >= 0) || pick >= n) pick = 0;
    if (letzte == null || pick !== letzte) return pick;
    let hop = Math.floor(Number(zufall()) * (n - 1));
    if (!(hop >= 0) || hop >= n - 1) hop = 0;
    return (letzte + hop + 1) % n;
  }
  function createWecker(rnd) {
    let letzte = null;
    let an = false;
    let bereit = true;
    return {
      eingeschlafen() {
        bereit = true;
      },
      impuls({ schlaeft, an: jetzt, puls } = {}) {
        const ein = !!jetzt;
        const kante = puls ? ein : ein && !an;
        if (!puls) an = ein;
        if (!kante || !schlaeft || !bereit) return null;
        bereit = false;
        const index = waehleVariante(letzte, rnd);
        letzte = index;
        return __spreadValues({ index }, WAKE_VARIANTS[index]);
      }
    };
  }

  // web/hinweis.js
  var LEER = { unknown: 1, unavailable: 1, none: 1, null: 1 };
  function createHinweis() {
    let text = "";
    let offen2 = false;
    return {
      setzen(roh) {
        const next = String(roh == null ? "" : roh).trim();
        if (!next || LEER[next.toLowerCase()]) {
          if (!offen2) return "still";
          text = "";
          offen2 = false;
          return "leer";
        }
        if (offen2 && next === text) return "gleich";
        text = next;
        offen2 = true;
        return "zeigen";
      },
      quittieren() {
        if (!offen2) return false;
        offen2 = false;
        text = "";
        return true;
      },
      get text() {
        return offen2 ? text : "";
      },
      get offen() {
        return offen2;
      }
    };
  }
  function ackAnHa(quelle) {
    return quelle === "ha";
  }

  // web/reaktionen.js
  var FELDER = ["gx", "gy", "roll", "dx", "dy", "scale", "sx", "sy", "tilt", "lidT", "lidA", "happy", "bright", "sep"];
  var EINS = { scale: 1, sx: 1, sy: 1, bright: 1, sep: 1 };
  var REAKTION_IDS = [
    "surprised",
    "curious",
    "shy",
    "pleased",
    "thinking",
    "confused",
    "nod",
    "sad",
    "happy",
    "relieved",
    "sleepy",
    "startled",
    "grumpy",
    "content"
  ];
  var SATZ = {};
  for (let i = 0; i < REAKTION_IDS.length; i++) SATZ[REAKTION_IDS[i]] = true;
  function istReaktion(id) {
    return !!SATZ[id];
  }
  function spur(dauer, werte) {
    const n = werte.length;
    const keys = new Array(n);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : dauer * i / (n - 1);
      keys[i] = [t, werte[i], i === 0 ? "lin" : "io"];
    }
    return keys;
  }
  function baue(phrase, dur, n, fn) {
    const liste2 = [];
    for (let i = 0; i < n; i++) {
      const dauer = dur * (0.92 + i * 0.05);
      const roh = fn(i);
      const rend = { phrase, dur: dauer, index: i };
      for (const key in roh) {
        if (Object.prototype.hasOwnProperty.call(roh, key)) rend[key] = spur(dauer, roh[key]);
      }
      liste2.push(rend);
    }
    return liste2;
  }
  function seite(i) {
    if (i % 3 === 2) return 0;
    return i % 2 === 0 ? -1 : 1;
  }
  var REAKTIONEN = {
    surprised: baue("startle", 0.88, 4, (i) => {
      const s = seite(i);
      const hoch = i === 2 ? 0.34 : 0.1;
      return {
        scale: [1, 1.14, 1.04, 1],
        sy: [1, 1.16, 1.05, 1],
        sx: [1, 0.9, 0.97, 1],
        sep: [1, 1.07, 1.03, 1],
        gy: [0, hoch, hoch * 0.4, 0],
        gx: [0, s * 0.2, s * 0.08, 0],
        dy: [0, 0.035, 0, 0]
      };
    }),
    curious: baue("curious", 1.4, 4, (i) => {
      const s = i % 2 === 0 ? -1 : 1;
      const seit = (i === 2 ? 0.16 : 0.52) * (i === 3 ? 1 : s);
      const hoch = 0.4 + i % 3 * 0.1;
      return {
        gx: [0, seit, seit * 0.72, 0.04 * s],
        gy: [0, hoch, hoch * 0.82, 0.08],
        tilt: [0, -s * (5 + i), -s * 3.5, 0],
        roll: [0, s * 2.4, s * 1.2, 0],
        sy: [1, 1.06, 1.04, 1],
        scale: [1, 1.03, 1.02, 1]
      };
    }),
    shy: baue("shy", 1.28, 4, (i) => {
      const s = i % 2 === 0 ? -1 : 1;
      return {
        gx: [0, s * (0.28 + i * 0.04), s * 0.36, s * 0.1],
        gy: [0, -0.26, -0.34, -0.08],
        sy: [1, 0.9, 0.84, 0.96],
        happy: [0, 0.12, 0.32, 0.08],
        tilt: [0, s * (4 + i), s * 5, 0],
        scale: [1, 0.97, 0.95, 1]
      };
    }),
    pleased: baue("happy", 1.15, 4, (i) => {
      const s = seite(i);
      return {
        happy: [0, 0.4, 0.58 + i * 0.03, 0.16],
        sx: [1, 1.06, 1.1, 1],
        sy: [1, 0.94, 0.9, 1],
        dy: [0, 0.015, 0.028, 0],
        gx: [0, s * 0.1, 0, 0]
      };
    }),
    thinking: baue("think", 1.55, 3, (i) => {
      const s = i === 1 ? 1 : -1;
      const seit = i === 2 ? 0.12 : 0.48;
      return {
        gx: [0, s * seit, s * seit * 0.85, s * 0.16],
        gy: [0, 0.5, 0.62, 0.28],
        scale: [1, 0.95, 0.94, 0.98],
        lidT: [0, 0.05, 0.1, 0.04],
        tilt: [0, -s * 4, -s * 5, -s]
      };
    }),
    confused: baue("curious", 1.35, 3, (i) => {
      const s = i === 1 ? -1 : 1;
      return {
        roll: [0, s * 7, -s * 5, s * 2, 0],
        lidA: [0, 12 + i, 8, 0],
        gy: [0, -0.1, 0.16, 0],
        gx: [0, s * 0.22, -s * 0.14, 0],
        scale: [1, 0.93, 0.97, 1],
        sy: [1, 0.96, 1.02, 1]
      };
    }),
    nod: baue("yes", 1.05, 3, (i) => {
      const hop = 0.045 + i * 0.012;
      const zweiter = i === 0 ? 0 : -hop * 0.7;
      return {
        dy: [0, -hop, 0.012, zweiter, 0],
        scale: [1, 0.98, 1.02, 1, 1],
        happy: [0, 0.05, i === 2 ? 0.28 : 0.08, 0]
      };
    }),
    sad: baue("sad", 1.55, 3, (i) => {
      const s = i === 2 ? -0.16 : i === 1 ? 0.14 : 0;
      return {
        gy: [0, -0.28, -0.4, -0.22],
        gx: [0, s, s * 1.2, s * 0.4],
        lidT: [0, 0.16, 0.28, 0.14],
        sy: [1, 0.86, 0.76, 0.9],
        bright: [1, 0.78, 0.66, 0.82],
        scale: [1, 0.98, 0.96, 0.98]
      };
    }),
    happy: baue("happy", 1.2, 4, (i) => {
      const hop = 0.05 + i * 0.012;
      const s = seite(i);
      return {
        dy: [0, hop, 0, i === 0 ? 0 : hop * 0.65, 0],
        happy: [0, 0.7, 0.85, 0.45, 0.05],
        sx: [1, 1.14, 1.18, 1.08, 1],
        sy: [1, 0.82, 0.78, 0.9, 1],
        gx: [0, s * 0.08, 0, 0]
      };
    }),
    relieved: baue("relieved", 1.35, 3, (i) => ({
      lidT: [0.2, 0.08, 0.02, 0],
      happy: [0, 0.18 + i * 0.06, 0.46, 0.12],
      dy: [0, -0.02, 0.03, 0],
      scale: [0.96, 1.04, 1.02, 1],
      sy: [0.88, 1.04, 1, 1],
      gx: [0, (i - 1) * 0.12, 0, 0]
    })),
    sleepy: baue("sleepy", 1.9, 3, (i) => ({
      lidT: [0, 0.1, 0.24 + i * 0.04, 0.38],
      gy: [0, -0.08, -0.26, -0.34],
      sy: [1, 0.9, 0.74, 0.62],
      bright: [1, 0.82, 0.64, 0.5],
      scale: [1, 0.99, 0.96, 0.94],
      gx: [0, (i - 1) * 0.06, 0, 0]
    })),
    startled: baue("startle", 0.72, 4, (i) => {
      const s = seite(i);
      return {
        scale: [1, 1.2, 1.06, 1],
        sy: [1, 1.22, 1.08, 1],
        sx: [1, 0.88, 0.96, 1],
        sep: [1, 1.09, 1.03, 1],
        dy: [0, 0.045, 0, 0],
        gx: [0, s * 0.16, s * 0.04, 0],
        gy: [0, i === 2 ? 0.28 : 0.12, 0.04, 0]
      };
    }),
    grumpy: baue("no", 1.12, 3, (i) => {
      const s = i === 1 ? -1 : 1;
      return {
        lidT: [0, 0.18, 0.32, 0.14],
        lidA: [0, -12, -18 - i, -6],
        sy: [1, 0.84, 0.74, 0.9],
        sx: [1, 1.05, 1.1, 1.02],
        gx: [0, s * 0.26, -s * 0.16, 0],
        scale: [1, 0.98, 0.97, 1]
      };
    }),
    content: baue("content", 1.45, 3, (i) => ({
      happy: [0, 0.28, 0.48 + i * 0.04, 0.32],
      lidT: [0, 0.04, 0.1, 0.05],
      scale: [1, 1.02, 1.04, 1.02],
      dy: [0, 8e-3, 0.016, 8e-3],
      sy: [1, 0.97, 0.94, 0.98],
      gx: [0, (i - 1) * 0.08, 0, 0]
    }))
  };
  function poseBei(rend, t) {
    const p = {};
    if (!rend) return p;
    for (let i = 0; i < FELDER.length; i++) {
      const key = FELDER[i];
      const keys = rend[key];
      if (keys && keys.length) p[key] = kf(keys, t);
    }
    return p;
  }
  function staerke(t, dur) {
    const zeit = Number(t) || 0;
    const laenge = dur > 0.2 ? dur : 0.2;
    const ein = 0.09;
    const aus = 0.26;
    if (zeit <= 0 || zeit >= laenge) return 0;
    if (zeit < ein) return zeit / ein;
    if (zeit > laenge - aus) return (laenge - zeit) / aus;
    return 1;
  }
  function mische(basis, extra, menge, mitBlick) {
    const out = {};
    const src = basis || {};
    for (const key in src) {
      if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = src[key];
    }
    const s = Math.max(0, Math.min(1, Number(menge) || 0));
    if (!extra || s <= 0) return out;
    for (let i = 0; i < FELDER.length; i++) {
      const key = FELDER[i];
      if (extra[key] == null) continue;
      if (!mitBlick && (key === "gx" || key === "gy")) continue;
      const b = src[key] == null ? EINS[key] || 0 : src[key];
      out[key] = b + (extra[key] - b) * s;
    }
    return out;
  }
  var TOUCH_POOL = ["curious", "shy", "pleased", "surprised"];
  var HINWEIS_POOL = ["nod", "curious"];
  var ACK_POOL = ["pleased", "nod"];
  var FEHLER_POOL = ["confused", "sad"];
  function createStupser(rnd, fensterMs) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    const fenster = fensterMs > 0 ? fensterMs : 2600;
    let zeiten = [];
    let letzte = null;
    return {
      tipp(now) {
        const t = Number(now) || 0;
        const offen2 = [];
        for (let i = 0; i < zeiten.length; i++) if (t - zeiten[i] < fenster) offen2.push(zeiten[i]);
        offen2.push(t);
        zeiten = offen2;
        if (zeiten.length >= 3) {
          zeiten = [];
          letzte = null;
          return "grumpy";
        }
        const index = waehleIndex(TOUCH_POOL.length, letzte, zufall);
        letzte = index;
        return TOUCH_POOL[index];
      }
    };
  }
  function createReaktionLauf(rnd) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    const letzte = {};
    const pools = {};
    let zuletzt = -10;
    return {
      aus(pool) {
        if (!pool || !pool.length) return "";
        const key = pool.join("|");
        const index = waehleIndex(pool.length, pools[key] == null ? null : pools[key], zufall);
        pools[key] = index;
        return pool[index];
      },
      start(id, now, opt) {
        const liste2 = REAKTIONEN[id];
        if (!liste2) return null;
        const o = opt || {};
        const t = Number(now) || 0;
        const pause = id === "grumpy" ? 0.32 : 0.48;
        if (!o.erzwingen && t - zuletzt < pause) return null;
        const index = waehleIndex(liste2.length, letzte[id] == null ? null : letzte[id], zufall);
        letzte[id] = index;
        zuletzt = t;
        return liste2[index];
      }
    };
  }

  // web/stimme.js
  var MUSTER = {
    happy: { count: [3, 4], base: 520, step: 68, dur: 0.08, gap: 0.045, glide: 46, form: "up" },
    curious: { count: [2, 3], base: 400, step: 96, dur: 0.11, gap: 0.06, glide: 140, form: "up" },
    sad: { count: [2, 3], base: 330, step: -58, dur: 0.15, gap: 0.07, glide: -70, form: "down" },
    think: { count: [3, 4], base: 370, step: 22, dur: 0.09, gap: 0.075, glide: 0, form: "wobble" },
    startle: { count: [1, 2], base: 620, step: 70, dur: 0.06, gap: 0.03, glide: 160, form: "up" },
    sleepy: { count: [1, 2], base: 250, step: -28, dur: 0.26, gap: 0.08, glide: -36, form: "down" },
    yes: { count: [2, 2], base: 470, step: 100, dur: 0.075, gap: 0.04, glide: 36, form: "up" },
    no: { count: [2, 3], base: 390, step: -84, dur: 0.085, gap: 0.05, glide: -48, form: "down" },
    shy: { count: [2, 3], base: 360, step: 18, dur: 0.11, gap: 0.065, glide: -24, form: "down" },
    content: { count: [2, 2], base: 340, step: 12, dur: 0.15, gap: 0.08, glide: -16, form: "down" },
    relieved: { count: [2, 3], base: 430, step: 36, dur: 0.11, gap: 0.055, glide: 28, form: "up" }
  };
  var VARIANTEN = 3;
  var MASTER = 0.2;
  var MAX_DUR = 1.45;
  function zahl(rnd) {
    const n = Number(typeof rnd === "function" ? rnd() : Math.random());
    return Number.isFinite(n) ? n : 0;
  }
  function silben(muster, index, rnd) {
    const lo = muster.count[0];
    const hi = muster.count[1];
    let n = lo + Math.floor(zahl(rnd) * (hi - lo + 1));
    if (index === 1 && n > lo) n -= 1;
    if (index === 2 && n < hi) n += 1;
    if (n < 1) n = 1;
    if (n > 5) n = 5;
    return n;
  }
  function bauePhrase(id, rnd, letzte) {
    const zufall = typeof rnd === "function" ? rnd : Math.random;
    const key = MUSTER[id] ? id : "yes";
    const muster = MUSTER[key];
    const index = waehleIndex(VARIANTEN, letzte == null ? null : letzte, zufall);
    const pitch = (0.94 + index * 0.045) * (0.96 + zahl(zufall) * 0.08);
    const tempo = (index === 1 ? 1.12 : index === 2 ? 0.9 : 1) * (0.94 + zahl(zufall) * 0.12);
    const n = silben(muster, index, zufall);
    const notes = [];
    let t = 0.02;
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 1 : i / (n - 1);
      let freq = muster.base * pitch + muster.step * i;
      if (muster.form === "wobble") freq += Math.sin(i * 1.7 + index) * 28;
      freq = Math.max(180, Math.min(980, freq));
      const dur = muster.dur / tempo * (i === n - 1 ? 1.12 : 0.94);
      const glide = Math.max(160, Math.min(1100, freq + muster.glide * (0.55 + 0.45 * u)));
      notes.push({
        at: t,
        dur,
        freq,
        glide,
        warble: (zahl(zufall) - 0.5) * 0.045,
        gain: muster.form === "startle" || key === "startle" ? 0.5 : 0.42 + 0.12 * (1 - u * 0.35)
      });
      t += dur + muster.gap / tempo;
    }
    let ende = notes[notes.length - 1].at + notes[notes.length - 1].dur;
    if (ende > MAX_DUR) {
      const k = MAX_DUR / ende;
      for (let i = 0; i < notes.length; i++) {
        notes[i].at *= k;
        notes[i].dur *= k;
      }
      ende = MAX_DUR;
    }
    return { id: key, index, notes, dur: ende };
  }
  function pulsHuelle(now, pulse2) {
    let a = 0;
    if (!pulse2 || !pulse2.length) return 0;
    for (let i = 0; i < pulse2.length; i++) {
      const p = pulse2[i];
      const ms = p.ms > 1 ? p.ms : 1;
      const u = (now - p.at) / ms;
      if (u >= 0 && u < 1) {
        const bell = Math.sin(Math.PI * u) * (p.amp > 0 ? p.amp : 0);
        if (bell > a) a = bell;
      }
    }
    return a > 1 ? 1 : a;
  }
  function createStimme(opt) {
    const o = opt || {};
    const rnd = typeof o.rnd === "function" ? o.rnd : Math.random;
    const cooldown = o.cooldownMs == null ? 1200 : Number(o.cooldownMs);
    const letzte = {};
    let frei = 0;
    let ziel = null;
    function ausgang(ctx) {
      if (ziel && ziel.ctx === ctx) return ziel.node;
      const node = ctx.createGain();
      node.gain.value = MASTER;
      node.connect(ctx.destination);
      ziel = { ctx, node };
      return node;
    }
    function note(ctx, dest, t0, n, laut) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      const f0 = n.freq;
      osc.frequency.setValueAtTime(f0, t0);
      if (n.warble) osc.frequency.linearRampToValueAtTime(f0 * (1 + n.warble), t0 + n.dur * 0.42);
      osc.frequency.linearRampToValueAtTime(n.glide || f0, t0 + n.dur);
      const peak = Math.max(2e-4, n.gain * MASTER * laut);
      g.gain.setValueAtTime(1e-4, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.028, n.dur * 0.35));
      g.gain.exponentialRampToValueAtTime(1e-4, t0 + n.dur);
      osc.connect(g);
      g.connect(dest);
      try {
        osc.start(t0);
        osc.stop(t0 + n.dur + 0.04);
      } catch (err) {
      }
    }
    return {
      plan(id, now) {
        const t = Number(now) || 0;
        if (t < frei) return null;
        const phrase = bauePhrase(id, rnd, letzte[id] == null ? null : letzte[id]);
        letzte[id] = phrase.index;
        frei = t + (cooldown > 0 ? cooldown : 0);
        return phrase;
      },
      spiel(ctx, phrase, volume, nowMs) {
        if (!phrase || !phrase.notes) return [];
        const start = Number(nowMs) || 0;
        const pulses = [];
        for (let i = 0; i < phrase.notes.length; i++) {
          const n = phrase.notes[i];
          pulses.push({
            at: start + n.at * 1e3,
            ms: Math.max(80, n.dur * 1e3),
            amp: 0.45 + Math.min(0.4, n.gain)
          });
        }
        const laut = Math.max(0, Math.min(1, Number(volume) || 0));
        if (!ctx || ctx.state !== "running" || !(laut > 0)) return pulses;
        const dest = ausgang(ctx);
        const t0 = ctx.currentTime || 0;
        for (let i = 0; i < phrase.notes.length; i++) {
          const n = phrase.notes[i];
          note(ctx, dest, t0 + n.at, n, laut);
        }
        return pulses;
      }
    };
  }

  // web/empfang.js
  var INTRO_KEYS = ["intro.1", "intro.2", "intro.3", "intro.4", "intro.5", "intro.6"];
  var INTRO_MS = 3400;
  var EMPFANG_REIHE = [
    "hallo",
    "curious",
    "thinking",
    "nod",
    "happy",
    "wake",
    "reminder",
    "shy",
    "sad",
    "angry",
    "relieved",
    "sleepy",
    "content"
  ];
  var EMPFANG_MS = 3200;
  var FENSTER_MS = 2200;
  function paramsVon(params) {
    return params instanceof URLSearchParams ? params : new URLSearchParams(params || "");
  }
  function ohneHaus(konfig, ort) {
    const host = ort && (ort.hostname || ort.host) || "";
    if (istDemoHost(host)) return true;
    const url = konfig && String(konfig.haUrl || "").trim();
    const token = konfig && String(konfig.haToken || "").trim();
    return !url && !token;
  }
  function sollWillkommen(konfig, ort, params) {
    const p = paramsVon(params);
    if (p.get("demo") === "1" || p.get("tour") || p.get("ablauf")) return false;
    if (p.get("intro") === "1" || p.get("lauf") === "1") return false;
    if (p.get("state") || p.get("zustand") || p.get("reaction") || p.get("reaktion")) return false;
    if (p.get("sequence") || p.get("sequenz")) return false;
    if (p.get("ha") === "mock") return false;
    if (p.get("welcome") === "0") return false;
    return ohneHaus(konfig, ort);
  }
  function empfangSchritt(index) {
    const n = EMPFANG_REIHE.length;
    const i = (index % n + n) % n;
    const kurz = EMPFANG_REIHE[i];
    return { index: i, kurz, ms: EMPFANG_MS, naechster: (i + 1) % n };
  }
  function tippFenster(zeiten, now, fenster) {
    const grenze = fenster > 0 ? fenster : FENSTER_MS;
    const t = Number(now) || 0;
    const offen2 = [];
    const liste2 = zeiten || [];
    for (let i = 0; i < liste2.length; i++) if (t - liste2[i] < grenze) offen2.push(liste2[i]);
    offen2.push(t);
    return { zeiten: offen2.length >= 5 ? [] : offen2, settings: offen2.length >= 5 };
  }
  function eckeHinweisFaellig(gesehen, tipps) {
    return !gesehen && tipps >= 2;
  }

  // web/app.js
  function __legacyBoot() {
    return __async(this, null, function* () {
      const q = new URLSearchParams(location.search);
      const ON = yield (yield fetch("onsets.json")).json();
      const siteDatei = yield ladeSiteConfig();
      const CLIPS = makeClips(ON);
      const BY = Object.fromEntries(CLIPS.map((c) => [c.name, c]));
      const HINWEIS_TON = "19_hinweis";
      const ECK_MS = 2e3;
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
      if (demoBesuch(konfig, location, q)) konfig.demo = true;
      let locale = resolveLocale({ query: q.get("lang"), stored: konfig.lang, nav: navigator.language });
      const audio = createAudio(CLIPS, ["15_hmmm_a", "16_hmmm_b", "17_hmmm_c", "18_hmmm_d", HINWEIS_TON]);
      audio.setTon(konfig.ton);
      const stimme = createStimme();
      const reaktionen = createReaktionLauf();
      const stupser = createStupser();
      const demoMusik = createDemoMusic();
      const augen = new Augen(CLIPS);
      augen.setLebendigkeit(konfig.lebendigkeit);
      const waechter = createWaechter(konfig.schlafSekunden);
      const wecker = createWecker();
      const hinweis = createHinweis();
      const renderer = new Buehne(document.getElementById("c"));
      renderer.sparsam = q.get("power") === "full" ? false : q.get("power") === "low" || istAltgeraet();
      document.documentElement.classList.toggle("is-low", renderer.sparsam);
      renderer.setMode("2d");
      let ha = null;
      let haStatus = "aus";
      let haMeldung = "";
      let letzterKurz = "idle";
      let letzterWechsel = 0;
      let bildKurz = "idle";
      let audioFrei = false;
      let tuerAuf = false;
      let hinweisQuelle = "";
      let schauLaeuft = false;
      let schauIndex = 0;
      let schauSeit = 0;
      let wachBis = 0;
      let dimIst = 1;
      let pauseAn = false;
      let eckTimer = 0;
      let eckStart = null;
      let last = performance.now();
      let lastDraw = 0;
      let reaktion = null;
      let scheinPulse = [];
      let stoerungAktiv = false;
      let druck = null;
      let langTimer = 0;
      let modus = "normal";
      let laufIndex = 0;
      let laufSeit = 0;
      let introIndex = 0;
      let introSeit = 0;
      let introTimer = 0;
      let tippZeiten = [];
      let tippGesamt = 0;
      let eckeHinweisGesehen = false;
      const LANG_MS = 720;
      const ECKE_HINT_KEY = "eye_ui_hint_ecke";
      try {
        eckeHinweisGesehen = localStorage.getItem(ECKE_HINT_KEY) === "1";
      } catch (e) {
      }
      function el(id) {
        return document.getElementById(id);
      }
      function t(key) {
        return translate(locale, key);
      }
      function param(name, alt) {
        if (q.has(name)) return q.get(name);
        if (alt && q.has(alt)) return q.get(alt);
        return null;
      }
      function zielId(node) {
        let n = node;
        while (n && n !== document) {
          if (n.id === "ecke" || n.id === "hinweis" || n.id === "wahl" || n.id === "wahl-demo" || n.id === "wahl-intro") return n.id;
          n = n.parentNode;
        }
        return "";
      }
      function liesZugang() {
        const neu = ladeKonfig(q, void 0, siteDatei, location);
        if (istDemoHost(location.hostname)) return { url: "", token: "" };
        return { url: neu.haUrl || "", token: neu.haToken || "" };
      }
      function gehoert() {
        return !!(audioFrei && audio.status().freigegeben);
      }
      let reaktionHoren = "";
      function ersterKontakt() {
        const neu = !audioFrei;
        if (audioFrei) return;
        audioFrei = true;
        syncHearHint();
        audio.unlock().catch(() => {
        });
        if (neu && reaktionHoren) {
          const id = reaktionHoren;
          reaktionHoren = "";
          spieleReaktion(id, { ton: true, erzwingen: true });
        }
      }
      function pegel(gain) {
        const laut = konfig.lautstaerke == null ? 0.8 : konfig.lautstaerke;
        return Math.max(0, Math.min(1, (gain == null ? 1 : gain) * laut));
      }
      function spieleDatei(name, gain) {
        if (!audioFrei || !konfig.ton || !name) return;
        audio.unlock().then(() => {
          if (audio.status().freigegeben) audio.ton({ sound: name, gain: pegel(gain) });
        }).catch(() => {
        });
      }
      function merkePulse(pulses) {
        if (!pulses || !pulses.length) return;
        const jetzt = performance.now();
        const bleiben = [];
        for (let i = 0; i < scheinPulse.length; i++) if (scheinPulse[i].at + scheinPulse[i].ms > jetzt - 40) bleiben.push(scheinPulse[i]);
        for (let i = 0; i < pulses.length; i++) bleiben.push(pulses[i]);
        scheinPulse = bleiben.length > 16 ? bleiben.slice(bleiben.length - 16) : bleiben;
      }
      function sag(phraseId, gain) {
        if (!phraseId || !konfig.ton) return;
        const phrase = stimme.plan(phraseId, performance.now());
        if (!phrase) return;
        const laut = pegel(gain == null ? 1 : gain);
        if (!audioFrei) {
          merkePulse(stimme.spiel(null, phrase, 0, performance.now()));
          return;
        }
        audio.unlock().then(() => {
          const ctx = audio.context();
          const frei = audio.status().freigegeben;
          merkePulse(stimme.spiel(frei ? ctx : null, phrase, frei ? laut : 0, performance.now()));
        }).catch(() => {
        });
      }
      function spieleReaktion(id, opt) {
        const o = opt || {};
        const rend = reaktionen.start(id, augen.now, o);
        if (!rend) return null;
        const live = konfig.lebendigkeit == null ? 0.7 : konfig.lebendigkeit;
        const basis = o.staerke == null ? 1 : o.staerke;
        reaktion = {
          rend,
          t0: augen.now,
          staerke: basis * (0.4 + 0.6 * Math.max(0, Math.min(1, live))),
          blick: o.blick !== false
        };
        if (o.ton !== false) sag(rend.phrase, o.gain == null ? 0.85 : o.gain);
        return rend;
      }
      function legeReaktion(pose) {
        if (!reaktion) return pose;
        const t2 = augen.now - reaktion.t0;
        if (t2 >= reaktion.rend.dur) {
          reaktion = null;
          return pose;
        }
        const extra = poseBei(reaktion.rend, t2);
        const s = staerke(t2, reaktion.rend.dur) * reaktion.staerke;
        return mische(pose, extra, s, reaktion.blick);
      }
      function istStoerung() {
        if (modus === "schlafwahl" || modus === "intro" || modus === "lauf" || schauLaeuft || haStatus === "mock") return false;
        if (haStatus === "fehler" || haStatus === "auth_ungueltig" || haStatus === "getrennt") return true;
        if (haMeldung === "tokenMissing" && konfig.haUrl) return true;
        if (haMeldung === "tokenRejected" || haMeldung === "connectFailed" || haMeldung === "connectionTrouble") return true;
        return false;
      }
      function zeichneCaption() {
        const node = el("caption");
        if (!node) return;
        if (istStoerung() && !tuerAuf && bildKurz !== "angry") {
          node.hidden = false;
          node.className = "is-on";
          const zeile2 = captionLine(locale, "stoerung");
          node.textContent = zeile2 && zeile2.text ? zeile2.text : "One moment.";
          return;
        }
        if (bildKurz === "schlafen") {
          node.hidden = false;
          node.className = "is-on is-sleep";
          node.textContent = "Zzzzzz...";
          return;
        }
        if (!konfig.caption || bildKurz === "idle") {
          node.hidden = true;
          node.className = "";
          node.textContent = "";
          return;
        }
        const zeile = captionLine(locale, bildKurz, konfig.states);
        if (!zeile || !zeile.text) {
          node.hidden = true;
          node.textContent = "";
          return;
        }
        node.hidden = false;
        node.className = bildKurz === "angry" ? "is-on is-alarm" : "is-on";
        node.textContent = zeile.text;
      }
      let alarmPuls = 0;
      function stopAlarmTon() {
        clearInterval(alarmPuls);
        alarmPuls = 0;
      }
      function tonFuer(kurz, gainScale) {
        if (!audioFrei || !konfig.ton) return;
        const clip = BY[KURZ[kurz]];
        if (!clip) return;
        const skala = gainScale == null ? 1 : gainScale;
        audio.unlock().then(() => {
          if (!audio.status().freigegeben) return;
          if (kurz !== "angry") stopAlarmTon();
          if (kurz === "angry" && clip.sound) {
            audio.ton({ sound: clip.sound, gain: pegel((konfig.alarmStaerke === "normal" ? 0.6 : 1) * skala) });
            return;
          }
          if (clip.sound) audio.ton({ sound: clip.sound, s_off: clip.s_off, gain: pegel((clip.gain == null ? 1 : clip.gain) * skala) });
        }).catch(() => {
        });
      }
      function syncDemoTrack() {
        const an = schauLaeuft && bildKurz === "musik_an";
        if (an && !demoMusik.playing && gehoert()) {
          audio.unlock().then(() => demoMusik.start(audio.context())).catch(() => {
          });
        } else if (!an && demoMusik.playing) demoMusik.stop();
      }
      function wendeZustand(roh, opt) {
        const ton = !opt || opt.ton !== false;
        const erzwingen = !!(opt && opt.erzwingen);
        const kurz = mapHaState(roh);
        if (kurz === "wake") {
          if (tuerAuf) return false;
          const variante = wecker.impuls({ schlaeft: waechter.schlaeft, an: true, puls: true });
          if (variante) starteWecken(variante);
          return !!variante;
        }
        if (kurz === "sprechen") {
          if (tuerAuf) return false;
          waechter.beruehrt();
          augen.set(KURZ.idle);
          bildKurz = "sprechen";
          letzterKurz = "sprechen";
          letzterWechsel = performance.now();
          zeichneCaption();
          return true;
        }
        if (!kurz || !KURZ[kurz]) return false;
        if (tuerAuf && kurz !== "angry") return false;
        const alter = performance.now() - letzterWechsel;
        if (!erzwingen && kurz === letzterKurz && (!ton || alter < 4e3)) {
          if (kurz === "schlafen") waechter.einschlafen();
          else waechter.beruehrt();
          return false;
        }
        if (kurz === "schlafen") waechter.einschlafen();
        else waechter.beruehrt();
        if (kurz === "angry") reaktion = null;
        augen.set(KURZ[kurz]);
        bildKurz = kurz;
        letzterKurz = kurz;
        letzterWechsel = performance.now();
        if (kurz === "schlafen" && ton) {
          spieleReaktion("sleepy", { ton: true, erzwingen: true, staerke: 0.62, gain: 0.7 });
          tonFuer(kurz, 0.28);
        } else if (ton) tonFuer(kurz);
        if (kurz === "zuhoeren" || kurz === "sprechen" || kurz === "musik_an") {
          const phraseId = kurz === "zuhoeren" ? "curious" : kurz === "musik_an" ? "happy" : "content";
          const phrase = bauePhrase(phraseId, Math.random, null);
          const start = performance.now();
          const pulses = [];
          for (let i = 0; i < phrase.notes.length; i++) {
            const n = phrase.notes[i];
            pulses.push({ at: start + n.at * 1e3, ms: Math.max(80, n.dur * 1e3), amp: 0.45 + Math.min(0.4, n.gain) });
          }
          merkePulse(pulses);
        }
        zeichneCaption();
        syncDemoTrack();
        return true;
      }
      function starteWecken(variante) {
        if (!variante || tuerAuf) return;
        waechter.beruehrt();
        augen.set(KURZ.idle);
        bildKurz = "idle";
        letzterKurz = "idle";
        letzterWechsel = performance.now();
        augen.glance = [variante.gx, variante.gy];
        augen.nextGlance = augen.now + variante.hold;
        augen.nextBlink = augen.now + variante.hold + 2;
        augen.schau(variante.gx, variante.gy);
        if (augen.touch) augen.touch.dur = Math.max(0.7, variante.hold);
        augen.blick.bis(augen.now + Math.max(0.7, variante.hold));
        const warte = Math.max(0, Math.round(variante.blink * 1e3));
        setTimeout(() => {
          augen.blinkAt = augen.now;
        }, warte);
        wachBis = performance.now() + variante.hold * 1e3;
        setTimeout(() => spieleDatei(variante.sound, 0.75), 180);
        spieleReaktion("startled", { ton: true, blick: false, erzwingen: true, gain: 0.5 });
        zeichneCaption();
      }
      function zeigeHinweis(text, quelle) {
        const aktion = hinweis.setzen(text);
        const node = el("hinweis");
        const body = el("hinweis-text");
        if (aktion === "leer") {
          if (node) node.hidden = true;
          if (body) body.textContent = "";
          return aktion;
        }
        if (aktion !== "zeigen") return aktion;
        hinweisQuelle = quelle || "ha";
        if (!tuerAuf) {
          waechter.beruehrt();
          if (bildKurz === "schlafen") {
            augen.set(KURZ.idle);
            bildKurz = "idle";
            letzterKurz = "idle";
          }
        }
        wachBis = Math.max(wachBis, performance.now() + 1800);
        if (!tuerAuf && bildKurz !== "angry") {
          spieleReaktion(reaktionen.aus(HINWEIS_POOL), { ton: true, erzwingen: true, gain: 0.7 });
        }
        if (node) node.hidden = false;
        const label = el("hinweis-label");
        if (label) label.textContent = t("hint.forget");
        if (body) body.textContent = hinweis.text;
        spieleDatei(HINWEIS_TON, 0.45);
        zeichneCaption();
        return aktion;
      }
      function quittiereHinweis() {
        if (!hinweis.offen) return;
        const quelle = hinweisQuelle;
        hinweis.quittieren();
        const node = el("hinweis");
        if (node) node.hidden = true;
        const body = el("hinweis-text");
        if (body) body.textContent = "";
        if (ackAnHa(quelle) && ha && konfig.reminderAckScript) ha.callScript(konfig.reminderAckScript);
        if (!tuerAuf && bildKurz !== "angry") {
          spieleReaktion(reaktionen.aus(ACK_POOL), { ton: true, erzwingen: true, gain: 0.65 });
        }
      }
      function zeigeDemoHinweis() {
        if (hinweis.offen && hinweisQuelle === "ha") return;
        zeigeHinweis(t("hint.demo"), "demo");
      }
      function pruefeTuer(state) {
        const offen2 = tuerOffen(state);
        if (offen2 === tuerAuf) return;
        tuerAuf = offen2;
        if (offen2) wendeZustand("angry", { ton: true, erzwingen: true });
        else {
          wendeZustand("idle", { ton: false, erzwingen: true });
          spieleReaktion("relieved", { ton: true, erzwingen: true, gain: 0.7 });
        }
      }
      function onStates(liste2) {
        if (!liste2) return;
        for (let i = 0; i < liste2.length; i++) {
          const e = liste2[i];
          if (!e || !e.entity_id) continue;
          if (konfig.tuer && e.entity_id === konfig.tuer) pruefeTuer(e.state);
          if (!schauLaeuft && konfig.presenceEntity && e.entity_id === konfig.presenceEntity) {
            const variante = wecker.impuls({ schlaeft: waechter.schlaeft, an: anwesend(e.state) });
            if (variante) starteWecken(variante);
          }
          if (konfig.reminderEntity && e.entity_id === konfig.reminderEntity) zeigeHinweis(e.state, "ha");
        }
      }
      function eingang(aktion) {
        if (!aktion || schauLaeuft) return;
        wendeZustand(aktion.zustand, { ton: aktion.ton !== false });
      }
      function setStatus(s) {
        if (!s) return;
        if (s.status) haStatus = s.status;
        if ("meldung" in s) haMeldung = sichereMeldung(s.meldung || "");
        zeichneCaption();
      }
      function syncHearHint() {
        const node = el("hear-hint");
        if (!node) return;
        const ruhig = modus === "schlafwahl" || modus === "intro" || modus === "lauf";
        node.hidden = !!audioFrei || ruhig;
        if (!node.hidden) node.textContent = t("hint.hear");
      }
      function syncUhr() {
        const node = el("uhr");
        if (!node) return;
        node.hidden = !konfig.uhr;
        if (!konfig.uhr) return;
        const d = /* @__PURE__ */ new Date();
        const h = d.getHours();
        const m = d.getMinutes();
        node.textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
      }
      function syncDim(dt) {
        const node = el("dim");
        if (!node) return;
        let ziel = helligkeit(waechter.ruhe(), konfig.schlafSekunden, konfig);
        if (waechter.schlaeft && modus === "normal") ziel = Math.min(ziel, konfig.dimStufe || 0.3);
        if (schauLaeuft || hinweis.offen || tuerAuf || modus === "schlafwahl" || modus === "intro" || modus === "lauf") ziel = 1;
        dimIst += (ziel - dimIst) * Math.min(1, (dt || 0.016) * 2);
        node.style.opacity = String(Math.max(0, Math.min(0.92, 1 - dimIst)));
      }
      function syncPause() {
        const pausieren = !!(hinweis.offen || schauLaeuft || tuerAuf || modus === "schlafwahl" || modus === "intro" || modus === "lauf");
        if (pausieren === pauseAn) return;
        pauseAn = pausieren;
        waechter.setPause(pausieren);
      }
      function sprungSchau(schritt) {
        if (istReaktion(schritt.kurz)) {
          if (bildKurz !== "idle") wendeZustand("idle", { ton: false, erzwingen: true });
          spieleReaktion(schritt.kurz, { ton: true, erzwingen: true });
          syncDemoTrack();
          return;
        }
        wendeZustand(schritt.kurz, { ton: true, erzwingen: true });
        syncDemoTrack();
      }
      function starteSchau() {
        schauLaeuft = true;
        schauIndex = 0;
        schauSeit = performance.now();
        waechter.setPause(true);
        pauseAn = true;
        zeigeDemoHinweis();
        sprungSchau(demoSchritt(0));
      }
      function tickSchau(now) {
        if (!schauLaeuft) return;
        const schritt = demoSchritt(schauIndex);
        if (now - schauSeit < schritt.ms) return;
        if (schritt.musik && demoMusik.playing) demoMusik.stop();
        schauIndex = schritt.naechster;
        schauSeit = now;
        sprungSchau(demoSchritt(schauIndex));
      }
      function stoppeSchau() {
        if (!schauLaeuft) return;
        schauLaeuft = false;
        if (demoMusik.playing) demoMusik.stop();
        if (hinweisQuelle === "demo") {
          hinweis.quittieren();
          const node = el("hinweis");
          if (node) node.hidden = true;
        }
        if (ohneHaus(konfig, location)) zeigeSchlafWahl();
        else {
          waechter.setPause(false);
          pauseAn = !!(hinweis.offen || tuerAuf);
          wendeZustand("idle", { ton: false, erzwingen: true });
        }
      }
      function eckLos() {
        if (eckTimer) clearTimeout(eckTimer);
        eckTimer = 0;
        eckStart = null;
      }
      function starteHa() {
        if (ha && ha.stop) ha.stop();
        ha = null;
        if (q.get("ha") === "mock" || demoBesuch(konfig, location, q)) {
          ha = mockHa(eingang, setStatus, null, { onStates });
          return;
        }
        ha = verbindeHa({
          url: konfig.haUrl,
          token: konfig.haToken,
          entityId: konfig.haEntity,
          onZustand: eingang,
          onStatus: setStatus,
          onStates,
          liesZugang
        });
      }
      function beiSicht() {
        if (document.visibilityState && document.visibilityState !== "visible") return;
        if (ha && ha.nudge) ha.nudge();
      }
      function pruefeStoerung() {
        if (modus === "schlafwahl" || modus === "intro" || modus === "lauf") return;
        const an = istStoerung();
        if (!an) {
          stoerungAktiv = false;
          return;
        }
        if (stoerungAktiv || performance.now() < 2500 || tuerAuf || bildKurz === "angry") return;
        stoerungAktiv = true;
        spieleReaktion(reaktionen.aus(FEHLER_POOL), { ton: true, staerke: 0.55, gain: 0.45 });
      }
      function versteckeWahl() {
        const wahl = el("wahl");
        if (wahl) wahl.hidden = true;
      }
      function versteckeIntro() {
        if (introTimer) clearTimeout(introTimer);
        introTimer = 0;
        const node = el("intro");
        if (!node) return;
        node.className = "";
        node.hidden = true;
      }
      function zeigeSchlafWahl() {
        modus = "schlafwahl";
        schauLaeuft = false;
        versteckeIntro();
        const wahl = el("wahl");
        const demo = el("wahl-demo");
        const intro = el("wahl-intro");
        if (demo) demo.textContent = t("welcome.demo");
        if (intro) intro.textContent = t("welcome.intro");
        if (wahl) wahl.hidden = false;
        waechter.setPause(true);
        pauseAn = true;
        reaktion = null;
        wendeZustand("schlafen", { ton: false, erzwingen: true });
        syncHearHint();
      }
      function abbrechenVorfuehrung() {
        if (demoMusik.playing) demoMusik.stop();
        schauLaeuft = false;
        if (hinweis.offen) {
          hinweis.quittieren();
          const note = el("hinweis");
          if (note) note.hidden = true;
        }
        versteckeIntro();
        reaktion = null;
        if (ohneHaus(konfig, location)) zeigeSchlafWahl();
        else {
          modus = "normal";
          versteckeWahl();
          waechter.setPause(!!(hinweis.offen || tuerAuf));
          pauseAn = !!(hinweis.offen || tuerAuf);
          wendeZustand("idle", { ton: false, erzwingen: true });
          syncHearHint();
        }
      }
      function sprungLauf(schritt) {
        if (schritt.kurz === "wake") {
          starteWecken(WAKE_VARIANTS[schritt.index % WAKE_VARIANTS.length]);
          return;
        }
        if (schritt.kurz === "reminder") {
          zeigeHinweis(t("hint.demo"), "demo");
          return;
        }
        if (hinweis.offen && hinweisQuelle === "demo") {
          hinweis.quittieren();
          const note = el("hinweis");
          if (note) note.hidden = true;
        }
        if (schritt.kurz === "angry") {
          wendeZustand("angry", { ton: true, erzwingen: true });
          return;
        }
        if (schritt.kurz === "relieved") {
          wendeZustand("idle", { ton: false, erzwingen: true });
          spieleReaktion("relieved", { ton: true, erzwingen: true });
          return;
        }
        if (istReaktion(schritt.kurz)) {
          if (bildKurz !== "idle") wendeZustand("idle", { ton: false, erzwingen: true });
          spieleReaktion(schritt.kurz, { ton: true, erzwingen: true });
          return;
        }
        wendeZustand(schritt.kurz, { ton: true, erzwingen: true });
      }
      function starteLauf() {
        modus = "lauf";
        versteckeWahl();
        versteckeIntro();
        waechter.beruehrt();
        waechter.setPause(true);
        pauseAn = true;
        laufIndex = 0;
        laufSeit = performance.now();
        sprungLauf(empfangSchritt(0));
        syncHearHint();
      }
      function tickLauf(now) {
        if (modus !== "lauf") return;
        const schritt = empfangSchritt(laufIndex);
        if (now - laufSeit < schritt.ms) return;
        laufIndex = schritt.naechster;
        laufSeit = now;
        sprungLauf(empfangSchritt(laufIndex));
      }
      function zeigeIntroZeile(index) {
        const node = el("intro");
        const text = el("intro-text");
        if (!node || !text) return;
        text.textContent = t(INTRO_KEYS[index]);
        node.hidden = false;
        node.className = "";
        if (introTimer) clearTimeout(introTimer);
        introTimer = setTimeout(() => {
          node.className = "is-on";
        }, 40);
      }
      function starteIntro() {
        modus = "intro";
        versteckeWahl();
        waechter.beruehrt();
        waechter.setPause(true);
        pauseAn = true;
        wendeZustand("idle", { ton: false, erzwingen: true });
        introIndex = 0;
        introSeit = performance.now();
        zeigeIntroZeile(0);
        syncHearHint();
      }
      function tickIntro(now) {
        if (modus !== "intro") return;
        if (now - introSeit < INTRO_MS) return;
        introIndex += 1;
        introSeit = now;
        if (introIndex >= INTRO_KEYS.length) {
          abbrechenVorfuehrung();
          return;
        }
        const node = el("intro");
        if (node) node.className = "";
        if (introTimer) clearTimeout(introTimer);
        introTimer = setTimeout(() => {
          if (modus === "intro") zeigeIntroZeile(introIndex);
        }, 380);
      }
      function merkeTipp(now) {
        const z = tippFenster(tippZeiten, now, 2200);
        tippZeiten = z.zeiten;
        tippGesamt += 1;
        if (z.settings) {
          location.href = "settings.html";
          return true;
        }
        if (eckeHinweisFaellig(eckeHinweisGesehen, tippGesamt) && modus === "normal") {
          eckeHinweisGesehen = true;
          try {
            localStorage.setItem(ECKE_HINT_KEY, "1");
          } catch (e) {
          }
          const node = el("ecke-hint");
          if (node) {
            node.hidden = false;
            node.textContent = t("hint.corner");
            setTimeout(() => {
              node.hidden = true;
            }, 6500);
          }
        }
        return false;
      }
      function frame(now) {
        tickSchau(now);
        tickLauf(now);
        tickIntro(now);
        const dt = Math.min(0.1, (now - last) / 1e3);
        last = now;
        syncPause();
        pruefeStoerung();
        const pose = legeReaktion(augen.tick(dt));
        if (!pauseAn && waechter.tick() === "einschlafen") {
          wecker.eingeschlafen();
          wendeZustand("schlafen", { ton: true });
        }
        syncDim(dt);
        if (pose && renderer.sparsam && now - lastDraw < 50) {
          requestAnimationFrame(frame);
          return;
        }
        lastDraw = now;
        let lichtKurz = bildKurz;
        if (tuerAuf || bildKurz === "angry") lichtKurz = "angry";
        else if (hinweis.offen || now < wachBis) lichtKurz = "verstanden";
        const befehl = lichtBefehl(lichtKurz, { alarmStark: konfig.alarmStaerke !== "normal" });
        const puls = pulsHuelle(now, scheinPulse);
        renderer.setLicht({
          profil: konfig.lichtProfil === "lebhaft" ? "lebhaft" : "ruhig",
          zustand: befehl.name,
          rgb: befehl.rgb,
          alarmStark: konfig.alarmStaerke !== "normal",
          huelle: puls
        });
        const ring = befehl.alarm ? [befehl.rgb, 1, null, "angry"] : augen.ring || [[255, 106, 0], 0.2, null];
        renderer.render(pose, ring);
        requestAnimationFrame(frame);
      }
      syncHearHint();
      syncUhr();
      setInterval(syncUhr, 1e3);
      starteHa();
      const startState = param("state", "zustand");
      const sequence = param("sequence", "sequenz");
      const reaktionStart = param("reaction", "reaktion");
      const willkommen = sollWillkommen(konfig, location, q);
      if (startState) wendeZustand(startState, { ton: false, erzwingen: true });
      if (param("intro") === "1" && !startState && !sequence) starteIntro();
      else if (param("lauf") === "1" && !startState && !sequence) starteLauf();
      else if (param("tour", "ablauf") || param("demo") === "1" && !startState && !sequence && !reaktionStart) starteSchau();
      else if (reaktionStart && istReaktion(reaktionStart)) {
        reaktionHoren = reaktionStart;
        wendeZustand("idle", { ton: false, erzwingen: true });
        spieleReaktion(reaktionStart, { ton: false, erzwingen: true });
      } else if (sequence) {
        const namen = sequence.split(",").map((s) => s.trim()).filter(Boolean);
        const jede = Math.max(400, (+param("sequence_s", "sequenz_s") || 3) * 1e3);
        let i = 0;
        const schritt = () => {
          if (!namen.length) return;
          const roh = namen[i % namen.length];
          i += 1;
          if (ha && ha.einspeisen) ha.einspeisen(roh);
          else wendeZustand(roh, { ton: true, erzwingen: true });
        };
        setTimeout(() => {
          schritt();
          setInterval(schritt, jede);
        }, 400);
      } else if (willkommen) zeigeSchlafWahl();
      window.addEventListener("resize", () => renderer.resize());
      window.addEventListener("online", () => {
        if (ha && ha.nudge) ha.nudge();
      });
      window.addEventListener("pageshow", beiSicht);
      document.addEventListener("visibilitychange", beiSicht);
      window.addEventListener("storage", () => {
        if (ha && ha.nudge) ha.nudge();
      });
      window.addEventListener("touchstart", ersterKontakt, true);
      window.addEventListener("mousedown", ersterKontakt, true);
      onZeiger(el("hinweis"), "up", () => {
        ersterKontakt();
        if (modus === "lauf" || modus === "intro") {
          abbrechenVorfuehrung();
          return;
        }
        quittiereHinweis();
      });
      onZeiger(el("ecke"), "down", (e) => {
        ersterKontakt();
        eckLos();
        eckStart = { x: e.clientX, y: e.clientY };
        eckTimer = setTimeout(() => {
          eckTimer = 0;
          location.href = "settings.html";
        }, ECK_MS);
      });
      onZeiger(el("ecke"), "up", eckLos);
      onZeiger(el("ecke"), "cancel", eckLos);
      onZeiger(el("ecke"), "move", (e) => {
        if (!eckStart) return;
        if (Math.abs(e.clientX - eckStart.x) > 28 || Math.abs(e.clientY - eckStart.y) > 28) eckLos();
      });
      const ecke = el("ecke");
      if (ecke) {
        ecke.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          location.href = "settings.html";
        });
      }
      onZeiger(el("wahl-demo"), "up", () => {
        ersterKontakt();
        starteLauf();
      });
      onZeiger(el("wahl-intro"), "up", () => {
        ersterKontakt();
        starteIntro();
      });
      onZeiger(document.body, "down", (e) => {
        ersterKontakt();
        if (zielId(e.target)) return;
        if (modus === "lauf" || modus === "intro" || schauLaeuft) {
          if (schauLaeuft) stoppeSchau();
          if (modus === "lauf" || modus === "intro") abbrechenVorfuehrung();
          return;
        }
        if (modus === "schlafwahl") {
          merkeTipp(performance.now());
          return;
        }
        if (tuerAuf || bildKurz === "angry") {
          waechter.beruehrt();
          return;
        }
        schauAuf(e);
        if (waechter.schlaeft) {
          wendeZustand("hallo", { ton: true, erzwingen: true });
          return;
        }
        waechter.beruehrt();
        druck = { x: e.clientX, y: e.clientY, lang: false };
        if (langTimer) clearTimeout(langTimer);
        langTimer = setTimeout(() => {
          langTimer = 0;
          if (!druck) return;
          druck.lang = true;
          spieleReaktion("content", { ton: true, erzwingen: true, gain: 0.6 });
        }, LANG_MS);
      });
      onZeiger(document.body, "move", (e) => {
        if (!druck || druck.lang) return;
        if (Math.abs(e.clientX - druck.x) > 28 || Math.abs(e.clientY - druck.y) > 28) {
          if (langTimer) clearTimeout(langTimer);
          langTimer = 0;
        }
      });
      onZeiger(document.body, "up", (e) => {
        if (!druck) return;
        const lang = druck.lang;
        const moved = Math.abs(e.clientX - druck.x) > 28 || Math.abs(e.clientY - druck.y) > 28;
        if (langTimer) clearTimeout(langTimer);
        langTimer = 0;
        druck = null;
        if (lang || moved || zielId(e.target)) return;
        if (merkeTipp(performance.now())) return;
        const id = stupser.tipp(performance.now());
        const live = konfig.lebendigkeit == null ? 0.7 : konfig.lebendigkeit;
        if (id === "grumpy" || live >= 0.12) {
          spieleReaktion(id, { ton: live > 0.15 || id === "grumpy", erzwingen: id === "grumpy" });
        }
      });
      function schauAuf(e) {
        const z = blickZumPunkt(e.clientX, e.clientY, window.innerWidth || 1, window.innerHeight || 1);
        augen.schau(z.gx, z.gy);
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(() => {
        });
      }
      requestAnimationFrame(frame);
    });
  }
  __legacyBoot();
})();
