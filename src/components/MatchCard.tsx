import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MatchView, Team } from '../engine';
import { C, F, R } from '../theme';
import { Icon, TeamBadge, tap } from './ui';

export function MatchCard({
  m,
  tid,
  teams,
  homeLabel,
  awayLabel,
  subtitle,
}: {
  m: MatchView;
  tid: string;
  teams: Map<string, Team>;
  homeLabel?: string;
  awayLabel?: string;
  subtitle?: string;
}) {
  const home = m.home ? teams.get(m.home) : null;
  const away = m.away ? teams.get(m.away) : null;
  const ready = !!home && !!away && !m.locked;
  const r = m.result;
  const homeWin = r && (r.hs > r.as || (r.hs === r.as && (r.hp ?? 0) > (r.ap ?? 0)));
  const awayWin = r && (r.as > r.hs || (r.hs === r.as && (r.ap ?? 0) > (r.hp ?? 0)));
  const isLevel = r && r.hs === r.as;

  return (
    <Pressable
      disabled={!ready}
      onPress={() => {
        tap();
        router.push({ pathname: '/t/[id]/match/[mid]', params: { id: tid, mid: m.id } });
      }}
      style={({ pressed }) => [styles.card, r && styles.played, { opacity: pressed ? 0.8 : 1 }]}
    >
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.row}>
        <Side team={home} label={homeLabel} win={!!homeWin} align="left" />
        <View style={styles.center}>
          {r ? (
            <>
              <Text style={styles.score}>
                <Text style={{ color: homeWin ? C.text : C.sub }}>{r.hs}</Text>
                <Text style={{ color: C.dim }}> – </Text>
                <Text style={{ color: awayWin ? C.text : C.sub }}>{r.as}</Text>
              </Text>
              {isLevel && r.hp != null && r.ap != null && m.decider ? (
                <Text style={styles.pens}>
                  {r.hp}–{r.ap} pens
                </Text>
              ) : null}
            </>
          ) : ready ? (
            <View style={styles.enter}>
              <Icon name="pencil" size={13} color={C.mint} />
              <Text style={styles.enterText}>Score</Text>
            </View>
          ) : (
            <Text style={styles.vs}>{m.locked ? 'Leg 1 first' : 'vs'}</Text>
          )}
        </View>
        <Side team={away} label={awayLabel} win={!!awayWin} align="right" />
      </View>
      {m.firstLeg && m.leg === 2 ? (
        <Text style={styles.agg}>
          {r
            ? `Aggregate ${m.firstLeg.home + r.hs}–${m.firstLeg.away + r.as}`
            : `1st leg ${m.firstLeg.home}–${m.firstLeg.away}`}
        </Text>
      ) : null}
      {m.missingPens ? (
        <Text style={[styles.agg, { color: C.red }]}>Level — tap to add the penalty shoot-out</Text>
      ) : null}
    </Pressable>
  );
}

function Side({ team, label, win, align }: { team?: Team | null; label?: string; win: boolean; align: 'left' | 'right' }) {
  const right = align === 'right';
  return (
    <View style={[styles.side, right && { flexDirection: 'row-reverse' }]}>
      <TeamBadge team={team} size={34} />
      <View style={{ flex: 1, alignItems: right ? 'flex-end' : 'flex-start' }}>
        <Text numberOfLines={1} style={[styles.name, !team && { color: C.dim }, win && { color: C.mint }]}>
          {team?.name ?? label ?? 'TBD'}
        </Text>
        {team?.player ? (
          <Text numberOfLines={1} style={styles.player}>
            {team.player}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  played: { backgroundColor: C.surface },
  subtitle: { color: C.dim, fontFamily: F.semi, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: C.text, fontFamily: F.semi, fontSize: 14 },
  player: { color: C.sub, fontFamily: F.body, fontSize: 11, marginTop: 1 },
  center: { width: 86, alignItems: 'center' },
  score: { fontFamily: F.display, fontSize: 28, color: C.text, letterSpacing: 1 },
  pens: { color: C.gold, fontFamily: F.semi, fontSize: 10, marginTop: -2 },
  vs: { color: C.dim, fontFamily: F.displayBold, fontSize: 14, textTransform: 'uppercase' },
  enter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.mint + '1A',
    borderColor: C.mint + '55',
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  enterText: { color: C.mint, fontFamily: F.semi, fontSize: 12 },
  agg: { color: C.sub, fontFamily: F.medium, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
