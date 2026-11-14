import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLibrary } from './library';
import { usePlayer } from './player';

export const C = { bg: '#121212', card: '#1e1e1e', line: '#2a2a2a', text: '#ffffff', dim: '#a7a7a7', green: '#1db954', red: '#f15e6c' };

export const mmss = (s) => (s ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

export function Button({ title, onPress, primary, style }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => [s.btn, primary && s.btnPrimary, pressed && { opacity: 0.7 }, style]}>
      <Text style={[s.btnText, primary && { color: '#000' }]}>{title}</Text>
    </Pressable>
  );
}

/** selected: undefined = mode biasa, true/false = mode pilih banyak. */
export function SongRow({ song, onPress, onLongPress, selected }) {
  const { current } = usePlayer();
  const playing = current?.id === song.id;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityState={selected === undefined ? undefined : { checked: selected }}
      style={({ pressed }) => [s.row, { flexDirection: 'row', alignItems: 'center', gap: 12 }, (pressed || selected) && { backgroundColor: C.card }]}>
      {selected !== undefined && <MaterialIcons name={selected ? 'check-circle' : 'radio-button-unchecked'} size={24} color={selected ? C.green : C.dim} />}
      <View style={{ flex: 1 }}>
        <Text style={[s.title, playing && { color: C.green }]} numberOfLines={1}>{song.title}</Text>
        <Text style={s.sub} numberOfLines={1}>{song.artist} · {mmss(song.duration)}{song.lyrics ? ' · lirik' : ''}</Text>
      </View>
    </Pressable>
  );
}

/** Modal pilih playlist untuk menambahkan satu lagu atau array lagu. */
export function PlaylistPicker({ song, onClose }) {
  const { playlists, setPlaylist } = useLibrary();
  const names = Object.keys(playlists);
  const ids = song ? [].concat(song).map((x) => x.id) : [];
  const hasAll = (n) => ids.every((id) => playlists[n].includes(id));
  return (
    <Modal visible={!!song} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <View style={s.sheet}>
          <View style={s.grip} />
          <Text style={s.h}>Tambah {ids.length > 1 ? `${ids.length} lagu ` : ''}ke playlist</Text>
          {names.length === 0 && <Text style={s.sub}>Belum ada playlist. Buat dulu di tab Playlist.</Text>}
          <FlatList data={names} keyExtractor={(n) => n} renderItem={({ item }) => (
            <Pressable style={s.action} onPress={() => {
              setPlaylist(item, [...playlists[item], ...ids.filter((id) => !playlists[item].includes(id))]);
              onClose();
            }}>
              <MaterialIcons name={hasAll(item) ? 'check-circle' : 'queue-music'} size={24}
                color={hasAll(item) ? C.green : C.dim} />
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item}</Text>
                <Text style={s.sub}>{hasAll(item) ? 'sudah ada' : `${playlists[item].length} lagu`}</Text>
              </View>
            </Pressable>
          )} />
        </View>
      </Pressable>
    </Modal>
  );
}

/** Menu bawah gaya Spotify. actions: [{ icon, label, onPress, destructive, confirm }] */
export function ActionSheet({ menu, onClose }) {
  const [armed, setArmed] = useState(null); // aksi berbahaya perlu ketuk dua kali
  const close = () => { setArmed(null); onClose(); };
  return (
    <Modal visible={!!menu} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={s.backdrop} onPress={close}>
        <Pressable style={s.sheet}>
          <View style={s.grip} />
          {menu && <>
            <Text style={s.title} numberOfLines={2}>{menu.title}</Text>
            {!!menu.subtitle && <Text style={s.sub} numberOfLines={2}>{menu.subtitle}</Text>}
            <View style={{ height: 1, backgroundColor: C.line, marginVertical: 12 }} />
            {menu.actions.map((a) => {
              const isArmed = armed === a.label;
              return (
                <Pressable key={a.label} accessibilityRole="button" style={({ pressed }) => [s.action, pressed && { opacity: 0.6 }]}
                  onPress={() => {
                    if (a.confirm && !isArmed) return setArmed(a.label);
                    close();
                    a.onPress();
                  }}>
                  <MaterialIcons name={a.icon} size={24} color={a.destructive ? C.red : C.dim} />
                  <Text style={[s.title, a.destructive && { color: C.red }]}>{isArmed ? a.confirm : a.label}</Text>
                </Pressable>
              );
            })}
          </>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function useSheet() {
  const [menu, setMenu] = useState(null);
  return [<ActionSheet key="sheet" menu={menu} onClose={() => setMenu(null)} />, setMenu];
}

export function usePicker() {
  const [song, setSong] = useState(null);
  return [<PlaylistPicker key="picker" song={song} onClose={() => setSong(null)} />, setSong];
}

export function MiniPlayer() {
  const { current, status, toggle, next } = usePlayer();
  if (!current) return null;
  const frac = status.duration ? status.currentTime / status.duration : 0;
  return (
    <Pressable onPress={() => router.push('/player')} style={s.mini}>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>{current.title}</Text>
        <Text style={s.sub} numberOfLines={1}>{current.artist}</Text>
      </View>
      <Pressable onPress={toggle} hitSlop={12} accessibilityLabel={status.playing ? 'Pause' : 'Putar'}>
        <MaterialIcons name={status.playing ? 'pause' : 'play-arrow'} size={30} color={C.text} />
      </Pressable>
      <Pressable onPress={next} hitSlop={12} accessibilityLabel="Berikutnya">
        <MaterialIcons name="skip-next" size={30} color={C.text} />
      </Pressable>
      <View style={[s.miniBar, { width: `${frac * 100}%` }]} />
    </Pressable>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  row: { paddingVertical: 10, paddingHorizontal: 16 },
  title: { color: C.text, fontSize: 16 },
  sub: { color: C.dim, fontSize: 13, marginTop: 2 },
  h: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: C.card, color: C.text, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  btn: { backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: C.green },
  btnText: { color: C.text, fontWeight: '600' },
  bar: { flexDirection: 'row', gap: 8, padding: 16 },
  backdrop: { flex: 1, backgroundColor: '#000a', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#282828', padding: 16, paddingBottom: 32, maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  grip: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: '#555', marginBottom: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.card, marginHorizontal: 8, marginBottom: 4, padding: 10, borderRadius: 8, overflow: 'hidden' },
  miniBar: { position: 'absolute', left: 0, bottom: 0, height: 2, backgroundColor: C.green },
  empty: { color: C.dim, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
});
