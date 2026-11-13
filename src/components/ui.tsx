import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import type { Team } from '../engine';
import { C, F, R } from '../theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const tap = (style: 'light' | 'medium' | 'success' = 'light') => {
  if (Platform.OS === 'web') return;
  if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else
    Haptics.impactAsync(style === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(
      () => {},
    );
};

export function Icon({ name, size = 20, color = C.text }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export function T({
  children,
  style,
  v = 'body',
  numberOfLines,
}: {
  children: ReactNode;
  style?: TextStyle | TextStyle[];
  v?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label' | 'score';
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[styles.base, styles[v], style as TextStyle]}>
      {children}
    </Text>
  );
}

export function Button({
  title,
  onPress,
  icon,
  kind = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  kind?: 'primary' | 'ghost' | 'danger' | 'gold';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const colors: [string, string] =
    kind === 'gold' ? [C.gold, C.goldDeep] : kind === 'danger' ? ['#FF5C7A', '#C8264A'] : [C.mint, C.mintDeep];
  const fg = kind === 'ghost' ? C.text : kind === 'danger' ? '#fff' : '#06210F';
  const inner = (
    <View style={styles.btnInner}>
      {icon && <Icon name={icon} size={20} color={fg} />}
      <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
    </View>
  );
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tap('medium');
        onPress();
      }}
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      {kind === 'ghost' ? (
        <View style={[styles.btn, { backgroundColor: C.card, borderWidth: 1, borderColor: C.line }]}>{inner}</View>
      ) : (
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
          {inner}
        </LinearGradient>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color = C.text, bg = C.card }: { icon: IconName; onPress: () => void; color?: string; bg?: string }) {
  return (
    <Pressable
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: bg, opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon name={icon} size={20} color={color} />
    </Pressable>
  );
}

export function Chip({ label, color = C.mint, icon }: { label: string; color?: string; icon?: IconName }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      {icon && <Icon name={icon} size={12} color={color} />}
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamBadge({ team, size = 32 }: { team?: Team | null; size?: number }) {
  const color = team?.color ?? C.dim;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: color + '26',
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {team ? (
        <Text style={{ color, fontFamily: F.display, fontSize: size * 0.42, letterSpacing: 0.5 }}>{initials(team.name)}</Text>
      ) : (
        <Icon name="help" size={size * 0.5} color={C.dim} />
      )}
    </View>
  );
}

export function Segmented<K extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <View style={styles.seg}>
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => {
              tap();
              onChange(it.key);
            }}
            style={[styles.segItem, active && styles.segActive]}
          >
            <Text style={[styles.segText, active && { color: '#06210F' }]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  big,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  big?: boolean;
  label?: string;
}) {
  const btn = (icon: IconName, d: number) => (
    <Pressable
      hitSlop={6}
      onPress={() => {
        const n = Math.min(max, Math.max(min, value + d));
        if (n !== value) {
          tap();
          onChange(n);
        }
      }}
      style={({ pressed }) => [big ? styles.stepBig : styles.step, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon name={icon} size={big ? 28 : 18} color={C.text} />
    </Pressable>
  );
  if (big) {
    return (
      <View style={{ alignItems: 'center', gap: 4 }}>
        {btn('plus', 1)}
        <Text style={styles.stepValueBig}>{value}</Text>
        {btn('minus', -1)}
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      {label ? <T v="label">{label}</T> : null}
      <View style={styles.stepRow}>
        {btn('minus', -1)}
        <Text style={big ? styles.stepValueBig : styles.stepValue}>{value}</Text>
        {btn('plus', 1)}
      </View>
    </View>
  );
}

export function Progress({ value, color = C.mint }: { value: number; color?: string }) {
  return (
    <View style={styles.progress}>
      <View style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.card, style as ViewStyle]}>{children}</View>;
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <T v="label" style={{ color: C.sub }}>{title}</T>
      {right}
    </View>
  );
}

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (b: boolean) => void }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onChange(!value);
      }}
      style={styles.toggleRow}
    >
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: F.semi }}>{label}</T>
        {hint ? <T v="small">{hint}</T> : null}
      </View>
      <View style={[styles.switch, value && { backgroundColor: C.mint }]}>
        <View style={[styles.knob, value && { transform: [{ translateX: 18 }], backgroundColor: '#06210F' }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { color: C.text, fontFamily: F.body, fontSize: 15 },
  h1: { fontFamily: F.display, fontSize: 40, letterSpacing: 0.5, lineHeight: 44 },
  h2: { fontFamily: F.display, fontSize: 28, letterSpacing: 0.4, lineHeight: 32 },
  h3: { fontFamily: F.displayBold, fontSize: 20, letterSpacing: 0.3 },
  body: {},
  small: { fontSize: 13, color: C.sub },
  label: { fontFamily: F.semi, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.sub },
  score: { fontFamily: F.display, fontSize: 22 },
  btn: { height: 54, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { fontFamily: F.display, fontSize: 19, letterSpacing: 1, textTransform: 'uppercase' },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, borderWidth: 1, alignSelf: 'flex-start' },
  chipText: { fontFamily: F.semi, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  seg: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.line },
  segItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  segActive: { backgroundColor: C.mint },
  segText: { fontFamily: F.semi, fontSize: 13, color: C.sub },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  step: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.cardHi, alignItems: 'center', justifyContent: 'center' },
  stepBig: { width: 64, height: 52, borderRadius: 16, backgroundColor: C.cardHi, alignItems: 'center', justifyContent: 'center' },
  stepValue: { color: C.text, fontFamily: F.display, fontSize: 22, minWidth: 34, textAlign: 'center' },
  stepValueBig: { color: C.text, fontFamily: F.display, fontSize: 84, minWidth: 90, textAlign: 'center', lineHeight: 92 },
  progress: { height: 6, backgroundColor: C.line, borderRadius: 4, overflow: 'hidden' },
  card: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  switch: { width: 46, height: 28, borderRadius: 14, backgroundColor: C.line, padding: 3 },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.sub },
});
