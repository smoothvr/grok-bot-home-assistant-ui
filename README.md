# Grok Bot Home Assistant UI

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/stefanvr82/grok-bot-home-assistant-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/stefanvr82/grok-bot-home-assistant-ui/actions/workflows/ci.yml)

Animated eyes for a wall-mounted tablet, such as an iPad. Simple commands, such as music and lights, go to Home Assistant on the local network. Real questions are handed on through your own Grok Bot setup. This page has no Grok client and no language model.

The eyes are upright rounded pills. Bold is the default: high contrast, and colour only as a short glow when a tap is acknowledged. Cube keeps a coloured cue at the screen edge. German and English follow the browser language.

**This is an unofficial community project. It is not affiliated with or endorsed by xAI or the Home Assistant project. Grok and Home Assistant are trademarks of their respective owners.**

Maintainer: [@stefanvr82](https://github.com/stefanvr82). About the maintainer: [HERRVONUNDZU, Digitalisierung & Automatisierung](https://www.herrvonundzu.eu/digitalisierung-automatisierung-4).

## Screenshots

The status line opens a sheet. The sheet ends with Demo. Settings assign the swipes. The clock, when it is on, sits clear of the corner, with the state under it.

![Quick sheet, English, with Demo](docs/sheet-en.png)

![Settings on a tablet, landscape](docs/settings-landscape-en.png)

![Settings on a phone](docs/settings-portrait-en.png)

![A state preview on the small bot](docs/settings-preview-en.png)

Flat view with the status line turned on, then settings beside the small bot.

![Thinking, English](docs/caption-thinking-en.png)

![Hi, English](docs/caption-hi-en.png)

![Listening, German](docs/caption-listening-de.png)

![Error, German](docs/caption-error-de.png)

![Settings, English](docs/settings-en.png)

![Settings, German](docs/settings-de.png)

Bold is the default. Cube draws the soft eyes in a square, and the coloured cues stay at the screen edge. While music or home mode is active, a swipe to the right opens that mode’s detail. Tap the same corner again to leave the mode. Tap the clock for My day.

![Home detail](docs/home-en.png)

![Cube](docs/cube-en.png)

![Fortune, the LED preview](docs/fortune-en.png)

![Bold, high contrast](docs/bold-en.png)

![Now playing](docs/now-playing-en.png)

![My day](docs/my-day-en.png)

![Demo tour](docs/demo-en.png)

## Inspiration

The idea of putting a pair of eyes on the wall started with [this post by @Texas_Twins_Dad](https://x.com/Texas_Twins_Dad/status/2114196344025878632). This repository is an independent tablet UI for a home that already runs Home Assistant.

## Quick start

```bash
npm test
npm start
```

Without npm:

```bash
node web/test_paritaet.mjs && node web/test_ha.mjs && node web/test_i18n.mjs
cd web && python3 -m http.server 8000
```

Open <http://localhost:8000/>.

A public demo is live at <https://grok-bot-ui.herrvonundzu.eu>. It starts in demo mode. On that host no token is ever stored.

`npm test` also refreshes `web/legacy.js`. That file is already in the folder, so the Python server can serve an iPad on iOS 10.3 without a build.

## Browsers

The minimum supported system is iOS 10.3. An iPad 4 on iOS 10.3.3 with Safari 10.1, an A6X, and 1 GB of RAM: legacy build available, device test pending.

Current browsers load `web/app.js` as a module. Safari 10.1 ignores `nomodule`, so `web/index.html` runs a small feature check and, when that check fails, loads `web/legacy.js` as a classic script. The bundle is ES2015, built from the same modules with esbuild (`npm run build`), and it is committed under `web/` so a plain static server can serve it. `npm test` parses that file with acorn at `ecmaVersion: 2015`.

Swipes, corners, and taps use Pointer Events where the browser has them, and touch events where it does not. Sound uses `AudioContext`, or `webkitAudioContext` on iOS 10.

An iPad on iOS 10, a device with about 1 GB of memory, or a browser without Pointer Events turns on a low-power mode for the flat eyes: the canvas stays at the screen size, draws less often, and skips the soft glow blur. The eye formulas still run every frame. `?power=low` forces that mode. `?power=full` forces the full glow.

Useful query parameters:

| Parameter | Effect |
|---|---|
| `?mode=vollbild` or `?mode=bold` | Bold. High contrast, no outline. This is the default. |
| `?mode=2d`, `?mode=cube`, or `?mode=cute` | Cube. Soft eyes in a square. `cute` is the previous name. |
| `?mode=led` or `?mode=fortune` | Fortune. The LED preview, with a round frame. |
| `?ha=mock&sequence=listening,done,not_understood&sequence_s=3` | Play states as if Home Assistant sent them. |
| `?lang=de` or `?lang=en` | Language for this visit. |
| `?caption=1` | Show the status line. It is on unless you turn it off. `?caption=0` hides it. |
| `?clock=1` | Show the 24-hour clock. It is off unless you turn it on. It sits outside the corner tap area. Tap it for My day. |
| `?np=1&media=media_player.living_room` | Follow a media player. `track` previews a line as title, artist, and an optional year, separated by vertical bars. |
| `?label=1` | Show the state under the clock. If the clock is off, only the state shows. |
| `?door=binary_sensor.front_door` | Wake and greet when this contact opens. Empty by default. |
| `?camera=camera.courtyard` | Camera preview in the home detail. Empty by default. |
| `?dim=60` | Seconds of quiet before idle dimming. The level and the sleep lead are settings. |
| `?zones=1` | Outline the invisible touch zones. |
| `?sleep=20` | Sleep after 20 seconds. In the URL the value is seconds. In settings it is minutes. |
| `?demo=1` | Loop the emotions, end on music for 30 seconds, then start again. `?demo=0` keeps a public page idle so it can be set up. |
| `?alarm=strong` or `?alarm=normal` | Alarm intensity. `strong` and `stark` are the same, and so are `normal` and `norm`. `?alarm_intensity=` accepts the same words. Strong is the default. |
| `?light=lebhaft` or `?light=ruhig` | Edge light. Lively is the default. Quiet is `ruhig`. `?licht_profil=` is the same. |
| `?light_state=speaking` or `?licht_zustand=sprechen` | Preview the speaking edge light. The eyes stay idle. |
| `?power=low` or `?power=full` | Force the cheaper 2D draw, or force the full glow. |
| `?lock=reset` | Clear the settings lock on this device. It does not change the token. |

Older parameter names (`modus`, `sequenz`, `sequenz_s`, `sequenz_pause`, `zonen`, `schlaf`, `zustand`, `ablauf`) still work. `vollbild` is the name of the plain black view.

The first touch anywhere unlocks sound, including the status line, the quick sheet, and settings. Nothing on screen asks for that tap. Idle and a glance stay silent. Every other state has its own tone. Every acknowledgement plays a sound. A wiggle plays a short original chirp. Mute in settings still silences the page.

## Language and status line

The interface is German and English. The page reads `navigator.language`, uses a saved choice when there is one, and falls back to English. `?lang=` and the language control in settings override that. The saved choice is in `localStorage` under `eye_ui_config`. An older save is copied once, including the token. Another language is a copy of the `en` blocks in [`web/strings.js`](web/strings.js).

The status line is a short sentence under the eyes, for example “Thinking” or “Denke nach”. It fades in, rises a little, and fades out. While the eyes are thinking, three dots bounce after the word. “I'm bored.” / “Bin gelangweilt.” appears only after the eyes have been idle for a while. The line is **on by default**. `?caption=0` hides it.

Tap the line itself and a sheet slides up from the bottom. It shows the current state and how long it has lasted, a short description, the Home Assistant connection, and the last command. The same sheet switches the status line, sound, language (German or English), the sleep timer, the clock, and now playing, and it links to the full settings. Tap outside the sheet or drag it down to close it. Tapping the eyes does not open it.

When the status line is switched off, a faint mark stays at the bottom center. Tap that mark and the line comes back for a moment. The same happens, with the sheet, when the line is enabled but has already faded. That tap wiggles the eyes for a fraction of a second and plays a short chirp. There is no tickle caption. The eye formulas themselves do not change.

The clock uses 24-hour time for the active language. It sits further from the right edge, outside the corner tap area, and it is off until you enable it. iOS still draws the status bar. This page cannot hide that bar, so the clock does not repeat it. The state name, when it is on, sits under the clock. Tap the clock for My day: a large clock, today’s events, and the small bot, with no outline. Tap the empty area above the bot to leave. The gesture action “Show the clock” shows it, and shows it again to hide it.

With no touch, the page dims to 30 percent after 60 seconds in the normal view. Those are `dimAfter` and `dimLevel`. The inactivity sleep timeout, 15 minutes by default, does not use `dimLead`, so dimming does not start at once. `dimLead` is only the ramp before a scheduled sleep time of day. A tap brings the brightness back.

Now playing reads one `media_player` entity over the same Home Assistant WebSocket. While its state is `playing`, the status area shows `media_title`, then `media_artist` when that attribute exists. A year is added only from a year or release-date attribute: `media_year`, `media_album_year`, `media_release_year`, `media_album_release_year`, `year`, `media_release_date`, `media_album_release_date`, `release_date`, `media_album_date`, or `media_date`. The value has to be a year from 1900 to 2099, or a date that starts with one. The title and the album name are never searched for a year. While a track is on screen it replaces the idle line. A real state line, such as “Listening…”, still plays through, and the track returns when that line fades. When playback stops, the idle line comes back. `music_on`, or playback that starts after thinking or understood, opens music mode and the now-playing detail with no swipe. The music corner leaves that view. Playback that stays stopped for 20 seconds leaves it too. Under the transport buttons, Up next lists up to five entries when the player exposes a queue, a playlist list, or `source_list`. A tap calls `media_player.play_media` or `media_player.select_source`. The block stays hidden when there is nothing to show. With no media player configured, the music state plays Orbit Drift instead, an original 80 second loop made in the browser. The line then reads “Orbit Drift, HVUZ Demo (2026)”. The musical work is CC0. It fades in and fades out. An empty, unavailable, or unknown player stays hidden and does not report an error.

Internal state ids stay as they are (`zuhoeren`, `nachdenken`, and the rest). Home Assistant may also send English names such as `listening`, `thinking`, `hello`, or `lights_off`.

## On a tablet

1. Copy the `web/` folder to Home Assistant as `/config/www/eyes/`. It is then available at `http://homeassistant.local:8123/local/eyes/index.html`. Any static server on the local network works the same way. Add `?mode=cube` when the square view should open for that visit.
2. Open that address in Safari, share, and choose **Add to Home Screen**. The icon opens without the browser bar, in landscape, on a black background. The first visit uses Bold until a theme is saved.
3. Tap once, anywhere. That unlocks sound, asks the screen to stay awake, and asks for landscape, as far as the system allows.
4. Set **Settings → Display & Brightness → Auto-Lock → Never**. Over plain `http` on the local network, Safari does not provide the Screen Wake Lock API or a service worker. The eyes, sound, gestures, settings, and a `ws://` Home Assistant connection still work, and the home-screen icon still opens without the Safari bar. Offline cache and the wake lock need HTTPS, or localhost.
5. Turn on **Accessibility → Guided Access** if the tablet should stay in this page.
6. Tap the top-left corner five times to open settings. Enter the address, the long-lived token, and the entity names, then save. Every name can be changed there, or for one visit with `entity`, `media`, `music_on`, `music_off`, `light_on`, and `light_off`. On your own device the token stays only in that browser's localStorage, under `eye_ui_config`. It is never put in a URL, and it is never sent anywhere except your Home Assistant.

On a wide landscape screen the panel fills the left half. The eyes shrink to the lower right, follow a finger, and blink when tapped. A short note sits above them for the setting under the pointer. In portrait the panel is full width and the small bot stays hidden. Each section has a help icon that opens [the project help](https://www.herrvonundzu.eu/grok-bot-universal-home-assistant-ui/) in a new tab. The same text is in [`docs/help.md`](docs/help.md).

Settings can ask for a PIN or password before they open. That lock is off by default. It stores a salted hash on this device and never the text. It is only a convenience lock. `?lock=reset` on this device clears it and nothing else.

The corner of the panel shows the version, which links to the changelog, and the HVUZ mark, which links to the maintainer’s page. There is no “Made by” line.

## Home Assistant

The page speaks the local WebSocket API only.

| Field | Example |
|---|---|
| Address | `ws://homeassistant.local:8123/api/websocket` (`http` and `https` are rewritten) |
| Token | Long-lived token from the Home Assistant profile |
| Entity | `input_select.eye_ui_state` |
| Music on / off | `script.eye_music_on`, `script.eye_music_off` |
| Lights on / off | `script.eye_light_on`, `script.eye_light_off`, or `light.turn_on/light.living_room` |
| Media player | Empty until you set one. The placeholder in settings is `media_player.living_room`. |

These names are only defaults. Change them in settings, or for one visit in the URL. The token is the exception: `?ha=ws://homeassistant.local:8123/api/websocket&entity=input_select.eye_ui_state&music_on=script.eye_music_on&light_on=script.eye_light_on`. `?ha=mock` feeds states locally (`sequence`, or `grokBot.haState` in the console). The media player stays empty unless `media=` or settings names one. With no entity, or when that entity is `unavailable` or `unknown`, the now-playing line stays hidden and the page does not report an error.

On connect, the page reads the current state and then listens for `state_changed`. Unknown values are ignored, including `unavailable` and `unknown`. One-shot states run to the end and the eyes return to idle locally, even if the entity stays put. `listening` keeps the listening look until the next state. `angry` keeps the warning look until the next state. `hello` plays the short greeting chirp and shows “Hi” on the bottom line, including when the status line is off.

```yaml
input_select:
  eye_ui_state:
    name: Eye UI
    initial: idle
    options:
      - idle
      - listening
      - speaking
      - thinking
      - understood
      - done
      - not_understood
      - error
      - angry
      - sleep
      - hello
      - laugh
      - gaze
      - music_on
      - light_on
      - light_off

script:
  eye_music_on:
    alias: Eye music on
    sequence:
      - action: input_select.select_option
        target:
          entity_id: input_select.eye_ui_state
        data:
          option: music_on
  eye_music_off:
    alias: Eye music off
    sequence:
      - action: input_select.select_option
        target:
          entity_id: input_select.eye_ui_state
        data:
          option: idle
  eye_light_on:
    alias: Eye light on
    sequence:
      - action: light.turn_on
        target:
          entity_id: light.living_room
      - action: input_select.select_option
        target:
          entity_id: input_select.eye_ui_state
        data:
          option: light_on
  eye_light_off:
    alias: Eye light off
    sequence:
      - action: light.turn_off
        target:
          entity_id: light.living_room
      - action: input_select.select_option
        target:
          entity_id: input_select.eye_ui_state
        data:
          option: light_off
```

`angry` slams into a glare and holds it until Home Assistant sends another option: strongly lowered inward-slanted lids, narrow eyes, a lunge toward the viewer, then small twitches and a level side-to-side scan. The red edge replaces Quiet and Lively only while the state is angry. Cube and Fortune keep the living edge for every other state, including speaking. Bold keeps the living edge for the short acknowledgement and adds the red rim only while angry. The warning tone plays a few times, then a quiet pulse. The status line stays “Intruder?” / “Wer da?” and pulses red. Leaving the state eases back to idle with a short smile. Alarm intensity in Display is Normal or Strong. Strong is the default. `?alarm=normal` or `?alarm=strong` sets it for one visit, and `?alarm_intensity=` accepts the same words. One way to drive it is a door contact. While `input_boolean.eye_guard` is on, the door opening sets angry and the eyes hold that glare until the door closes. While the guard is off, the door opening sets hello. The door closing sets idle. The page does not time the glare out.

`speaking` on `input_select.eye_ui_state` leaves the eyes idle and lights the speaking profile. `?licht_zustand=sprechen` previews the same light.

```yaml
input_boolean:
  eye_guard:
    name: Eye guard

automation:
  - alias: Eyes when the door opens
    triggers:
      - trigger: state
        entity_id: binary_sensor.front_door
        to: "on"
    actions:
      - choose:
          - conditions:
              - condition: state
                entity_id: input_boolean.eye_guard
                state: "on"
            sequence:
              - action: input_select.select_option
                target:
                  entity_id: input_select.eye_ui_state
                data:
                  option: angry
        default:
          - action: input_select.select_option
            target:
              entity_id: input_select.eye_ui_state
            data:
              option: hello
  - alias: Idle eyes when the door closes
    triggers:
      - trigger: state
        entity_id: binary_sensor.front_door
        to: "off"
    actions:
      - action: input_select.select_option
        target:
          entity_id: input_select.eye_ui_state
        data:
          option: idle
```

Older Home Assistant versions expect `service:` instead of `action:`. The eyes follow the entity. The scripts set it so the edge color matches the action.

## Voice with an iPhone shortcut

The wall tablet draws the eyes. Voice needs a separate microphone device.

On the iPhone, make a Vocal Shortcut named “Hey Grok” and point it at a Shortcut. Vocal Shortcuts need iOS 18. Inside the Shortcut, the Home Assistant action “Perform action” calls `script.grok_hallo`. That action needs iOS 17. Dictate, then call `script.grok_spiel_musik` the same way.

`script.grok_hallo` sets `input_select.eye_ui_state` to `hello`. The eyes play the short greeting chirp and the bottom line shows “Hi”. `script.grok_spiel_musik` is the script for the dictated request. A music request can set `listening`, then `understood` or `thinking`, then `music_on`, and start the player. `listening` holds until the next option. `music_on`, or the player reaching `playing` after thinking or understood, opens the now-playing detail on its own.

Sound on the tablet still needs one tap in the page first. A Shortcut on the phone cannot unlock audio in Safari.

```yaml
script:
  grok_hallo:
    alias: Grok hello
    sequence:
      - action: input_select.select_option
        target:
          entity_id: input_select.eye_ui_state
        data:
          option: hello
  grok_spiel_musik:
    alias: Grok play music
    sequence:
      - action: input_select.select_option
        target:
          entity_id: input_select.eye_ui_state
        data:
          option: listening
      - action: input_select.select_option
        target:
          entity_id: input_select.eye_ui_state
        data:
          option: music_on
      - action: media_player.media_play
        target:
          entity_id: media_player.living_room
```

## Requirements

This section is meant to grow as more devices are tried.

### Tested

- Current iPadOS, through the module build.
- Home Assistant 2026.10.4 for the WebSocket API, `calendar.get_events`, and `weather.get_forecasts`.

### Minimum

iOS 10.3 / Safari 10.1. Older than that is outside what this page aims to run.

Eyes and touch control keep working from iPad 4 / iOS 10.3.3, Safari 10.1: legacy build available, device test pending. Voice needs a separate microphone device.

These floors are per vendor store pages, Oct 2026:

- This page does not use the microphone. Voice goes through an iPhone Shortcut or the Home Assistant Companion app. `getUserMedia` is only what a future in-browser microphone would need: iOS/iPadOS 13.4 or newer as a Home Screen app, or Chrome 53 or newer on Android, and HTTPS or localhost.
- The Home Assistant Companion app needs iPadOS 16.4 or newer, or Android 6 or newer.
- The Grok Bot app needs iPadOS 18 or newer, or Android 9 or newer.
- A background wake word on a tablet is only possible on Android, with the Home Assistant Companion app as the default assistant. That path is experimental.

### Network

On the LAN over plain `http`, the eyes, sound, gestures, settings, and a `ws://` Home Assistant connection work. The Screen Wake Lock and the service worker need HTTPS, or localhost. The offline cache is named from the version. The worker is a classic script at `sw.js`, so a browser that already registered it can update. The page and the scripts come from the network when it is up, and from the cache when it is not. A new worker reloads the open page once. Hosts should send `Cache-Control: no-cache` for `sw.js` and `index.html`, so a new install does not precache stale files.

The public demo at <https://grok-bot-ui.herrvonundzu.eu> is HTTPS with no Home Assistant configured, so it starts in demo mode. `?demo=1` does the same on any other host. There is no badge on screen. While the corner map is still the stock map, each corner does something: settings, the next theme, music, and Home mode. A saved corner map is left as it is. `?demo=0` is the way to set up a private copy on that same address.

### Security

On the public demo host no token is ever stored. On your own device the token stays only in that browser's localStorage and is never put in URLs or sent anywhere except your Home Assistant. A saved token is kept when the page is updated. `config.local.json` can fill an empty token. That file is gitignored, and it is readable by anyone on the LAN, so use a non-admin, local-only Home Assistant user.

### Kiosk

Add the page to the Home Screen. Set Auto-Lock to Never. Guided Access keeps the tablet in this page. The screen may still sleep over plain `http`, because Wake Lock is missing there.

### Known limits

The settings lock is a convenience lock. The eye-motion formulas are fixed. Fortune is a preview of a brightness buffer, not a live hardware link. Home-detail tiles disappear when their entity is missing. iOS draws the status bar itself. This page cannot hide it in Safari or on the iOS 10 home screen, so the in-app clock stays off and does not repeat it. There is no Grok client in this page.

## Themes

The view control cycles three themes. The saved value and the URL keep the original keys.

| Theme | Key | Look |
|---|---|---|
| Bold | `vollbild` | High contrast, no rounded outline. Colour shows only as a short glow when a tap is acknowledged, and that acknowledgement plays a sound. This is the default. The red rim is added only while angry. |
| Cube | `2d` | Soft eyes in a square, with no frame. A living edge light sits at the screen edge. Lively is the default. Quiet is `licht_profil` `ruhig`. |
| Fortune | `led` | LED preview inside a round frame. The eyes are a crisp outline. The rim fades into the background. The living edge follows the state, and the red rim replaces it only while angry. |

`?theme=bold`, `?theme=cube`, `?theme=cute`, and `?theme=fortune` select the same views. A saved `vollbild` stays Bold. `cute` still means Cube.

![Lively edge light, English](docs/light-lively.png)

![Lively edge light while speaking, English](docs/light-speaking.png)

## Home and Music detail views

The home action enters Home mode. The music corner enters music mode and starts music. The same control again returns to the normal view. While either mode is active, swipe right opens its detail and the eyes shrink to the lower right. `music_on`, or playback that starts after thinking or understood, opens Now Playing on its own. Music detail shows the cover, the title, and previous, play, and next. Under those controls, Up next lists up to five entries when the player exposes a queue, a playlist list, or `source_list`. A tap plays that entry. The block stays hidden when there is nothing to show. Home shows open contacts, Guard, and waste, plus weather and the calendar when those are configured. A camera preview is included when `camera` is set. Tap the preview to fill the screen, and tap again to close. On Cube and Fortune, and on Bold, the open detail takes the left half. The eyes stay on the right. Swipe up or down on the left half moves through My day, Home, Energy, Climate, Music, Status, and Timer. Swipe left closes. A view appears only when its entities exist. Energy stays hidden until a PV entity is set and present. The timer is local.

The home card can also show waste that goes out today or tomorrow, open windows, indoor temperatures, and outdoor rain, wind, and brightness. Every tile hides when its entity is missing or unavailable.

Waste accepts sensors such as `sensor.waste_paper` and a calendar such as `calendar.waste`. A calendar shows the next event per bin for today or tomorrow. The bin name is read from the event summary.

“All off” calls `script.eye_all_off`. “Guard on/off” calls `script.eye_guard_toggle` and reads `input_boolean.eye_guard`. More buttons are lines of `Label|service` in settings.

`?ha=mock` and demo mode fill the card with sample data, including a courtyard camera. An optional door entity, empty unless you set `door`, wakes the eyes with an original chirp when that contact opens. The same section is in [the help](https://www.herrvonundzu.eu/grok-bot-universal-home-assistant-ui/#dashboard).

## Site config

`web/config.example.json` shows an optional `config.local.json` placed next to `index.html`. Copy it and edit the copy. The local file is gitignored. A missing file is ignored. It can set the Home Assistant address, the token, entity ids, the Home mode lists, the door contact, the camera, dimming (`dimAfter` seconds, `dimLevel` from 0 to 1, `dimLead` minutes before a scheduled sleep time of day), gestures, corners, the theme, and the language. An old `coldC` key is accepted and ignored. When the file sets an address, that address overrides the saved one. A token in the file fills an empty store. A token already saved on the device stays. Every other saved setting still wins. The public demo host ignores the address and the token from the file, and it still drops any saved token.

The file is readable by anyone on the LAN. Use a non-admin, local-only Home Assistant user for the token in that file.

Order: defaults, then saved settings, then the file for the address and for a missing token, then URL parameters. A token in the URL is still ignored.

## Controls

The center belongs to the eyes. A tap wakes them and resets the sleep timer. A tap also stops the demo.

Swipes and a long press on the eyes are stored in `localStorage` and edited under Settings. Each one can do nothing, toggle music, toggle the lights, call a Home Assistant script or `domain.service/entity_id` (for example `light.toggle/light.living_room`), open settings, open the quick sheet, show or hide the clock, show or hide the status line, start and stop demo mode, cycle the theme, or enter home mode. A custom action is a label plus a service, such as `light.toggle/light.hallway`. The quick sheet ends with Demo. That tour loops the emotions, ends on music for 30 seconds, then starts again until the next tap. It keeps moving in fullscreen and while an overlay is open. It does not change the theme and it does not open the music cover.

State buttons and Play all preview on the small bot while settings are open. Closing settings returns to the previous state, unless demo mode stays on. Demo mode loops hello, listening, thinking, understood, done, laugh, confused, angry, sleepy, glance, and error, then holds music for 30 seconds and starts again. Advanced can replace a caption, a color, or a sound. Empty fields keep the original. Reset states clears those overrides.

| Gesture | Default |
|---|---|
| Swipe left | Open the quick sheet. |
| Swipe right | Home mode. While music or home mode is already active, this swipe opens that mode’s detail. The same on a phone and on a tablet. |
| Swipe up | Toggle the status line. |
| Swipe up from the bottom edge | Open settings. This is fixed. It does not use the swipe-up action above. |
| Swipe down | Open settings. |
| Long press on the eyes (0.8 s) | Demo mode. |

The side edges are fixed and are not part of that map:

| Gesture | Action |
|---|---|
| Left edge, top / bottom | Music on / off |
| Right edge, top / bottom | Lights on / off |

Each corner has its own tap and its own hold (0.8 s), using the same action list. Top-left tap calls `light.toggle/light.living_room` and the hold toggles the clock. Top-right tap toggles music and the hold cycles the theme. Bottom-left and bottom-right taps cycle the theme. Their holds do nothing until you assign them. The hit area is 128 CSS pixels, plus the safe-area inset on newer systems, and the size can be changed under Advanced. While the corner section is open, the zones show for a moment. The corner glows briefly when it runs. A hold in a corner runs the corner’s second action, so the old 1.5 s hold that opened settings is gone. A saved layout that still has the previous defaults (swipe left for music, every corner empty) is moved to these defaults once. A layout you already changed is left as it is.

A swipe up that starts at the bottom edge of the screen opens settings, on a phone and on a tablet. The edge is about 72 to 120 pixels, including the safe area. A swipe up that starts higher on the screen still runs the swipe-up action.

Five taps in the top-left corner, each within about 0.35 s and all inside 2 s, always open settings and do not run that corner’s tap. One tap waits 0.35 s, then runs the corner’s tap action. Two, three, or four taps in that same rhythm run the tap action once. Slower taps each run on their own. While the eyes are asleep, a tap or a hold wakes them with “Hi.” and does not run the corner action. Five taps still open settings. A swipe runs even if the eyes are asleep.

## Phone and tablet

The page picks a profile from the screen and from touch. A touch screen whose shorter side is under 600 CSS pixels is a phone, including a phone in landscape. Anything else, including a desktop window, uses the tablet profile. Settings are stored separately for each profile under `eye_ui_config`, and settings show which profile is being edited. An older single save is kept for the profile that opens it first.

Settings open as separate pages: Display, Sound and sleep, Gestures and corners, Views, Home Assistant, Advanced, and Security. On a phone the settings fill the screen on black. In landscape the tablet keeps the shaded frame at full size and shrinks only the eyes.

The state glyph sits under the clock on both. If the clock is off, only the glyph shows. While the eyes sleep, the bottom line plays “Zzzzzz...”. While music or home mode is active, swipe right opens that mode’s detail on both. Opening settings on a tablet in landscape nudges the eyes aside with a small sound. Closing them plays a quiet sigh.

On a keyboard: `1` through `0`, then `q w e r`, select the states. Arrow keys run the configured swipes. Space plays every state. `m` cycles the view. `i` opens settings. Escape closes the sheet, then settings.

With no new state and no touch, the eyes sleep after the configured time. The default is 15 minutes. `0` disables sleep.

## Experimental hardware buffer

`ledFrame(pose, opt)` in `web/renderer.js` builds an optional brightness buffer for custom hardware. The default is 1330 points split across 4 lines (333, 333, 332, 332). The tablet UI does not send that buffer anywhere. Fortune draws a preview of that buffer. The preview is not the buffer itself.

```js
ledFrame(pose)
ledFrame(pose, { anzahl: 1400, leitungen: 4 })
ledFrame(pose, { anzahl: 1400, leitungen: [350, 350, 350, 350] })
```

The result is `{ pitch, anzahl, leitungen, helligkeit, linien }`. `anzahl` is the point count, `leitungen` is the number of lines, and `helligkeit` is brightness from 0 to 1. Each entry in `linien` is `{ leitung, start, laenge, helligkeit }`: line index, start offset, length, and that line's brightness. Those names are the buffer fields. The tablet UI does not rename them.

## Tests

`npm test` rebuilds `web/legacy.js`, checks that it parses as ES2015, and checks the eye formulas against `web/paritaet.sha256`, the Home Assistant mapping (including English names), the WebSocket handshake against a fake socket, sleep, gestures, and the string catalog. `--dump` on `web/test_paritaet.mjs` writes the parity JSON to stdout.

## Files

| Path | Contents |
|---|---|
| `web/index.html`, `manifest.webmanifest`, `sw.js` | Page, home-screen manifest, offline cache |
| `web/app.js`, `web/legacy.js`, `web/strings.js` | Wiring and the Safari 10 bundle, captions, the quick sheet, both languages |
| `web/demotrack.js` | Orbit Drift and the short acknowledgement sounds, generated in the browser |
| `web/dimmen.js` | Idle dimming and the door-contact edge |
| `docs/help.md` | The help page, with the same anchors as the settings icons |
| `web/aktionen.js`, `web/gesten.js` | Gesture map, corners, and the five-tap rule |
| `web/nowplaying.js` | Track line from media-player attributes |
| `web/augen.js`, `zustaende.js`, `engine.js` | Eye motion |
| `web/renderer.js` | Canvas views and `ledFrame()` |
| `web/dashboard.js`, `web/siteconfig.js`, `web/config.example.json` | Home detail tiles and the optional site file |
| `web/ha.js`, `konfig.js` | WebSocket client and local settings |
| `web/sounds/`, `onsets.json` | Tones and their onset times |

## Support

GitHub Sponsors: <https://github.com/sponsors/stefanvr82>. The owner turns Sponsors on for that account. The page itself has no donation link.

## License

MIT. See [LICENSE](LICENSE). Third-party notes, including the Contributor Covenant, are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The HERRVONUNDZU mark in [`assets/brand/`](assets/brand/NOTICE.md) is not covered by MIT. It is a trademark, all rights reserved. Forks should replace it or remove it. Settings show it as a small logo, without a “Made by” line. Orbit Drift, the demo loop, is original and dedicated under CC0. The code that synthesizes it stays under MIT.
