import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createAudioPlaylist, setAudioModeAsync, useAudioPlaylistStatus } from 'expo-audio';

const Ctx = createContext(null);
const LOCK_OPTS = { showNextTrack: true, showPreviousTrack: true };
const src = (s) => ({ uri: s.uri, name: s.title });

const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function PlayerProvider({ children }) {
  // AudioPlaylist native: next/prev di notifikasi & lanjut otomatis tetap jalan saat app di latar belakang
  const [pl] = useState(() => createAudioPlaylist({ loop: 'all', updateInterval: 250 }));
  const status = useAudioPlaylistStatus(pl);
  const [queue, setQueue] = useState([]);
  const [loopOne, setLoopOne] = useState(false);
  const [sleep, setSleep] = useState(null); // null | { at: ms } | { endOfTrack: true }
  const queueRef = useRef(queue);
  const sleepRef = useRef(sleep);
  queueRef.current = queue;
  sleepRef.current = sleep;

  useEffect(() => {
    setAudioModeAsync({ shouldPlayInBackground: true, playsInSilentMode: true, interruptionMode: 'doNotMix' });
    const sub = pl.addListener('trackChanged', ({ currentIndex }) => {
      if (sleepRef.current?.endOfTrack) {
        pl.pause();
        setSleep(null);
      }
      const s = queueRef.current[currentIndex];
      if (s) pl.updateLockScreenMetadata({ title: s.title, artist: s.artist });
    });
    // pl hidup selama app; pl.remove(i) di playlist = hapus track, bukan release
    return () => sub.remove();
  }, [pl]);

  // Dicek tiap update status (event native tetap datang di latar belakang, beda dengan setTimeout JS)
  useEffect(() => {
    // akhir lagu: pause sebelum track berganti, karena trackChanged baru datang setelah lagu berikutnya mulai bunyi
    const endNear = sleep?.endOfTrack && status.duration > 0 && status.duration - status.currentTime < 0.4;
    if (endNear || (sleep?.at && Date.now() >= sleep.at)) {
      pl.pause();
      setSleep(null);
    }
  }, [status.currentTime, status.duration, sleep, pl]);

  const playList = (songs, start = 0, random = false) => {
    if (!songs.length) return;
    const q = random ? shuffled(songs) : songs;
    const idx = random ? 0 : start;
    pl.clear();
    q.forEach((s) => pl.add(src(s)));
    setQueue(q);
    pl.skipTo(idx);
    pl.play();
    pl.setActiveForLockScreen(true, { title: q[idx].title, artist: q[idx].artist }, LOCK_OPTS);
  };

  const insertAt = (song, index) => {
    if (!queueRef.current.length) return playList([song]);
    pl.insert(src(song), index);
    setQueue((q) => [...q.slice(0, index), song, ...q.slice(index)]);
  };

  const removeAt = (index) => {
    pl.remove(index);
    setQueue((q) => q.filter((_, i) => i !== index));
  };

  const stopIfQueued = (id) => {
    if (!queueRef.current.some((s) => s.id === id)) return;
    pl.pause();
    pl.clear();
    pl.setActiveForLockScreen(false);
    setQueue([]);
  };

  const value = {
    status, loopOne, queue, sleep,
    current: queue[status.currentIndex] || null,
    playList, stopIfQueued, removeAt,
    playNext: (song) => insertAt(song, status.currentIndex + 1),
    addToQueue: (song) => insertAt(song, queueRef.current.length),
    skipTo: (i) => { pl.skipTo(i); pl.play(); },
    toggleLoop: () => { pl.loop = loopOne ? 'all' : 'single'; setLoopOne(!loopOne); },
    setSleepMinutes: (m) => setSleep(m ? { at: Date.now() + m * 60000 } : null),
    sleepEndOfTrack: () => setSleep({ endOfTrack: true }),
    toggle: () => (status.playing ? pl.pause() : pl.play()),
    next: () => pl.next(),
    prev: () => (status.currentTime > 3 ? pl.seekTo(0) : pl.previous()),
    seek: (t) => pl.seekTo(t),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePlayer = () => useContext(Ctx);
