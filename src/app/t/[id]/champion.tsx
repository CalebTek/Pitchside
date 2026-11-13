import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, TeamBadge } from '../../../components/ui';
import { Resolver, type Team } from '../../../engine';
import { useTournament } from '../../../store';
import { C, F, R } from '../../../theme';

const { width: W, height: H } = Dimensions.get('window');
const CONFETTI = ['#FFC93C', '#3DF5A7', '#5B8CFF', '#FF5C7A', '#ffffff', '#B07CFF'];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        x: Math.random() * W,
        delay: Math.random() * 1400,
        dur: 2600 + Math.random() * 2200,
        size: 6 + Math.random() * 7,
        color: CONFETTI[i % CONFETTI.length],
        drift: (Math.random() - 0.5) * 120,
        rot: Math.random() * 720,
        v: new Animated.Value(0),
      })),
    [],
  );
  useEffect(() => {
    const anims = pieces.map((p) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.v, { toValue: 1, duration: p.dur, easing: Easing.linear, useNativeDriver: true }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [pieces]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.size,
            height: p.size * 0.45,
            borderRadius: 1.5,
            backgroundColor: p.color,
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, H + 40] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.drift, 0] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

export default function Champion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTournament(id);
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.4)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 600, delay: 250, useNativeDriver: true }),
    ]).start();
  }, [scale, fade]);

  const data = useMemo(() => {
    if (!t) return null;
    const r = new Resolver(t);
    const p = r.podium();
    const find = (x: string | null) => (x ? t.teams.find((tm) => tm.id === x) ?? null : null);
    const champ = find(p.champion);
    const stats = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    if (champ) {
      for (const m of r.matches()) {
        if (!m.result || (m.home !== champ.id && m.away !== champ.id)) continue;
        const isHome = m.home === champ.id;
        const f = isHome ? m.result.hs : m.result.as;
        const a = isHome ? m.result.as : m.result.hs;
        stats.p++;
        stats.gf += f;
        stats.ga += a;
        if (f > a) stats.w++;
        else if (f < a) stats.l++;
        else stats.d++;
      }
    }
    return { champ, runnerUp: find(p.runnerUp), third: find(p.third), stats };
  }, [t]);

  if (!t || !data?.champ) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.sub, fontFamily: F.medium }}>No champion yet.</Text>
        <Button title="Back" kind="ghost" style={{ marginTop: 16 }} onPress={() => router.back()} />
      </View>
    );
  }
  const { champ, runnerUp, third, stats } = data;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={['#3A2A00', C.bg, C.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, { backgroundColor: champ.color + '22' }]} />
      <Confetti />
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="close" onPress={() => router.replace({ pathname: '/t/[id]', params: { id: t.id } })} bg="#00000040" />
      </View>
      <View style={styles.center}>
        <Text style={styles.event}>{t.name}</Text>
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center', marginTop: 18 }}>
          <LinearGradient colors={[C.gold, C.goldDeep]} style={styles.trophy}>
            <Icon name="trophy" size={84} color="#3A2500" />
          </LinearGradient>
        </Animated.View>
        <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
          <Text style={styles.label}>CHAMPIONS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <TeamBadge team={champ} size={44} />
            <Text style={styles.name} numberOfLines={2}>
              {champ.name}
            </Text>
          </View>
          {champ.player ? <Text style={styles.player}>{champ.player}</Text> : null}
          <View style={styles.stats}>
            {[
              ['P', stats.p], ['W', stats.w], ['D', stats.d], ['L', stats.l], ['GF', stats.gf], ['GA', stats.ga],
            ].map(([k, v]) => (
              <View key={k as string} style={{ alignItems: 'center', minWidth: 36 }}>
                <Text style={styles.statV}>{v}</Text>
                <Text style={styles.statK}>{k}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            {runnerUp ? <Podium label="Runner-up" team={runnerUp} color="#C9D2EA" /> : null}
            {third ? <Podium label="Third" team={third} color="#E09A62" /> : null}
          </View>
        </Animated.View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16, gap: 10 }}>
        <Button title="See the full story" kind="gold" icon="tournament" onPress={() => router.replace({ pathname: '/t/[id]', params: { id: t.id } })} />
        <Button title="Home" kind="ghost" onPress={() => router.replace('/')} />
      </View>
    </View>
  );
}

function Podium({ label, team, color }: { label: string; team: Team; color: string }) {
  return (
    <View style={styles.podium}>
      <Text style={[styles.podiumLabel, { color }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TeamBadge team={team} size={26} />
        <Text style={styles.podiumName} numberOfLines={1}>
          {team.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 18, flexDirection: 'row' },
  glow: { position: 'absolute', width: W * 1.2, height: W * 1.2, borderRadius: W, top: H * 0.12, left: -W * 0.1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  event: { color: C.sub, fontFamily: F.semi, fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase' },
  trophy: {
    width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.gold, shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, elevation: 16,
  },
  label: { color: C.gold, fontFamily: F.semi, fontSize: 13, letterSpacing: 4, marginTop: 26 },
  name: { color: C.text, fontFamily: F.display, fontSize: 46, textTransform: 'uppercase', lineHeight: 48, flexShrink: 1 },
  player: { color: C.sub, fontFamily: F.medium, fontSize: 15, marginTop: 4 },
  stats: {
    flexDirection: 'row', gap: 6, marginTop: 20, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: R.md, backgroundColor: C.card + 'CC', borderWidth: 1, borderColor: C.line,
  },
  statV: { color: C.text, fontFamily: F.display, fontSize: 22 },
  statK: { color: C.dim, fontFamily: F.semi, fontSize: 10, letterSpacing: 1 },
  podium: { width: 160, padding: 12, borderRadius: R.md, backgroundColor: C.card + 'CC', borderWidth: 1, borderColor: C.line, gap: 6 },
  podiumLabel: { fontFamily: F.semi, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
  podiumName: { color: C.text, fontFamily: F.displayBold, fontSize: 16, flex: 1 },
});
