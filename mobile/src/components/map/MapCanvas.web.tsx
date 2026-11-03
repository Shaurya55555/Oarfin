import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
import type { MapCanvasProps } from './types';

// react-native-maps has no web build. The web target only exists for quick
// previews, so it lists the map's points instead of drawing tiles.
export function MapCanvas({ markers, circles, onMarkerPress, style, interactive = true }: MapCanvasProps) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.wrap, style]}>
      <Text style={styles.title}>Interactive map runs in the mobile app</Text>
      <Text style={styles.sub}>
        {markers.length} points · {circles.length} danger zones
      </Text>
      {interactive && (
        <ScrollView style={{ alignSelf: 'stretch' }} contentContainerStyle={{ gap: 6, padding: 12, paddingTop: 72 }}>
          {markers.slice(0, 40).map((m) => (
            <Pressable key={m.id} onPress={() => onMarkerPress?.(m)} style={styles.row}>
              <Text>{m.glyph}</Text>
              <Text style={styles.rowText} numberOfLines={1}>
                {m.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#dce8f0', alignItems: 'center', paddingTop: 16 },
  title: { fontWeight: '700', color: colors.navy },
  sub: { color: colors.textSecondary, fontSize: 12 },
  row: { flexDirection: 'row', gap: 8, backgroundColor: colors.card, padding: 8, borderRadius: 8 },
  rowText: { flex: 1, color: colors.text },
});
