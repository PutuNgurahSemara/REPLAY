import { Pressable, Text, View } from 'react-native';
import { router, Tabs } from 'expo-router';
import { useNetworkState } from 'expo-network';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, MiniPlayer } from '../../lib/ui';

const LABELS = { index: 'Lagu', playlists: 'Playlist', download: 'Online' };
const HREF = { index: '/', playlists: '/playlists', download: '/download' };

// Tab bar sendiri supaya mini player bisa menempel di atasnya
function TabBar({ state }) {
  const insets = useSafeAreaInsets();
  const net = useNetworkState();
  const offline = net.isConnected === false || net.isInternetReachable === false; // undefined = belum diketahui
  return (
    <View style={{ backgroundColor: C.bg, paddingBottom: insets.bottom }}>
      {offline && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite"
          style={{ backgroundColor: C.red, color: C.text, textAlign: 'center', paddingVertical: 6, fontWeight: '600' }}>
          Kamu sedang offline
        </Text>
      )}
      <MiniPlayer />
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line }}>
        {state.routes.map((r, i) => (
          <Pressable key={r.key} onPress={() => router.navigate(HREF[r.name])} accessibilityRole="tab"
            accessibilityState={{ selected: state.index === i }} style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: state.index === i ? C.text : C.dim, fontWeight: state.index === i ? '700' : '400' }}>
              {LABELS[r.name] || r.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />}
      screenOptions={{ headerStyle: { backgroundColor: C.bg }, headerTintColor: C.text, sceneStyle: { backgroundColor: C.bg } }}>
      <Tabs.Screen name="index" options={{ title: 'Lagu' }} />
      <Tabs.Screen name="playlists" options={{ title: 'Playlist' }} />
      <Tabs.Screen name="download" options={{ title: 'Online' }} />
    </Tabs>
  );
}
