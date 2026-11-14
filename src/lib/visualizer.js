import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { C } from './ui';

const BARS = 24;

// shortcut: animasi dekoratif, bukan analisis suara asli (expo-audio belum menyediakan data sampel untuk AudioPlaylist)
export function Visualizer({ playing }) {
  const bars = useRef([...Array(BARS)].map(() => new Animated.Value(0.15))).current;
  useEffect(() => {
    if (!playing) {
      Animated.parallel(bars.map((b) => Animated.timing(b, { toValue: 0.15, duration: 300, useNativeDriver: true }))).start();
      return;
    }
    const loops = bars.map((b, i) => Animated.loop(Animated.sequence([
      Animated.timing(b, { toValue: 0.3 + Math.random() * 0.7, duration: 180 + ((i * 37) % 220), useNativeDriver: true }),
      Animated.timing(b, { toValue: 0.1 + Math.random() * 0.3, duration: 160 + ((i * 53) % 240), useNativeDriver: true }),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [playing, bars]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 48, gap: 3 }}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {bars.map((b, i) => (
        <Animated.View key={i} style={{ width: 6, height: 48, borderRadius: 3, backgroundColor: C.green,
          opacity: 0.85, transform: [{ scaleY: b }], transformOrigin: 'bottom' }} />
      ))}
    </View>
  );
}
