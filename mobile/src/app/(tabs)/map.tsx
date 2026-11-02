import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MapCanvas } from '../../components/map/MapCanvas';
import type { AppMapType, MapCircleData, MapFocus, MapMarkerData } from '../../components/map/types';
import { Button, Chip, SeverityBadge } from '../../components/ui';
import { useAlerts } from '../../context/AlertsContext';
import { useFriends } from '../../context/FriendsContext';
import { useLocation } from '../../context/LocationContext';
import { DEFAULT_REGION } from '../../config';
import { timeAgo } from '../../lib/format';
import { directionsUrl, distanceKm, formatDistance } from '../../lib/geo';
import { openAlert } from '../../lib/nav';
import { openUrl } from '../../lib/sos';
import { colors, radius, severityColor, shadow } from '../../theme';

type Layer = 'alerts' | 'safe' | 'shelters' | 'friends';

const LAYERS: { key: Layer; label: string; color: string }[] = [
  { key: 'alerts', label: 'Danger zones', color: colors.critical },
  { key: 'safe', label: 'Safe areas', color: colors.safe },
  { key: 'shelters', label: 'Shelters & help', color: colors.navy },
  { key: 'friends', label: 'Friends', color: colors.friend },
];

const MAP_TYPES: AppMapType[] = Platform.OS === 'android' ? ['standard', 'satellite', 'hybrid', 'terrain'] : ['standard', 'satellite', 'hybrid'];

const SHELTER_GLYPH: Record<string, string> = {
  hospital: '🏥',
  clinic: '🏥',
  nursing_home: '🏥',
  pharmacy: '💊',
  police: '👮',
  fire_station: '🚒',
  shelter: '🏠',
};

type Params = { lat?: string; lng?: string; span?: string; focus?: string; layer?: string; t?: string };

export default function MapScreen() {
  const params = useLocalSearchParams<Params>();
  const { position, refresh: refreshPosition } = useLocation();
  const { alerts, safeLocations, shelters, sheltersLoading, sheltersError, loadShelters, refresh, loading, alertsAt } = useAlerts();
  const { friends } = useFriends();

  const [layers, setLayers] = useState<Record<Layer, boolean>>({ alerts: true, safe: true, shelters: true, friends: true });
  const [mapTypeIndex, setMapTypeIndex] = useState(0);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [initialCenter] = useState(() => position ?? DEFAULT_REGION);

  // Centre on whatever another tab asked us to show. Adjusting state while
  // rendering (rather than in an effect) avoids a second render pass.
  const requestKey = [params.lat, params.lng, params.span, params.focus, params.layer, params.t].join('|');
  const [handledKey, setHandledKey] = useState('');
  if (requestKey !== handledKey) {
    setHandledKey(requestKey);
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (params.lat && params.lng && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      setFocus({ coordinate: { latitude: lat, longitude: lng }, spanKm: Number(params.span) || 30 });
      setSelectedId(params.focus || null);
    } else if (params.layer === 'shelters') {
      setLayers((l) => ({ ...l, shelters: true }));
      if (position) setFocus({ coordinate: position, spanKm: 20 });
    }
  }

  // Centre on the user the first time we learn where they are.
  const [centredOnUser, setCentredOnUser] = useState(!!position);
  if (position && !centredOnUser) {
    setCentredOnUser(true);
    if (!params.lat) setFocus({ coordinate: position, spanKm: 60 });
  }

  useEffect(() => {
    if (layers.shelters && position) loadShelters();
  }, [layers.shelters, position, loadShelters]);

  const { markers, circles } = useMemo(() => {
    const m: MapMarkerData[] = [];
    const c: MapCircleData[] = [];
    if (layers.alerts) {
      for (const a of alerts) {
        const color = severityColor[a.severity];
        c.push({ id: `c:${a.id}`, center: a, radiusKm: a.radiusKm, color });
        m.push({ id: `a:${a.id}`, kind: 'alert', coordinate: a, title: a.title, color, glyph: '⚠️' });
      }
    }
    if (layers.safe) {
      for (const s of safeLocations) {
        m.push({ id: `s:${s.id}`, kind: 'safe', coordinate: s, title: s.description, color: colors.safe, glyph: '✅' });
      }
    }
    if (layers.shelters) {
      for (const h of shelters.slice(0, 80)) {
        m.push({
          id: `h:${h.id}`,
          kind: 'shelter',
          coordinate: { latitude: h.lat, longitude: h.lng },
          title: h.name || h.type,
          color: colors.navy,
          glyph: SHELTER_GLYPH[h.type] ?? '🏠',
        });
      }
    }
    if (layers.friends) {
      for (const f of friends) {
        if (f.latitude == null || f.longitude == null) continue;
        m.push({
          id: `f:${f.id}`,
          kind: 'friend',
          coordinate: { latitude: f.latitude, longitude: f.longitude },
          title: f.displayName,
          color: colors.friend,
          glyph: '👤',
        });
      }
    }
    return { markers: m, circles: c };
  }, [layers, alerts, safeLocations, shelters, friends]);

  const goToMe = async () => {
    const p = (await refreshPosition()) ?? position;
    if (p) setFocus({ coordinate: p, spanKm: 15 });
  };

  const mapType = MAP_TYPES[mapTypeIndex % MAP_TYPES.length];

  return (
    <View style={{ flex: 1 }}>
      <MapCanvas
        initialCenter={initialCenter}
        initialSpanKm={position ? 60 : 1500}
        focus={focus}
        markers={markers}
        circles={circles}
        mapType={mapType}
        onMarkerPress={(m) => setSelectedId(m.id)}
        onMapPress={() => setSelectedId(null)}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.layerBar} contentContainerStyle={styles.layerContent}>
        {LAYERS.map((l) => (
          <Chip
            key={l.key}
            label={l.label}
            color={l.color}
            active={layers[l.key]}
            onPress={() => setLayers((prev) => ({ ...prev, [l.key]: !prev[l.key] }))}
          />
        ))}
      </ScrollView>

      <View style={styles.controls}>
        <MapButton icon="layers" label={`Map type: ${mapType}`} onPress={() => setMapTypeIndex((i) => i + 1)} />
        <MapButton icon="locate" label="My location" onPress={goToMe} />
        <MapButton icon="refresh" label="Refresh" onPress={refresh} busy={loading} />
      </View>

      {layers.shelters && (sheltersLoading || sheltersError) && !selectedId && (
        <View style={styles.status}>
          {sheltersLoading && <ActivityIndicator size="small" color={colors.primary} />}
          <Text style={styles.statusText}>{sheltersLoading ? 'Finding shelters and emergency services nearby…' : sheltersError}</Text>
        </View>
      )}

      {selectedId && renderSheet(selectedId)}
    </View>
  );

  // Plain render helpers (not components) so the sheet isn't remounted on every render.
  function renderSheet(id: string) {
    const onClose = () => setSelectedId(null);
    const [kind, ...rest] = id.split(':');
    const key = rest.join(':');
    let content: React.ReactNode = null;

    if (kind === 'a') {
      const a = alerts.find((x) => x.id === key);
      if (a) {
        content = (
          <>
            <View style={styles.sheetHeader}>
              <SeverityBadge severity={a.severity} />
              <Text style={styles.sheetMeta}>{timeAgo(a.issuedAt)}</Text>
            </View>
            <Text style={styles.sheetTitle}>{a.title}</Text>
            <Text style={styles.sheetBody} numberOfLines={3}>
              {a.inside
                ? 'You are inside this zone.'
                : a.distanceKm !== null
                  ? `${formatDistance(a.distanceKm)} from you · ${a.radiusEstimated ? 'estimated ' : ''}${formatDistance(a.radiusKm)} radius`
                  : `${formatDistance(a.radiusKm)} radius`}
            </Text>
            <Button title="View details" icon="information-circle" onPress={() => openAlert(a.id)} />
          </>
        );
      }
    } else if (kind === 's') {
      const s = safeLocations.find((x) => x.id === key);
      if (s) content = placeContent({ title: s.description, badge: 'OFFICIAL SAFE AREA', color: colors.safe, point: s });
    } else if (kind === 'h') {
      const h = shelters.find((x) => x.id === key);
      if (h) {
        content = placeContent({
          title: h.name || h.type.replace(/_/g, ' '),
          badge: h.type.replace(/_/g, ' ').toUpperCase(),
          color: colors.navy,
          point: { latitude: h.lat, longitude: h.lng },
          extra: [h.address, h.capacity ? `Capacity ${h.capacity}` : null, `Source: ${h.source}`].filter(Boolean).join(' · '),
        });
      }
    } else if (kind === 'f') {
      const f = friends.find((x) => x.id === key);
      if (f && f.latitude != null && f.longitude != null) {
        const zones = alertsAt({ latitude: f.latitude, longitude: f.longitude });
        content = placeContent({
          title: f.displayName,
          badge: zones.length ? 'IN A DANGER ZONE' : 'FRIEND',
          color: zones.length ? colors.critical : colors.friend,
          point: { latitude: f.latitude, longitude: f.longitude },
          extra: [
            `Last seen ${timeAgo(f.lastLocationUpdate).toLowerCase()}`,
            f.batteryLevel != null ? `Battery ${f.batteryLevel}%` : null,
            zones[0]?.title,
          ]
            .filter(Boolean)
            .join(' · '),
        });
      }
    }

    if (!content) return null;
    return (
      <View style={styles.sheet}>
        <Pressable onPress={onClose} style={styles.sheetClose} hitSlop={10} accessibilityLabel="Close">
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
        {content}
      </View>
    );
  }

  function placeContent({
    title,
    badge,
    color,
    point,
    extra,
  }: {
    title: string;
    badge: string;
    color: string;
    point: { latitude: number; longitude: number };
    extra?: string;
  }) {
    return (
      <>
        <View style={[styles.placeBadge, { backgroundColor: color }]}>
          <Text style={styles.placeBadgeText}>{badge}</Text>
        </View>
        <Text style={styles.sheetTitle}>{title}</Text>
        <Text style={styles.sheetBody} numberOfLines={3}>
          {[position ? `${formatDistance(distanceKm(position, point))} from you` : null, extra].filter(Boolean).join(' · ')}
        </Text>
        <Button title="Get directions" icon="navigate" variant="safe" onPress={() => openUrl(directionsUrl(point))} />
      </>
    );
  }
}

function MapButton({ icon, label, onPress, busy }: { icon: any; label: string; onPress: () => void; busy?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.mapButton} accessibilityLabel={label}>
      {busy ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name={icon} size={22} color={colors.text} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layerBar: { position: 'absolute', top: 10, left: 0, right: 0 },
  layerContent: { paddingHorizontal: 12, gap: 8 },
  controls: { position: 'absolute', right: 12, top: 60, gap: 10 },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  status: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: radius.md,
    ...shadow,
  },
  statusText: { flex: 1, fontSize: 13, color: colors.textSecondary },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
    ...shadow,
    elevation: 6,
  },
  sheetClose: { position: 'absolute', right: 12, top: 12, zIndex: 1 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetMeta: { fontSize: 12, color: colors.textMuted },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.text, paddingRight: 24 },
  sheetBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  placeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  placeBadgeText: { color: colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
});
