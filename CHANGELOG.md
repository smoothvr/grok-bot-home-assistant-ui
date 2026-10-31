# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [semantic versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-10-31

### Added

- Idle gaze with saccades, side and upward glances, a slow drift, and a slight head tilt in the eye shape. Blinks vary: single, double, a slow sleepy blink, and a half blink. A touch makes the eyes look that way for a moment, and they sometimes glance back.
- Reactions with two to four renditions each, chosen at random and never repeated immediately: surprised, curious, shy, pleased, thinking, confused, a nod, sad (“no”), a happy bounce, relieved, sleepy, startled, grumpy, and content. A few quick pokes turn grumpy. A long press settles into content.
- A procedural droid voice (Web Audio oscillators, no samples): a happy trill, a rising question, a sad descending boop, a thinking burble, a startled squeak, a sleepy yawn, and yes or no beeps. Pitch, tempo, and syllable count shift a little each time. Phrases stay short, quiet, and on a cooldown. The four presence-wake hums stay.
- The edge light pulses with those beeps. It turns red only while angry.
- Settings: a Liveliness slider (`Lebendigkeit`) and a volume slider. A collapsed Reactions list plays each reaction. `settings.html?preview=1` opens that list. `?reaction=curious&demo=0` plays one on the face. `?live=` and `?vol=` set the sliders for one visit.

### Changed

- Demo mode still ends on music for 30 seconds. Between the emotions it now shows the new reactions.
- Sleep plays a short yawn with the existing sleep tone ducked under it. Closing the door plays a relieved reaction. A reminder and its acknowledgement, a presence wake, and a calm error each pick a fitting reaction.

## [2.0.0] - 2026-10-31

### Changed

- The main screen is only the face: eyes, emotions, the living edge light, and sound. Red light is only for angry. Overview tiles, detail views, the theme switch, and the settings overlay are gone.
- Settings are a separate page, `settings.html`. The saved token and the Home Assistant address from 1.0.x stay in `eye_ui_config`.
- The face is served from Home Assistant at `/local/eye-ui/index.html`, with relative asset URLs and an HTML5 application cache manifest. `npm run appcache` writes the version line from `VERSION`.
- Voice is not part of this release.

### Added

- Presence wake. `presenceEntity` (for example `binary_sensor.living_room_presence`) and `input_select.eye_ui_state` value `wake` open the eyes from sleep, look around, and play one of four short hums. Presence does nothing while the face is already awake.
- A reminder note from `input_text.eye_hinweis`. It stays until a tap, which calls `script.eye_hinweis_quittieren`. Demo mode shows a stand-in note.
- A Home Assistant heartbeat every 30 seconds. A missing pong reconnects after 10 seconds. The page also reconnects on `online` and when it becomes visible. `auth_invalid` shows the calm error and tries again every 60 seconds.
- The first touch unlocks sound. Until then, reactions are light only, with one small hint.

### Fixed

- Connection trouble stays a calm line. The page does not show a raw Home Assistant error.

## [1.0.1] - 2026-10-26

### Fixed

- Cube and Fortune use the 1.4.3 living edge again for every state except angry. The red rim replaces Quiet and Lively only while angry. Bold keeps the living edge for the short acknowledgement and adds the red rim only while angry. The angry scan stays level, and the red rim no longer doubles in the corners.
- A saved Home Assistant token survives an update, including a token stored by a 1.4.3 build. Missing keys take the new defaults. An empty save does not wipe a token. `config.local.json` can set the address, and it can fill a missing token. A token already saved on the device stays. The public demo host ignores both.
- The service worker precaches with a reload and checks the network without the HTTP cache. Hosts should send `Cache-Control: no-cache` for `sw.js` and `index.html`.
- Connection trouble shows a short quiet line and slightly confused eyes. The detail stays in settings and on the Status page, as a known phrase.
- Leaving angry eases back with a short smile. A door automation can hold angry while the guard is on, say hello while it is off, and return to idle when the door closes.

### Changed

- Demo mode loops the emotions, ends on music for 30 seconds, then starts again until a tap. It keeps moving in fullscreen and under an overlay, and it does not open the music cover.
- Shipped defaults: Lively edge light, status line on, now playing on, demo on. Swipe left opens the quick sheet, swipe up toggles the status line, swipe down opens settings, and a long press starts the demo. Top-left tap toggles `light.living_room`, top-right toggles music, and the bottom corners cycle the theme. Each gesture and corner is one row that opens a picker.
- `speaking` on `input_select.eye_ui_state` lights the speaking profile while the eyes stay idle.
- On the public demo host, address, token, entity, and custom-action fields are read-only.

## [1.0.0] - 2026-10-25

### Added

- First public release.
- Angry holds a glare for as long as the state is angry. The lids slam down and slant inward, the eyes stay narrow, and they scan from side to side. Entry is a short lunge and a sharp shake, then a small twitch every few seconds. The edge light overrides Quiet and Lively with a strong pulsing red on Bold, Cube, and Fortune, including the legacy build. The warning tone plays a few times, then pulses quietly. The status line stays “Intruder?” / “Wer da?” and pulses red. Leaving the state eases back to idle. Alarm intensity is Normal or Strong. Strong is the default.

## [0.4.3-beta] - 2026-10-25

### Fixed

- Timer and Climate fit in the detail column without a scrollbar, at 1024×768 and at 390×844, in Bold, Cube, and Fortune. Detail views do not show a scrollbar.
- The track line stays in the open half beside a detail view, so it is not cut off by the panel.
- Settings are separate pages on a phone and on a tablet.

## [0.4.2-beta] - 2026-10-25

### Fixed

- Timer, Music, Status, and Home no longer stack the action buttons on top of the text. The header, the stage, the actions, and the footer sit in one column, on a tablet and on a phone, in Bold, Cube, and Fortune. The open-contact count keeps a space before “windows”, and the open values line up. Guard sits under the facts.
- Settings pages are opaque, and an open detail view is hidden while settings are open. Sleep and Views each show only their own page. The nameless section is gone.
- The example config uses generic entity ids such as `binary_sensor.front_door` and `sensor.living_room_temperature`. Screenshots are from this app. Quiet and Lively are both in the help. The internal light probe is not part of the page.

## [0.4.1-beta] - 2026-10-25

### Fixed

- Settings switches on a phone no longer collapse to an empty box. Each one keeps a 51 by 31 track and a knob: light knob on a grey track when off, dark knob on a light track when on. The same treatment is in Bold, Cube, and Fortune, in current Safari and in the legacy build. Segment buttons and pick lists keep a filled chip, and the selected chip is light with dark text.

## [0.4.0-beta] - 2026-10-25

### Added

- Detail views share one set of type and colour tokens and open on the left half, in Bold, Cube, and Fortune. The eyes stay visible on the right. Swipe up or down on that half to move through My day, Home, Energy, Climate, Music, Status, and Timer. Swipe left to close. A view is listed only when its entities exist. Energy stays hidden until a PV entity is configured and Home Assistant has it.
- The example config names generic entities: `weather.home`, `sensor.open_contacts` (header attribute), `binary_sensor.front_door`, `sensor.living_room_temperature`, `calendar.family`, and `calendar.waste`. Every id is a setting. There is no PV entity in that example, so Energy stays out of the stack.
- A local timer view: remaining time, the target clock, +1 min, +5 min, and Stop. It does not call Home Assistant.
- Settings open as pages: Display, Sound and sleep, Gestures and corners, Views, Home Assistant, Advanced, and Security. Choices are segments or button lists.
- A living edge light, profile Quiet by default. Lively is the `licht_profil` setting (`ruhig` or `lebhaft`). Sleep stays calm and still readable. No grain. Bold keeps the light for the short acknowledgement only. Cube and Fortune draw it at the screen edge. The eye pixels are unchanged.

### Changed

- Home mode, Music mode, Up next, the angry state, and dimming stay as they shipped in 0.3.2-beta. Sleep is still a number of minutes, not a 1·3·5·15·never segment. `dimLead` still applies only before a scheduled time of day.

## [0.3.2-beta] - 2026-10-25

### Added

- State `angry`, from the `input_select.eye_ui_state` option `angry`. The eyes lower and slant the upper lids inward, narrow, and take a red glow on Bold, Cube, and Fortune, including the legacy build. A short low tone plays once. The look holds until the next state. Play all shows it after the error state. Status line: “Intruder?” / “Wer da?”. The README and the help page include an automation: the front door opens while `input_boolean.eye_guard` is on, Home Assistant sets `angry`, then `idle` after 30 seconds.

### Fixed

- `dimLead` no longer applies to the inactivity sleep timeout. With the default 900 seconds, dimming no longer starts at once. The page still dims after `dimAfter` seconds of quiet. `dimLead` is only the ramp before a scheduled sleep time of day.

### Changed

- The bottom-right demo corner and swipe right are Home mode in the README, the help page, and settings. The old Dashboard heading is now Home and Music detail views. That section names Up next, and that `music_on` opens Now Playing.
- Detail insets match the page: Cube and Fortune inset by the clock’s top margin. Bold stays flat, with no border.
- The requirements say this page does not use the microphone. Voice goes through an iPhone Shortcut or the Home Assistant Companion app. `getUserMedia` is only what a future in-browser microphone would need.
- The repeated iPad 4 line in the requirements is gone. Eyes and touch control keep working from iPad 4 / iOS 10.3.3: legacy build available, device test pending.

### Removed

- The “Cold below °C” setting. An old `coldC` key in a saved config is still accepted and ignored.

## [0.3.1-beta] - 2026-10-25

### Added

- `hello` from Home Assistant plays the short greeting chirp and shows “Hi” on the bottom line, including when the status line is off. `listening` keeps the listening look until the next state.
- `music_on`, or playback that starts after thinking or understood, opens music mode and the now-playing detail with no swipe. The music corner leaves that view. Playback that stays stopped for 20 seconds leaves it too.
- Up next, under the transport buttons. Up to five entries from a queue, a playlist list, or `source_list`. A tap calls `media_player.play_media` or `media_player.select_source`. The block stays hidden when the player exposes nothing.
- Voice with an iPhone shortcut, in the README and the help page. Vocal Shortcut “Hey Grok”, then Home Assistant “Perform action” for `script.grok_hallo`, dictation, then `script.grok_spiel_musik`. Requirements name the store-page minimums as of Oct 2026. Eyes and touch control keep working from iPad 4 / iOS 10.3.3: legacy build available, device test pending. Voice needs a separate microphone device.

## [0.3.0-beta] - 2026-10-25

### Added

- Cube keeps the soft eyes and draws them in a square, with no frame. Coloured cues stay at the screen edge. `?mode=cube` selects it. `?mode=cute` still does.
- Music mode and home mode. The control that starts a mode leaves it on the next tap. While a mode is active, swipe right opens its detail. Music detail is a now-playing view. Home detail shows weather, upcoming events, and a camera preview. Tap the preview to fill the screen.
- My day. Tap the clock for a large time, today’s events, and the small bot. Tap the empty area above the bot to leave.
- Idle dimming. With no sleep time the page dims to 30 percent after 60 seconds. With a sleep time, dimming starts 15 minutes before it and eases down until sleep. `dimAfter`, `dimLevel`, and `dimLead` set the timing.
- An optional door entity. When that contact opens, the eyes wake and play an original chirp. It is empty unless you set `door`.
- Demo at the bottom of the quick sheet. The tour shows the themes and the details, then leaves the music playing until the next tap.
- A small nudge, with a sound, when settings push the eyes aside, and a quiet sigh when they come back.

### Changed

- Bold is the default theme. It has no rounded outline. Colour appears only as a glow when an interaction is acknowledged, and that acknowledgement plays a sound.
- The clock sits further from the right edge, outside the corner tap area. The state sits under the clock. The clock stays off unless you turn it on.
- Sleep writes “Zzzzzz...” on the bottom line.
- Settings use on-theme pickers. Section arrows keep a fixed width. Doc links use an info icon. The long notes under Commands and the neighbouring sections are gone.
- Detail views use the screen. Cube and Fortune inset them by the clock’s top margin. Bold is flat white on the current black background, with no border.
- The in-app credits button is gone. The project page still keeps `#credits`.

### Removed

- The cold shiver and the “Brrrr...” line.

## [0.2.2-beta] - 2026-10-25

### Fixed

- The service worker is a classic script again, still served at `/sw.js`. A browser that already registered it can update. The build writes the version into the worker. Activating it still deletes older caches, including `grok-bot-home-ui-v7`.

## [0.2.1-beta] - 2026-10-25

### Fixed

- The offline cache is named from the version. A new worker takes over, deletes older caches, and loads the page and the scripts from the network first. When that worker takes control, the open page reloads once.
- `web/assets/brand/NOTICE.md` ships with the page. It is the same brand notice as `assets/brand/NOTICE.md`.
- On a phone in portrait, the eyes sit in from the left and right edges.

### Added

- The profile line in settings links to the `#phone` section on the project page.

## [0.2.0-beta] - 2026-10-25

### Added

- A swipe up from the bottom edge opens settings, on a phone and on a tablet. Other swipes up and down keep their action.
- Separate settings profiles for phone and tablet. The page chooses from screen size and touch, and settings name the profile being edited.
- In the public demo, and with `?demo=1`, every corner has an action when the map is still the stock map.

### Changed

- With settings open on a tablet, only the eyes shrink. The shaded frame stays full size.
- Settings sections collapse. They start collapsed on a phone and expanded on a tablet. On a phone the panel is full width on black.
- Swipe right opens the dashboard on a phone, the same as on a tablet. The browser edge swipe no longer leaves the page.
- The state glyph sits in the top-left on a phone.
- Credits in the app are a short line and a link to the project page anchor `#credits`. The notices stay in the repository.
- The German settings copy no longer uses “Tipps” for a tap. The help control is one icon and still leaves the bot view.

### Removed

- The “tap for sound” hint. The first touch still unlocks sound.
- The demo badge. Demo mode itself is unchanged.

## [0.1.1-beta] - 2026-10-25

### Changed

- Credits hide the GitHub profile, the repository, and Sponsors while `REPO_PUBLIC` is false. Source code and Support read “coming soon”, with no link. The HVUZ links stay. Set the switch to true to restore the links.
- The demo hint moves above the caption while a caption is on screen.
- The public demo is live at <https://grok-bot-ui.herrvonundzu.eu>.
- iPad 4 on iOS 10.3.3: legacy build available, device test pending.

### Removed

- `web/sounds/00_alle_nacheinander.wav`. Nothing played it.

### Security

- On the public demo host no token is ever stored. On your own device the token stays only in that browser's localStorage and is never put in URLs or sent anywhere except your Home Assistant.

## [0.1.0-beta] - 2026-10-25

### Added

- Settings in landscape use the left half of the screen. A small bot in the lower right follows a finger, blinks on tap, and shows a note for the focused setting. Portrait keeps a full-width panel.
- State buttons and Play all preview on that bot. Closing settings returns to the real state unless demo mode stays on.
- Demo mode cycles every state with its caption and sound. A gesture or a corner can toggle it.
- Orbit Drift, an original demo loop, plays in the music state when no media player is set. The line reads “Orbit Drift, HVUZ Demo (2026)”.
- Credits from settings and the quick sheet: maintainer, the original idea, the repository, Sponsors, and the HVUZ page.
- Optional settings lock. It stores a salted hash and never the PIN. `?lock=reset` on this device clears only the lock.
- Custom actions: a label plus a Home Assistant service.
- Per-state caption, color, and sound under Advanced, with reset to the original.
- Help icons open the project page. The same anchors are in `docs/help.md`.
- Safari 10.1 / iOS 10.3 support. `web/legacy.js` is an ES2015 build, chosen by a feature check because that Safari ignores `nomodule`. Touch events cover gestures. Sound uses `webkitAudioContext`. Old devices use a lower draw rate and a cheaper glow.
- The version in settings links to the changelog. The HVUZ mark is the logo only.
- Public demo behavior for `grok-bot-ui.herrvonundzu.eu`, and for HTTPS with no Home Assistant yet. `?demo=0` opts out. The page does not keep a token on that host.
- Optional `config.local.json` beside `index.html`. See `web/config.example.json`. A token in that file is ignored.
- Dashboard: weather, calendars, waste sensors or a waste calendar, open windows, indoor temperatures, rain, wind, and brightness. Missing entities hide their tile.
- Themes Cute (`2d`), Fortune (`led`), and Bold (`vollbild`). Swipe left cycles them. Swipe right opens the dashboard. Music is the bottom-left tap.
- A small state glyph in the top-left when the state name is on.
- Larger corner hit areas, with the size under Advanced.

### Changed

- The clock is larger and sits further from the corner, including the safe area on newer systems.
- The interface uses the system font stack.
- A tap on the status line still wiggles the eyes and plays a chirp. The tickle caption is gone.
- Keyboard hints stay hidden on a touch device.

### Fixed

- The colored floor is one gradient. The lighter bar along the bottom is gone.

### Security

- The settings lock is a convenience lock, not real security. The secret is not stored as text.

## [0.0.0-beta] - 2026-10-25

### Added

- Animated eye UI for a wall-mounted tablet, with a standalone home-screen launch.
- Local Home Assistant controls for music and lights. Questions stay with Grok Bot.
- Settings panel, German and English interface text, and an optional status line.
- A quick sheet on the status line, a faint tap zone when that line is hidden, and a short tickle.
- Sound unlocks on the first touch anywhere, with a one-time hint until it does.
- Configurable swipes, a long press, and four corners. Five quick taps in the top-left corner open settings.
- An optional 24-hour clock, and a now-playing line from a Home Assistant media player.
- A small “Made by HERRVONUNDZU” credit in settings and on the quick sheet. The mark is not under MIT.
- Default Home Assistant names are `input_select.eye_ui_state`, `script.eye_music_on`, `script.eye_music_off`, `script.eye_light_on`, and `script.eye_light_off`. The media player starts empty. Saved settings move to `eye_ui_config`, and an older token is kept.
- Repository documentation in English. The page UI stays German and English.
- English aliases for the eye states.
- Optional experimental `ledFrame()` buffer for custom hardware. The tablet UI does not send it. Fortune only previews it.

### Security

- The Home Assistant token is stored only in the browser. A token in the page URL is ignored.
- Settings no longer open on a long hold. A corner hold runs that corner’s own action. Five taps still open settings.

[2.0.0]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v1.0.1...v2.0.0
[1.0.1]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/smoothvr/grok-bot-home-assistant-ui/releases/tag/v1.0.0
[0.4.3-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.4.2-beta...v0.4.3-beta
[0.4.2-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.4.1-beta...v0.4.2-beta
[0.4.1-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.4.0-beta...v0.4.1-beta
[0.4.0-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.3.2-beta...v0.4.0-beta
[0.3.2-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.3.1-beta...v0.3.2-beta
[0.3.1-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.3.0-beta...v0.3.1-beta
[0.3.0-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.2.2-beta...v0.3.0-beta
[0.2.2-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.2.1-beta...v0.2.2-beta
[0.2.1-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.2.0-beta...v0.2.1-beta
[0.2.0-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.1.1-beta...v0.2.0-beta
[0.1.1-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.1.0-beta...v0.1.1-beta
[0.1.0-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/compare/v0.0.0-beta...v0.1.0-beta
[0.0.0-beta]: https://github.com/smoothvr/grok-bot-home-assistant-ui/releases/tag/v0.0.0-beta
