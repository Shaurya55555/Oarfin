import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Notice } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors, radius } from '../theme';

const USER_TYPES = [
  { value: 'civilian', label: 'Civilian' },
  { value: 'responder', label: 'Responder' },
  { value: 'agency', label: 'Agency' },
  { value: 'ngo', label: 'NGO' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', mobile: '', password: '', confirm: '' });
  const [userType, setUserType] = useState('civilian');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const isSignup = mode === 'signup';

  const submit = async () => {
    setError(null);
    if (!EMAIL_RE.test(form.email.trim())) return setError('Enter a valid email address.');
    if (!form.password) return setError('Enter your password.');
    if (isSignup) {
      if (!form.firstName.trim() || !form.lastName.trim()) return setError('Enter your first and last name.');
      if (form.password.length < 6) return setError('Use a password of at least 6 characters.');
      if (form.password !== form.confirm) return setError('Passwords do not match.');
    }
    setBusy(true);
    try {
      if (isSignup) {
        await signUp({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email,
          mobile: form.mobile.trim(),
          password: form.password,
          userType,
        });
      } else {
        await signIn(form.email, form.password);
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons name="shield-half" size={40} color={colors.primary} />
            </View>
            <Text style={styles.appName}>Oarfin</Text>
            <Text style={styles.tagline}>Real-time disaster alerts, safe places and help — wherever you are.</Text>
          </View>

          <View style={styles.tabs}>
            {(['signin', 'signup'] as const).map((m) => (
              <Text
                key={m}
                onPress={() => {
                  setMode(m);
                  setError(null);
                }}
                style={[styles.tab, mode === m && styles.tabActive]}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </Text>
            ))}
          </View>

          <View style={styles.form}>
            {isSignup && (
              <View style={styles.row}>
                <Field label="First name" value={form.firstName} onChangeText={set('firstName')} style={{ flex: 1 }} />
                <Field label="Last name" value={form.lastName} onChangeText={set('lastName')} style={{ flex: 1 }} />
              </View>
            )}
            <Field
              label="Email"
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {isSignup && (
              <Field label="Mobile (optional)" value={form.mobile} onChangeText={set('mobile')} keyboardType="phone-pad" />
            )}
            <Field label="Password" value={form.password} onChangeText={set('password')} secureTextEntry />
            {isSignup && <Field label="Confirm password" value={form.confirm} onChangeText={set('confirm')} secureTextEntry />}

            {isSignup && (
              <View style={{ gap: 8 }}>
                <Text style={styles.label}>I am a</Text>
                <View style={styles.chips}>
                  {USER_TYPES.map((t) => (
                    <Chip key={t.value} label={t.label} active={userType === t.value} onPress={() => setUserType(t.value)} />
                  ))}
                </View>
              </View>
            )}

            {error && <Notice tone="error">{error}</Notice>}

            <Button title={isSignup ? 'Create account' : 'Sign in'} onPress={submit} loading={busy} />
            <Button title="Continue as guest" variant="ghost" onPress={continueAsGuest} disabled={busy} />
            <Text style={styles.footnote}>
              Guests get alerts, the map and the assistant. Sign in to share your location with friends and family.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  style,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.textMuted} style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40, gap: 20, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', gap: 6, marginTop: 16 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  tagline: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  tabs: { flexDirection: 'row', backgroundColor: colors.section, borderRadius: radius.md, padding: 4 },
  tab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    overflow: 'hidden',
  },
  tabActive: { backgroundColor: colors.card, color: colors.primary },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footnote: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
