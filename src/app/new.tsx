import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Icon, IconButton, IconName, SectionTitle, Segmented, Stepper, TeamBadge, Toggle, tap } from '../components/ui';
import {
  FORMAT_INFO, Resolver, TEAM_COLORS, createTournament, defaultSettings, nextPow2, roundName, uid, validate,
  type Format, type Settings, type Team,
} from '../engine';
import { useStore } from '../store';
import { C, F, FORMAT_GRADIENT, R } from '../theme';

const FORMATS: { key: Format; desc: string }[] = [
  { key: 'worldcup', desc: 'Teams are drawn into groups. The best from each group go into a knockout bracket.' },
  { key: 'ucl', desc: 'One big league table where everyone plays a set number of games. Top seeds go through, the next batch fight in play-offs.' },
  { key: 'league', desc: 'Round robin. Most points at the end wins the title.' },
  { key: 'knockout', desc: 'Straight bracket. Byes are handed out automatically if the numbers are odd.' },
];

export default function NewTournament() {
  const insets = useSafeAreaInsets();
  const create = useStore((s) => s.create);
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<Format>('worldcup');
  const [name, setName] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [randomDraw, setRandomDraw] = useState(true);
  const [settings, setSettings] = useState<Settings>(defaultSettings('worldcup', 8));
  const [touched, setTouched] = useState(false);

  const n = teams.length;
  const set = (p: Partial<Settings>) => {
    setTouched(true);
    setSettings((s) => ({ ...s, ...p }));
  };

  const goSettings = () => {
    if (!touched) setSettings(defaultSettings(format, n));
    setStep(2);
  };

  const error = validate(format, n, settings);
  const summary = useMemo(() => (error ? null : describe(format, teams, settings)), [error, format, teams, settings]);

  const onCreate = () => {
    const id = create({ name: name || `${FORMAT_INFO[format].title} ${new Date().getFullYear()}`, format, teams, settings, randomDraw });
    tap('success');
    router.replace({ pathname: '/t/[id]', params: { id } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton icon={step === 0 ? 'close' : 'arrow-left'} onPress={() => (step === 0 ? router.back() : setStep(step - 1))} />
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i <= step && { backgroundColor: C.mint, width: i === step ? 22 : 8 }]} />
          ))}
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <>
            <Text style={styles.title}>Pick a format</Text>
            <Text style={styles.lead}>You can tweak group sizes, legs and play-offs in the last step.</Text>
            {FORMATS.map((f) => {
              const info = FORMAT_INFO[f.key];
              const active = format === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => {
                    tap();
                    setFormat(f.key);
                    setTouched(false);
                  }}
                  style={[styles.formatCard, active && { borderColor: C.mint, backgroundColor: C.cardHi }]}
                >
                  <LinearGradient colors={FORMAT_GRADIENT[f.key]} style={styles.formatIcon}>
                    <Icon name={info.icon as IconName} size={26} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formatTitle}>{info.title}</Text>
                    <Text style={styles.formatDesc}>{f.desc}</Text>
                  </View>
                  <View style={[styles.radio, active && { borderColor: C.mint }]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </>
        )}

        {step === 1 && <TeamsStep name={name} setName={setName} teams={teams} setTeams={setTeams} format={format} />}

        {step === 2 && (
          <>
            <Text style={styles.title}>Rules</Text>
            <Text style={styles.lead}>
              {FORMAT_INFO[format].title} · {n} teams
            </Text>
            <SettingsForm format={format} n={n} s={settings} set={set} />
            <SectionTitle title="Draw" />
            <Card style={{ paddingVertical: 4 }}>
              <Toggle
                label="Random draw"
                hint={randomDraw ? 'Teams are shuffled into groups / bracket.' : 'Teams are seeded in the order you entered them.'}
                value={randomDraw}
                onChange={setRandomDraw}
              />
            </Card>
            {error ? (
              <View style={styles.error}>
                <Icon name="alert-circle" size={18} color={C.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : summary ? (
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>How it plays out</Text>
                {summary.lines.map((l, i) => (
                  <View key={i} style={styles.summaryLine}>
                    <View style={styles.summaryDot} />
                    <Text style={styles.summaryText}>{l}</Text>
                  </View>
                ))}
                <Text style={styles.summaryTotal}>{summary.total} matches in total</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {step === 0 && <Button title="Next: teams" icon="arrow-right" onPress={() => setStep(1)} />}
        {step === 1 && <Button title="Next: rules" icon="arrow-right" disabled={n < 2} onPress={goSettings} />}
        {step === 2 && <Button title="Make the draw" icon="shuffle-variant" disabled={!!error} onPress={onCreate} />}
      </View>
    </KeyboardAvoidingView>
  );
}

function TeamsStep({
  name, setName, teams, setTeams, format,
}: {
  name: string;
  setName: (s: string) => void;
  teams: Team[];
  setTeams: (t: Team[]) => void;
  format: Format;
}) {
  const [teamName, setTeamName] = useState('');
  const [player, setPlayer] = useState('');
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const add = (list: { name: string; player?: string }[]) => {
    const existing = new Set(teams.map((t) => t.name.toLowerCase()));
    const next = [...teams];
    for (const x of list) {
      const nm = x.name.trim();
      if (!nm || existing.has(nm.toLowerCase())) continue;
      existing.add(nm.toLowerCase());
      next.push({ id: uid('tm'), name: nm, player: x.player?.trim() || undefined, color: TEAM_COLORS[next.length % TEAM_COLORS.length] });
    }
    setTeams(next);
  };

  const addOne = () => {
    if (!teamName.trim()) return;
    tap();
    add([{ name: teamName, player }]);
    setTeamName('');
    setPlayer('');
  };

  const addBulk = () => {
    const rows = bulkText
      .split(/\n|,(?![^()]*\))/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [nm, pl] = l.split(/\s+[-–|]\s+/);
        return { name: nm, player: pl };
      });
    add(rows);
    setBulkText('');
    setBulk(false);
  };

  const quick = (count: number) => {
    const list = Array.from({ length: count }, (_, i) => ({ name: `Team ${teams.length + i + 1}` }));
    add(list);
  };

  return (
    <>
      <Text style={styles.title}>Name & teams</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={`${FORMAT_INFO[format].title} ${new Date().getFullYear()}`}
        placeholderTextColor={C.dim}
        style={[styles.input, styles.nameInput]}
      />

      <SectionTitle
        title={`Teams · ${teams.length}`}
        right={
          <Pressable onPress={() => setBulk(!bulk)} hitSlop={8}>
            <Text style={styles.link}>{bulk ? 'One at a time' : 'Paste a list'}</Text>
          </Pressable>
        }
      />

      {bulk ? (
        <Card>
          <Text style={styles.hint}>One team per line. Add the player after a dash, e.g. “Real Madrid - Tunde”.</Text>
          <TextInput
            value={bulkText}
            onChangeText={setBulkText}
            multiline
            placeholder={'Arsenal - Caleb\nBarcelona - Femi\nAC Milan - Ayo'}
            placeholderTextColor={C.dim}
            style={[styles.input, { height: 150, textAlignVertical: 'top', marginTop: 10 }]}
          />
          <Button title="Add teams" icon="playlist-plus" onPress={addBulk} style={{ marginTop: 12 }} disabled={!bulkText.trim()} />
        </Card>
      ) : (
        <Card>
          <TextInput
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Team (e.g. Chelsea)"
            placeholderTextColor={C.dim}
            style={styles.input}
            returnKeyType="next"
            onSubmitEditing={addOne}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TextInput
              value={player}
              onChangeText={setPlayer}
              placeholder="Player (optional)"
              placeholderTextColor={C.dim}
              style={[styles.input, { flex: 1 }]}
              returnKeyType="done"
              onSubmitEditing={addOne}
            />
            <Pressable onPress={addOne} style={[styles.addBtn, !teamName.trim() && { opacity: 0.4 }]}>
              <Icon name="plus" size={26} color="#06210F" />
            </Pressable>
          </View>
        </Card>
      )}

      {teams.length === 0 ? (
        <View style={styles.quickRow}>
          <Text style={styles.hint}>Just testing? Fill with placeholders:</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {[8, 16, 32].map((c) => (
              <Pressable key={c} onPress={() => quick(c)} style={styles.quickBtn}>
                <Text style={styles.quickText}>{c} teams</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          {teams.map((t, i) => (
            <View key={t.id} style={styles.teamRow}>
              <Text style={styles.teamIdx}>{i + 1}</Text>
              <TeamBadge team={t} size={30} />
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName} numberOfLines={1}>
                  {t.name}
                </Text>
                {t.player ? <Text style={styles.teamPlayer}>{t.player}</Text> : null}
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => {
                  tap();
                  setTeams(teams.filter((x) => x.id !== t.id));
                }}
              >
                <Icon name="close-circle" size={22} color={C.dim} />
              </Pressable>
            </View>
          ))}
          <Pressable onPress={() => setTeams([])} style={{ alignSelf: 'center', marginTop: 8 }}>
            <Text style={[styles.link, { color: C.red }]}>Clear all</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

function SettingsForm({ format, n, s, set }: { format: Format; n: number; s: Settings; set: (p: Partial<Settings>) => void }) {
  const koToggles = (
    <>
      <Toggle label="Two-legged ties" hint="Home & away, decided on aggregate." value={s.koTwoLegs} onChange={(v) => set({ koTwoLegs: v })} />
      {s.koTwoLegs ? (
        <Toggle label="One-off final" hint="Final is a single match." value={s.singleLegFinal} onChange={(v) => set({ singleLegFinal: v })} />
      ) : null}
    </>
  );

  if (format === 'league') {
    return (
      <>
        <SectionTitle title="League" />
        <Card style={{ paddingVertical: 4 }}>
          <Toggle label="Home & away" hint="Everyone plays each other twice." value={s.doubleRoundRobin} onChange={(v) => set({ doubleRoundRobin: v })} />
        </Card>
        <PointsCard s={s} set={set} />
      </>
    );
  }

  if (format === 'knockout') {
    return (
      <>
        <SectionTitle title="Knockout" />
        <Card style={{ paddingVertical: 4 }}>
          {koToggles}
          {n >= 4 ? <Toggle label="Third-place match" value={s.thirdPlace} onChange={(v) => set({ thirdPlace: v })} /> : null}
        </Card>
      </>
    );
  }

  if (format === 'worldcup') {
    const perGroup = s.groupCount ? n / s.groupCount : 0;
    return (
      <>
        <SectionTitle title="Group stage" />
        <Card>
          <View style={styles.stepperRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Groups</Text>
              <Text style={styles.hint}>
                {Number.isInteger(perGroup) ? `${perGroup} teams each` : `${Math.floor(perGroup)}–${Math.ceil(perGroup)} teams each`}
              </Text>
            </View>
            <Stepper value={s.groupCount} min={1} max={Math.max(1, Math.floor(n / 2))} onChange={(v) => set({ groupCount: v, bestThirds: Math.min(s.bestThirds, v) })} />
          </View>
          <View style={styles.sep} />
          <View style={styles.stepperRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Qualify per group</Text>
            </View>
            <Stepper value={s.advancePerGroup} min={1} max={4} onChange={(v) => set({ advancePerGroup: v, bestThirds: v === 2 ? s.bestThirds : 0 })} />
          </View>
          {s.advancePerGroup === 2 ? (
            <>
              <View style={styles.sep} />
              <View style={styles.stepperRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Best 3rd-placed teams</Text>
                  <Text style={styles.hint}>Like Euro 2016 or the 48-team World Cup.</Text>
                </View>
                <Stepper value={s.bestThirds} min={0} max={s.groupCount} onChange={(v) => set({ bestThirds: v })} />
              </View>
            </>
          ) : null}
          <View style={styles.sep} />
          <Toggle label="Home & away in groups" value={s.doubleRoundRobin} onChange={(v) => set({ doubleRoundRobin: v })} />
        </Card>
        <SectionTitle title="Knockouts" />
        <Card style={{ paddingVertical: 4 }}>
          {koToggles}
          <Toggle label="Third-place match" value={s.thirdPlace} onChange={(v) => set({ thirdPlace: v })} />
        </Card>
        <PointsCard s={s} set={set} />
      </>
    );
  }

  // Champions League
  const sizes = [2, 4, 8, 16, 32].filter((k) => k <= n);
  return (
    <>
      <SectionTitle title="League phase" />
      <Card>
        <View style={styles.stepperRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Matches per team</Text>
            <Text style={styles.hint}>Different opponent every game.</Text>
          </View>
          <Stepper value={s.leagueMatches} min={1} max={Math.max(1, n - 1)} onChange={(v) => set({ leagueMatches: v })} />
        </View>
      </Card>
      <SectionTitle title="Knockouts" />
      <Card>
        <Text style={[styles.settingLabel, { marginBottom: 10 }]}>Knockout bracket starts at</Text>
        <Segmented
          items={sizes.map((k) => ({ key: String(k), label: roundName(k).short === 'F' ? 'Final' : roundName(k).short }))}
          value={String(s.koSize)}
          onChange={(k) => set({ koSize: Number(k) })}
        />
        <Toggle
          label="Knockout play-offs"
          hint={
            n >= s.koSize * 1.5
              ? `Top ${s.koSize / 2} go straight through; ${s.koSize / 2 + 1}–${s.koSize * 1.5} play off for the other spots.`
              : `Needs at least ${s.koSize * 1.5} teams.`
          }
          value={s.playoff}
          onChange={(v) => set({ playoff: v })}
        />
        {koToggles}
      </Card>
      <PointsCard s={s} set={set} />
    </>
  );
}

function PointsCard({ s, set }: { s: Settings; set: (p: Partial<Settings>) => void }) {
  return (
    <>
      <SectionTitle title="Points" />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <Stepper label="Win" value={s.winPoints} min={1} max={5} onChange={(v) => set({ winPoints: v })} />
          <Stepper label="Draw" value={s.drawPoints} min={0} max={3} onChange={(v) => set({ drawPoints: v })} />
        </View>
      </Card>
    </>
  );
}

function describe(format: Format, teams: Team[], s: Settings) {
  const n = teams.length;
  const t = createTournament({ name: 'x', format, teams, settings: s, randomDraw: false, rand: () => 0.5 });
  const r = new Resolver(t);
  const total = r.progress().total;
  const lines: string[] = [];
  if (format === 'league') {
    lines.push(`${n} teams, ${s.doubleRoundRobin ? 'home & away' : 'single round robin'}`);
    lines.push('Top of the table is champion');
  } else if (format === 'knockout') {
    const size = nextPow2(n);
    lines.push(`${roundName(size).name}${size > n ? ` · ${size - n} bye${size - n > 1 ? 's' : ''} for top seeds` : ''}`);
    lines.push(`Ties: ${s.koTwoLegs ? 'two legs' : 'one match'}, penalties if level`);
  } else if (format === 'worldcup') {
    const q = s.groupCount * s.advancePerGroup + s.bestThirds;
    lines.push(`${s.groupCount} group${s.groupCount > 1 ? 's' : ''} · top ${s.advancePerGroup}${s.bestThirds ? ` + ${s.bestThirds} best 3rd` : ''} advance`);
    const size = nextPow2(q);
    lines.push(`${q} teams into the ${roundName(size).name.toLowerCase()}${size > q ? ` (${size - q} byes)` : ''}`);
  } else {
    const po = s.playoff && n >= s.koSize * 1.5;
    lines.push(`League phase: ${s.leagueMatches} games each, one table`);
    if (po) {
      lines.push(`1–${s.koSize / 2} → ${roundName(s.koSize).name.toLowerCase()}`);
      lines.push(`${s.koSize / 2 + 1}–${s.koSize * 1.5} → play-offs, ${s.koSize * 1.5 + 1}+ out`);
    } else {
      lines.push(`Top ${s.koSize} → ${roundName(s.koSize).name.toLowerCase()}`);
    }
  }
  return { lines, total };
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 8 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line },
  title: { color: C.text, fontFamily: F.display, fontSize: 38, textTransform: 'uppercase', marginTop: 6 },
  lead: { color: C.sub, fontFamily: F.body, fontSize: 14, marginTop: 4, marginBottom: 18 },
  formatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: R.lg,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line, marginBottom: 12,
  },
  formatIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  formatTitle: { color: C.text, fontFamily: F.display, fontSize: 22, textTransform: 'uppercase' },
  formatDesc: { color: C.sub, fontFamily: F.body, fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.mint },
  input: {
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.line, color: C.text,
    fontFamily: F.medium, fontSize: 15, paddingHorizontal: 14, height: 50,
  },
  nameInput: { height: 58, fontFamily: F.displayBold, fontSize: 22, marginTop: 16 },
  link: { color: C.mint, fontFamily: F.semi, fontSize: 13 },
  hint: { color: C.sub, fontFamily: F.body, fontSize: 12.5, lineHeight: 18 },
  addBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  quickRow: { marginTop: 18, alignItems: 'center' },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  quickText: { color: C.text, fontFamily: F.semi, fontSize: 13 },
  teamRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: C.card, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: C.line,
  },
  teamIdx: { color: C.dim, fontFamily: F.displayBold, fontSize: 15, width: 20, textAlign: 'center' },
  teamName: { color: C.text, fontFamily: F.semi, fontSize: 15 },
  teamPlayer: { color: C.sub, fontFamily: F.body, fontSize: 12 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { color: C.text, fontFamily: F.semi, fontSize: 15 },
  sep: { height: 1, backgroundColor: C.line, marginVertical: 12 },
  error: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.red + '18', borderColor: C.red + '55', borderWidth: 1, padding: 14, borderRadius: 14, marginTop: 20 },
  errorText: { color: C.red, fontFamily: F.semi, fontSize: 13.5, flex: 1 },
  summary: { marginTop: 20, padding: 16, borderRadius: R.lg, backgroundColor: C.mint + '10', borderWidth: 1, borderColor: C.mint + '40' },
  summaryTitle: { color: C.mint, fontFamily: F.display, fontSize: 18, textTransform: 'uppercase', marginBottom: 8 },
  summaryLine: { flexDirection: 'row', gap: 10, alignItems: 'center', marginVertical: 3 },
  summaryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.mint },
  summaryText: { color: C.text, fontFamily: F.medium, fontSize: 13.5, flex: 1 },
  summaryTotal: { color: C.sub, fontFamily: F.semi, fontSize: 12, marginTop: 10 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: C.bg + 'F2' },
});
