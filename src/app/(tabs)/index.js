import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { deviceSongs, titleKey, useLibrary } from '../../lib/library';
import { usePlayer } from '../../lib/player';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button, C, SongRow, mmss, s, usePicker, useSheet } from '../../lib/ui';

export default function Songs() {
  const { songs, addSong, deleteSong } = useLibrary();
  const { playList, playNext, addToQueue, stopIfQueued } = usePlayer();
  const [msg, setMsg] = useState('');

  const importDevice = async () => {
    setMsg('Membaca musik di perangkat...');
    try {
      const found = await deviceSongs();
      const seen = new Set(songs.map((x) => titleKey(x.title)));
      let added = 0;
      for (const song of found) {
        if (seen.has(titleKey(song.title))) continue; // duplikat dicek dari judul saja
        seen.add(titleKey(song.title));
        addSong(song);
        added++;
      }
      setMsg(`${added} lagu diimpor, ${found.length - added} dilewati karena judulnya sudah ada.`);
    } catch (e) {
      setMsg(`Gagal impor: ${e.message || e}`);
    }
  };
  const [query, setQuery] = useState('');
  const [picker, pickFor] = usePicker();
  const [sheet, openSheet] = useSheet();
  const shown = songs.filter((x) => x.title.toLowerCase().includes(query.toLowerCase()));
  const [sel, setSel] = useState(null); // null = mode biasa, Set id = mode pilih banyak
  const toggleSel = (id) => setSel((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const picked = songs.filter((x) => sel?.has(x.id));

  const deletePicked = () => {
    const devices = picked.filter((x) => x.device).length;
    const files = picked.length - devices;
    openSheet({
      title: `Hapus ${picked.length} lagu?`,
      subtitle: [files && `${files} file download dihapus permanen`, devices && `${devices} lagu impor hanya dihapus dari daftar (file tetap ada)`]
        .filter(Boolean).join(' · '),
      actions: [{ icon: 'delete-outline', label: `Hapus ${picked.length} lagu`, destructive: true, confirm: 'Ketuk lagi untuk menghapus',
        onPress: () => { picked.forEach((x) => { stopIfQueued(x.id); deleteSong(x.id); }); setSel(null); } }],
    });
  };

  const menu = (song) => openSheet({
    title: song.title,
    subtitle: [song.artist, mmss(song.duration), song.format].filter(Boolean).join(' · '),
    actions: [
      { icon: 'queue-play-next', label: 'Putar berikutnya', onPress: () => playNext(song) },
      { icon: 'add-to-queue', label: 'Tambah ke antrean', onPress: () => addToQueue(song) },
      { icon: 'playlist-add', label: 'Tambah ke playlist', onPress: () => pickFor(song) },
      { icon: 'checklist', label: 'Pilih beberapa lagu', onPress: () => setSel(new Set([song.id])) },
      { icon: 'delete-outline', label: song.device ? 'Hapus dari daftar (file tetap ada)' : 'Hapus lagu', destructive: true,
        confirm: 'Ketuk lagi untuk menghapus',
        onPress: () => { stopIfQueued(song.id); deleteSong(song.id); } },
    ],
  });

  return (
    <View style={s.screen}>
      {sel ? (
        <View style={[s.bar, { alignItems: 'center' }]}>
          <Pressable onPress={() => setSel(null)} hitSlop={8} accessibilityLabel="Batal memilih">
            <MaterialIcons name="close" size={26} color={C.text} />
          </Pressable>
          <Text style={[s.title, { flex: 1 }]}>{sel.size} dipilih</Text>
          <Pressable onPress={() => setSel(sel.size === shown.length ? new Set() : new Set(shown.map((x) => x.id)))} hitSlop={8}
            accessibilityLabel={sel.size === shown.length ? 'Batal pilih semua' : 'Pilih semua'}>
            <MaterialIcons name="select-all" size={26} color={sel.size === shown.length ? C.green : C.text} />
          </Pressable>
          <Pressable onPress={() => picked.length && pickFor(picked)} hitSlop={8} accessibilityLabel="Tambah ke playlist">
            <MaterialIcons name="playlist-add" size={26} color={picked.length ? C.text : C.dim} />
          </Pressable>
          <Pressable onPress={() => picked.length && deletePicked()} hitSlop={8} accessibilityLabel="Hapus yang dipilih">
            <MaterialIcons name="delete-outline" size={26} color={picked.length ? C.red : C.dim} />
          </Pressable>
        </View>
      ) : (
      <View style={s.bar}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Cari lagu" placeholderTextColor={C.dim}
          value={query} onChangeText={setQuery} />
        <Pressable onPress={importDevice} hitSlop={8} accessibilityRole="button" accessibilityLabel="Impor musik dari perangkat"
          style={({ pressed }) => [{ justifyContent: 'center', paddingHorizontal: 4 }, pressed && { opacity: 0.5 }]}>
          <MaterialIcons name="library-add" size={28} color={C.text} />
        </Pressable>
        <Button title="Acak" primary onPress={() => playList(shown, 0, true)} />
      </View>
      )}
      {!!msg && <Text style={[s.sub, { paddingHorizontal: 16, marginBottom: 8 }]}>{msg}</Text>}
      <FlatList data={shown} keyExtractor={(x) => x.id} extraData={sel}
        ListEmptyComponent={<Text style={s.empty}>{songs.length ? 'Tidak ditemukan.' : 'Belum ada lagu. Cari di tab Online, atau ketuk ikon impor untuk memakai musik di HP.'}</Text>}
        renderItem={({ item, index }) => sel
          ? <SongRow song={item} selected={sel.has(item.id)} onPress={() => toggleSel(item.id)} onLongPress={() => toggleSel(item.id)} />
          : <SongRow song={item} onPress={() => playList(shown, index)} onLongPress={() => menu(item)} />} />
      {picker}
      {sheet}
    </View>
  );
}
