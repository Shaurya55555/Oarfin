import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, EmptyState, Notice, SectionTitle } from '../../components/ui';
import { useAlerts } from '../../context/AlertsContext';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../context/FriendsContext';
import { useLocation } from '../../context/LocationContext';
import { timeAgo } from '../../lib/format';
import { distanceKm, formatDistance } from '../../lib/geo';
import { showOnMap } from '../../lib/nav';
import { colors, radius } from '../../theme';
import type { Friend } from '../../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FriendsScreen() {
  const { user, signOut } = useAuth();
  const { friends, pending, loading, error, refresh, sendRequest, respond, remove } = useFriends();
  const { alertsAt } = useAlerts();
  const { position } = useLocation();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Pick up accepted requests and new locations whenever the tab is opened.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (!user) {
    return (
      <EmptyState
        icon="people-outline"
        title="Keep your people close"
        message="Sign in to add friends and family, see where they are during a disaster, and let them see you're safe."
        action={<Button title="Sign in or create account" icon="log-in" onPress={signOut} />}
      />
    );
  }

  const incoming = pending.filter((p) => !p.isRequestor);
  const outgoing = pending.filter((p) => p.isRequestor);

  const add = async () => {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setFeedback({ tone: 'error', text: 'Enter a valid email address.' });
      return;
    }
    if (value.toLowerCase() === user.email.toLowerCase()) {
      setFeedback({ tone: 'error', text: "That's your own email." });
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      await sendRequest(value);
      setEmail('');
      setFeedback({ tone: 'info', text: `Request sent to ${value}. They'll appear here once they accept.` });
    } catch (e: any) {
      setFeedback({ tone: 'error', text: e?.message || 'Could not send the request.' });
    } finally {
      setSending(false);
    }
  };

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = (f: Friend) =>
    Alert.alert('Remove friend?', `${f.displayName} will no longer see your location, and you won't see theirs.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => act(f.id, () => remove(f.id)) },
    ]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Card style={{ gap: 10 }}>
        <Text style={styles.cardTitle}>Add a friend</Text>
        <Text style={styles.cardSub}>Enter the email they used to sign up for Oarfin.</Text>
        <View style={styles.addRow}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="friend@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={add}
            style={styles.input}
          />
          <Button title="Send" icon="person-add" onPress={add} loading={sending} />
        </View>
        {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      {incoming.length > 0 && (
        <View>
          <SectionTitle>Requests for you</SectionTitle>
          <View style={{ gap: 10 }}>
            {incoming.map((r) => (
              <Card key={r.id} style={styles.personRow}>
                <Avatar name={r.displayName} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.displayName}</Text>
                  <Text style={styles.sub}>{r.email}</Text>
                </View>
                <Button title="Accept" compact variant="safe" loading={busyId === r.id} onPress={() => act(r.id, () => respond(r.id, true))} />
                <Button title="Decline" compact variant="ghost" disabled={busyId === r.id} onPress={() => act(r.id, () => respond(r.id, false))} />
              </Card>
            ))}
          </View>
        </View>
      )}

      <View>
        <SectionTitle>Friends ({friends.length})</SectionTitle>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>
            No friends yet. Add family members so you can check on each other during an emergency.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {friends.map((f) => {
              const hasLocation = f.latitude != null && f.longitude != null;
              const point = hasLocation ? { latitude: f.latitude!, longitude: f.longitude! } : null;
              const zones = point ? alertsAt(point) : [];
              const inDanger = zones.length > 0 || f.activeAlertsCount > 0;
              return (
                <Card key={f.id} style={{ gap: 12 }}>
                  <View style={styles.personRow}>
                    <Avatar name={f.displayName} danger={inDanger} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{f.displayName}</Text>
                      <Text style={styles.sub}>
                        {hasLocation ? `Seen ${timeAgo(f.lastLocationUpdate).toLowerCase()}` : 'Location not shared yet'}
                        {point && position ? ` · ${formatDistance(distanceKm(position, point))} away` : ''}
                        {f.batteryLevel != null ? ` · 🔋 ${f.batteryLevel}%` : ''}
                      </Text>
                    </View>
                  </View>
                  {inDanger ? (
                    <Notice tone="error" icon="warning">
                      {zones[0] ? `${f.displayName} is inside a danger zone: ${zones[0].title}` : `${f.displayName} has an active alert.`}
                    </Notice>
                  ) : hasLocation ? (
                    <View style={styles.safeRow}>
                      <Ionicons name="shield-checkmark" size={16} color={colors.safe} />
                      <Text style={styles.safeText}>Not in any known danger zone</Text>
                    </View>
                  ) : null}
                  <View style={styles.actions}>
                    <Button
                      title="Show on map"
                      icon="map"
                      variant="secondary"
                      compact
                      disabled={!point}
                      onPress={() => point && showOnMap(point, 10, `f:${f.id}`)}
                      style={{ flex: 1 }}
                    />
                    <Button title="Remove" icon="trash-outline" variant="ghost" compact disabled={busyId === f.id} onPress={() => confirmRemove(f)} />
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      {outgoing.length > 0 && (
        <View>
          <SectionTitle>Waiting for reply</SectionTitle>
          <View style={{ gap: 10 }}>
            {outgoing.map((r) => (
              <Card key={r.id} style={styles.personRow}>
                <Avatar name={r.displayName} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.displayName}</Text>
                  <Text style={styles.sub}>{r.email}</Text>
                </View>
                <Button title="Cancel" compact variant="ghost" loading={busyId === r.id} onPress={() => act(r.id, () => remove(r.id))} />
              </Card>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.footnote} onPress={() => router.push('/settings')}>
        Friends see your location only while location sharing is on in Settings.
      </Text>
    </ScrollView>
  );
}

function Avatar({ name, danger }: { name: string; danger?: boolean }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: danger ? colors.critical : colors.friend }]}>
      <Text style={styles.avatarText}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 13, color: colors.textSecondary },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.text,
  },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  safeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  safeText: { fontSize: 13, color: colors.safe, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  emptyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  footnote: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
