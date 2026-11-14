import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useLibrary } from '../../lib/library';
import { Button, C, s, useSheet } from '../../lib/ui';

export default function Playlists() {
  const { playlists, setPlaylist, deletePlaylist } = useLibrary();
  const [name, setName] = useState('');
  const [sheet, openSheet] = useSheet();
  const create = () => {
    const n = name.trim();
    if (!n) return;
    if (playlists[n]) return Alert.alert('Nama sudah dipakai', n);
    setPlaylist(n, []);
    setName('');
  };
  return (
    <View style={s.screen}>
      <View style={s.bar}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Nama playlist baru" placeholderTextColor={C.dim}
          value={name} onChangeText={setName} onSubmitEditing={create} />
        <Button title="Buat" primary onPress={create} />
      </View>
      <FlatList data={Object.keys(playlists)} keyExtractor={(n) => n}
        ListEmptyComponent={<Text style={s.empty}>Belum ada playlist.</Text>}
        renderItem={({ item }) => (
          <Pressable style={s.row} onPress={() => router.push({ pathname: '/playlist/[name]', params: { name: item } })}
            onLongPress={() => openSheet({ title: item, subtitle: `${playlists[item].length} lagu`, actions: [
              { icon: 'delete-outline', label: 'Hapus playlist (lagunya tetap ada)', destructive: true,
                confirm: 'Ketuk lagi untuk menghapus', onPress: () => deletePlaylist(item) }] })}>
            <Text style={s.title}>{item}</Text>
            <Text style={s.sub}>{playlists[item].length} lagu</Text>
          </Pressable>
        )} />
      {sheet}
    </View>
  );
}
