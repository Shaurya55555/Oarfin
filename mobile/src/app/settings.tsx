import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Button, Card, Notice, SectionTitle } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useSettings } from '../context/SettingsContext';
import { API_URL } from '../config';
import { capitalize, timeAgo } from '../lib/format';
import { formatDistance } from '../lib/geo';
import { ensureNotificationPermission } from '../lib/notifications';
import { colors, radius, severityColor } from '../theme';
import { SEVERITIES } from '../types';

export default function SettingsScreen() {
  const { user, isGuest, signOut } = useAuth();
  const { settings, update, contacts, addContact, removeContact } = useSettings();
  const { permission, requestPermission, lastReportedAt } = useLocation();
  const [radiusDraft, setRadiusDraft] = useState(settings.alertRadiusKm);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);

  const saveContact = () => {
    if (!contactName.trim() || !/^\+?[\d\s-]{6,}$/.test(contactPhone.trim())) {
      setContactError('Enter a name and a valid phone number.');
      return;
    }
    addContact(contactName, contactPhone);
    setContactName('');
    setContactPhone('');
    setContactError(null);
  };

  const confirmSignOut = () =>
    Alert.alert(isGuest ? 'Leave guest mode?' : 'Sign out?', isGuest ? 'You can sign in or create an account next.' : undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: isGuest ? 'Continue' : 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <Ionicons name={isGuest ? 'person-outline' : 'person'} size={30} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.displayName ?? 'Guest'}</Text>
          <Text style={styles.sub}>{user ? `${user.email} · ${capitalize(user.userType)}` : 'Not signed in'}</Text>
        </View>
      </Card>
      <Button
        title={isGuest ? 'Sign in or create account' : 'Sign out'}
        icon={isGuest ? 'log-in-outline' : 'log-out-outline'}
        variant="secondary"
        onPress={confirmSignOut}
      />

      <View>
        <SectionTitle>Safety</SectionTitle>
        <Card style={styles.group}>
          <ToggleRow
            icon="notifications"
            title="Danger zone notifications"
            subtitle="Alert me when I'm inside a disaster zone"
            value={settings.notificationsEnabled}
            onChange={async (v) => {
              if (v && !(await ensureNotificationPermission())) {
                Alert.alert('Notifications blocked', 'Allow notifications for Oarfin in your phone settings.');
              }
              update({ notificationsEnabled: v });
            }}
          />
          <ToggleRow
            icon="navigate"
            title="Share my location"
            subtitle={
              settings.shareLocation
                ? `Authorities and friends can see you${lastReportedAt ? ` · sent ${timeAgo(new Date(lastReportedAt).toISOString()).toLowerCase()}` : ''}`
                : 'Off — authorities and friends cannot see you'
            }
            value={settings.shareLocation}
            onChange={(v) => update({ shareLocation: v })}
          />
          {permission !== 'granted' && (
            <View style={{ padding: 12 }}>
              <Notice
                tone="warning"
                icon="location"
                action={<Button title="Allow location" compact onPress={requestPermission} style={{ alignSelf: 'flex-start' }} />}
              >
                Location access is off, so Oarfin can’t detect danger zones around you.
              </Notice>
            </View>
          )}
        </Card>
      </View>

      <View>
        <SectionTitle>Alerts</SectionTitle>
        <Card style={{ gap: 14 }}>
          <View>
            <View style={styles.sliderHeader}>
              <Text style={styles.rowTitle}>“Near me” radius</Text>
              <Text style={styles.sliderValue}>{formatDistance(radiusDraft)}</Text>
            </View>
            <Slider
              minimumValue={50}
              maximumValue={2000}
              step={50}
              value={settings.alertRadiusKm}
              onValueChange={setRadiusDraft}
              onSlidingComplete={(v) => update({ alertRadiusKm: v })}
              minimumTrackTintColor={colors.primary}
              thumbTintColor={colors.primary}
            />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={styles.rowTitle}>Show these severities</Text>
            {SEVERITIES.map((s) => (
              <View key={s} style={styles.severityRow}>
                <View style={[styles.dot, { backgroundColor: severityColor[s] }]} />
                <Text style={styles.severityLabel}>{s}</Text>
                <Switch
                  value={settings.severities[s]}
                  onValueChange={(v) => update({ severities: { ...settings.severities, [s]: v } })}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View>
        <SectionTitle>Emergency</SectionTitle>
        <Card style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <Text style={styles.rowTitle}>Emergency number</Text>
            <TextInput
              value={settings.emergencyNumber}
              onChangeText={(v) => update({ emergencyNumber: v.replace(/[^\d+]/g, '') })}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <Text style={styles.sub}>112 works across India and Europe. Change it for your country.</Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.rowTitle}>SOS contacts</Text>
            <Text style={styles.sub}>The SOS button opens a text message to these people with your live location.</Text>
            {contacts.map((c) => (
              <View key={c.id} style={styles.contactRow}>
                <Ionicons name="person-circle" size={26} color={colors.friend} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.sub}>{c.phone}</Text>
                </View>
                <Pressable onPress={() => removeContact(c.id)} hitSlop={8} accessibilityLabel={`Remove ${c.name}`}>
                  <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
            <View style={styles.contactForm}>
              <TextInput
                value={contactName}
                onChangeText={setContactName}
                placeholder="Name"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="Phone"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={[styles.input, { flex: 1 }]}
              />
            </View>
            {contactError && <Text style={styles.error}>{contactError}</Text>}
            <Button title="Add contact" icon="add" variant="secondary" compact onPress={saveContact} />
          </View>
        </Card>
      </View>

      <View>
        <SectionTitle>About</SectionTitle>
        <Card style={{ gap: 6 }}>
          <Text style={styles.rowTitle}>Oarfin {Constants.expoConfig?.version ?? ''}</Text>
          <Text style={styles.sub}>
            Live alerts come from GDACS (UN / European Commission) and from authorities using the Oarfin website. GDACS publishes no
            impact radius, so those danger zones are estimates.
          </Text>
          <Text style={[styles.sub, { marginTop: 4 }]}>Server: {API_URL}</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: any;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  group: { padding: 0 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderValue: { fontSize: 15, fontWeight: '700', color: colors.primary },
  severityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  severityLabel: { flex: 1, fontSize: 15, color: colors.text },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  contactName: { fontSize: 15, fontWeight: '600', color: colors.text },
  contactForm: { flexDirection: 'row', gap: 8 },
  error: { color: colors.critical, fontSize: 13 },
});
