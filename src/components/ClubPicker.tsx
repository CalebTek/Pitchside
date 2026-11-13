import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CLUBS, LEAGUES, PACKS, leagueName, type LeagueKey, type PresetClub } from '../data/clubs';
import { C, F, R } from '../theme';
import { Button, Icon, IconButton, TeamBadge, tap } from './ui';

type Filter = LeagueKey | 'all';

/**
 * Full-screen content for choosing preset clubs. Render inside a Modal (or any full-height view).
 * `taken` are names already in the tournament; they show as added and can't be picked twice.
 */
export function ClubPicker({
  taken,
  onDone,
  onClose,
  title = 'Pick clubs',
  doneLabel = 'Add',
}: {
  taken: string[];
  onDone: (clubs: PresetClub[]) => void;
  onClose: () => void;
  title?: string;
  doneLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const takenSet = useMemo(() => new Set(taken.map((n) => n.toLowerCase())), [taken]);
  const pickedSet = new Set(picked);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return CLUBS.filter(
      (c) =>
        (filter === 'all' || c.league === filter) &&
        (!term || c.name.toLowerCase().includes(term) || c.short.toLowerCase().includes(term)),
    );
  }, [filter, q]);

  const available = list.filter((c) => !takenSet.has(c.name.toLowerCase()));
  const allPicked = available.length > 0 && available.every((c) => pickedSet.has(c.name));

  const toggle = (c: PresetClub) => {
    if (takenSet.has(c.name.toLowerCase())) return;
    tap();
    setPicked((p) => (p.includes(c.name) ? p.filter((x) => x !== c.name) : [...p, c.name]));
  };

  const toggleAll = () => {
    tap();
    if (allPicked) setPicked((p) => p.filter((n) => !available.some((c) => c.name === n)));
    else setPicked((p) => [...new Set([...p, ...available.map((c) => c.name)])]);
  };

  const applyPack = (clubs: PresetClub[]) => {
    tap('medium');
    setPicked((p) => [...new Set([...p, ...clubs.filter((c) => !takenSet.has(c.name.toLowerCase())).map((c) => c.name)])]);
  };

  const done = () => {
    const order = new Map(picked.map((n, i) => [n, i]));
    onDone(CLUBS.filter((c) => order.has(c.name)).sort((a, b) => order.get(a.name)! - order.get(b.name)!));
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <IconButton icon="close" onPress={onClose} />
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.search}>
        <Icon name="magnify" size={20} color={C.dim} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search clubs or countries"
          placeholderTextColor={C.dim}
          style={styles.searchInput}
          autoCorrect={false}
        />
        {q ? (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Icon name="close-circle" size={18} color={C.dim} />
          </Pressable>
        ) : null}
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {PACKS.map((p) => (
            <Pressable key={p.id} onPress={() => applyPack(p.clubs)} style={styles.pack}>
              <Icon name="lightning-bolt" size={14} color={C.gold} />
              <Text style={styles.packText}>{p.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {([{ key: 'all', name: 'All' }, ...LEAGUES] as { key: Filter; name: string }[]).map((l) => {
            const on = filter === l.key;
            return (
              <Pressable
                key={l.key}
                onPress={() => {
                  tap();
                  setFilter(l.key);
                }}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipText, on && { color: C.bg }]}>{l.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listHead}>
        <Text style={styles.count}>
          {list.length} {filter === 'nations' ? 'teams' : 'clubs'}
        </Text>
        {available.length ? (
          <Pressable onPress={toggleAll} hitSlop={8}>
            <Text style={styles.link}>{allPicked ? 'Unselect all' : 'Select all'}</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={list}
        keyExtractor={(c) => c.league + c.name}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
        renderItem={({ item }) => {
          const isTaken = takenSet.has(item.name.toLowerCase());
          const on = pickedSet.has(item.name);
          return (
            <Pressable
              onPress={() => toggle(item)}
              style={[styles.row, on && styles.rowOn, isTaken && { opacity: 0.45 }]}
            >
              <TeamBadge team={{ id: item.name, name: item.name, short: item.short, color: item.color }} size={34} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.league}>{isTaken ? 'Already added' : leagueName(item.league)}</Text>
              </View>
              <View style={[styles.check, (on || isTaken) && styles.checkOn]}>
                {on || isTaken ? <Icon name="check" size={16} color="#06210F" /> : null}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={[styles.count, { textAlign: 'center', marginTop: 40 }]}>No match for “{q}”.</Text>}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Button
          title={picked.length ? `${doneLabel} ${picked.length} club${picked.length > 1 ? 's' : ''}` : 'Tap clubs to select'}
          icon="check"
          disabled={!picked.length}
          onPress={done}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  title: { color: C.text, fontFamily: F.display, fontSize: 24, textTransform: 'uppercase' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, paddingHorizontal: 12, height: 46,
    borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  searchInput: { flex: 1, color: C.text, fontFamily: F.medium, fontSize: 15, height: 46 },
  chips: { paddingHorizontal: 16, gap: 8, paddingTop: 10 },
  pack: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99,
    backgroundColor: C.gold + '18', borderWidth: 1, borderColor: C.gold + '55',
  },
  packText: { color: C.gold, fontFamily: F.semi, fontSize: 12.5 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.text, borderColor: C.text },
  chipText: { color: C.sub, fontFamily: F.semi, fontSize: 12.5 },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  count: { color: C.dim, fontFamily: F.semi, fontSize: 12 },
  link: { color: C.mint, fontFamily: F.semi, fontSize: 13 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: R.md, marginBottom: 6,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.line,
  },
  rowOn: { borderColor: C.mint, backgroundColor: C.cardHi },
  name: { color: C.text, fontFamily: F.semi, fontSize: 15 },
  league: { color: C.sub, fontFamily: F.body, fontSize: 12 },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: C.mint, borderColor: C.mint },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.bg + 'F2' },
});
