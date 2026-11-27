import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import Ytdl from '../../modules/ytdl';
import { cleanTitle, fetchLyrics } from './lrc';

/** Kunci duplikat: judul tanpa embel-embel "(Official Video)" dsb, huruf kecil. */
export const titleKey = (title) => cleanTitle(title || '').toLowerCase();

const MUSIC = new Directory(Paths.document, 'music');
const DB = new File(Paths.document, 'library.json');
const musicPath = () => decodeURI(MUSIC.uri.replace(/^file:\/\//, '')).replace(/\/$/, '');

// bestaudio dipakai kalau bisa; sisanya cadangan saat YouTube sesekali membalas 403
const FORMATS = ['bestaudio', 'bestaudio[ext=m4a]', 'bestaudio[protocol^=m3u8]', 'best'];
const INFO = '%(.{id,title,uploader,artist,track,duration,filepath,format_id,acodec,abr})j';

function load() {
  try {
    const d = JSON.parse(DB.textSync());
    return { songs: d.songs || [], playlists: d.playlists || {} };
  } catch {
    return { songs: [], playlists: {} };
  }
}

const Ctx = createContext(null);

export function LibraryProvider({ children }) {
  const [db, setDb] = useState(load);

  useEffect(() => {
    DB.write(JSON.stringify(db)).catch((e) => console.warn('gagal menyimpan library', e));
  }, [db]);

  const addSong = useCallback((s) => setDb((d) => ({ ...d, songs: [...d.songs.filter((x) => x.id !== s.id), s] })), []);
  const updateSong = useCallback((id, patch) =>
    setDb((d) => ({ ...d, songs: d.songs.map((s) => (s.id === id ? { ...s, ...patch } : s)) })), []);

  const deleteSong = useCallback((id) => {
    setDb((d) => {
      const s = d.songs.find((x) => x.id === id);
      if (s && !s.device) { // lagu impor: file milik perangkat, jangan dihapus
        const f = new File(s.uri);
        if (f.exists) f.delete();
      }
      const playlists = Object.fromEntries(Object.entries(d.playlists).map(([n, ids]) => [n, ids.filter((x) => x !== id)]));
      return { songs: d.songs.filter((x) => x.id !== id), playlists };
    });
  }, []);

  const setPlaylist = useCallback((name, ids) => setDb((d) => ({ ...d, playlists: { ...d.playlists, [name]: ids } })), []);
  const deletePlaylist = useCallback((name) =>
    setDb((d) => { const { [name]: _, ...rest } = d.playlists; return { ...d, playlists: rest }; }), []);

  const songs = [...db.songs].sort((a, b) => a.title.localeCompare(b.title));
  const byId = Object.fromEntries(db.songs.map((s) => [s.id, s]));
  const hasTitle = (title) => db.songs.some((s) => titleKey(s.title) === titleKey(title));

  return (
    <Ctx.Provider value={{ songs, byId, hasTitle, playlists: db.playlists, addSong, updateSong, deleteSong, setPlaylist, deletePlaylist }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLibrary = () => useContext(Ctx);

const ENTRY = '%(.{id,title,uploader,duration})j';

/** Link video/playlist YouTube, atau kata kunci pencarian (10 hasil teratas). */
export async function findVideos(input) {
  const target = /^https?:\/\//.test(input) ? input : `ytsearch10:${input}`;
  const out = await Ytdl.run(target, [['--flat-playlist'], ['--print', ENTRY]], 'find');
  return out.split('\n').filter((l) => l.startsWith('{')).map((l) => {
    const e = JSON.parse(l);
    return { id: e.id, title: e.title || e.id, artist: e.uploader || '', duration: e.duration || 0 };
  });
}

/** URL audio langsung untuk streaming tanpa download (berlaku beberapa jam). */
export async function streamSong(entry) {
  let err;
  for (const fmt of FORMATS) {
    try {
      const out = await Ytdl.run(`https://www.youtube.com/watch?v=${entry.id}`,
        [['-f', fmt], ['-g'], ['--no-playlist']], `stream-${entry.id}`);
      const uri = out.split('\n').find((l) => l.startsWith('http'));
      if (uri) return { ...entry, id: `stream:${entry.id}`, uri, stream: true };
    } catch (e) {
      err = e;
    }
  }
  throw err || new Error('URL stream tidak ditemukan');
}

/** Lagu audio yang sudah ada di perangkat (MediaStore). File tidak disalin. */
export async function deviceSongs() {
  // dimuat saat dipakai saja: APK tanpa modul ini tetap bisa jalan, hanya fitur impor yang gagal
  const { AssetField, MediaType, Query, requestPermissionsAsync } = await import('expo-media-library');
  const perm = await requestPermissionsAsync(false, ['audio']);
  if (!perm.granted) throw new Error('Izin akses musik ditolak');
  const assets = await new Query().eq(AssetField.MEDIA_TYPE, MediaType.AUDIO).exe();
  const infos = await Promise.all(assets.map((a) => a.getInfo()));
  return infos.map((i) => ({
    id: `device:${i.id}`, title: i.filename.replace(/\.[^.]+$/, ''), artist: 'Perangkat',
    duration: (i.duration || 0) / 1000, uri: i.uri, device: true, format: 'File di perangkat',
  }));
}

const canceled = new Set();

/** Hentikan download yang sedang berjalan; downloadVideo lalu melempar error dengan e.canceled = true. */
export function cancelDownload(videoId) {
  canceled.add(videoId);
  Ytdl.cancel(videoId);
}

/** Download satu video jadi MP3 + lirik. onProgress(persen, baris log). */
export async function downloadVideo(videoId, onProgress) {
  MUSIC.create({ idempotent: true, intermediates: true });
  canceled.delete(videoId);
  const sub = Ytdl.addListener('onProgress', (e) => e.id === videoId && onProgress(e.progress, e.line));
  let err;
  try {
    for (const fmt of FORMATS) {
      try {
        const out = await Ytdl.run(`https://www.youtube.com/watch?v=${videoId}`, [
          ['-f', fmt], ['-x'], ['--audio-format', 'mp3'], ['--audio-quality', '192K'],
          ['-o', `${musicPath()}/%(id)s.%(ext)s`], ['--no-playlist'], ['--no-mtime'],
          // --print membuat yt-dlp diam, jadi --progress/--newline dipaksa agar progress tetap terkirim
          ['--print', `after_move:${INFO}`], ['--no-simulate'], ['--progress'], ['--newline'],
        ], videoId);
        const info = JSON.parse(out.trim().split('\n').pop());
        const lyr = await fetchLyrics(info).catch(() => null);
        return {
          id: info.id, title: info.title, artist: info.artist || info.uploader, duration: info.duration,
          uri: `file://${info.filepath}`,
          format: `${info.format_id} · ${info.acodec} · ${Math.round(info.abr || 0)} kbps → MP3 192 kbps`,
          lyrics: lyr?.lrc || null, lyricsSource: lyr?.source || null,
          downloaded: new Date().toISOString().slice(0, 10),
        };
      } catch (e) {
        if (canceled.has(videoId)) throw Object.assign(new Error('Dibatalkan'), { canceled: true }); // jangan coba format lain
        err = e;
      }
    }
    throw err;
  } finally {
    canceled.delete(videoId);
    sub.remove();
  }
}

export const updateYtdlp = () => Ytdl.update();
