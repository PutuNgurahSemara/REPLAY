import { FlatList, Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { usePlayer } from '../lib/player';
import { C, mmss, s, useSheet } from '../lib/ui';

export default function Queue() {
  const { queue, status, skipTo, removeAt } = usePlayer();
  const [sheet, openSheet] = useSheet();
  return (
    <View style={s.screen}>
      <FlatList data={queue} keyExtractor={(x, i) => `${x.id}-${i}`}
        initialScrollIndex={Math.max(status.currentIndex, 0) < queue.length ? Math.max(status.currentIndex, 0) : 0}
        getItemLayout={(_, i) => ({ length: 62, offset: 62 * i, index: i })}
        ListEmptyComponent={<Text style={s.empty}>Antrean kosong.</Text>}
        renderItem={({ item, index }) => {
          const now = index === status.currentIndex;
          return (
            <Pressable onPress={() => skipTo(index)} style={[s.row, { height: 62, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
              onLongPress={now ? undefined : () => openSheet({ title: item.title, subtitle: item.artist, actions: [
                { icon: 'remove-circle-outline', label: 'Keluarkan dari antrean', onPress: () => removeAt(index) }] })}>
              <MaterialIcons name={now ? 'graphic-eq' : item.stream ? 'cloud-queue' : 'music-note'} size={22}
                color={now ? C.green : C.dim} />
              <View style={{ flex: 1 }}>
                <Text style={[s.title, now && { color: C.green }]} numberOfLines={1}>{item.title}</Text>
                <Text style={s.sub} numberOfLines={1}>{item.artist} · {mmss(item.duration)}{item.stream ? ' · stream' : ''}</Text>
              </View>
            </Pressable>
          );
        }} />
      {sheet}
    </View>
  );
}
