import { usdtFromString, usdtFromWhole } from '@/lib/money';
import type { AppNotification, Participation, Person, ProfileStats } from './types';

/**
 * Datos semilla.
 *
 * Los montos van en unidades base de USDT (`usdtFromWhole` / `usdtFromString`)
 * y los plazos como cantidad de días, que `src/api/backend.ts` convierte a
 * timestamps absolutos — igual que haría un contrato.
 */

/** Tasa anual por defecto, en basis points. 450 = 4,50%. */
export const DEFAULT_APR_BPS = 450;

/** La cuenta del usuario demo. Con wallet real sale del SDK. */
export const DEMO_ACCOUNT = '0x8f2ce1a6c4b5d9e3f70a1b8c2d4e6f8a0b23a2fc';

/** Forma de la semilla: sin timestamps absolutos, para que no envejezca. */
export type PoolSeed = {
  id: string;
  name: string;
  mood: Person['mood'];
  tag: string;
  minWhole: number;
  maxWhole: number;
  goalWhole: number;
  raisedWhole: number;
  capacity: number;
  filled: number;
  durationMonths: number;
  joinDaysLeft: number;
};

export const POOL_SEEDS: PoolSeed[] = [
  { id: 'salta',    name: 'Viaje a Salta',       mood: 'excited', tag: 'Viajes',      minWhole: 50,  maxWhole: 200, goalWhole: 1550, raisedWhole: 1210, capacity: 5, filled: 4, durationMonths: 4, joinDaysLeft: 6 },
  { id: 'fondo',    name: 'Fondo emergencia',    mood: 'normal',  tag: 'Emergencia',  minWhole: 100, maxWhole: 500, goalWhole: 1500, raisedWhole: 510,  capacity: 5, filled: 2, durationMonths: 6, joinDaysLeft: 12 },
  { id: 'notebook', name: 'Notebook nueva',      mood: 'happy',   tag: 'Tecnología',  minWhole: 80,  maxWhole: 300, goalWhole: 1300, raisedWhole: 780,  capacity: 5, filled: 3, durationMonths: 5, joinDaysLeft: 9 },
  { id: 'depto',    name: 'Alquiler del depto',  mood: 'normal',  tag: 'Hogar',       minWhole: 200, maxWhole: 800, goalWhole: 2400, raisedWhole: 530,  capacity: 6, filled: 2, durationMonths: 8, joinDaysLeft: 15 },
  { id: 'mundial',  name: 'Entradas al mundial', mood: 'excited', tag: 'Viajes',      minWhole: 150, maxWhole: 600, goalWhole: 2350, raisedWhole: 2140, capacity: 6, filled: 5, durationMonths: 7, joinDaysLeft: 3 },
  { id: 'bici',     name: 'Bici para el laburo', mood: 'happy',   tag: 'Movilidad',   minWhole: 40,  maxWhole: 150, goalWhole: 500,  raisedWhole: 240,  capacity: 4, filled: 3, durationMonths: 3, joinDaysLeft: 7 },
  { id: 'facu',     name: 'Cuota de la facu',    mood: 'normal',  tag: 'Educación',   minWhole: 60,  maxWhole: 250, goalWhole: 1240, raisedWhole: 190,  capacity: 5, filled: 1, durationMonths: 6, joinDaysLeft: 20 },
];

export const CATEGORIES = ['Viajes', 'Tecnología', 'Hogar', 'Educación', 'Movilidad', 'Emergencia'];
export const SEARCH_TAGS = ['Todos', ...CATEGORIES];

export const PEOPLE: Person[] = [
  { id: 'juli', name: 'Juli', handle: '@juli.eth', mood: 'happy', bg: '#FFE0EC' },
  { id: 'tomi', name: 'Tomi', handle: '@tomi.crypto', mood: 'excited', bg: '#E0F5EC' },
  { id: 'caro', name: 'Caro', handle: '@carolina.base', mood: 'normal', bg: '#FFEDD9' },
  { id: 'nico', name: 'Nico', handle: '@nico.lens', mood: 'celebrating', bg: '#E6EEFF' },
  { id: 'flor', name: 'Flor', handle: '@flor.arg', mood: 'happy', bg: '#F3E5FF' },
  { id: 'santi', name: 'Santi', handle: '@santi.op', mood: 'normal', bg: '#FFE5E0' },
  { id: 'vale', name: 'Vale', handle: '@vale.degen', mood: 'excited', bg: '#E0F0FF' },
  { id: 'mati', name: 'Mati', handle: '@mati.sol', mood: 'happy', bg: '#EAFAF2' },
];

/** Qué amigos están dentro de cada chanchito. */
export const POOL_FRIENDS: Record<string, string[]> = {
  salta: ['juli', 'tomi'],
  fondo: [],
  notebook: ['caro'],
  depto: [],
  mundial: ['juli', 'nico', 'flor'],
  bici: ['tomi'],
  facu: [],
};

export const PARTICIPATIONS: Participation[] = [
  {
    id: 'p-salta',
    poolId: 'salta',
    name: 'Viaje a Salta',
    mood: 'excited',
    deposited: usdtFromWhole(120),
    yieldEarned: usdtFromString('4.20')!,
    progress: 78,
    activeCount: 4,
    totalCount: 5,
    durationMonths: 4,
    account: DEMO_ACCOUNT,
    status: 'active',
  },
  {
    id: 'p-mama',
    poolId: 'mama',
    name: 'Regalo de mamá',
    mood: 'happy',
    deposited: usdtFromWhole(60),
    yieldEarned: usdtFromString('1.80')!,
    progress: 45,
    activeCount: 3,
    totalCount: 3,
    durationMonths: 5,
    account: DEMO_ACCOUNT,
    status: 'active',
  },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', icon: '🐷', title: "'Viaje a Salta' llegó al 80% de la meta", time: 'hace 2 h', tone: 'mint' },
  { id: 'n2', icon: '⏳', title: "Quedan 3 días para que cierre la inscripción de 'Fondo emergencia'", time: 'ayer', tone: 'paper' },
  { id: 'n3', icon: '🎉', title: '¡Meta cumplida! Retirá tu plata cuando quieras', time: 'hace 2 días', tone: 'coral' },
  { id: 'n4', icon: '📈', title: "Alguien salió de 'Regalo de mamá' — tu ganancia estimada subió", time: 'hace 3 días', tone: 'paper' },
];

export const PROFILE_STATS: ProfileStats = {
  saved: usdtFromWhole(1240),
  earned: usdtFromWhole(86),
  completed: 3,
  abandoned: 1,
};

export const ONBOARDING = [
  { mood: 'normal' as const, title: 'Juntá con otros', body: 'Armá un chanchito con amigos o familia y pongan plata al mismo objetivo.' },
  { mood: 'happy' as const, title: 'Tu plata genera interés', body: 'Mientras esperan, el ahorro del grupo trabaja solo y va creciendo.' },
  { mood: 'excited' as const, title: 'Cumplan la meta juntos', body: 'Cuando se llena el chanchito, cada uno retira su parte más la ganancia.' },
];
