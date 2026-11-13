import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PresetClub } from '../data/clubs';
import { MAX_DRAW_PLAYERS, TALLIES, maxPerPlayer, pickRandom, uid, type PoolClub, type Team } from '../engine';
import { C, F, R } from '../theme';
import { ClubPicker } from './ClubPicker';
import { Button, Icon, IconButton, Stepper, TeamBadge, tap } from './ui';

interface Player {
  id: string;
  name: string;
  tally: number;
  clubs: PoolClub[];
}

const SPIN_DELAYS = [45, 45, 50, 55, 60, 70, 80, 95, 115, 140, 175, 220, 280];

/**
 * Colour-tally club draw. Each player picks a colour, then taps their tally to spin
 * and land on a random club from the pool. Returns the drawn line-up as tournament teams.
 */
export function TallyDraw({
  initialPool,
  onDone,
  onClose,
}: {
  initialPool: PoolClub[];
  onDone: (teams: Team[]) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'players' | 'pool' | 'draw'>('players');
  const [pool, setPool] = useState<PoolClub[]>(initialPool);
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [tally, setTally] = useState(0);
  const [perPlayer, setPerPlayer] = useState(1);
  const [spinning, setSpinning] = useState<{ id: string; label: PoolClub } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const queue = useRef<string[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const usedTallies = new Set(players.map((p) => p.tally));
  const firstFree = (taken: Set<number>) => TALLIES.findIndex((_, i) => !taken.has(i));
  const maxPer = maxPerPlayer(pool.length, players.length);
  const need = players.length * perPlayer;
  const enough = players.length >= 2 && pool.length >= need;

  const addPlayer = () => {
    const nm = name.trim();
    if (!nm || usedTallies.has(tally) || players.length >= MAX_DRAW_PLAYERS) return;
    tap('medium');
    const next = [...players, { id: uid('pl'), name: nm, tally, clubs: [] }];
    setPlayers(next);
    setName('');
    const free = firstFree(new Set(next.map((p) => p.tally)));
    if (free >= 0) setTally(free);
  };

  const removePlayer = (id: string) => {
    tap();
    const next = players.filter((p) => p.id !== id);
    setPlayers(next);
    if (usedTallies.has(tally)) setTally(Math.max(0, firstFree(new Set(next.map((p) => p.tally)))));
  };

  const takenClubs = () => new Set(players.flatMap((p) => p.clubs));
  const done = players.length > 0 && players.every((p) => p.clubs.length >= perPlayer);

  /** Spin one tally; when it lands, run the next queued spin (for "Draw all"). */
  const spin = (id: string): boolean => {
    if (spinning) return false;
    const p = players.find((x) => x.id === id);
    if (!p || p.clubs.length >= perPlayer) return false;
    const taken = takenClubs();
    const final = pickRandom(pool, taken);
    if (!final) return false;
    const left = pool.filter((c) => !taken.has(c));
    let t = 0;
    SPIN_DELAYS.forEach((d, i) => {
      t += d;
      timers.current.push(
        setTimeout(() => {
          const isLast = i === SPIN_DELAYS.length - 1;
          const label = isLast ? final : left[Math.floor(Math.random() * left.length)];
          setSpinning({ id, label });
          if (!isLast && i % 2 === 0) tap();
          if (isLast) {
            timers.current.push(
              setTimeout(() => {
                tap('success');
                setPlayers((ps) => ps.map((x) => (x.id === id ? { ...x, clubs: [...x.clubs, final] } : x)));
                setSpinning(null);
              }, 380),
            );
          }
        }, t),
      );
    });
    return true;
  };

  // Drives the "Draw all" queue once each spin finishes
  useEffect(() => {
    if (spinning || !queue.current.length) return;
    const t = setTimeout(() => {
      while (queue.current.length && !spin(queue.current.shift()!)) {
        /* skip tallies that are already full */
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, players]);

  const drawAllNow = () => {
    if (spinning) return;
    const order: string[] = [];
    for (let round = 0; round < perPlayer; round++) {
      for (const p of players) if (p.clubs.length <= round) order.push(p.id);
    }
    queue.current = order;
    while (queue.current.length && !spin(queue.current.shift()!)) {
      /* skip */
    }
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    queue.current = [];
    setSpinning(null);
    setPlayers((ps) => ps.map((p) => ({ ...p, clubs: [] })));
  };

  const finish = () => {
    const teams: Team[] = players.flatMap((p) =>
      p.clubs.map((c) => ({ id: uid('tm'), name: c.name, short: c.short, player: p.name, color: TALLIES[p.tally].color })),
    );
    onDone(teams);
  };

  if (phase === 'pool') {
    return (
      <ClubPicker
        title="Add to the pool"
        taken={pool.map((c) => c.name)}
        onClose={() => setPhase('players')}
        onDone={(clubs: PresetClub[]) => {
          setPool([...pool, ...clubs.map((c) => ({ name: c.name, short: c.short, color: c.color }))]);
          setPhase('players');
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton icon={phase === 'draw' ? 'arrow-left' : 'close'} onPress={() => (phase === 'draw' && !spinning ? setPhase('players') : onClose())} />
        <Text style={styles.title}>{phase === 'draw' ? 'The draw' : 'Tally draw'}</Text>
        <View style={{ width: 42 }} />
      </View>

      {phase === 'players' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>
            Every player picks a colour tally. Then each tally spins and lands on a random club, so nobody gets to stick with their usual team.
          </Text>

          <View style={styles.poolCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.poolTitle}>Club pool · {pool.length}</Text>
              <Text style={styles.poolSub} numberOfLines={2}>
                {pool.length ? pool.map((c) => c.name).join(', ') : 'No clubs yet. Add some to draw from.'}
              </Text>
            </View>
            <Pressable onPress={() => setPhase('pool')} style={styles.poolBtn}>
              <Icon name="plus" size={18} color={C.mint} />
              <Text style={styles.poolBtnText}>Clubs</Text>
            </Pressable>
          </View>

          <Text style={styles.section}>ADD PLAYERS · {players.length}/{MAX_DRAW_PLAYERS}</Text>
          <View style={styles.card}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Player name"
              placeholderTextColor={C.dim}
              style={styles.input}
              onSubmitEditing={addPlayer}
              returnKeyType="done"
            />
            <Text style={styles.small}>Pick a tally</Text>
            <View style={styles.palette}>
              {TALLIES.map((t, i) => {
                const used = usedTallies.has(i);
                const on = tally === i && !used;
                return (
                  <Pressable
                    key={t.name}
                    disabled={used}
                    onPress={() => {
                      tap();
                      setTally(i);
                    }}
                    style={[styles.swatchWrap, on && { borderColor: t.color }]}
                  >
                    <View style={[styles.swatch, { backgroundColor: t.color, opacity: used ? 0.18 : 1 }]}>
                      {used ? <Icon name="close" size={14} color={C.bg} /> : on ? <Icon name="check" size={16} color={C.bg} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Button
              title={`Add${name.trim() ? ' ' + name.trim() : ''} as ${TALLIES[tally]?.name ?? ''}`}
              icon="account-plus"
              disabled={!name.trim() || usedTallies.has(tally) || players.length >= MAX_DRAW_PLAYERS}
              onPress={addPlayer}
              style={{ marginTop: 12 }}
            />
          </View>

          {players.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <View style={[styles.tallyDot, { backgroundColor: TALLIES[p.tally].color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.small}>{TALLIES[p.tally].name} tally</Text>
              </View>
              <Pressable onPress={() => removePlayer(p.id)} hitSlop={10}>
                <Icon name="close-circle" size={22} color={C.dim} />
              </Pressable>
            </View>
          ))}

          {players.length >= 2 ? (
            <View style={[styles.card, { marginTop: 12, flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>Clubs per player</Text>
                <Text style={styles.small}>
                  {players.length} × {perPlayer} = {need} teams in the tournament
                </Text>
              </View>
              <Stepper value={perPlayer} min={1} max={Math.max(1, Math.min(4, maxPer))} onChange={setPerPlayer} />
            </View>
          ) : null}

          {players.length >= 2 && pool.length < need ? (
            <View style={styles.warn}>
              <Icon name="alert-circle" size={18} color={C.red} />
              <Text style={styles.warnText}>
                The pool needs at least {need} clubs. Add {need - pool.length} more.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
          <Text style={styles.lead}>Tap your tally to spin. Hit “Draw all” to let fate handle everyone.</Text>
          <View style={styles.grid}>
            {players.map((p) => (
              <TallyCard
                key={p.id}
                player={p}
                perPlayer={perPlayer}
                spinning={spinning?.id === p.id ? spinning.label : null}
                disabled={!!spinning}
                onPress={() => spin(p.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {phase === 'players' ? (
          <Button
            title={players.length < 2 ? 'Add at least 2 players' : 'Go to the draw'}
            icon="dice-multiple"
            disabled={!enough}
            onPress={() => {
              reset();
              setPhase('draw');
            }}
          />
        ) : done ? (
          <View style={{ gap: 10 }}>
            <Button title={`Use these ${need} teams`} icon="check-all" onPress={finish} />
            <Button title="Draw again" kind="ghost" icon="restore" onPress={reset} />
          </View>
        ) : (
          <Button title={spinning ? 'Spinning…' : 'Draw all'} kind="gold" icon="dice-multiple" disabled={!!spinning} onPress={drawAllNow} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function TallyCard({
  player,
  perPlayer,
  spinning,
  disabled,
  onPress,
}: {
  player: Player;
  perPlayer: number;
  spinning: PoolClub | null;
  disabled: boolean;
  onPress: () => void;
}) {
  const t = TALLIES[player.tally];
  const full = player.clubs.length >= perPlayer;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 120, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [spinning, pulse]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || full}
      style={({ pressed }) => [styles.tallyCard, { borderColor: t.color + (full ? 'AA' : '55') }, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <LinearGradient colors={[t.color + '55', t.color + '08']} style={StyleSheet.absoluteFill} />
      <View style={styles.tallyTop}>
        <View style={[styles.tallyChip, { backgroundColor: t.color }]}>
          <Text style={styles.tallyChipText}>{t.name}</Text>
        </View>
        {full ? <Icon name="check-circle" size={18} color={t.color} /> : null}
      </View>
      <Text style={styles.tallyPlayer} numberOfLines={1}>
        {player.name}
      </Text>
      <View style={{ gap: 6, marginTop: 8, minHeight: 34 }}>
        {player.clubs.map((c) => (
          <View key={c.name} style={styles.clubRow}>
            <TeamBadge team={{ id: c.name, name: c.name, short: c.short, color: t.color }} size={26} />
            <Text style={styles.clubName} numberOfLines={1}>
              {c.name}
            </Text>
          </View>
        ))}
        {spinning ? (
          <Animated.View style={[styles.clubRow, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }) }]}>
            <Icon name="dice-5" size={22} color={t.color} />
            <Text style={[styles.clubName, { color: t.color }]} numberOfLines={1}>
              {spinning.name}
            </Text>
          </Animated.View>
        ) : !full ? (
          <View style={styles.tapRow}>
            <Icon name="gesture-tap" size={18} color={C.sub} />
            <Text style={styles.tapText}>
              Tap to draw{perPlayer > 1 ? ` (${player.clubs.length}/${perPlayer})` : ''}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 6 },
  title: { color: C.text, fontFamily: F.display, fontSize: 24, textTransform: 'uppercase' },
  lead: { color: C.sub, fontFamily: F.body, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  section: { color: C.dim, fontFamily: F.semi, fontSize: 11, letterSpacing: 1.4, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14 },
  poolCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.lg,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  poolTitle: { color: C.text, fontFamily: F.display, fontSize: 18, textTransform: 'uppercase' },
  poolSub: { color: C.sub, fontFamily: F.body, fontSize: 12, marginTop: 2 },
  poolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99,
    borderWidth: 1, borderColor: C.mint + '66', backgroundColor: C.mint + '14',
  },
  poolBtnText: { color: C.mint, fontFamily: F.semi, fontSize: 13 },
  input: {
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.line, color: C.text,
    fontFamily: F.medium, fontSize: 15, paddingHorizontal: 14, height: 50, marginBottom: 12,
  },
  small: { color: C.sub, fontFamily: F.body, fontSize: 12 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  swatchWrap: { padding: 3, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  swatch: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginTop: 8, borderRadius: 14,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.line,
  },
  tallyDot: { width: 28, height: 28, borderRadius: 9 },
  playerName: { color: C.text, fontFamily: F.semi, fontSize: 15 },
  warn: {
    flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12, padding: 12, borderRadius: 14,
    backgroundColor: C.red + '18', borderWidth: 1, borderColor: C.red + '55',
  },
  warnText: { color: C.red, fontFamily: F.semi, fontSize: 13, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tallyCard: {
    width: '48.5%', minHeight: 132, borderRadius: R.lg, borderWidth: 1.5, padding: 12, overflow: 'hidden', backgroundColor: C.card,
  },
  tallyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tallyChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  tallyChipText: { color: C.bg, fontFamily: F.bold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  tallyPlayer: { color: C.text, fontFamily: F.display, fontSize: 22, textTransform: 'uppercase', marginTop: 8 },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clubName: { color: C.text, fontFamily: F.semi, fontSize: 13.5, flex: 1 },
  tapRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tapText: { color: C.sub, fontFamily: F.medium, fontSize: 12.5 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.bg + 'F2' },
});
