// The whole UI kit in one file: text, layout, buttons, badges, stat tiles and
// the bar mark. Kept together because each piece is small and they are always
// imported as a set. Screens should not need raw <View>/<Text> styling beyond
// these.

import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, font, radius, sp, type Tone, toneStyle, weight } from './tokens';

// --- text --------------------------------------------------------------------
type TxtVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'tiny';

const VARIANT: Record<TxtVariant, TextStyle> = {
  display: { fontSize: font.display, lineHeight: font.display * 1.1, fontWeight: weight.bold },
  h1: { fontSize: font.h1, lineHeight: font.h1 * 1.2, fontWeight: weight.bold },
  h2: { fontSize: font.h2, lineHeight: font.h2 * 1.25, fontWeight: weight.semibold },
  h3: { fontSize: font.h3, lineHeight: font.h3 * 1.3, fontWeight: weight.semibold },
  body: { fontSize: font.body, lineHeight: font.body * 1.45 },
  small: { fontSize: font.small, lineHeight: font.small * 1.4 },
  tiny: { fontSize: font.tiny, lineHeight: font.tiny * 1.35 },
};

export function Txt(props: {
  children: ReactNode;
  variant?: TxtVariant;
  c?: string;
  w?: TextStyle['fontWeight'];
  center?: boolean;
  style?: TextStyle;
  numberOfLines?: number;
}) {
  const { children, variant = 'body', c = color.ink, w, center, style, numberOfLines } = props;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        VARIANT[variant],
        { color: c },
        w ? { fontWeight: w } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// --- layout ------------------------------------------------------------------
export function Screen(props: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  right?: ReactNode;
}) {
  const { children, title, subtitle, scroll = true, right } = props;
  const header =
    title != null ? (
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Txt variant="h1">{title}</Txt>
          {subtitle ? (
            <Txt variant="small" c={color.inkMuted} style={{ marginTop: 2 }}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {right}
      </View>
    ) : null;

  const body = (
    <>
      {header}
      {children}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.scrollContent, { flex: 1 }]}>{body}</View>
      )}
    </SafeAreaView>
  );
}

export function Row(props: {
  children: ReactNode;
  gap?: number;
  style?: ViewStyle;
  wrap?: boolean;
}) {
  const { children, gap = sp.sm, style, wrap } = props;
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap },
        wrap ? { flexWrap: 'wrap' } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Card(props: { children: ReactNode; onPress?: () => void; style?: ViewStyle }) {
  const { children, onPress, style } = props;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, style, pressed ? styles.pressed : null]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

// --- avatar ------------------------------------------------------------------
export function Avatar(props: { initials: string; tone?: Tone; size?: number }) {
  const { initials, tone = 'accent', size = 40 } = props;
  const { bg, fg } = toneStyle(tone);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: fg, fontWeight: weight.bold, fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

// --- badges ------------------------------------------------------------------
export function Badge(props: { label: string; tone?: Tone; dot?: boolean }) {
  const { label, tone = 'neutral', dot } = props;
  const { bg, fg } = toneStyle(tone);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: fg }]} /> : null}
      <Text style={{ color: fg, fontSize: font.tiny, fontWeight: weight.semibold }}>{label}</Text>
    </View>
  );
}

// --- buttons -----------------------------------------------------------------
export function Button(props: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
}) {
  const {
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    icon,
    style,
  } = props;
  const isDisabled = disabled || loading;
  const base: ViewStyle[] = [
    styles.btn,
    size === 'sm' ? styles.btnSm : null,
    variant === 'primary' ? styles.btnPrimary : null,
    variant === 'secondary' ? styles.btnSecondary : null,
    variant === 'ghost' ? styles.btnGhost : null,
    isDisabled ? { opacity: 0.5 } : null,
    style,
  ].filter(Boolean) as ViewStyle[];
  const fg =
    variant === 'primary' ? color.inkInverse : variant === 'secondary' ? color.ink : color.accent;
  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [...base, pressed && !isDisabled ? styles.pressed : null]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text
          style={{
            color: fg,
            fontWeight: weight.semibold,
            fontSize: size === 'sm' ? font.small : font.body,
          }}
        >
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      )}
    </Pressable>
  );
}

// --- stat tile ---------------------------------------------------------------
export function StatTile(props: {
  label: string;
  value: string;
  caption?: string;
  tone?: Tone;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const { label, value, caption, tone, onPress, style } = props;
  const accentFg = tone ? toneStyle(tone).fg : color.ink;
  return (
    <Card onPress={onPress} style={StyleSheet.flatten([{ flex: 1, gap: 2 }, style])}>
      <Txt
        variant="tiny"
        c={color.inkMuted}
        w={weight.semibold}
        style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Txt>
      <Txt variant="h1" c={accentFg}>
        {value}
      </Txt>
      {caption ? (
        <Txt variant="small" c={color.inkMuted}>
          {caption}
        </Txt>
      ) : null}
    </Card>
  );
}

// --- section title -----------------------------------------------------------
export function SectionTitle(props: { title: string; caption?: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={{ flex: 1 }}>
        <Txt variant="h3">{props.title}</Txt>
        {props.caption ? (
          <Txt variant="small" c={color.inkMuted}>
            {props.caption}
          </Txt>
        ) : null}
      </View>
      {props.action}
    </View>
  );
}

// --- bar mark ----------------------------------------------------------------
// A single horizontal bar: label, a track, a baseline-anchored fill with a
// rounded data-end, and the value printed in ink (never on the fill, so
// contrast never depends on the bar colour). Tapping drills in - the touch
// equivalent of a chart tooltip.
export function BarRow(props: {
  label: string;
  value: number;
  max?: number;
  display?: string;
  fill?: string;
  sub?: string;
  onPress?: () => void;
}) {
  const { label, value, max = 100, display, fill = color.struggle, sub, onPress } = props;
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const inner = (
    <View style={{ gap: 6, paddingVertical: sp.sm }}>
      <View style={styles.barLabelRow}>
        <Txt variant="small" w={weight.medium} numberOfLines={1} style={{ flex: 1 }}>
          {label}
        </Txt>
        <Txt variant="small" w={weight.bold}>
          {display ?? String(value)}
        </Txt>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fill }]} />
      </View>
      {sub ? (
        <Txt variant="tiny" c={color.inkMuted}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${display ?? String(value)}${sub ? `, ${sub}` : ''}`}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {inner}
    </Pressable>
  ) : (
    inner
  );
}

// --- loading -----------------------------------------------------------------
// Fills its container with a centred spinner while a screen's first fetch is in
// flight. Screens render this instead of a half-empty layout.
export function Loading(props: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={color.accent} />
      {props.label ? (
        <Txt variant="small" c={color.inkMuted}>
          {props.label}
        </Txt>
      ) : null}
    </View>
  );
}

// --- empty state -------------------------------------------------------------
export function EmptyState(props: { title: string; body?: string; icon?: string }) {
  return (
    <View style={styles.empty}>
      {props.icon ? <Text style={{ fontSize: 34 }}>{props.icon}</Text> : null}
      <Txt variant="h3" center>
        {props.title}
      </Txt>
      {props.body ? (
        <Txt variant="small" c={color.inkMuted} center>
          {props.body}
        </Txt>
      ) : null}
    </View>
  );
}

// --- error state -------------------------------------------------------------
// A failed fetch. Same centred layout as EmptyState, plus a retry that re-runs
// the screen's fetcher (useApi.reload) - so recovery is one tap, not a
// navigate-away-and-back.
export function ErrorState(props: { title?: string; message?: string; onRetry?: () => void }) {
  const { title = 'Something went wrong', message, onRetry } = props;
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 34 }}>⚠️</Text>
      <Txt variant="h3" center>
        {title}
      </Txt>
      {message ? (
        <Txt variant="small" c={color.inkMuted} center>
          {message}
        </Txt>
      ) : null}
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.appBg },
  scrollContent: { padding: sp.lg, gap: sp.lg, paddingBottom: sp.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: sp.sm },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.lg,
    padding: sp.lg,
    borderWidth: 1,
    borderColor: color.border,
    shadowColor: '#0B1220',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  pressed: { opacity: 0.7 },
  divider: { height: 1, backgroundColor: color.border },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: sp.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  btn: {
    minHeight: 48,
    paddingHorizontal: sp.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnSm: { minHeight: 38, paddingHorizontal: sp.md, borderRadius: radius.sm },
  btnPrimary: { backgroundColor: color.accent },
  btnSecondary: { backgroundColor: color.card, borderWidth: 1, borderColor: color.border },
  btnGhost: { backgroundColor: 'transparent' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: sp.sm, marginBottom: sp.xs },
  barLabelRow: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: color.track,
    overflow: 'hidden',
  },
  fill: { height: 10, minWidth: 6, borderRadius: radius.pill },
  empty: { alignItems: 'center', gap: sp.sm, padding: sp.xl },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.md,
    padding: sp.xl,
    backgroundColor: color.appBg,
  },
});
