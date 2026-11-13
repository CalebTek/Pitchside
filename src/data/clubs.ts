/**
 * Built-in catalogue of popular clubs and national teams.
 * Names and colours are factual descriptors only — no crests or trademarks are bundled.
 */

export interface PresetClub {
  name: string;
  short: string;
  color: string;
  league: LeagueKey;
}

export type LeagueKey = 'epl' | 'laliga' | 'seriea' | 'bundesliga' | 'ligue1' | 'europe' | 'world' | 'nations';

export const LEAGUES: { key: LeagueKey; name: string; short: string }[] = [
  { key: 'epl', name: 'Premier League', short: 'England' },
  { key: 'laliga', name: 'La Liga', short: 'Spain' },
  { key: 'seriea', name: 'Serie A', short: 'Italy' },
  { key: 'bundesliga', name: 'Bundesliga', short: 'Germany' },
  { key: 'ligue1', name: 'Ligue 1', short: 'France' },
  { key: 'europe', name: 'Rest of Europe', short: 'Europe' },
  { key: 'world', name: 'Rest of the World', short: 'World' },
  { key: 'nations', name: 'National Teams', short: 'Nations' },
];

type Row = [name: string, short: string, color: string];

const DATA: Record<LeagueKey, Row[]> = {
  epl: [
    ['Manchester City', 'MCI', '#6CABDD'],
    ['Arsenal', 'ARS', '#EF0107'],
    ['Liverpool', 'LIV', '#E31B23'],
    ['Chelsea', 'CHE', '#3B6BFF'],
    ['Manchester United', 'MUN', '#DA291C'],
    ['Tottenham Hotspur', 'TOT', '#C9D2EA'],
    ['Newcastle United', 'NEW', '#E8E8E8'],
    ['Aston Villa', 'AVL', '#A3375A'],
    ['West Ham United', 'WHU', '#9B3A55'],
    ['Brighton', 'BHA', '#2F7BE5'],
    ['Everton', 'EVE', '#3D63D9'],
    ['Nottingham Forest', 'NFO', '#E53233'],
  ],
  laliga: [
    ['Real Madrid', 'RMA', '#FEBE10'],
    ['Barcelona', 'BAR', '#C8264A'],
    ['Atlético Madrid', 'ATM', '#E2412F'],
    ['Real Sociedad', 'RSO', '#3C7DD9'],
    ['Athletic Club', 'ATH', '#EE2523'],
    ['Villarreal', 'VIL', '#FFE667'],
    ['Real Betis', 'BET', '#22B04B'],
    ['Sevilla', 'SEV', '#F43333'],
    ['Valencia', 'VAL', '#FF8A3D'],
    ['Girona', 'GIR', '#E2393D'],
  ],
  seriea: [
    ['Inter', 'INT', '#3D7BFF'],
    ['AC Milan', 'MIL', '#FB090B'],
    ['Juventus', 'JUV', '#E8E8E8'],
    ['Napoli', 'NAP', '#2ED3F0'],
    ['AS Roma', 'ROM', '#F0BC42'],
    ['Lazio', 'LAZ', '#87D8F7'],
    ['Atalanta', 'ATA', '#3F7FD9'],
    ['Fiorentina', 'FIO', '#9B5DE5'],
    ['Bologna', 'BOL', '#D6304A'],
  ],
  bundesliga: [
    ['Bayern Munich', 'FCB', '#DC052D'],
    ['Borussia Dortmund', 'BVB', '#FDE100'],
    ['Bayer Leverkusen', 'B04', '#E32221'],
    ['RB Leipzig', 'RBL', '#E8344E'],
    ['Eintracht Frankfurt', 'SGE', '#E1000F'],
    ['VfB Stuttgart', 'VFB', '#E32219'],
    ['Wolfsburg', 'WOB', '#65B32E'],
    ['Borussia Mönchengladbach', 'BMG', '#3DBE6B'],
  ],
  ligue1: [
    ['Paris Saint-Germain', 'PSG', '#4C7DFF'],
    ['Marseille', 'OM', '#2FAEE0'],
    ['Monaco', 'ASM', '#E7001B'],
    ['Lyon', 'OL', '#5B8CFF'],
    ['Lille', 'LIL', '#E01E13'],
    ['Nice', 'NIC', '#E4202C'],
    ['Lens', 'RCL', '#FFD200'],
  ],
  europe: [
    ['Benfica', 'SLB', '#FF3B3B'],
    ['FC Porto', 'POR', '#3D7BFF'],
    ['Sporting CP', 'SCP', '#21B35B'],
    ['Ajax', 'AJA', '#D2122E'],
    ['PSV', 'PSV', '#ED1C24'],
    ['Feyenoord', 'FEY', '#FF4D4D'],
    ['Celtic', 'CEL', '#1BB35C'],
    ['Rangers', 'RAN', '#3C6CFF'],
    ['Galatasaray', 'GAL', '#FDB912'],
    ['Fenerbahçe', 'FEN', '#FFED00'],
    ['Club Brugge', 'BRU', '#3A7BD5'],
    ['Shakhtar Donetsk', 'SHA', '#FF8A00'],
    ['Red Star Belgrade', 'CZV', '#E30613'],
    ['Olympiacos', 'OLY', '#E4242C'],
    ['Salzburg', 'SAL', '#E8344E'],
  ],
  world: [
    ['Al Nassr', 'NAS', '#FFD100'],
    ['Al Hilal', 'HIL', '#3D6BFF'],
    ['Al Ittihad', 'ITT', '#FFE100'],
    ['Inter Miami', 'MIA', '#F7B5CD'],
    ['LA Galaxy', 'LAG', '#5B8CFF'],
    ['Flamengo', 'FLA', '#E2231A'],
    ['Palmeiras', 'PAL', '#2DB360'],
    ['Boca Juniors', 'BOC', '#FFD100'],
    ['River Plate', 'RIV', '#E8344E'],
    ['Club América', 'AME', '#FFE14D'],
    ['Al Ahly', 'AHL', '#E4202C'],
    ['Mamelodi Sundowns', 'SUN', '#FFD200'],
  ],
  nations: [
    ['Argentina', 'ARG', '#75AADB'],
    ['France', 'FRA', '#4C7DFF'],
    ['Spain', 'ESP', '#FF4B3E'],
    ['England', 'ENG', '#E8E8E8'],
    ['Brazil', 'BRA', '#FFDF00'],
    ['Portugal', 'POR', '#E42518'],
    ['Netherlands', 'NED', '#FF7F00'],
    ['Belgium', 'BEL', '#ED2939'],
    ['Germany', 'GER', '#E8E8E8'],
    ['Italy', 'ITA', '#3D7BFF'],
    ['Croatia', 'CRO', '#FF5C5C'],
    ['Uruguay', 'URU', '#7FC4F0'],
    ['Colombia', 'COL', '#FCD116'],
    ['Morocco', 'MAR', '#E3343B'],
    ['Nigeria', 'NGA', '#22B35E'],
    ['Senegal', 'SEN', '#2DBE60'],
    ['Ghana', 'GHA', '#FCD116'],
    ['Cameroon', 'CMR', '#21A35A'],
    ['Ivory Coast', 'CIV', '#FF8200'],
    ['Egypt', 'EGY', '#E4313C'],
    ['Algeria', 'ALG', '#2DB35F'],
    ['South Africa', 'RSA', '#FFB612'],
    ['USA', 'USA', '#5B8CFF'],
    ['Mexico', 'MEX', '#1FA05A'],
    ['Canada', 'CAN', '#FF3B3B'],
    ['Japan', 'JPN', '#4C6FFF'],
    ['South Korea', 'KOR', '#E8344E'],
    ['Australia', 'AUS', '#FFCD00'],
    ['Switzerland', 'SUI', '#FF3B3B'],
    ['Denmark', 'DEN', '#E8344E'],
    ['Poland', 'POL', '#F2F2F2'],
    ['Türkiye', 'TUR', '#E30A17'],
  ],
};

export const CLUBS: PresetClub[] = (Object.keys(DATA) as LeagueKey[]).flatMap((league) =>
  DATA[league].map(([name, short, color]) => ({ name, short, color, league })),
);

export const leagueName = (k: LeagueKey) => LEAGUES.find((l) => l.key === k)?.name ?? '';

const byName = (names: string[]) => names.map((n) => CLUBS.find((c) => c.name === n)!).filter(Boolean);

/** One-tap starter packs. */
export const PACKS: { id: string; name: string; clubs: PresetClub[] }[] = [
  {
    id: 'giants8',
    name: 'Big 8',
    clubs: byName(['Real Madrid', 'Manchester City', 'Bayern Munich', 'Barcelona', 'Liverpool', 'Paris Saint-Germain', 'Arsenal', 'Inter']),
  },
  {
    id: 'europe16',
    name: 'Top 16 Europe',
    clubs: byName([
      'Real Madrid', 'Manchester City', 'Bayern Munich', 'Barcelona', 'Liverpool', 'Paris Saint-Germain', 'Arsenal', 'Inter',
      'Chelsea', 'Manchester United', 'Juventus', 'AC Milan', 'Borussia Dortmund', 'Atlético Madrid', 'Bayer Leverkusen', 'Napoli',
    ]),
  },
  {
    id: 'ucl36',
    name: 'Champions League 36',
    clubs: byName([
      'Real Madrid', 'Manchester City', 'Bayern Munich', 'Barcelona', 'Liverpool', 'Paris Saint-Germain', 'Arsenal', 'Inter',
      'Chelsea', 'Juventus', 'AC Milan', 'Borussia Dortmund', 'Atlético Madrid', 'Bayer Leverkusen', 'Napoli', 'Tottenham Hotspur',
      'Newcastle United', 'Aston Villa', 'Benfica', 'FC Porto', 'Sporting CP', 'PSV', 'Feyenoord', 'Celtic',
      'Galatasaray', 'Club Brugge', 'Atalanta', 'RB Leipzig', 'Monaco', 'Marseille', 'Shakhtar Donetsk', 'Salzburg',
      'Red Star Belgrade', 'Olympiacos', 'AS Roma', 'Villarreal',
    ]),
  },
  { id: 'wc32', name: 'World Cup 32', clubs: CLUBS.filter((c) => c.league === 'nations') },
];
