import { StyleSheet, Text, View } from 'react-native';
import { zoneFor, type Row, type Team, type Tournament } from '../engine';
import { C, F, R } from '../theme';
import { TeamBadge } from './ui';

const ZONE_COLOR = { direct: C.mint, playoff: C.blue, third: C.gold, out: 'transparent' } as const;

export function StandingsTable({
  t,
  rows,
  teams,
  title,
  groupSize,
  complete,
}: {
  t: Tournament;
  rows: Row[];
  teams: Map<string, Team>;
  title?: string;
  groupSize?: number;
  complete?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      {title ? (
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {complete ? <Text style={styles.done}>FINAL</Text> : null}
        </View>
      ) : null}
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.pos, styles.headText]}>#</Text>
        <Text style={[styles.teamCol, styles.headText]}>Team</Text>
        {['P', 'W', 'D', 'L', 'GD'].map((h) => (
          <Text key={h} style={[styles.num, styles.headText]}>
            {h}
          </Text>
        ))}
        <Text style={[styles.pts, styles.headText]}>Pts</Text>
      </View>
      {rows.map((r, i) => {
        const team = teams.get(r.teamId);
        const zone = zoneFor(t, i + 1, groupSize);
        const zc = zone ? ZONE_COLOR[zone] : 'transparent';
        return (
          <View key={r.teamId} style={[styles.row, i % 2 === 1 && { backgroundColor: C.surface + '88' }]}>
            <View style={[styles.zone, { backgroundColor: zc }]} />
            <Text style={[styles.pos, zone && zone !== 'out' ? { color: zc } : null]}>{i + 1}</Text>
            <View style={[styles.teamCol, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <TeamBadge team={team} size={24} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.teamName}>
                  {team?.name}
                </Text>
                <View style={styles.form}>
                  {r.form.map((f, k) => (
                    <View
                      key={k}
                      style={[styles.formDot, { backgroundColor: f === 'W' ? C.mint : f === 'D' ? C.sub : C.red }]}
                    />
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.num}>{r.p}</Text>
            <Text style={styles.num}>{r.w}</Text>
            <Text style={styles.num}>{r.d}</Text>
            <Text style={styles.num}>{r.l}</Text>
            <Text style={styles.num}>{r.gd > 0 ? `+${r.gd}` : r.gd}</Text>
            <Text style={styles.pts}>{r.pts}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ZoneLegend({ t }: { t: Tournament }) {
  const items: { c: string; l: string }[] = [];
  const s = t.settings;
  if (t.format === 'ucl') {
    const po = s.playoff && t.teams.length >= s.koSize * 1.5;
    items.push({ c: C.mint, l: po ? `Top ${s.koSize / 2}: straight to ${s.koSize === 2 ? 'final' : 'knockouts'}` : `Top ${s.koSize}: knockouts` });
    if (po) items.push({ c: C.blue, l: `${s.koSize / 2 + 1}–${s.koSize * 1.5}: play-offs` });
  } else if (t.format === 'worldcup') {
    items.push({ c: C.mint, l: `Top ${s.advancePerGroup} advance` });
    if (s.bestThirds) items.push({ c: C.gold, l: `${s.bestThirds} best 3rd-placed advance` });
  } else if (t.format === 'league') {
    items.push({ c: C.mint, l: 'Champion' });
  }
  return (
    <View style={styles.legend}>
      {items.map((i) => (
        <View key={i.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: i.c }} />
          <Text style={{ color: C.sub, fontFamily: F.medium, fontSize: 12 }}>{i.l}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, overflow: 'hidden', marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  title: { color: C.text, fontFamily: F.display, fontSize: 22, letterSpacing: 0.5 },
  done: { color: C.mint, fontFamily: F.semi, fontSize: 10, letterSpacing: 1.4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingRight: 10 },
  head: { borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 8 },
  headText: { color: C.dim, fontFamily: F.semi, fontSize: 11 },
  zone: { position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2 },
  pos: { width: 30, textAlign: 'center', color: C.sub, fontFamily: F.displayBold, fontSize: 15 },
  teamCol: { flex: 1, paddingRight: 4 },
  teamName: { color: C.text, fontFamily: F.semi, fontSize: 13 },
  form: { flexDirection: 'row', gap: 3, marginTop: 3, height: 5 },
  formDot: { width: 10, height: 4, borderRadius: 2 },
  num: { width: 26, textAlign: 'center', color: C.sub, fontFamily: F.medium, fontSize: 12 },
  pts: { width: 32, textAlign: 'center', color: C.text, fontFamily: F.display, fontSize: 17 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 14 },
});
