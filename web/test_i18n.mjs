// SPDX-License-Identifier: MIT
import fs from 'fs';
import { LINKS, repoLinks } from './hilfe.js';
import { VORGABE, mitUrl } from './konfig.js';
import { REPO_PUBLIC } from './version.js';
import { KURZ } from './namen.js';
import { makeClips } from './zustaende.js';
import { jetztLaeuft } from './nowplaying.js';
import {
  CAPTIONS, DETAILS, LOCALES, captionLine, detailLine, localeCode, resolveLocale, stateLabel, textOrServer, translate,
} from './strings.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

assert(resolveLocale({ nav: 'fr-FR' }) === 'en', 'unknown language does not fall back to English');
assert(resolveLocale({ nav: 'de-DE' }) === 'de', 'German from the browser');
assert(resolveLocale({ nav: 'de', stored: 'en' }) === 'en', 'stored language');
assert(resolveLocale({ nav: 'en', stored: 'en', query: 'de' }) === 'de', 'lang from the URL');
assert(resolveLocale({ query: 'en-US', stored: 'de' }) === 'en', 'en-US');
assert(localeCode('DE') === 'de' && localeCode('zh') === '', 'localeCode');

for (const lang of LOCALES) {
  for (const kurz of Object.keys(KURZ)) {
    const line = captionLine(lang, kurz);
    assert(line && line.text, `${lang} has no line for ${kurz}`);
    assert(stateLabel(lang, kurz), `${lang} has no state name for ${kurz}`);
  }
  for (const key of Object.keys(CAPTIONS.en)) assert(CAPTIONS.de[key], `de is missing ${key}`);
}

assert(captionLine('en', 'nachdenken').text === 'Thinking' && captionLine('en', 'nachdenken').dots === true, 'Thinking');
assert(captionLine('de', 'nachdenken').text === 'Denke nach' && captionLine('de', 'nachdenken').dots === true, 'Denke nach');
assert(captionLine('en', 'zuhoeren').text === 'Listening…', 'Listening');
assert(captionLine('de', 'zuhoeren').text === 'Hör zu…', 'German listening line');
assert(captionLine('en', 'idle').text === "I'm bored.", 'bored');
assert(captionLine('de', 'idle').text === 'Bin gelangweilt.', 'gelangweilt');
assert(captionLine('en', 'hallo').text === 'Hi.' && captionLine('de', 'hallo').text === 'Hi.', 'Hi');
assert(captionLine('en', 'angry').text === 'Intruder?' && captionLine('de', 'angry').text === 'Wer da?', 'angry status line');
assert(detailLine('en', 'angry').includes('door') && detailLine('de', 'angry').includes('Tür'), 'angry detail');
assert(translate('en', 'np.upNext') === 'Up next' && translate('de', 'np.upNext') === 'Als Nächstes', 'up next');
assert(!captionLine('en', 'zuhoeren').dots, 'listening has no animated dots');
assert(!captionLine('en', 'tickle') && !captionLine('de', 'tickle'), 'no tickle line');
assert(translate('en', 'credits.short').includes('project page') && translate('de', 'credits.short').includes('Projektseite'), 'short credit line');
assert(!translate('de', 'settings.intro').includes('Tipps'), 'German settings copy does not use Tipps');
assert(translate('en', 'gesture.help').includes('bottom edge') && translate('de', 'gesture.help').includes('unteren Kante'), 'bottom-edge swipe is described');
assert(translate('en', 'credit.madeBy') === 'Made by' && translate('de', 'credit.madeBy') === 'Gemacht von', 'maintainer credit');
for (const lang of LOCALES) {
  for (const kurz of Object.keys(KURZ)) {
    assert(detailLine(lang, kurz), `${lang} has no detail for ${kurz}`);
    assert(DETAILS[lang][kurz] === detailLine(lang, kurz), `${lang} detail ${kurz}`);
  }
}
assert(jetztLaeuft('playing', { media_title: 'Night Drive', media_artist: 'The Twins', media_year: 2019 }) === 'Night Drive, The Twins (2019)', 'title, artist, year');
assert(jetztLaeuft('playing', { media_title: 'Night Drive', media_artist: 'The Twins' }) === 'Night Drive, The Twins', 'year omitted');
assert(jetztLaeuft('playing', { media_title: 'Night Drive (2019)', media_artist: 'The Twins', media_album_name: '2018' }) === 'Night Drive (2019), The Twins', 'album name is not a year');
assert(jetztLaeuft('playing', { media_title: 'Night Drive', media_release_date: '2019-04-02' }) === 'Night Drive (2019)', 'release date');
assert(jetztLaeuft('playing', { media_title: 'Night Drive', media_year: 'nope' }) === 'Night Drive', 'a bad year is omitted');
assert(jetztLaeuft('playing', { media_title: 'Night Drive', media_year: 1800 }) === 'Night Drive', 'an implausible year is omitted');
assert(jetztLaeuft('paused', { media_title: 'Night Drive', media_artist: 'The Twins', media_year: 2019 }) === null, 'paused shows nothing');
assert(jetztLaeuft('playing', {}) === null, 'playing without a title shows nothing');
assert(jetztLaeuft('unavailable', { media_title: 'Night Drive' }) === null, 'unavailable player stays hidden');
assert(jetztLaeuft('unknown', { media_title: 'Night Drive', media_artist: 'The Twins' }) === null, 'unknown player stays hidden');
assert(jetztLaeuft(undefined, null) === null, 'missing media payload stays hidden');
assert(jetztLaeuft('playing', { media_artist: 'The Twins', media_album_release_date: '03.05.2021' }) === 'The Twins (2021)', 'artist and a dotted date');

const onset = JSON.parse(fs.readFileSync(new URL('./onsets.json', import.meta.url)));
for (const clip of makeClips(onset)) {
  if (clip.name === '03_idle' || clip.name === '04_blicke') {
    assert(clip.sound == null, `${clip.name} is silent`);
    continue;
  }
  assert(clip.sound, `${clip.name} has no tone`);
  const wav = fs.readFileSync(new URL(`./sounds/${clip.sound}.wav`, import.meta.url));
  assert(wav.toString('ascii', 0, 4) === 'RIFF' && wav.toString('ascii', 8, 12) === 'WAVE', `${clip.sound} is not a wav`);
}
const kitzel = fs.readFileSync(new URL('./sounds/13_kitzel.wav', import.meta.url));
assert(kitzel.toString('ascii', 0, 4) === 'RIFF' && !kitzel.includes(Buffer.from('LIST')) && !kitzel.includes(Buffer.from('INFO')), 'tickle tone');

assert(translate('de', 'action.save') === 'Speichern', 'German save label');
assert(translate('fr', 'action.close') === 'Close', 'English fallback');
assert(translate('en', 'detail.called', { name: 'script.eye_music_on' }) === 'Called script.eye_music_on', 'placeholder');
assert(textOrServer('de', 'tokenMissing') === 'Token fehlt', 'our own code');
assert(textOrServer('en', 'Service not found') === 'Service not found', 'server text is left as-is');
assert(translate('en', 'settings.disclaimer').includes('xAI'), 'disclaimer');

const ausUrl = mitUrl(VORGABE, new URLSearchParams('lang=de&caption=1'));
assert(ausUrl.lang === 'de' && ausUrl.caption === true, 'lang and caption from the URL');
assert(mitUrl(VORGABE, new URLSearchParams('caption=0')).caption === false, 'caption aus');
assert(mitUrl({ ...VORGABE, caption: true }, new URLSearchParams('')).caption === true, 'caption is unchanged');
assert(mitUrl(VORGABE, new URLSearchParams('mode=led&sleep=8')).modus === 'led', 'mode from the URL');
assert(mitUrl(VORGABE, new URLSearchParams('mode=led&sleep=8')).schlafSekunden === 8, 'sleep from the URL');
assert(mitUrl(VORGABE, new URLSearchParams('modus=2d&schlaf=3')).modus === '2d' && mitUrl(VORGABE, new URLSearchParams('modus=2d&schlaf=3')).schlafSekunden === 3, 'original parameter names');
assert(VORGABE.haEntity === 'input_select.eye_ui_state', 'example entity');
assert(VORGABE.mediaEntity === '', 'media player starts empty');
assert(VORGABE.scriptMusikAn === 'script.eye_music_on' && VORGABE.scriptMusikAus === 'script.eye_music_off', 'music scripts');
assert(VORGABE.scriptLichtAn === 'script.eye_light_on' && VORGABE.scriptLichtAus === 'script.eye_light_off', 'light scripts');
assert(translate('en', 'ph.media') === 'media_player.living_room', 'media placeholder');
assert(VORGABE.caption === true, 'status line defaults to on');

const manifest = JSON.parse(fs.readFileSync(new URL('./manifest.webmanifest', import.meta.url)));
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));
assert(pkg.name === 'grok-bot-home-assistant-ui' && pkg.license === 'MIT', 'Paket');
assert(manifest.name === 'Grok Bot Home Assistant UI' && manifest.short_name === 'Grok Bot', 'Manifest');
assert(manifest.license === 'MIT' && manifest.maintainer === '@stefanvr82', 'Manifest-Maintainer');

const seite = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const credit = 'https://www.herrvonundzu.eu/digitalisierung-automatisierung-4';
assert(seite.split(credit).length === 2, 'the footer links to the maintainer');
assert(seite.includes('assets/brand/hvuz-logo.jpg'), 'the page has the mark');
assert(!seite.includes('Made by') && !seite.includes('Gemacht von'), 'no made-by line on the page');
assert(!seite.includes('id="sound-hint"') && !seite.includes('id="demo-badge"') && !seite.includes('id="demo-hint"'), 'no sound hint and no demo badge');
const creditsHtml = seite.slice(seite.indexOf('id="credits"'));
assert(creditsHtml && !creditsHtml.includes('github.com'), 'credits markup has no GitHub link while the repo is private');
assert(creditsHtml.includes('id="link-projekt"') && creditsHtml.includes('#credits'), 'credits link to the project anchor');
assert(creditsHtml.includes('credits.short'), 'credits stay a short line');
assert(REPO_PUBLIC === false, 'the shipped switch is off');
const zu = repoLinks(false);
assert(!zu.maintainer && !zu.repo && !zu.sponsors && !zu.repoLabel && !zu.supportLabel, 'private state has no GitHub link');
const auf = repoLinks(true);
assert(auf.maintainer === 'https://github.com/stefanvr82', 'public maintainer link');
assert(auf.repo === 'https://github.com/stefanvr82/grok-bot-home-assistant-ui', 'public repository link');
assert(auf.sponsors === 'https://github.com/sponsors/stefanvr82', 'public Sponsors link');
assert(auf.repoLabel === 'GitHub' && auf.supportLabel === 'GitHub Sponsors', 'public link labels');
assert(!LINKS.repo && !LINKS.sponsors && !LINKS.maintainer, 'hilfe.js follows the switch');
assert(LINKS.hvuz.includes('herrvonundzu.eu'), 'hilfe.js keeps HVUZ');
assert(translate('en', 'credits.soon') === 'coming soon' && translate('de', 'credits.soon') === 'kommt bald', 'coming soon in both languages');
assert(fs.existsSync(new URL('./assets/brand/hvuz-logo.jpg', import.meta.url)), 'page mark');
const notice = fs.readFileSync(new URL('../assets/brand/NOTICE.md', import.meta.url), 'utf8');
const seitenNotice = fs.readFileSync(new URL('./assets/brand/NOTICE.md', import.meta.url), 'utf8');
assert(/trademark/i.test(notice) && /all rights reserved/i.test(notice) && /not covered by the MIT/i.test(notice), 'brand notice');
assert(seitenNotice === notice, 'the page package includes the brand notice');
const funding = fs.readFileSync(new URL('../.github/FUNDING.yml', import.meta.url), 'utf8');
assert(funding.includes('github: [stefanvr82]'), 'GitHub Sponsors');

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Languages and status lines ok');
