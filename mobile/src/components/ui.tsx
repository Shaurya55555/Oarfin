import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, severityColor, shadow } from '../theme';
import type { Severity } from '../types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'safe' | 'ghost';

const BUTTON_COLORS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.card, fg: colors.primary, border: colors.border },
  danger: { bg: colors.critical, fg: colors.white, border: colors.critical },
  safe: { bg: colors.safe, fg: colors.white, border: colors.safe },
  ghost: { bg: 'transparent', fg: colors.textSecondary, border: 'transparent' },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  compact,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = BUTTON_COLORS[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: c.bg, borderColor: c.border, opacity: inactive ? 0.55 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} size="small" />
      ) : (
        icon && <Ionicons name={icon} size={compact ? 16 : 18} color={c.fg} />
      )}
      <Text style={[styles.buttonText, compact && styles.buttonTextCompact, { color: c.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <View style={[styles.badge, { backgroundColor: severityColor[severity] }]}>
      <Text style={styles.badgeText}>{severity.toUpperCase()}</Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color = colors.primary,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      style={[styles.chip, active ? { backgroundColor: color, borderColor: color } : null]}
    >
      <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({
  tone = 'info',
  icon,
  children,
  action,
}: {
  tone?: 'info' | 'error' | 'warning';
  icon?: IconName;
  children: ReactNode;
  action?: ReactNode;
}) {
  const tint = tone === 'error' ? colors.critical : tone === 'warning' ? colors.warning : colors.primary;
  return (
    <View style={[styles.notice, { borderColor: tint, backgroundColor: `${tint}14` }]}>
      <Ionicons name={icon ?? (tone === 'info' ? 'information-circle' : 'alert-circle')} size={20} color={tint} />
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={styles.noticeText}>{children}</Text>
        {action}
      </View>
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: IconName; title: string; message: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={56} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {action}
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  buttonCompact: { paddingVertical: 8, paddingHorizontal: 12 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  buttonTextCompact: { fontSize: 13 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, alignItems: 'flex-start' },
  noticeText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  infoRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: 12 },
  infoLabel: { width: 110, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  infoValue: { flex: 1, fontSize: 14, color: colors.text },
});
