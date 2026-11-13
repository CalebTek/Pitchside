import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bracket, TieCard } from '../../../components/Bracket';
import { confirm } from '../../../components/confirm';
import { MatchCard } from '../../../components/MatchCard';
import { StandingsTable, ZoneLegend } from '../../../components/StandingsTable';
import { Button, Chip, Icon, IconButton, IconName, Progress, Segmented, TeamBadge, tap } from '../../../components/ui';
import { FORMAT_INFO, Resolver, groupLetter, type MatchView, type Team } from '../../../engine';
import { useStore, useTournament } from '../../../store';
import { C, F, FORMAT_GRADIENT, R } from '../../../theme';

type Tab = 'table' | 'matches' | 'bracket' | 'teams';

export default function TournamentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTournament(id);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'results' | 'all'>('upcoming');
  const [menu, setMenu] = useState(false);
  const store = useStore();

  const data = useMemo(() => {
    if (!t) return null;
    const r = new Resolver(t);
    const teams = new Map<string, Team>(t.teams.map((x) => [x.id, x]));
    return { r, teams, matches: r.matches(), progress: r.progress(), podium: r.podium(), stage: r.stageLabel() };
  }, [t]);

  if (!t || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ color: C.sub, fontFamily: F.medium }}>Tournament not found.</Text>
        <Button title="Home" kind="ghost" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const { r, teams, matches, progress, podium } = data;
  const tabs: { key: Tab; label: string }[] =
    t.format === 'worldcup'
      ? [{ key: 'table', label: 'Groups' }, { key: 'matches', label: 'Matches' }, { key: 'bracket', label: 'Bracket' }]
      : t.format === 'ucl'
        ? [{ key: 'table', label: 'Table' }, { key: 'matches', label: 'Matches' }, { key: 'bracket', label: 'Knockouts' }]
        : t.format === 'league'
          ? [{ key: 'table', label: 'Table' }, { key: 'matches', label: 'Matches' }]
          : [{ key: 'bracket', label: 'Bracket' }, { key: 'matches', label: 'Matches' }];
  tabs.push({ key: 'teams', label: 'Teams' });
  const koTime = (t.format === 'worldcup' && r.allGroupsComplete()) || (t.format === 'ucl' && r.leagueComplete());
  const active: Tab = tab ?? (koTime ? 'bracket' : tabs[0].key);
  const champion = podium.champion ? teams.get(podium.champion) : null;
  const info = FORMAT_INFO[t.format];
  const grad = FORMAT_GRADIENT[t.format];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} stickyHeaderIndices={[1]}>
        <View>
          <LinearGradient colors={[grad[0] + '55', C.bg]} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topBar}>
              <IconButton icon="arrow-left" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} bg="#00000033" />
              <IconButton icon="dots-horizontal" onPress={() => setMenu(true)} bg="#00000033" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <Icon name={info.icon as IconName} size={16} color={C.text} />
              <Text style={styles.format}>{info.title}</Text>
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {t.name}
            </Text>
            {champion ? (
              <Pressable
                onPress={() => router.push({ pathname: '/t/[id]/champion', params: { id: t.id } })}
                style={styles.champBanner}
              >
                <LinearGradient colors={[C.gold, C.goldDeep]} style={styles.champIcon}>
                  <Icon name="trophy" size={22} color="#3A2500" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.champLabel}>CHAMPIONS</Text>
                  <Text style={styles.champName} numberOfLines={1}>
                    {champion.name}
                    {champion.player ? <Text style={{ color: C.sub, fontFamily: F.medium, fontSize: 14 }}>  · {champion.player}</Text> : null}
                  </Text>
                </View>
                <Icon name="chevron-right" size={22} color={C.gold} />
              </Pressable>
            ) : (
              <View style={{ marginTop: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={data.stage} icon="whistle" />
                  <Text style={styles.count}>
                    {progress.played} of {progress.total} played
                  </Text>
                </View>
                <Progress value={progress.total ? progress.played / progress.total : 0} />
              </View>
            )}
          </LinearGradient>
        </View>

        <View style={styles.tabsWrap}>
          <Segmented items={tabs} value={active} onChange={setTab} />
        </View>

        <View style={{ paddingTop: 6 }}>
          {active === 'table' && (
            <View style={{ paddingHorizontal: 16 }}>
              <ZoneLegend t={t} />
              {t.format === 'worldcup'
                ? t.groups!.map((g, gi) => (
                    <StandingsTable
                      key={gi}
                      t={t}
                      rows={r.groupTable(gi)}
                      teams={teams}
                      title={`Group ${groupLetter(gi)}`}
                      groupSize={g.length}
                      complete={r.groupComplete(gi)}
                    />
                  ))
                : <StandingsTable t={t} rows={r.table()} teams={teams} complete={r.leagueComplete()} />}
              {t.format === 'worldcup' && t.settings.bestThirds > 0 ? (
                <StandingsTable t={{ ...t, format: 'knockout' }} rows={r.placeRanking(3)} teams={teams} title={`3rd-placed teams · best ${t.settings.bestThirds} go through`} />
              ) : null}
            </View>
          )}

          {active === 'matches' && (
            <View style={{ paddingHorizontal: 16 }}>
              <View style={styles.filters}>
                {(['upcoming', 'results', 'all'] as const).map((k) => (
                  <Pressable key={k} onPress={() => { tap(); setFilter(k); }} style={[styles.filter, filter === k && styles.filterOn]}>
                    <Text style={[styles.filterText, filter === k && { color: C.bg }]}>
                      {k === 'upcoming' ? 'To play' : k === 'results' ? 'Results' : 'All'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <MatchList tid={t.id} matches={matches} teams={teams} filter={filter} r={r} />
            </View>
          )}

          {active === 'bracket' && (
            <View>
              {t.format === 'worldcup' && !r.allGroupsComplete() ? (
                <Notice icon="information-outline" text="The bracket fills in as each group finishes." />
              ) : null}
              {t.format === 'ucl' && !r.leagueComplete() ? (
                <Notice icon="information-outline" text="Knockout spots are filled once every league-phase match is played." />
              ) : null}
              {t.ko.filter((x) => x.isPlayoff).map((round) => (
                <View key={round.id} style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                  <Text style={styles.blockTitle}>{round.name}</Text>
                  <View style={styles.poGrid}>
                    {round.ties.map((tie) => (
                      <View key={tie.id} style={styles.poItem}>
                        <TieCard v={r.tie(tie.id)!} r={r} teams={teams} tid={t.id} />
                      </View>
                    ))}
                  </View>
                </View>
              ))}
              <Bracket r={r} rounds={t.ko} teams={teams} />
              {t.ko.filter((x) => x.isThirdPlace).map((round) => (
                <View key={round.id} style={{ paddingHorizontal: 16, marginTop: 12 }}>
                  <Text style={styles.blockTitle}>Third-place match</Text>
                  <View style={{ maxWidth: 260 }}>
                    <TieCard v={r.tie(round.ties[0].id)!} r={r} teams={teams} tid={t.id} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {active === 'teams' && <TeamsList tid={t.id} teams={t.teams} />}
        </View>
      </ScrollView>

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.grabber} />
            <MenuItem icon="restore" label="Clear all scores" onPress={() => {
              setMenu(false);
              confirm('Clear all scores?', 'Fixtures and the draw stay the same — only results are removed.', 'Clear', () => store.resetResults(t.id));
            }} />
            <MenuItem icon="trash-can-outline" label="Delete tournament" danger onPress={() => {
              setMenu(false);
              confirm('Delete tournament?', `"${t.name}" will be gone for good.`, 'Delete', () => {
                store.remove(t.id);
                router.replace('/');
              });
            }} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: C.cardHi }]}>
      <Icon name={icon} size={22} color={danger ? C.red : C.text} />
      <Text style={[styles.menuText, danger && { color: C.red }]}>{label}</Text>
    </Pressable>
  );
}

function Notice({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.notice}>
      <Icon name={icon} size={18} color={C.blue} />
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}

function MatchList({
  tid, matches, teams, filter, r,
}: {
  tid: string;
  matches: MatchView[];
  teams: Map<string, Team>;
  filter: 'upcoming' | 'results' | 'all';
  r: Resolver;
}) {
  const list = matches.filter((m) =>
    filter === 'upcoming' ? !m.result || m.missingPens : filter === 'results' ? !!m.result : true,
  );
  const visible = filter === 'upcoming' ? list.filter((m) => m.home && m.away) : list;
  const waiting = filter === 'upcoming' ? list.length - visible.length : 0;

  if (!visible.length) {
    return (
      <View style={styles.empty}>
        <Icon name={filter === 'results' ? 'scoreboard-outline' : 'check-decagram'} size={40} color={C.dim} />
        <Text style={styles.emptyText}>
          {filter === 'results' ? 'No results yet.' : waiting ? 'Waiting on earlier rounds to finish.' : 'All matches played!'}
        </Text>
      </View>
    );
  }

  // Group into sections by stage + round
  const sections: { key: string; title: string; items: MatchView[] }[] = [];
  for (const m of visible) {
    const key = m.stage === 'knockout' ? m.roundKey : `${m.stage}-${m.roundKey}`;
    let sec = sections.find((s) => s.key === key);
    if (!sec) {
      sec = { key, title: m.stage === 'knockout' ? m.roundLabel : m.roundLabel, items: [] };
      sections.push(sec);
    }
    sec.items.push(m);
  }
  if (filter === 'results') sections.reverse();

  return (
    <>
      {sections.map((s) => (
        <View key={s.key} style={{ marginBottom: 8 }}>
          <Text style={styles.blockTitle}>{s.title}</Text>
          {s.items.map((m) => (
            <MatchCard
              key={m.id}
              m={m}
              tid={tid}
              teams={teams}
              subtitle={
                m.stage === 'group'
                  ? `Group ${groupLetter(m.group!)}`
                  : m.leg
                    ? m.twoLegs ? `Leg ${m.leg}` : undefined
                    : undefined
              }
              homeLabel={m.tieId ? r.sourceLabel(r.tie(m.tieId)!.tie.a) : undefined}
              awayLabel={m.tieId ? r.sourceLabel(r.tie(m.tieId)!.tie.b) : undefined}
            />
          ))}
        </View>
      ))}
      {waiting ? <Text style={styles.waiting}>+ {waiting} match{waiting > 1 ? 'es' : ''} waiting on earlier results</Text> : null}
    </>
  );
}

function TeamsList({ tid, teams }: { tid: string; teams: Team[] }) {
  const renameTeam = useStore((s) => s.renameTeam);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [player, setPlayer] = useState('');
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <Text style={[styles.waiting, { textAlign: 'left', marginBottom: 10 }]}>Tap a team to rename it or change the player.</Text>
      {teams.map((tm) => (
        <View key={tm.id} style={styles.teamRow}>
          {editing === tm.id ? (
            <View style={{ flex: 1, gap: 8 }}>
              <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Team" placeholderTextColor={C.dim} />
              <TextInput value={player} onChangeText={setPlayer} style={styles.input} placeholder="Player" placeholderTextColor={C.dim} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Save" style={{ flex: 1 }} disabled={!name.trim()} onPress={() => {
                  renameTeam(tid, tm.id, name.trim(), player.trim() || undefined);
                  setEditing(null);
                }} />
                <Button title="Cancel" kind="ghost" style={{ flex: 1 }} onPress={() => setEditing(null)} />
              </View>
            </View>
          ) : (
            <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={() => {
              setEditing(tm.id);
              setName(tm.name);
              setPlayer(tm.player ?? '');
            }}>
              <TeamBadge team={tm} size={34} />
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>{tm.name}</Text>
                {tm.player ? <Text style={styles.teamPlayer}>{tm.player}</Text> : null}
              </View>
              <Icon name="pencil-outline" size={18} color={C.dim} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingBottom: 18 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  format: { color: C.text, fontFamily: F.semi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.85 },
  name: { color: C.text, fontFamily: F.display, fontSize: 40, lineHeight: 44, textTransform: 'uppercase', marginTop: 4 },
  count: { color: C.sub, fontFamily: F.medium, fontSize: 12 },
  champBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 12, borderRadius: R.md,
    backgroundColor: C.gold + '1A', borderWidth: 1, borderColor: C.gold + '66',
  },
  champIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  champLabel: { color: C.gold, fontFamily: F.semi, fontSize: 10, letterSpacing: 1.6 },
  champName: { color: C.text, fontFamily: F.display, fontSize: 24 },
  tabsWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.bg },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  filter: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: C.line },
  filterOn: { backgroundColor: C.text, borderColor: C.text },
  filterText: { color: C.sub, fontFamily: F.semi, fontSize: 12.5 },
  blockTitle: { color: C.text, fontFamily: F.display, fontSize: 20, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  emptyText: { color: C.sub, fontFamily: F.medium, fontSize: 14 },
  waiting: { color: C.dim, fontFamily: F.medium, fontSize: 12, textAlign: 'center', marginTop: 4 },
  notice: {
    flexDirection: 'row', gap: 10, alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 12,
    borderRadius: 14, backgroundColor: C.blue + '14', borderWidth: 1, borderColor: C.blue + '44',
  },
  noticeText: { color: C.text, fontFamily: F.medium, fontSize: 13, flex: 1 },
  poGrid: { gap: 10 },
  poItem: {},
  backdrop: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 12, borderWidth: 1, borderColor: C.line },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, alignSelf: 'center', marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14 },
  menuText: { color: C.text, fontFamily: F.semi, fontSize: 16 },
  teamRow: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 12, marginBottom: 8, flexDirection: 'row' },
  teamName: { color: C.text, fontFamily: F.semi, fontSize: 15 },
  teamPlayer: { color: C.sub, fontFamily: F.body, fontSize: 12 },
  input: {
    backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.line, color: C.text,
    fontFamily: F.medium, fontSize: 15, paddingHorizontal: 12, height: 46,
  },
});
