# Grok Bot Home Assistant UI

Help for the wall tablet. Settings are a separate page. The face itself stays clear.

<h2 id="display">Display</h2>

The page is German or English. It follows the browser language until a saved choice, `config.local.json`, or `?lang=` overrides it.

There is one look. The eyes are flat on black, full-screen. There is no cube and no frame around them. The edge light is the approved quiet profile: a slow breath along the bottom edge, between that state's low and high level. A phrase lifts the level with the sound and eases back. Thinking and music use the long profile, up the sides. Red is the alarm while angry, and the error colour when something fails. Cube, Fortune, and Bold are not switched in this release.

Sleep is in minutes. `0` keeps the eyes awake. The page dims to 30 percent after 60 seconds of quiet (`dimAfter`, `dimLevel`). While the eyes sleep, the screen stays dim and the bottom line reads “Zzzzzz...”. The clock is off unless you turn it on. It sits clear of the corner you hold for settings. iOS draws the status bar itself. This page cannot hide that bar in Safari or on the iOS 10 home screen.

The status line is a short caption for the current emotion, or “One moment.” when the connection needs a moment. Raw errors are not shown. Demo mode is optional. Alarm intensity is Strong. `?alarm=normal` or `?alarm=strong` changes it for one visit, and `?alarm_intensity=` accepts the same words.

Liveliness (`Lebendigkeit`) and volume are sliders on the settings page. Volume runs from 0 to 200 percent, and the default is 160 percent. Liveliness changes how often the eyes glance and whether a casual tap gets a reaction. `?live=` and `?vol=` do the same for one visit. A field that `config.local.json` sets is marked centrally set and is not edited by hand. Neu laden checks for a new version and reloads the page.

<h2 id="sound">Sound</h2>

The first tap anywhere unlocks sound and keeps it unlocked for that visit. Until then the page is light only, and it shows one small line, “tap me to hear me”. Idle stays quiet. Other states have their own tone. A presence wake plays one of four short hums, with a small startled squeak just before. A reminder plays a soft chime and a short nod or question.

Reactions also speak in generated beeps: a happy trill, a curious rise, a sad descending boop, a thinking burble, a startled squeak, a sleepy yawn, and yes or no. Pitch, tempo, and the number of notes change a little each play. Phrases are short and sit under a cooldown. The volume slider scales every tone from 0 to 200 percent. The droid phrases are leveled to a similar loudness, and a compressor keeps the louder settings from clipping. The edge still follows the phrase itself. Mute still silences them. This uses `AudioContext`, or `webkitAudioContext` on iOS 10. No sound files were added for the chatter.

This page does not use the microphone. Voice is not part of this release.

When the demo reaches the music state and no player is set, the page can play a short original loop in the browser. The demo holds that step for 30 seconds.

<h2 id="home-assistant">Home Assistant</h2>

The page talks only to the local WebSocket API. On your own device the token stays only in that browser's localStorage, under `eye_ui_config`, and is never put in a URL or sent anywhere except your Home Assistant. On the public demo host no token is ever stored. A token and address saved by 1.0.x are kept. A key in `config.local.json` wins over the value stored on the tablet. `volume` is a percent, and `reloadEntity` names the button that reloads the page. `presenceEntity`, `reminderEntity`, and `reminderAckScript` still work.

Copy the files to `config/www/eye-ui/` and open `/local/eye-ui/index.html`. Folders return 403. Home Assistant caches `/local/` for 31 days. The page references `eye-ui.appcache`, and `npm run appcache` stamps `# version` from `VERSION`. Hosts should send `Cache-Control: no-cache` for `sw.js` and `index.html`.

The usual names are `input_select.eye_ui_state`, `input_text.eye_hinweis`, and `script.eye_hinweis_quittieren`. `presenceEntity` is a binary sensor such as `binary_sensor.living_room_presence`. `wake` on the state entity is the same wake. Presence does nothing while the eyes are already awake. After the sleep timeout, a new presence edge can wake them again.

A door entity such as `binary_sensor.front_door` holds angry while it is open and relaxes when it closes. `speaking` lights the speaking colour while the eyes stay idle.

`?ha=mock` plays states on this device without a server.

The socket sends `ping` every 30 seconds. If `pong` is missing for 10 seconds, it reconnects. `online` and a visible page reconnect as well. `auth_invalid` shows the calm line and retries every 60 seconds.

<h2 id="voice">Voice</h2>

Voice is not part of this release. The wall tablet only draws the eyes. It does not take questions.

<h2 id="states">States</h2>

| Key | English | German | Meaning |
|---|---|---|---|
| idle | I'm bored. | Bin gelangweilt. | Waiting quietly. The caption stays hidden. |
| hallo | Hi. | Hi. | Saying hello. A tap from sleep uses this. |
| blicke | Just looking. | Ich schau nur. | Looking around. |
| zuhoeren | Listening… | Hör zu… | Listening for what comes next. |
| nachdenken | Thinking | Denke nach | Working on an answer. |
| verstanden | Got it. | Verstanden. | Showing that it understood. |
| erledigt | All done. | Erledigt. | Showing that the task is finished. |
| nicht_verstanden | Come again? | Wie bitte? | Asking for that again. Also the calm connection face. |
| fehler | That broke. | Das ging schief. | Showing that something failed, still in the face design. |
| angry | Intruder? | Wer da? | Warning. A held glare and a red rim. It holds while the door is open. |
| schlafen | Zzzzzz... | Zzzzzz... | Asleep, and the screen is dim. |

`option: angry` can still be set by an automation. `input_boolean.eye_guard` is the optional guard flag for that automation. The page does not wait on a timer: the door entity is enough.

A reminder from `input_text.eye_hinweis` wakes the face, shows “Don't forget”, and stays until a tap. The tap calls `script.eye_hinweis_quittieren`.

<h2 id="demo">Demo</h2>

A public page, and a fresh page with no Home Assistant address or token, opens asleep. The screen is only the eyes. The first tap wakes them and plays every reaction once, with sound, then keeps looping. A tap during the loop still answers, and the loop continues. A configured install starts in the normal face.

`?demo=1` still runs the longer tour, ends on music for 30 seconds, then starts again until a tap. `?lauf=1` is the reaction showcase. `?welcome=0` skips the sleeping start. On the public demo host no token is ever stored.

<h2 id="phone">Phone and tablet</h2>

Phone and tablet share the face. Each one keeps its own saved profile in this browser.

<h2 id="requirements">Requirements</h2>

Tested on current iPadOS and against Home Assistant 2026.10.4.

Eyes and touch control keep working from iPad 4 / iOS 10.3.3, Safari 10.1: legacy build available, device test pending. The legacy file is ES2015. The inline loader is ES5.

Serve the manifest as `text/cache-manifest` if the browser should honour the application cache.

<h2 id="dashboard">Dashboard</h2>

There is no dashboard in 2.0. Weather, calendars, and detail views are not on the face. A reminder is a single note, not a tile.

<h2 id="credits">Credits</h2>

The settings page keeps `id="credits"`. Editors must keep this id so the project link stays findable.

Maintainer: smoothvr.

The project page is <https://www.herrvonundzu.eu/grok-bot-universal-home-assistant-ui/#credits>.
