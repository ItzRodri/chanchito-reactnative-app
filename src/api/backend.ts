import {
  DEFAULT_APR_BPS,
  DEMO_ACCOUNT,
  NOTIFICATIONS,
  PARTICIPATIONS,
  PEOPLE,
  POOL_FRIENDS,
  POOL_SEEDS,
  PROFILE_STATS,
} from '@/data/db';
import type { AppNotification, Participation, Person, Pool, ProfileStats } from '@/data/types';
import { usdtFromWhole, type Usdt } from '@/lib/money';
import { makeInviteCode } from '@/lib/qr';
import type { PoolDraft } from '@/store/draft';

/**
 * Backend simulado. Todo vive en memoria y responde con latencia.
 *
 * Este archivo es la única frontera con "el servidor": cuando existan los
 * contratos, se reemplaza el cuerpo de estas funciones por llamadas reales y
 * ni los hooks ni las pantallas se enteran. Por eso las que escriben devuelven
 * un `txHash` — la UI ya trabaja como si cada escritura fuera una transacción.
 */

const LATENCY = 260;
const DAY_MS = 86_400_000;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Hash de mentira, con la forma de uno real. */
function fakeTxHash() {
  let out = '0x';
  for (let i = 0; i < 64; i++) out += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  return out;
}

/* --------------------------- estado en memoria ---------------------------- */

function seedToPool(seed: (typeof POOL_SEEDS)[number]): Pool {
  return {
    id: seed.id,
    name: seed.name,
    mood: seed.mood,
    tag: seed.tag,
    visibility: 'public',
    min: usdtFromWhole(seed.minWhole),
    max: usdtFromWhole(seed.maxWhole),
    goal: usdtFromWhole(seed.goalWhole),
    raised: usdtFromWhole(seed.raisedWhole),
    capacity: seed.capacity,
    filled: seed.filled,
    status: seed.filled >= seed.capacity ? 'active' : 'waiting',
    durationMonths: seed.durationMonths,
    joinDeadline: Date.now() + seed.joinDaysLeft * DAY_MS,
    activatedAt: seed.filled >= seed.capacity ? Date.now() : null,
    maturity:
      seed.filled >= seed.capacity
        ? Date.now() + seed.durationMonths * 30 * DAY_MS
        : null,
    aprBps: DEFAULT_APR_BPS,
  };
}

let pools: Pool[] = POOL_SEEDS.map(seedToPool);
let participations: Participation[] = [...PARTICIPATIONS];
let poolFriends: Record<string, string[]> = { ...POOL_FRIENDS };
let friendIds: string[] = ['juli', 'tomi', 'caro', 'nico', 'flor'];
let requestsIn: string[] = ['santi'];
let pendingOut: string[] = [];

const person = (id: string) => PEOPLE.find((p) => p.id === id)!;

/* ---------------------------------- pools -------------------------------- */

export type PoolWithFriends = Pool & { friends: Person[] };

/** Resultado de una escritura: la UI lo usa para seguir la transacción. */
export type WriteResult<T> = { txHash: string; result: T };

function withFriends(pool: Pool): PoolWithFriends {
  const friends = (poolFriends[pool.id] ?? []).filter((id) => friendIds.includes(id)).map(person);
  return { ...pool, friends };
}

export function fetchPools() {
  return delay(pools.filter((p) => p.visibility === 'public').map(withFriends));
}

export function fetchPool(id: string) {
  const pool = pools.find((p) => p.id === id);
  return delay<PoolWithFriends | null>(pool ? withFriends(pool) : null);
}

/** Cuántos chanchitos tienen al menos un amigo adentro. */
export function fetchPoolsWithFriendsCount() {
  return delay(pools.filter((p) => withFriends(p).friends.length > 0).length);
}

export function fetchPoolByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== 6) return delay<PoolWithFriends | null>(null);

  const owned = pools.find((p) => p.code === normalized);
  if (owned) return delay<PoolWithFriends | null>(withFriends(owned));

  // El mockup siempre resuelve un código válido a un chanchito de ejemplo.
  const template = pools.find((p) => p.id === 'mundial')!;
  const guest: Pool = {
    ...template,
    id: `code-${normalized}`,
    name: 'Chanchito privado',
    tag: 'Privado',
    visibility: 'private',
    code: normalized,
  };
  pools = [...pools, guest];
  return delay<PoolWithFriends | null>(withFriends(guest));
}

export function createPool(draft: PoolDraft): Promise<WriteResult<Pool>> {
  const code = makeInviteCode();
  const max = usdtFromWhole(draft.maxWhole);
  const pool: Pool = {
    id: `own-${code.toLowerCase()}`,
    name: draft.name.trim(),
    mood: 'happy',
    tag: draft.tag,
    visibility: draft.vis,
    code,
    min: usdtFromWhole(draft.minWhole),
    max,
    goal: max * BigInt(draft.capacity),
    raised: 0n,
    capacity: draft.capacity,
    filled: 0,
    status: 'waiting',
    durationMonths: draft.durationMonths,
    joinDeadline: Date.now() + 14 * DAY_MS,
    activatedAt: null,
    maturity: null,
    aprBps: DEFAULT_APR_BPS,
  };
  pools = [pool, ...pools];
  poolFriends = { ...poolFriends, [pool.id]: [] };
  return delay({ txHash: fakeTxHash(), result: pool }, 420);
}

/* ----------------------------- participaciones ---------------------------- */

export function fetchParticipations() {
  return delay(participations);
}

export function fetchParticipation(id: string) {
  return delay<Participation | null>(participations.find((p) => p.id === id) ?? null);
}

export function joinPool({
  poolId,
  amount,
  account = DEMO_ACCOUNT,
}: {
  poolId: string;
  amount: Usdt;
  account?: string;
}): Promise<WriteResult<Participation>> {
  const pool = pools.find((p) => p.id === poolId);
  if (!pool) throw new Error('No encontramos ese chanchito');

  const updated: Pool = { ...pool, raised: pool.raised + amount, filled: pool.filled + 1 };
  pools = pools.map((p) => (p.id === poolId ? updated : p));

  const participation: Participation = {
    id: `p-${poolId}-${Date.now()}`,
    poolId,
    name: pool.name,
    mood: pool.mood,
    deposited: amount,
    yieldEarned: 0n,
    progress: Number((updated.raised * 100n) / (updated.goal || 1n)),
    activeCount: updated.filled,
    totalCount: updated.capacity,
    durationMonths: pool.durationMonths,
    account,
    status: updated.filled >= updated.capacity ? 'active' : 'waiting',
  };
  participations = [participation, ...participations];
  return delay({ txHash: fakeTxHash(), result: participation }, 520);
}

export function exitParticipation(id: string): Promise<WriteResult<{ id: string }>> {
  participations = participations.filter((p) => p.id !== id);
  return delay({ txHash: fakeTxHash(), result: { id } }, 420);
}

/** Atajo de demo: marca la meta como cumplida. */
export function completeParticipation(id: string): Promise<WriteResult<Participation>> {
  participations = participations.map((p) =>
    p.id === id ? { ...p, progress: 100, mood: 'celebrating' as const } : p,
  );
  return delay({ txHash: fakeTxHash(), result: participations.find((p) => p.id === id)! }, 300);
}

/* -------------------------------- notifs ---------------------------------- */

export function fetchNotifications(): Promise<AppNotification[]> {
  return delay(NOTIFICATIONS);
}

/* -------------------------------- amigos ---------------------------------- */

export function fetchFriends() {
  return delay(
    friendIds.map((id) => {
      const p = person(id);
      const shared = Object.keys(poolFriends).filter((pid) => poolFriends[pid]?.includes(id)).length;
      return { ...p, sharedPools: shared };
    }),
  );
}

export function fetchFriendRequests() {
  return delay(requestsIn.map(person));
}

export function fetchSuggestions() {
  return delay(
    PEOPLE.filter((p) => !friendIds.includes(p.id) && !requestsIn.includes(p.id)).map((p) => ({
      ...p,
      requested: pendingOut.includes(p.id),
    })),
  );
}

export function acceptRequest(id: string) {
  requestsIn = requestsIn.filter((x) => x !== id);
  friendIds = [...friendIds, id];
  return delay({ id }, 180);
}

export function rejectRequest(id: string) {
  requestsIn = requestsIn.filter((x) => x !== id);
  return delay({ id }, 180);
}

export function removeFriend(id: string) {
  friendIds = friendIds.filter((x) => x !== id);
  return delay({ id }, 180);
}

export function sendFriendRequest(id: string) {
  if (!pendingOut.includes(id)) pendingOut = [...pendingOut, id];
  return delay({ id }, 180);
}

/* -------------------------------- perfil ---------------------------------- */

export function fetchProfileStats(): Promise<ProfileStats> {
  return delay(PROFILE_STATS);
}
