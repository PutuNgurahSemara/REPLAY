import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { downloadVideo, findVideos, streamSong, titleKey, updateYtdlp, useLibrary } from '../../lib/library';
import { usePlayer } from '../../lib/player';
import { Button, C, mmss, s } from '../../lib/ui';

function IconBtn({ icon, label, onPress, color = C.text, disabled }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [{ padding: 6 }, (pressed || disabled) && { opacity: 0.4 }]}>
      <MaterialIcons name={icon} size={26} color={color} />
    </Pressable>
  );
}

export default function Online() {
  const { addSong, hasTitle } = useLibrary();
  const { playList, playNext } = usePlayer();
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState(null); // lagu yang sedang di-stream/download
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [typed, setTyped] = useState(false); // saran hanya muncul saat user sedang mengetik

  // Saran kata kunci ala YouTube, dicari 300 ms setelah berhenti mengetik
  useEffect(() => {
    const q = input.trim();
    if (!typed || !q || /^https?:\/\//.test(q)) { setSuggestions([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      // shortcut: endpoint saran tidak resmi; kalau berubah, saran hilang tapi pencarian biasa tetap jalan
      fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => r.json()).then((d) => setSuggestions(d[1] || [])).catch(() => {});
    }, 300);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [input, typed]);

  const search = async (text = input) => {
    const q = text.trim();
    if (!q) return;
    setTyped(false);
    setSuggestions([]);
    setSearching(true);
    setResults([]);
    setMsg('');
    try {
      const r = await findVideos(q);
      setResults(r);
      if (!r.length) setMsg('Tidak ada hasil.');
    } catch (e) {
      setMsg(`Gagal mencari: ${String(e.message || e).split('\n').pop()}`);
    }
    setSearching(false);
  };

  const stream = async (entry, next) => {
    setBusyId(entry.id);
    setStatus('Mengambil stream...');
    try {
      const song = await streamSong(entry);
      next ? playNext(song) : playList([song]);
      setMsg(next ? `Diputar berikutnya: ${entry.title}` : '');
    } catch (e) {
      setMsg(`Gagal stream: ${String(e.message || e).split('\n').pop()}`);
    }
    setBusyId(null);
  };

  const download = async (entries) => {
    for (const [i, entry] of entries.entries()) {
      if (hasTitle(entry.title)) { // duplikat dicek dari judul saja
        setMsg(`Dilewati (sudah ada): ${entry.title}`);
        continue;
      }
      setBusyId(entry.id);
      setProgress(0);
      setStatus(`[${i + 1}/${entries.length}] Menyiapkan yt-dlp...`);
      try {
        const song = await downloadVideo(entry.id, (p, line) => {
          const pct = p >= 0 ? p : Number(/(\d+(?:\.\d+)?)%/.exec(line || '')?.[1]);
          if (pct >= 0) setProgress(pct);
          if (line) setStatus(line.trim());
        });
        addSong(song);
        setMsg(`✓ ${song.title}${song.lyrics ? ' (dengan lirik)' : ''}`);
      } catch (e) {
        setMsg(`✗ ${entry.title}: ${String(e.message || e).split('\n').pop()}`); // lanjut ke lagu berikutnya
      }
    }
    setBusyId(null);
    setProgress(null);
  };

  const update = async () => {
    setMsg('Memperbarui yt-dlp...');
    try { setMsg(`yt-dlp: ${await updateYtdlp()}`); } catch (e) { setMsg(`Gagal update: ${e.message || e}`); }
  };

  const busy = searching || busyId !== null;
  const newOnes = results.filter((r) => !hasTitle(r.title));

  return (
    <View style={s.screen}>
      <View style={s.bar}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Cari lagu atau tempel link YouTube" placeholderTextColor={C.dim}
          value={input} onChangeText={(v) => { setInput(v); setTyped(true); }} onSubmitEditing={() => search()} autoCapitalize="none" autoCorrect={false}
          returnKeyType="search" />
        <Button title="Cari" primary onPress={busy ? undefined : () => search()} />
      </View>

      {suggestions.length > 0 && !busy && (
        <View style={{ backgroundColor: C.card, marginHorizontal: 16, borderRadius: 8 }}>
          {suggestions.slice(0, 8).map((q) => (
            <Pressable key={q} onPress={() => { setInput(q); search(q); }} accessibilityRole="button"
              style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }, pressed && { opacity: 0.5 }]}>
              <MaterialIcons name="search" size={20} color={C.dim} />
              <Text style={[s.title, { flex: 1 }]} numberOfLines={1}>{q}</Text>
              <Pressable onPress={() => setInput(q + ' ')} hitSlop={8} accessibilityLabel={`Pakai "${q}" lalu lanjut mengetik`}>
                <MaterialIcons name="north-west" size={20} color={C.dim} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

      {(searching || progress !== null || busyId) && (
        <View style={{ paddingHorizontal: 16, gap: 4 }}>
          {progress !== null ? (
            <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
              style={{ height: 6, backgroundColor: C.card, borderRadius: 3 }}>
              <View style={{ height: 6, width: `${progress}%`, backgroundColor: C.green, borderRadius: 3 }} />
            </View>
          ) : <ActivityIndicator size="large" color={C.green} style={{ alignSelf: 'center', marginTop: 32, transform: [{ scale: 1.5 }] }} />}
          <Text style={[s.sub, { fontSize: progress === null ? 14 : 11 }, progress === null && { textAlign: 'center', marginTop: 12 }]} numberOfLines={2}>
            {searching ? 'Mencari...' : progress >= 100 ? 'Mengonversi ke MP3 & mencari lirik...' : status}
          </Text>
        </View>
      )}
      {!!msg && <Text style={[s.sub, { paddingHorizontal: 16, marginTop: 4 }]}>{msg}</Text>}

      {results.length > 1 && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, gap: 8 }}>
          <Button title={`Download semua (${newOnes.length})`} style={{ flex: 1 }} onPress={busy ? undefined : () => download(newOnes)} />
        </View>
      )}

      <FlatList data={results} keyExtractor={(x) => x.id} contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={!busy && !msg ? <Text style={s.empty}>Cari lagu untuk di-stream atau di-download.{'\n'}Lagu yang di-stream butuh internet dan tidak tersimpan.</Text> : null}
        renderItem={({ item }) => {
          const owned = hasTitle(item.title);
          return (
            <View style={[s.row, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.title} numberOfLines={1}>{item.title}</Text>
                <Text style={s.sub} numberOfLines={1}>
                  {item.artist} · {mmss(item.duration)}{owned ? ' · sudah ada di Lagu' : ''}
                </Text>
              </View>
              {busyId === item.id ? <ActivityIndicator color={C.green} style={{ padding: 6 }} /> : <>
                <IconBtn icon="play-circle-outline" label="Stream sekarang" disabled={busy} onPress={() => stream(item)} />
                <IconBtn icon="queue-play-next" label="Stream berikutnya" disabled={busy} onPress={() => stream(item, true)} />
                <IconBtn icon={owned ? 'check-circle' : 'download'} label={owned ? 'Sudah diunduh' : 'Download'}
                  color={owned ? C.green : C.text} disabled={busy || owned} onPress={() => download([item])} />
              </>}
            </View>
          );
        }} />

      <Pressable onPress={busy ? undefined : update} style={{ padding: 12, alignItems: 'center' }}>
        <Text style={[s.sub, { fontSize: 12 }]}>Download gagal terus? Ketuk untuk update yt-dlp</Text>
      </Pressable>
    </View>
  );
}
