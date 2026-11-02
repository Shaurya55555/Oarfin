import type { StyleProp, ViewStyle } from 'react-native';
import type { LatLng } from '../../types';

export type MarkerKind = 'alert' | 'safe' | 'shelter' | 'friend';

export type MapMarkerData = {
  id: string;
  kind: MarkerKind;
  coordinate: LatLng;
  title: string;
  color: string;
  glyph: string; // emoji drawn inside the pin; plain text renders reliably in map snapshots
};

export type MapCircleData = { id: string; center: LatLng; radiusKm: number; color: string };

export type AppMapType = 'standard' | 'satellite' | 'hybrid' | 'terrain';

// A new object each time the map should move, even to the same place.
export type MapFocus = { coordinate: LatLng; spanKm: number };

export type MapCanvasProps = {
  initialCenter: LatLng;
  initialSpanKm?: number;
  focus?: MapFocus | null;
  markers: MapMarkerData[];
  circles: MapCircleData[];
  mapType?: AppMapType;
  showsUserLocation?: boolean;
  interactive?: boolean;
  onMarkerPress?: (marker: MapMarkerData) => void;
  onMapPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// Degrees of latitude spanned by a given distance (1° ≈ 111 km).
export const kmToDelta = (km: number) => Math.max(0.005, km / 111);
