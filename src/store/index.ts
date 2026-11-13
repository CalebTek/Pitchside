import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createTournament, type CreateInput, type Result, type Tournament } from '../engine';

interface State {
  tournaments: Tournament[];
  create: (input: CreateInput) => string;
  remove: (id: string) => void;
  setResult: (tid: string, mid: string, r: Omit<Result, 'at'>) => void;
  clearResult: (tid: string, mid: string) => void;
  rename: (tid: string, name: string) => void;
  renameTeam: (tid: string, teamId: string, name: string, player?: string) => void;
  resetResults: (tid: string) => void;
}

const patch = (list: Tournament[], id: string, fn: (t: Tournament) => Tournament) =>
  list.map((t) => (t.id === id ? fn(t) : t));

export const useStore = create<State>()(
  persist(
    (set) => ({
      tournaments: [],
      create: (input) => {
        const t = createTournament(input);
        set((s) => ({ tournaments: [t, ...s.tournaments] }));
        return t.id;
      },
      remove: (id) => set((s) => ({ tournaments: s.tournaments.filter((t) => t.id !== id) })),
      setResult: (tid, mid, r) =>
        set((s) => ({
          tournaments: patch(s.tournaments, tid, (t) => ({ ...t, results: { ...t.results, [mid]: { ...r, at: Date.now() } } })),
        })),
      clearResult: (tid, mid) =>
        set((s) => ({
          tournaments: patch(s.tournaments, tid, (t) => {
            const results = { ...t.results };
            delete results[mid];
            return { ...t, results };
          }),
        })),
      rename: (tid, name) => set((s) => ({ tournaments: patch(s.tournaments, tid, (t) => ({ ...t, name })) })),
      renameTeam: (tid, teamId, name, player) =>
        set((s) => ({
          tournaments: patch(s.tournaments, tid, (t) => ({
            ...t,
            teams: t.teams.map((x) => (x.id === teamId ? { ...x, name, player } : x)),
          })),
        })),
      resetResults: (tid) => set((s) => ({ tournaments: patch(s.tournaments, tid, (t) => ({ ...t, results: {} })) })),
    }),
    {
      name: 'pitchside-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useTournament = (id: string | undefined) =>
  useStore((s) => s.tournaments.find((t) => t.id === id));
