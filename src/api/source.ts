import type { Participation } from '@/data/types';
import { hasContracts } from '@/lib/chain';
import type { PoolDraft } from '@/store/draft';
import * as mock from './backend';
import type { PoolWithFriends } from './backend';
import * as chain from './contracts';

/**
 * Elige de dónde salen los datos.
 *
 * Con las direcciones de contrato cargadas en el `.env`, los chanchitos se leen
 * de la cadena. Sin ellas, la app sigue funcionando entera contra el mock — que
 * es lo que permite desarrollar sin red y tener un plan B si el día de la demo
 * la testnet se pone lenta.
 *
 * Lo social (amigos, solicitudes, notificaciones) es siempre mock: no vive en
 * ningún contrato, por diseño.
 */
export const USING_CHAIN = hasContracts();

/**
 * Con contratos, los amigos de un chanchito salen de cruzar sus participantes
 * reales contra tu lista real — eso lo hace `usePoolFriends`, porque necesita
 * saber quién sos. Acá se devuelve la lista vacía y la pantalla la completa.
 *
 * Sin contratos (modo mock) se usan los amigos de ejemplo.
 */
function decorateWithFriends(pool: PoolWithFriends): PoolWithFriends {
  return pool;
}

/* ---------------------------------- pools -------------------------------- */

export async function fetchPools(): Promise<PoolWithFriends[]> {
  const pools = USING_CHAIN ? await chain.fetchPoolsOnChain() : await mock.fetchPools();
  return pools.map(decorateWithFriends);
}

export async function fetchPool(id: string): Promise<PoolWithFriends | null> {
  const pool = USING_CHAIN ? await chain.fetchPoolOnChain(id) : await mock.fetchPool(id);
  return pool ? decorateWithFriends(pool) : null;
}

export async function fetchPoolByCode(code: string): Promise<PoolWithFriends | null> {
  const pool = USING_CHAIN
    ? await chain.fetchPoolByCodeOnChain(code)
    : await mock.fetchPoolByCode(code);
  return pool ? decorateWithFriends(pool) : null;
}

export async function fetchPoolsWithFriendsCount(): Promise<number> {
  if (!USING_CHAIN) return mock.fetchPoolsWithFriendsCount();
  const pools = await fetchPools();
  return pools.filter((p) => p.friends.length > 0).length;
}

/* ----------------------------- participaciones ---------------------------- */

export async function fetchParticipations(
  account: `0x${string}` | null,
): Promise<Participation[]> {
  if (!USING_CHAIN) return mock.fetchParticipations();
  if (!account) return [];
  return chain.fetchParticipationsOnChain(account);
}

export async function fetchParticipation(
  id: string,
  account: `0x${string}` | null,
): Promise<Participation | null> {
  if (!USING_CHAIN) return mock.fetchParticipation(id);
  const all = await fetchParticipations(account);
  return all.find((p) => p.id === id) ?? null;
}

/* --------------------------------- escritura ------------------------------ */

/** Toda escritura necesita saber desde qué cuenta se firma. */
type WithAccount<T> = T & { account: `0x${string}` | null };

function requireAccount(account: `0x${string}` | null): `0x${string}` {
  if (!account) throw new Error('Conectá tu wallet primero');
  return account;
}

export async function createPool(vars: WithAccount<{ draft: PoolDraft; code: string }>) {
  if (!USING_CHAIN) {
    const { txHash, result } = await mock.createPool(vars.draft);
    return { txHash, result: { id: result.id } };
  }
  return chain.createPoolOnChain(vars.draft, requireAccount(vars.account), vars.code);
}

export async function joinPool(vars: WithAccount<{ poolId: string; amount: bigint }>) {
  if (!USING_CHAIN) {
    const { txHash, result } = await mock.joinPool({
      poolId: vars.poolId,
      amount: vars.amount,
      account: vars.account ?? undefined,
    });
    return { txHash, result: { poolId: result.poolId, amount: result.deposited } };
  }
  return chain.depositToPool({
    poolId: vars.poolId,
    amount: vars.amount,
    account: requireAccount(vars.account),
  });
}

export async function sendUsdt(vars: WithAccount<{ to: `0x${string}`; amount: bigint }>) {
  if (!USING_CHAIN) throw new Error('Enviar requiere estar conectado a la red');
  return chain.sendUsdt({ to: vars.to, amount: vars.amount, account: requireAccount(vars.account) });
}

export async function exitParticipation(vars: WithAccount<{ id: string }>) {
  if (!USING_CHAIN) return mock.exitParticipation(vars.id);
  return chain.exitPoolEarly(vars.id, requireAccount(vars.account));
}

export async function completeParticipation(vars: WithAccount<{ id: string }>) {
  if (!USING_CHAIN) return mock.completeParticipation(vars.id);
  return chain.closePoolOnChain(vars.id, requireAccount(vars.account));
}

/* ---------------------------- social: siempre mock ------------------------ */

export const fetchFriends = mock.fetchFriends;
export const fetchFriendRequests = mock.fetchFriendRequests;
export const fetchSuggestions = mock.fetchSuggestions;
export const acceptRequest = mock.acceptRequest;
export const rejectRequest = mock.rejectRequest;
export const removeFriend = mock.removeFriend;
export const sendFriendRequest = mock.sendFriendRequest;
export const fetchNotifications = mock.fetchNotifications;
export const fetchProfileStats = mock.fetchProfileStats;
