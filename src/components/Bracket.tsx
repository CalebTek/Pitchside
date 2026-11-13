import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { KoRound, Resolver, Team, TieView } from '../engine';
import { C, F } from '../theme';
import { Icon, TeamBadge, tap } from './ui';

const CARD_H = 76;
const GAP = 16;
const UNIT = CARD_H + GAP;
const COL_W = 196;
const LINK = 14;

export function Bracket({ r, rounds, teams }: { r: Resolver; rounds: KoRound[]; teams: Map<string, Team> }) {
  const main = rounds.filter((x) => !x.isThirdPlace && !x.isPlayoff);
  if (!main.length) return null;
  const firstCount = main[0].ties.length;
  const height = firstCount * UNIT;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      {main.map((round, ri) => {
        const slot = UNIT * 2 ** ri;
        const isFinal = ri === main.length - 1;
        return (
          <View key={round.id} style={{ width: COL_W, marginRight: isFinal ? 0 : LINK * 2 }}>
            <View style={styles.colHead}>
              <Text style={[styles.colTitle, isFinal && { color: C.gold }]}>{round.name}</Text>
              {round.twoLegs ? <Text style={styles.colSub}>2 legs</Text> : null}
            </View>
            <View style={{ height }}>
              {round.ties.map((tie, ti) => {
                const v = r.tie(tie.id)!;
                return (
                  <View key={tie.id} style={{ height: slot, justifyContent: 'center' }}>
                    {ri > 0 ? (
                      <>
                        <View style={[styles.vLine, { top: slot / 4, height: slot / 2, left: -LINK }]} />
                        <View style={[styles.hLine, { left: -LINK, width: LINK, top: slot / 2 }]} />
                      </>
                    ) : null}
                    {!isFinal ? (
                      <View style={[styles.hLine, { right: -LINK, width: LINK, top: slot / 2 }]} />
                    ) : null}
                    <TieCard v={v} r={r} teams={teams} final={isFinal} tid={r.t.id} index={ti} />
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

export function TieCard({
  v,
  r,
  teams,
  final,
  tid,
  showRound,
}: {
  v: TieView;
  r: Resolver;
  teams: Map<string, Team>;
  final?: boolean;
  tid: string;
  index?: number;
  showRound?: boolean;
}) {
  const next = v.legs.find((l) => !l.result && !l.locked) ?? v.legs.find((l) => l.missingPens) ?? v.legs[0];
  const ready = !!v.a && !!v.b && !!next;
  const row = (side: 'a' | 'b') => {
    const id = v[side];
    const bye = side === 'a' ? v.aBye : v.bBye;
    const team = id ? teams.get(id) : null;
    const src = side === 'a' ? v.tie.a : v.tie.b;
    const score = side === 'a' ? v.aggA : v.aggB;
    const pens = side === 'a' ? v.pensA : v.pensB;
    const won = !!v.winner && v.winner === id;
    const lost = !!v.winner && v.winner !== id;
    return (
      <View style={[styles.teamRow, lost && { opacity: 0.45 }]}>
        {bye ? <View style={styles.byeBadge} /> : <TeamBadge team={team} size={22} />}
        <Text numberOfLines={1} style={[styles.teamName, !team && { color: C.dim, fontFamily: F.medium }, won && { color: final ? C.gold : C.mint }]}>
          {bye ? 'Bye' : team?.name ?? r.sourceLabel(src)}
        </Text>
        {pens !== null ? <Text style={styles.pens}>({pens})</Text> : null}
        <Text style={[styles.score, won && { color: final ? C.gold : C.mint }]}>{score ?? ''}</Text>
        {won && final ? <Icon name="trophy" size={14} color={C.gold} /> : null}
      </View>
    );
  };
  return (
    <Pressable
      disabled={!ready}
      onPress={() => {
        tap();
        router.push({ pathname: '/t/[id]/match/[mid]', params: { id: tid, mid: next.id } });
      }}
      style={({ pressed }) => [
        styles.card,
        final && { borderColor: C.gold + '88' },
        v.winner && !final && { borderColor: C.mint + '44' },
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {showRound ? <Text style={styles.roundTag}>{v.round.name}</Text> : null}
      {row('a')}
      <View style={styles.divider} />
      {row('b')}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  colHead: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 8 },
  colTitle: { color: C.text, fontFamily: F.display, fontSize: 18, letterSpacing: 0.5, textTransform: 'uppercase' },
  colSub: { color: C.dim, fontFamily: F.semi, fontSize: 10 },
  card: {
    minHeight: CARD_H,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 26 },
  teamName: { flex: 1, color: C.text, fontFamily: F.semi, fontSize: 13 },
  score: { color: C.text, fontFamily: F.display, fontSize: 18, minWidth: 16, textAlign: 'right' },
  pens: { color: C.gold, fontFamily: F.semi, fontSize: 11 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 4 },
  vLine: { position: 'absolute', width: 2, backgroundColor: C.line, borderRadius: 1 },
  hLine: { position: 'absolute', height: 2, backgroundColor: C.line, borderRadius: 1, marginTop: -1 },
  byeBadge: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line },
  roundTag: { color: C.dim, fontFamily: F.semi, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
});
