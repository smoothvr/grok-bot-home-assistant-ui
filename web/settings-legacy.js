// SPDX-License-Identifier: MIT
// Built for Safari 10.1 (iOS 10.3). Refresh with npm run build.

(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
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
  function translate(locale2, key, vars) {
    var _a;
    const lang = UI[locale2] ? locale2 : "en";
    let text = (_a = UI[lang][key]) != null ? _a : UI.en[key];
    if (text == null) return "";
    if (vars) {
      for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  }

  // web/konfig.js
  var DEMO_HOST = "grok-bot-ui.herrvonundzu.eu";
  function istDemoHost(host) {
    return String(host || "").replace(/\.+$/, "").toLowerCase() === DEMO_HOST;
  }
  function demoSperre(host) {
    return istDemoHost(host);
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
  function speichereKonfig(konfig2, storage, opt) {
    const s = speicher(storage);
    if (!s) return;
    const tokenLoeschen = !!(opt && opt.tokenLoeschen);
    const paket = lesePaket(s);
    const profiles = {
      phone: paket.neu ? __spreadValues({}, paket.phone) : {},
      tablet: paket.neu ? __spreadValues({}, paket.tablet) : {}
    };
    const bekannt = nurBekannte(konfig2);
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
    const paket = lesePaket(s);
    const host = ort && (ort.hostname || ort.host) || "";
    const demoHost = istDemoHost(host);
    let gespeichert = {};
    let migrated = false;
    if (paket.neu) gespeichert = paket[klasse] || {};
    else gespeichert = paket.flat || {};
    if (!paket.neu && (lesen(s, KEY) || lesen(s, ALT_CONFIG))) migrated = true;
    if (paket.neu && paket.v < 4) migrated = true;
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
      const geliehen = tokenVon(paket.phone) || tokenVon(paket.tablet) || tokenVon(paket.flat) || tokenVon(paket.top) || String(lesen(s, ALT_TOKEN) || "").trim();
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
  function mitUrl(konfig2, params) {
    const p = params instanceof URLSearchParams ? params : new URLSearchParams(params || "");
    const n = __spreadValues({}, konfig2);
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

  // web/version.js
  var VERSION = "2.2.0";

  // web/reaktionen.js
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
  function spur(dauer, werte) {
    const n = werte.length;
    const keys = new Array(n);
    for (let i = 0; i < n; i++) {
      const t2 = n === 1 ? 0 : dauer * i / (n - 1);
      keys[i] = [t2, werte[i], i === 0 ? "lin" : "io"];
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

  // web/settings.js
  var q = new URLSearchParams(location.search);
  setzeKlasse(geraeteKlasse({
    width: window.innerWidth,
    height: window.innerHeight,
    touch: navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches
  }));
  var konfig = ladeKonfig(q, void 0, null, location);
  if (istDemoHost(location.hostname)) {
    konfig.haToken = "";
    vergissToken();
  }
  var locale = resolveLocale({ query: q.get("lang"), stored: konfig.lang, nav: navigator.language });
  var gesperrt = demoSperre(location.hostname);
  function el(id) {
    return document.getElementById(id);
  }
  function t(key) {
    return translate(locale, key);
  }
  function applyI18n() {
    const nodes = document.querySelectorAll("[data-i18n]");
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const text = t(node.getAttribute("data-i18n"));
      if (text) node.textContent = text;
    }
    const version = el("version");
    if (version) version.textContent = "v" + VERSION;
    document.documentElement.lang = locale;
    document.title = t("settings.title");
  }
  function setWert(id, wert) {
    const node = el(id);
    if (node) node.value = wert == null ? "" : String(wert);
  }
  function lies(id) {
    const node = el(id);
    return node ? String(node.value || "").trim() : "";
  }
  function fuellen() {
    var _a, _b;
    setWert("ha-url", konfig.haUrl || "");
    setWert("ha-token", "");
    setWert("ha-entity", konfig.haEntity || "");
    setWert("tuer-entity", konfig.tuer || "");
    setWert("presence-entity", konfig.presenceEntity || "");
    setWert("reminder-entity", konfig.reminderEntity || "");
    setWert("reminder-ack", konfig.reminderAckScript || "");
    setWert("schlaf-min", String(Math.round((konfig.schlafSekunden || 0) / 60)));
    setWert("dim-nach", String((_a = konfig.dimNachSekunden) != null ? _a : 60));
    setWert("dim-stufe", String(Math.round(((_b = konfig.dimStufe) != null ? _b : 0.3) * 100)));
    const ton = el("ton");
    if (ton) ton.checked = !!konfig.ton;
    setWert("lautstaerke", String(Math.round((konfig.lautstaerke == null ? 0.8 : konfig.lautstaerke) * 100)));
    setWert("lebendigkeit", String(Math.round((konfig.lebendigkeit == null ? 0.42 : konfig.lebendigkeit) * 100)));
    const uhr = el("uhr-an");
    if (uhr) uhr.checked = !!konfig.uhr;
    const alarm = el("alarm-staerke");
    if (alarm) alarm.value = konfig.alarmStaerke === "normal" ? "normal" : "stark";
    const sprache = el("sprache");
    if (sprache) sprache.value = konfig.lang || "auto";
    const token = el("ha-token");
    if (token) token.placeholder = konfig.haToken ? t("ph.tokenReplace") : t("ph.tokenEmpty");
    const fehler = el("form-fehler");
    if (fehler) fehler.textContent = "";
    const ids = ["ha-url", "ha-token", "ha-entity", "tuer-entity", "presence-entity", "reminder-entity", "reminder-ack"];
    for (let i = 0; i < ids.length; i++) {
      const node = el(ids[i]);
      if (node) node.readOnly = gesperrt;
    }
    const note = el("demo-sperre");
    if (note) {
      note.hidden = !gesperrt;
      note.textContent = gesperrt ? t("demo.locked") : "";
    }
  }
  function melden(key) {
    const node = el("form-fehler");
    if (node) node.textContent = t(key);
  }
  function uebernehmen(k) {
    k.schlafSekunden = Math.max(0, Math.round(Number(lies("schlaf-min")) * 60) || 0);
    k.dimNachSekunden = Math.max(0, Math.min(3600, Math.round(Number(lies("dim-nach"))) || 0));
    k.dimStufe = Math.max(0.05, Math.min(1, (Math.round(Number(lies("dim-stufe"))) || 30) / 100));
    k.ton = !!(el("ton") && el("ton").checked);
    k.lautstaerke = Math.max(0, Math.min(1, (Math.round(Number(lies("lautstaerke"))) || 0) / 100));
    k.lebendigkeit = Math.max(0, Math.min(1, (Math.round(Number(lies("lebendigkeit"))) || 0) / 100));
    k.uhr = !!(el("uhr-an") && el("uhr-an").checked);
    const gewaehlt = lies("sprache");
    k.lang = gewaehlt === "auto" ? "" : gewaehlt;
    k.alarmStaerke = lies("alarm-staerke") === "normal" ? "normal" : "stark";
  }
  function speichern(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    const k = __spreadValues({}, konfig);
    const loeschen = !!(el("token-loeschen") && el("token-loeschen").checked);
    if (!gesperrt) {
      const urlRoh = lies("ha-url");
      if (urlRoh) {
        const url = normalisiereHaUrl(urlRoh);
        if (!url) {
          melden("err.url");
          return;
        }
        k.haUrl = url;
      } else k.haUrl = "";
      const token = lies("ha-token");
      if (loeschen) k.haToken = "";
      else if (token) k.haToken = token;
      const felder = [
        ["ha-entity", "haEntity"],
        ["tuer-entity", "tuer"],
        ["presence-entity", "presenceEntity"],
        ["reminder-entity", "reminderEntity"]
      ];
      for (let i = 0; i < felder.length; i++) {
        const wert = lies(felder[i][0]).toLowerCase();
        if (wert && !gueltigeEntity(wert)) {
          melden("err.entity");
          return;
        }
        k[felder[i][1]] = wert;
      }
      const ack = lies("reminder-ack").toLowerCase();
      if (ack && !dienstAus(ack)) {
        melden("err.entity");
        return;
      }
      k.reminderAckScript = ack;
    }
    uebernehmen(k);
    speichereKonfig(k, void 0, { tokenLoeschen: !gesperrt && loeschen });
    if (gesperrt) vergissToken();
    location.href = "index.html";
  }
  applyI18n();
  fuellen();
  baueVorschau();
  var form = el("form");
  if (form) form.addEventListener("submit", speichern);
  function baueVorschau() {
    const box = el("preview-list");
    const details = el("preview-reactions");
    if (!box) return;
    if (q.get("preview") === "1" && details) details.open = true;
    for (let i = 0; i < REAKTION_IDS.length; i++) {
      const id = REAKTION_IDS[i];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preview-btn";
      button.textContent = id;
      button.addEventListener("click", () => {
        location.href = "index.html?demo=0&reaction=" + encodeURIComponent(id);
      });
      box.appendChild(button);
    }
  }
})();
