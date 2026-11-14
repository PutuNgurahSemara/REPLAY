// Port dari player.py: parse .lrc dan cari lirik tersinkron di LRCLIB.
const TAG = /\[(\d+):(\d+(?:\.\d+)?)\]/g;

export function parseLrc(text) {
  const out = [];
  for (const line of (text || '').split(/\r?\n/)) {
    const txt = line.replace(TAG, '').trim();
    for (const [, m, s] of line.matchAll(TAG)) out.push([Number(m) * 60 + Number(s), txt]);
  }
  out.sort((a, b) => a[0] - b[0]);
  const res = [];
  for (const [t, txt] of out) {
    const last = res[res.length - 1];
    if (last && last[0] === t) last[1] = `${last[1]} ${txt}`.trim(); // satu cue bisa beberapa baris
    else if (!last || last[1] !== txt) res.push([t, txt]);
  }
  return res;
}

export function currentLine(lines, t) {
  let i = -1;
  while (i + 1 < lines.length && lines[i + 1][0] <= t) i++;
  return i;
}

export function cleanTitle(title) {
  return title
    .replace(/[([【].*?[)\]】]/g, ' ')
    .replace(/\b(official|music video|lyrics?|lyric video|audio|video|mv|hd|4k)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-|]+|[\s\-|]+$/g, '');
}

export function lrclibQueries(title, artist, track) {
  const qs = [];
  if (track && artist) qs.push({ track_name: track, artist_name: artist });
  const t = cleanTitle(title);
  qs.push({ q: t });
  if (t.includes(' - ')) qs.push({ q: t.split(' - ').pop() }); // "Artis - Judul": coba judulnya saja
  return qs;
}

export function bestMatch(results, duration, tolerance = 5) {
  let best = null;
  for (const r of results) {
    if (!r.syncedLyrics || !r.duration || Math.abs(r.duration - duration) > tolerance) continue;
    if (!best || Math.abs(r.duration - duration) < Math.abs(best.duration - duration)) best = r;
  }
  return best;
}

export async function fetchLyrics({ title, artist, track, duration }) {
  if (!duration) return null;
  for (const params of lrclibQueries(title, artist, track)) {
    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const r = await fetch(`https://lrclib.net/api/search?${qs}`, { headers: { 'User-Agent': 'musik-mobile' } });
    if (!r.ok) continue;
    const hit = bestMatch(await r.json(), duration);
    if (hit) return { lrc: hit.syncedLyrics, source: `${hit.artistName} - ${hit.trackName}` };
  }
  return null;
}
