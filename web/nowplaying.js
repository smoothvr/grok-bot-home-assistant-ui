// SPDX-License-Identifier: MIT
// Now-playing text from a Home Assistant media_player. A year is shown only when an attribute actually carries one.

const JAHR_KEYS = [
  'media_year',
  'media_album_year',
  'media_release_year',
  'media_album_release_year',
  'year',
  'media_release_date',
  'media_album_release_date',
  'release_date',
  'media_album_date',
  'media_date',
];

function jahrAusWert(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1900 && value <= 2099) return String(value);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  if (!text || text.length > 40) return null;
  if (/^(19|20)\d{2}$/.test(text)) return text;
  const iso = text.match(/^((?:19|20)\d{2})-\d{2}-\d{2}(?:$|T)/);
  if (iso) return iso[1];
  const dmy = text.match(/^\d{1,2}[./]\d{1,2}[./]((?:19|20)\d{2})$/);
  if (dmy) return dmy[1];
  return null;
}

export function jahrAusAttributen(attr) {
  if (!attr || typeof attr !== 'object') return null;
  for (const key of JAHR_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(attr, key)) continue;
    const year = jahrAusWert(attr[key]);
    if (year) return year;
  }
  return null;
}

// How long playback may stay stopped before the now-playing view closes.
export const MUSIK_RUHE_MS = 20000;

const QUEUE_KEYS = [
  'queue', 'media_queue', 'media_queue_items', 'queue_items',
  'spotifyplus_queue', 'spotifyplus_track_queue', 'upcoming_media', 'up_next',
];
const PLAYLIST_KEYS = ['playlists', 'playlist_list', 'media_playlists', 'spotifyplus_playlists'];

function alsListe(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().charAt(0) === '[') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* a plain string is not a list */ }
  }
  return null;
}

function ersteListe(attr, keys) {
  for (let i = 0; i < keys.length; i++) {
    const liste = alsListe(attr[keys[i]]);
    if (liste && liste.length) return liste;
  }
  return null;
}

function textVon(item) {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
  const title = item.media_title || item.title || item.name || item.song || item.track || '';
  const artist = item.media_artist || item.artist || '';
  return [String(title).trim(), String(artist).trim()].filter(Boolean).join(' — ');
}

function eintragVon(item, artFallback) {
  if (item == null) return null;
  if (typeof item === 'string' || typeof item === 'number') {
    const label = String(item).trim();
    if (!label) return null;
    if (/^spotify:/.test(label) || label.indexOf('://') >= 0) {
      return { label, art: 'media', contentId: label, contentType: 'music' };
    }
    if (artFallback === 'media') return { label, art: 'media', contentId: label, contentType: 'music' };
    return { label, art: 'source', source: label };
  }
  if (typeof item !== 'object') return null;
  const label = textVon(item);
  const id = item.media_content_id || item.uri || item.media_id || item.id || '';
  const type = item.media_content_type || item.content_type || (id ? 'music' : '');
  if (id) {
    return {
      label: label || String(id),
      art: 'media',
      contentId: String(id),
      contentType: String(type || 'music'),
    };
  }
  const source = item.source || item.name || label;
  if (!source) return null;
  if (artFallback === 'media') {
    return { label: label || String(source), art: 'media', contentId: String(source), contentType: 'music' };
  }
  return { label: label || String(source), art: 'source', source: String(source) };
}

// Up to five things the player can start. A queue wins. Otherwise playlists, then source_list.
export function naechsteEintraege(attr, limit = 5) {
  const max = Math.max(0, Math.min(5, Number(limit) || 5));
  if (!attr || typeof attr !== 'object' || !max) return [];
  const out = [];
  const push = (item, art) => {
    if (out.length >= max) return;
    const eintrag = eintragVon(item, art);
    if (!eintrag) return;
    if (eintrag.art === 'media' && attr.media_content_id && eintrag.contentId === String(attr.media_content_id)) return;
    out.push(eintrag);
  };
  const queue = ersteListe(attr, QUEUE_KEYS);
  if (queue) {
    for (let i = 0; i < queue.length; i++) push(queue[i], 'media');
    return out;
  }
  const lists = ersteListe(attr, PLAYLIST_KEYS);
  if (lists) {
    for (let i = 0; i < lists.length; i++) push(lists[i], 'media');
    return out;
  }
  const sources = alsListe(attr.source_list);
  if (sources) {
    for (let i = 0; i < sources.length; i++) push(sources[i], 'source');
  }
  return out;
}

// music_on opens the view. Playback does too, after thinking or understood. A snapshot does not.
export function sollMusikOeffnen(eye, mediaState, quelle) {
  if (!quelle || quelle === 'snapshot') return false;
  if (eye === 'musik_an') return true;
  return String(mediaState || '') === 'playing' && (eye === 'nachdenken' || eye === 'verstanden');
}

export function wiedergabeLaeuft(state) {
  const s = String(state || '').trim().toLowerCase();
  return s === 'playing' || s === 'buffering';
}

// "Title, Artist (Year)". Missing pieces are left out. Playback other than "playing" returns null.
export function jetztLaeuft(state, attr) {
  if (String(state ?? '').trim().toLowerCase() !== 'playing') return null;
  const title = String(attr?.media_title ?? '').trim();
  const artist = String(attr?.media_artist ?? '').trim();
  if (!title && !artist) return null;
  let text = title && artist ? `${title}, ${artist}` : (title || artist);
  const year = jahrAusAttributen(attr);
  if (year) text += ` (${year})`;
  return text;
}
