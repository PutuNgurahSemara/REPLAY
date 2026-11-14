import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LibraryProvider } from '../lib/library';
import { PlayerProvider } from '../lib/player';
import { C } from '../lib/ui';

export default function RootLayout() {
  return (
    <LibraryProvider>
      <PlayerProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerStyle: { backgroundColor: C.bg }, headerTintColor: C.text, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="player" options={{ presentation: 'modal', title: 'Sedang diputar' }} />
          <Stack.Screen name="playlist/[name]" options={{ title: 'Playlist' }} />
          <Stack.Screen name="queue" options={{ title: 'Antrean' }} />
        </Stack>
      </PlayerProvider>
    </LibraryProvider>
  );
}
