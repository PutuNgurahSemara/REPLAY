import { FlatList, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useLibrary } from '../../lib/library';
import { usePlayer } from '../../lib/player';
import { Button, MiniPlayer, SongRow, mmss, s, useSheet } from '../../lib/ui';

export default function PlaylistDetail() {
  const { name } = useLocalSearchParams();
  const { playlists, byId, setPlaylist } = useLibrary();
  const { playList } = usePlayer();
  const [sheet, openSheet] = useSheet();
  const ids = playlists[name] || [];
  const songs = ids.map((id) => byId[id]).filter(Boolean);
  return (
    <View style={s.screen}>
      <Stack.Screen options={{ title: name }} />
      <View style={s.bar}>
        <Button title="Putar" primary style={{ flex: 1 }} onPress={() => playList(songs)} />
        <Button title="Acak" style={{ flex: 1 }} onPress={() => playList(songs, 0, true)} />
      </View>
      <FlatList data={songs} keyExtractor={(x) => x.id}
        ListEmptyComponent={<Text style={s.empty}>Kosong. Tekan lama sebuah lagu di tab Lagu untuk menambahkannya.</Text>}
        renderItem={({ item, index }) => (
          <SongRow song={item} onPress={() => playList(songs, index)}
            onLongPress={() => openSheet({ title: item.title, subtitle: `${item.artist} · ${mmss(item.duration)}`, actions: [
              { icon: 'remove-circle-outline', label: `Keluarkan dari ${name}`,
                onPress: () => setPlaylist(name, ids.filter((x) => x !== item.id)) }] })} />
        )} />
      <MiniPlayer />
      {sheet}
    </View>
  );
}
