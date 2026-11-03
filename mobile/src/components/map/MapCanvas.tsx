import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { kmToDelta, type MapCanvasProps } from './types';

export function MapCanvas({
  initialCenter,
  initialSpanKm = 60,
  focus,
  markers,
  circles,
  mapType = 'standard',
  showsUserLocation = true,
  interactive = true,
  onMarkerPress,
  onMapPress,
  style,
}: MapCanvasProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!focus) return;
    const delta = kmToDelta(focus.spanKm);
    mapRef.current?.animateToRegion({ ...focus.coordinate, latitudeDelta: delta, longitudeDelta: delta }, 600);
  }, [focus]);

  const delta = kmToDelta(initialSpanKm);
  return (
    <MapView
      ref={mapRef}
      style={[StyleSheet.absoluteFill, style]}
      initialRegion={{ ...initialCenter, latitudeDelta: delta, longitudeDelta: delta }}
      mapType={mapType}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsCompass={interactive}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={interactive}
      pitchEnabled={false}
      toolbarEnabled={false}
      onPress={onMapPress}
    >
      {circles.map((c) => (
        <Circle
          key={c.id}
          center={c.center}
          radius={c.radiusKm * 1000}
          strokeColor={c.color}
          strokeWidth={2}
          fillColor={`${c.color}26`}
        />
      ))}
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={m.coordinate}
          title={m.title}
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
          onPress={(e) => {
            e.stopPropagation();
            onMarkerPress?.(m);
          }}
        >
          <View style={[styles.pin, { backgroundColor: m.color }]}>
            <Text style={styles.glyph}>{m.glyph}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 15 },
});
