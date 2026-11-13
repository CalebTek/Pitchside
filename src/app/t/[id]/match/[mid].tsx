import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, Stepper, TeamBadge, tap } from '../../../../components/ui';
import { Resolver, groupLetter } from '../../../../engine';
import { useStore, useTournament } from '../../../../store';
import { C, F, R } from '../../../../theme';

export default function MatchEntry() {
  const { id, mid } = useLocalSearchParams<{ id: string; mid: string }>();
  const t = useTournament(id);
  const insets = useSafeAreaInsets();
  const setResult = useStore((s) => s.setResult);
  const clearResult = useStore((s) => s.clearResult);

  const ctx = useMemo(() => {
    if (!t) return null;
    const r = new Resolver(t);
    const m = r.match(mid);
    return m ? { r, m } : null;
  }, [t, mid]);

  const [hs, setHs] = useState(ctx?.m.result?.hs ?? 0);
  const [as, setAs] = useState(ctx?.m.result?.as ?? 0);
  const [hp, setHp] = useState(ctx?.m.result?.hp ?? 0);
  const [ap, setAp] = useState(ctx?.m.result?.ap ?? 0);

  if (!t || !ctx || !ctx.m.home || !ctx.m.away) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.sub, fontFamily: F.medium }}>This match isn't ready yet.</Text>
        <Button title="Back" kind="ghost" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const { r, m } = ctx;
  const home = t.teams.find((x) => x.id === m.home)!;
  const away = t.teams.find((x) => x.id === m.away)!;
  const pens = r.needsPens(m, hs, as);
  const pensInvalid = pens && hp === ap;
  const hadChampion = !!r.podium().champion;

  const save = () => {
    setResult(t.id, m.id, { hs, as, hp: pens ? hp : null, ap: pens ? ap : null, h: m.home!, a: m.away! });
    tap('success');
    // Did this result crown a champion?
    const updated = useStore.getState().tournaments.find((x) => x.id === t.id);
    const champ = updated ? new Resolver(updated).podium().champion : null;
    if (champ && !hadChampion) router.replace({ pathname: '/t/[id]/champion', params: { id: t.id } });
    else router.back();
  };

  const context =
    m.stage === 'group'
      ? `Group ${groupLetter(m.group!)} · ${m.roundLabel}`
      : m.stage === 'league'
        ? t.format === 'ucl' ? `League phase · ${m.roundLabel}` : m.roundLabel
        : `${m.roundLabel}${m.twoLegs ? ` · Leg ${m.leg}` : ''}`;

  const aggHome = m.firstLeg ? m.firstLeg.home + hs : null;
  const aggAway = m.firstLeg ? m.firstLeg.away + as : null;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[home.color + '30', C.bg, away.color + '22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="close" onPress={() => router.back()} bg="#00000040" />
        <Text style={styles.context}>{context}</Text>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 160 }}>
        <View style={styles.teamsRow}>
          {[home, away].map((tm, i) => (
            <View key={tm.id} style={styles.teamCol}>
              <TeamBadge team={tm} size={72} />
              <Text style={styles.teamName} numberOfLines={2}>
                {tm.name}
              </Text>
              {tm.player ? <Text style={styles.player}>{tm.player}</Text> : null}
              <Text style={styles.ha}>{i === 0 ? 'HOME' : 'AWAY'}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.scoreRow, { gap: 40, marginTop: 24 }]}>
          <Stepper big value={hs} onChange={setHs} />
          <Text style={styles.dash}>–</Text>
          <Stepper big value={as} onChange={setAs} />
        </View>

        {m.firstLeg ? (
          <View style={styles.aggBox}>
            <Text style={styles.aggLabel}>AGGREGATE</Text>
            <Text style={styles.agg}>
              {aggHome} – {aggAway}
            </Text>
            <Text style={styles.aggSub}>
              First leg: {away.name} {m.firstLeg.away} – {m.firstLeg.home} {home.name}
            </Text>
          </View>
        ) : null}

        {pens ? (
          <View style={styles.pensBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Icon name="soccer-field" size={18} color={C.gold} />
              <Text style={styles.pensTitle}>Penalty shoot-out</Text>
            </View>
            <Text style={styles.pensHint}>{m.twoLegs ? 'Level on aggregate' : 'Level after full time'} — who won on penalties?</Text>
            <View style={[styles.scoreRow, { marginTop: 10 }]}>
              <Stepper value={hp} onChange={setHp} max={30} />
              <Text style={[styles.dash, { fontSize: 28 }]}>–</Text>
              <Stepper value={ap} onChange={setAp} max={30} />
            </View>
            {pensInvalid ? <Text style={styles.pensErr}>Shoot-outs need a winner.</Text> : null}
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Button title={m.result ? 'Update result' : 'Save result'} icon="check" onPress={save} disabled={pensInvalid} />
        {m.result ? (
          <Button
            title="Remove result"
            kind="ghost"
            icon="delete-outline"
            style={{ marginTop: 10 }}
            onPress={() => {
              clearResult(t.id, m.id);
              router.back();
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  context: { color: C.sub, fontFamily: F.semi, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', flex: 1, textAlign: 'center' },
  teamsRow: { flexDirection: 'row', marginTop: 20, gap: 16 },
  teamCol: { flex: 1, alignItems: 'center', gap: 8 },
  teamName: { color: C.text, fontFamily: F.display, fontSize: 26, textAlign: 'center', textTransform: 'uppercase', lineHeight: 28 },
  player: { color: C.sub, fontFamily: F.medium, fontSize: 13, marginTop: -4 },
  ha: { color: C.dim, fontFamily: F.semi, fontSize: 10, letterSpacing: 1.6 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 30 },
  dash: { color: C.dim, fontFamily: F.display, fontSize: 48 },
  aggBox: { alignItems: 'center', marginTop: 26, padding: 14, borderRadius: R.md, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  aggLabel: { color: C.sub, fontFamily: F.semi, fontSize: 10, letterSpacing: 1.6 },
  agg: { color: C.text, fontFamily: F.display, fontSize: 32 },
  aggSub: { color: C.dim, fontFamily: F.medium, fontSize: 12 },
  pensBox: { marginTop: 22, padding: 16, borderRadius: R.lg, backgroundColor: C.gold + '12', borderWidth: 1, borderColor: C.gold + '55' },
  pensTitle: { color: C.gold, fontFamily: F.display, fontSize: 20, textTransform: 'uppercase' },
  pensHint: { color: C.sub, fontFamily: F.medium, fontSize: 12.5, textAlign: 'center', marginTop: 4 },
  pensErr: { color: C.red, fontFamily: F.semi, fontSize: 12, textAlign: 'center', marginTop: 10 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.bg + 'EE' },
});
