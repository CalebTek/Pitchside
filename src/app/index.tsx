import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, Icon, IconName, Progress, TeamBadge, tap } from '../components/ui';
import { FORMAT_INFO, Resolver, type Tournament } from '../engine';
import { useStore } from '../store';
import { C, F, FORMAT_GRADIENT, R } from '../theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const tournaments = useStore((s) => s.tournaments);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={['#173A6B55', '#0A0F1E00']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.5 }}
      />
      <FlatList
        data={tournaments}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 18, paddingBottom: insets.bottom + 120 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 22 }}>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Icon name="soccer" size={20} color="#06210F" />
              </View>
              <Text style={styles.brand}>PITCHSIDE</Text>
            </View>
            <Text style={styles.hero}>Run your own{'\n'}
              <Text style={{ color: C.mint }}>cup nights.</Text>
            </Text>
            <Text style={styles.heroSub}>
              World Cup, Champions League, league or straight knockout. Enter the scores — the tables, promotions and bracket sort themselves out.
            </Text>
            {tournaments.length ? <Text style={styles.section}>YOUR TOURNAMENTS</Text> : null}
          </View>
        }
        ListEmptyComponent={<Empty />}
        renderItem={({ item }) => <TournamentCard t={item} />}
      />
      <View style={[styles.fabWrap, { paddingBottom: insets.bottom + 14 }]}>
        <Button title="New tournament" icon="plus" onPress={() => router.push('/new')} />
      </View>
    </View>
  );
}

function Empty() {
  const tiles: { icon: IconName; title: string; sub: string; colors: [string, string] }[] = [
    { icon: 'earth', title: 'World Cup', sub: 'Groups → knockouts', colors: FORMAT_GRADIENT.worldcup },
    { icon: 'star-four-points', title: 'Champions League', sub: 'League phase → KO', colors: FORMAT_GRADIENT.ucl },
    { icon: 'format-list-numbered', title: 'League', sub: 'Home & away', colors: FORMAT_GRADIENT.league },
    { icon: 'tournament', title: 'Knockout', sub: 'Win or go home', colors: FORMAT_GRADIENT.knockout },
  ];
  return (
    <View style={styles.grid}>
      {tiles.map((x) => (
        <Pressable key={x.title} style={styles.tileWrap} onPress={() => router.push('/new')}>
          <LinearGradient colors={x.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
            <Icon name={x.icon} size={28} color="#fff" />
            <View>
              <Text style={styles.tileTitle}>{x.title}</Text>
              <Text style={styles.tileSub}>{x.sub}</Text>
            </View>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
}

function TournamentCard({ t }: { t: Tournament }) {
  const info = useMemo(() => {
    const r = new Resolver(t);
    const p = r.progress();
    const podium = r.podium();
    return { r, p, stage: r.stageLabel(), champion: podium.champion ? t.teams.find((x) => x.id === podium.champion) : null };
  }, [t]);
  const f = FORMAT_INFO[t.format];
  const colors = FORMAT_GRADIENT[t.format];
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push({ pathname: '/t/[id]', params: { id: t.id } });
      }}
      style={({ pressed }) => [{ marginBottom: 14, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      <View style={styles.card}>
        <LinearGradient colors={[colors[0] + '40', colors[1] + '00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.cardTop}>
          <LinearGradient colors={colors} style={styles.formatIcon}>
            <Icon name={f.icon as IconName} size={22} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {t.name}
            </Text>
            <Text style={styles.cardSub}>
              {f.title} · {t.teams.length} teams
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={C.sub} />
        </View>
        {info.champion ? (
          <View style={styles.champRow}>
            <Icon name="trophy" size={18} color={C.gold} />
            <TeamBadge team={info.champion} size={24} />
            <Text style={styles.champName} numberOfLines={1}>
              {info.champion.name}
            </Text>
            <Chip label="Champions" color={C.gold} />
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip label={info.stage} color={C.mint} icon="whistle" />
              <Text style={styles.count}>
                {info.p.played}/{info.p.total} matches
              </Text>
            </View>
            <Progress value={info.p.total ? info.p.played / info.p.total : 0} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 26 },
  logo: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  brand: { color: C.text, fontFamily: F.display, fontSize: 22, letterSpacing: 3 },
  hero: { color: C.text, fontFamily: F.display, fontSize: 48, lineHeight: 50, letterSpacing: 0.3, textTransform: 'uppercase' },
  heroSub: { color: C.sub, fontFamily: F.body, fontSize: 15, lineHeight: 22, marginTop: 12 },
  section: { color: C.dim, fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, marginTop: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tileWrap: { width: '47.5%' },
  tile: { height: 130, borderRadius: R.lg, padding: 16, justifyContent: 'space-between' },
  tileTitle: { color: '#fff', fontFamily: F.display, fontSize: 21, textTransform: 'uppercase' },
  tileSub: { color: '#ffffffcc', fontFamily: F.medium, fontSize: 12 },
  card: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  formatIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: C.text, fontFamily: F.display, fontSize: 24, letterSpacing: 0.3 },
  cardSub: { color: C.sub, fontFamily: F.medium, fontSize: 12, marginTop: 1 },
  count: { color: C.sub, fontFamily: F.medium, fontSize: 12 },
  champRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: C.gold + '14', padding: 10, borderRadius: 14 },
  champName: { flex: 1, color: C.gold, fontFamily: F.display, fontSize: 18 },
  fabWrap: { position: 'absolute', left: 18, right: 18, bottom: 0 },
});
