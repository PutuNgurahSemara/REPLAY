import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { fetchLyrics, parseLrc, currentLine } from '../lib/lrc';
import { useLibrary } from '../lib/library';
import { Visualizer } from '../lib/visualizer';
import { usePlayer } from '../lib/player';
import { C, mmss, s, useSheet } from '../lib/ui';

function Ctrl({ label, icon, size = 36, color = C.text, onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => pressed && { opacity: 0.6 }}>
      <MaterialIcons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export default function Player() {
  const { current, status, toggle, next, prev, toggleLoop, loopOne, seek, sleep, setSleepMinutes, sleepEndOfTrack } = usePlayer();
  const { byId, updateSong } = useLibrary();
  const [barW, setBarW] = useState(1);
  const [fetched, setFetched] = useState({}); // lirik yang dicari saat diputar (lagu impor / stream)
  const [sheet, openSheet] = useSheet();
  const saved = current && byId[current.id]; // antrean menyimpan salinan; versi library ikut berubah saat lirik dihapus
  const lrc = current && ((saved || current).lyrics ?? fetched[current.id]);
  const lines = useMemo(() => parseLrc(lrc), [lrc]);

  // lagu yang belum pernah dicek liriknya (lyrics === undefined): cari di LRCLIB sekali
  useEffect(() => {
    if (!current || current.lyrics !== undefined || current.id in fetched) return;
    const id = current.id;
    fetchLyrics({ title: current.title, duration: current.duration }).catch(() => null).then((r) => {
      setFetched((f) => ({ ...f, [id]: r?.lrc || null }));
      if (byId[id]) updateSong(id, { lyrics: r?.lrc || null, lyricsSource: r?.source || null });
    });
  }, [current, fetched, byId, updateSong]);

  const sleepLabel = sleep?.endOfTrack ? 'Berhenti di akhir lagu'
    : sleep?.at ? `Berhenti dalam ${Math.max(1, Math.ceil((sleep.at - Date.now()) / 60000))} menit` : null;
  const sleepMenu = () => openSheet({ title: 'Sleep timer', subtitle: sleepLabel || 'Mati', actions: [
    ...[15, 30, 45, 60].map((m) => ({ icon: 'timer', label: `${m} menit`, onPress: () => setSleepMinutes(m) })),
    { icon: 'music-off', label: 'Akhir lagu ini', onPress: sleepEndOfTrack },
    ...(sleep ? [{ icon: 'timer-off', label: 'Matikan sleep timer', destructive: true, onPress: () => setSleepMinutes(0) }] : []),
  ] });
  // null = "sudah dicek, tidak ada", jadi lirik yang salah tidak dicari ulang otomatis
  const lyricsMenu = () => openSheet({ title: 'Lirik', subtitle: 'Hapus kalau lirik tidak sesuai dengan lagu', actions: [
    { icon: 'delete-outline', label: 'Hapus lirik', destructive: true, confirm: 'Ketuk lagi untuk menghapus', onPress: () => {
      setFetched((f) => ({ ...f, [current.id]: null }));
      if (saved) updateSong(current.id, { lyrics: null, lyricsSource: null });
    } },
  ] });
  if (!current) return <Text style={s.empty}>Tidak ada lagu yang diputar.</Text>;

  const cur = currentLine(lines, status.currentTime);
  const frac = status.duration ? status.currentTime / status.duration : 0;
  return (
    <View style={[s.screen, { padding: 24 }]}>
      <Text style={[s.h, { fontSize: 22 }]} numberOfLines={2}>{current.title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[s.sub, { flex: 1 }]} numberOfLines={1}>{current.artist}{current.stream ? ' · stream' : ''}</Text>
        {lines.length > 0 && <>
          <Ctrl label="Hapus lirik" icon="subtitles-off" size={26} color={C.dim} onPress={lyricsMenu} />
          <View style={{ width: 16 }} />
        </>}
        <Ctrl label="Sleep timer" icon={sleep ? 'bedtime' : 'bedtime-off'} size={26} color={sleep ? C.green : C.dim} onPress={sleepMenu} />
        <View style={{ width: 16 }} />
        <Ctrl label="Antrean" icon="queue-music" size={28} color={C.dim} onPress={() => router.push('/queue')} />
      </View>
      {sleepLabel && <Text style={[s.sub, { color: C.green }]}>{sleepLabel}</Text>}

      <View style={{ flex: 1, justifyContent: 'center' }}>
        {lines.length ? lines.slice(Math.max(cur - 3, 0), Math.max(cur - 3, 0) + 8).map(([t, txt], k) => {
          const i = Math.max(cur - 3, 0) + k;
          return (
            <Pressable key={i} onPress={() => seek(t)}>
              <Text style={{ fontSize: i === cur ? 22 : 17, fontWeight: i === cur ? '700' : '400',
                color: i === cur ? C.green : C.dim, marginVertical: 6 }}>{txt || '♪'}</Text>
            </Pressable>
          );
        }) : <Text style={s.empty}>{lrc === undefined && current.lyrics === undefined ? 'Mencari lirik...' : 'Lirik tidak tersedia.'}</Text>}
      </View>

      <Visualizer playing={status.playing} />

      <Pressable onLayout={(e) => setBarW(e.nativeEvent.layout.width || 1)}
        onPress={(e) => status.duration && seek((e.nativeEvent.locationX / barW) * status.duration)}
        style={{ paddingVertical: 10 }} accessibilityLabel="Posisi lagu">
        <View style={{ height: 4, backgroundColor: C.card, borderRadius: 2 }}>
          <View style={{ height: 4, width: `${frac * 100}%`, backgroundColor: C.text, borderRadius: 2 }} />
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={s.sub}>{mmss(status.currentTime)}</Text>
        <Text style={s.sub}>{mmss(status.duration)}</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 16 }}>
        <Ctrl label={loopOne ? 'Matikan ulangi lagu' : 'Ulangi lagu ini'} icon="repeat-one" size={28}
          color={loopOne ? C.green : C.dim} onPress={toggleLoop} />
        <Ctrl label="Sebelumnya" icon="skip-previous" size={40} onPress={prev} />
        <Ctrl label={status.playing ? 'Pause' : 'Putar'} icon={status.playing ? 'pause-circle-filled' : 'play-circle-filled'}
          size={72} onPress={toggle} />
        <Ctrl label="Berikutnya" icon="skip-next" size={40} onPress={next} />
        <View style={{ width: 28 }} />
      </View>
      {loopOne && <Text style={[s.sub, { textAlign: 'center', color: C.green }]}>Mengulang lagu ini</Text>}
      {current.format && <Text style={[s.sub, { textAlign: 'center', marginTop: 16 }]}>{current.format}</Text>}
      {sheet}
    </View>
  );
}
