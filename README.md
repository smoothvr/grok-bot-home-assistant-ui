# Grok Bot Home Assistant UI

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/smoothvr/grok-bot-home-assistant-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/smoothvr/grok-bot-home-assistant-ui/actions/workflows/ci.yml)

A face for a wall-mounted tablet, such as an iPad. The screen is the eyes: emotions, a living edge light, and short sounds. Home Assistant on the local network drives the state. This page has no tiles, no theme switch, and no settings overlay.

**This is an unofficial community project. It is not affiliated with or endorsed by xAI or the Home Assistant project. Grok and Home Assistant are trademarks of their respective owners.**

Maintainer: [@smoothvr](https://github.com/smoothvr). About the maintainer: [HERRVONUNDZU, Digitalisierung & Automatisierung](https://www.herrvonundzu.eu/digitalisierung-automatisierung-4).

Voice is not part of this release. This page does not ask Grok anything, and it does not use the microphone.

## Quick start

```bash
npm test
npm start
```

Open <http://localhost:8000/>. On a Home Assistant box the page is served at `/local/eye-ui/index.html`. A folder URL returns 403, so open `index.html` itself. Asset URLs are relative, so the same files work under `/local/eye-ui/`.

Home Assistant caches `/local/` for 31 days. `index.html` points at `eye-ui.appcache`. `npm run appcache` writes a `# version` line from `VERSION`. When that cache is ready the page swaps it and reloads, including after a check about every 30 minutes and when the iPad wakes. Hosts should still send `Cache-Control: no-cache` for `sw.js` and `index.html`.

A public demo is live at <https://grok-bot-ui.herrvonundzu.eu>. It starts in demo mode. On that host no token is ever stored.

`npm test` refreshes `web/legacy.js` and `web/settings-legacy.js`. Those files are committed, so a plain static server can serve an iPad on iOS 10.3 without a build.

## Browsers

The minimum supported system is iOS 10.3. Current browsers load `web/app.js` as a module. Safari 10.1 ignores `nomodule`, so `web/index.html` runs a small feature check and, when that check fails, loads `web/legacy.js` as a classic script. The bundle is ES2015 (`npm run build`). `npm test` parses it with acorn at `ecmaVersion: 2015`.

Eyes and touch control keep working from iPad 4 / iOS 10.3.3, Safari 10.1: legacy build available, device test pending.

Sound uses `AudioContext`, or `webkitAudioContext` on iOS 10. The first touch anywhere unlocks it and keeps it unlocked. Before that touch, reactions are light only, and the page shows one small line: “tap me to hear me”.

An iPad on iOS 10, or a browser without Pointer Events, uses the low-power draw. `?power=low` forces it. `?power=full` forces the full glow.

Useful query parameters:

| Parameter | Effect |
|---|---|
| `?clock=1` | Show the 24-hour clock. It is off unless you turn it on. |
| `?lang=de` or `?lang=en` | Language for this visit. |
| `?sleep=20` | Sleep after 20 seconds. In the URL the value is seconds. In settings it is minutes. |
| `?demo=1` | Longer tour. It ends on music for 30 seconds, then starts again. `?demo=0` skips that tour. |
| `?lauf=1` | Play every reaction once, then keep looping. |
| `?welcome=0` | Skip the sleeping start. |
| `?door=binary_sensor.front_door` | Hold angry while this contact is open, and relax when it closes. |
| `?presence=binary_sensor.living_room_presence` | Wake from sleep when this sensor turns on. |
| `?alarm=strong` or `?alarm=normal` | Alarm intensity. `?alarm_intensity=` accepts the same words. Strong is the default. |
| `?live=0.7` or `?vol=1.6` | Liveliness and sound volume for this visit. Volume runs from 0 to 200 percent (`0.5` is half, `160` and `1.6` are 160 percent, `2` is 200 percent). |
| `?ha=mock&sequence=listening,done` | Play states without a server. |

Phone and tablet keep separate saved profiles in the same browser.

## The face

One look. The eyes are flat and full-screen on black. There is no square, no cube, and no frame around them. The edge light is the approved quiet profile: a soft glow along the bottom, breathing slowly between its low and high level. A phrase lifts that level with the sound, inside the same range, then it settles. Thinking and music let the glow rise up the sides. Lively, the moving wave, stays available. Red is the alarm while angry, and the error colour when something fails. The front door holds the alarm while its contact is open.

Sleep is in minutes. `0` keeps the eyes awake. After `dimAfter` seconds of quiet the page dims (30 percent unless you change it). While the eyes are asleep the screen stays dim. A tap wakes them. Presence can wake them only from sleep, and only again after the next sleep.

While idle the eyes saccade, glance to the sides and up, drift slowly, and tilt a little. Blinks come as a single, a double, a slow sleepy blink, or a half blink. A touch draws a look. A few quick pokes turn the face grumpy. A long press, about 0.7 seconds and not in the settings corner, makes it content. Each reaction has a few renditions and does not repeat the same one immediately.

The droid chatter is generated in the browser: short beeps and chirps, a little different every time, with a cooldown so a hallway does not get a stream of noise. The four wake hums are unchanged. The edge light follows those phrases inside the current colour's approved range.

Settings shows sleep, dimming, language, volume, liveliness, the clock, and the demo. The clock is off unless you turn it on. Volume runs from 0 to 200 percent in steps of 20, and the default is 160 percent. Liveliness is a few named steps. `0` keeps the gaze rare and skips casual tap reactions. A field that `config.local.json` already sets is left off the page. The collapsed Reactions list plays each reaction (`settings.html?preview=1` opens it). `?live=` and `?vol=` override the values for one visit. A new version still arrives through the application cache and through `input_button.eye_ui_reload`.

`speaking` on `input_select.eye_ui_state` lights the speaking colour while the eyes stay idle. `wake` on that same entity is the presence wake, not a separate clip.

A public demo, and a fresh page with no Home Assistant address or token, opens asleep. There is nothing else on the screen. The first tap wakes the eyes, unlocks sound, and plays every reaction once, then keeps looping. A tap during the loop still gets the usual answer, and the loop continues. On a configured install the face starts as usual. `?demo=1` runs the longer tour and holds music for 30 seconds. `?lauf=1` is the reaction showcase.

Hold the top-left corner for about 2 seconds to open settings, or tap the face five times. There is no gear and no sheet.

## Home Assistant

The page talks only to the local WebSocket API. On your own device the token stays only in that browser's localStorage, under `eye_ui_config`, and is never put in a URL or sent anywhere except your Home Assistant. A saved token and address from 1.0.x are kept. Settings are `settings.html` and use the same key.

Suggested helpers:

- `input_select.eye_ui_state` with options such as `idle`, `listening`, `thinking`, `angry`, `wake`, and `speaking`
- `input_text.eye_hinweis` for a reminder line, for example a bin day set at 08:00
- `script.eye_hinweis_quittieren` to clear that text
- `binary_sensor.front_door` for the angry hold
- `binary_sensor.living_room_presence` for the wake
- `input_button.eye_ui_reload` to reload the page when its last-pressed time changes. The first value after connect is ignored. A missing helper does nothing. `reloadEntity` in `config.local.json` can name another button.
- `binary_sensor.klingel_haustuer` for the doorbell. Each off-to-on edge is one ring. The first state after connect is ignored. `doorbellEntity` can name another sensor.
- `camera.hofkamera` for the doorbell picture (`doorbellCamera`). The page reads `access_token` from that camera and opens `/api/camera_proxy_stream/<entity>?token=...`, then a snapshot once a second if the stream does not show a frame. The Home Assistant address is the host in `haUrl`. A missing camera or a failed picture leaves the eyes full size, with no empty frame. `camera.gartenkamera` can be put in `doorbellCamera` later. Nothing else listens for a garden bell.
- `doorbellHoldSeconds` keeps that view open. The default is 90. Another ring extends it. A tap outside the picture closes it.

`option: angry` still works from an automation. `input_boolean.eye_guard` can set that option while a guard is on. The page itself holds angry for as long as the door entity is open, and returns to idle when the door closes.

The socket sends `ping` every 30 seconds and reconnects if `pong` does not arrive within 10 seconds. It also reconnects when the browser fires `online` or the page becomes visible. After `auth_invalid` the face shows a calm line and tries again every 60 seconds, reading the token from storage, so a token fixed in settings works without a reload.

### Security

On your own device the token stays only in that browser's localStorage. It is never put in a URL or sent anywhere except your Home Assistant. Every key present in `config.local.json` wins over the value stored on the iPad. A stored value is used only for a key the file does not contain. Settings shows those fields as centrally set, so a change there is not saved over the file. `volume` is a percent from 0 to 200. `reloadEntity` defaults to `input_button.eye_ui_reload`. `doorbellEntity`, `doorbellCamera`, and `doorbellHoldSeconds` set the doorbell. `presenceEntity`, `reminderEntity`, and `reminderAckScript` still work. See `web/config.example.json`. A URL parameter still wins for one visit. The file is readable by anyone on the LAN, so use a non-admin, local-only Home Assistant user. On the public demo host the address and the token from that file are ignored, and no token is ever stored.

## License

MIT. See [LICENSE](LICENSE).

GitHub Sponsors: <https://github.com/sponsors/smoothvr>.
