import { hexToString, stringToHex } from 'viem';

import { socialRegistryAbi } from './abi';
import { SOCIAL_REGISTRY_ADDRESS, hasSocialRegistry, publicClient } from '@/lib/chain';
import { getSigningClient } from './signer';
import type { ChainWrite } from './contracts';

/**
 * Nombres de usuario y amistades, contra `SocialRegistry`.
 *
 * Los nombres viajan como `bytes32` en vez de `string`: cuesta menos gas, la
 * búsqueda inversa es directa y alcanza de sobra para 16 caracteres.
 */

export type Friend = {
  address: `0x${string}`;
  username: string;
};

function registry(): `0x${string}` {
  if (!SOCIAL_REGISTRY_ADDRESS) throw new Error('Falta la dirección del registro social');
  return SOCIAL_REGISTRY_ADDRESS;
}

/** "meli" → bytes32 rellenado con ceros. */
const toBytes32 = (name: string) => stringToHex(name.trim().toLowerCase(), { size: 32 });

/** bytes32 → "meli", sin los ceros del relleno. */
const fromBytes32 = (raw: string) => hexToString(raw as `0x${string}`).replace(/\0+$/, '');

/* --------------------------------- lectura -------------------------------- */

export async function fetchUsername(account: `0x${string}`): Promise<string | null> {
  if (!hasSocialRegistry()) return null;
  const raw = (await publicClient.readContract({
    address: registry(),
    abi: socialRegistryAbi,
    functionName: 'usernameOf',
    args: [account],
  })) as string;
  const name = fromBytes32(raw);
  return name.length > 0 ? name : null;
}

/** Busca a alguien por su nombre. Devuelve `null` si nadie lo tiene. */
export async function findByUsername(username: string): Promise<`0x${string}` | null> {
  if (!hasSocialRegistry() || username.trim().length < 3) return null;
  const address = (await publicClient.readContract({
    address: registry(),
    abi: socialRegistryAbi,
    functionName: 'addressOf',
    args: [toBytes32(username)],
  })) as `0x${string}`;
  return /^0x0+$/.test(address) ? null : address;
}

/** Resuelve los nombres de varias cuentas en una sola llamada. */
async function resolveNames(addresses: readonly `0x${string}`[]): Promise<Friend[]> {
  if (addresses.length === 0) return [];
  const raw = (await publicClient.readContract({
    address: registry(),
    abi: socialRegistryAbi,
    functionName: 'usernamesOf',
    args: [addresses],
  })) as readonly string[];

  return addresses.map((address, i) => ({
    address,
    username: fromBytes32(raw[i]) || shortFallback(address),
  }));
}

/** Sin nombre registrado, se muestra la dirección cortada. */
function shortFallback(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export async function fetchFriendsOnChain(account: `0x${string}`): Promise<Friend[]> {
  if (!hasSocialRegistry()) return [];
  const addresses = (await publicClient.readContract({
    address: registry(),
    abi: socialRegistryAbi,
    functionName: 'friendsOf',
    args: [account],
  })) as readonly `0x${string}`[];
  return resolveNames(addresses);
}

export async function fetchRequestsOnChain(account: `0x${string}`): Promise<Friend[]> {
  if (!hasSocialRegistry()) return [];
  const addresses = (await publicClient.readContract({
    address: registry(),
    abi: socialRegistryAbi,
    functionName: 'requestsFor',
    args: [account],
  })) as readonly `0x${string}`[];
  return resolveNames(addresses);
}

/**
 * Cuáles de esos participantes son amigos tuyos.
 *
 * Es la consulta que vuelve real el filtro "dónde están mis amigos": se cruza
 * en el contrato, sin traerse las dos listas al teléfono.
 */
export async function filterFriends(
  account: `0x${string}`,
  candidates: readonly `0x${string}`[],
): Promise<`0x${string}`[]> {
  if (!hasSocialRegistry() || candidates.length === 0) return [];
  const flags = (await publicClient.readContract({
    address: registry(),
    abi: socialRegistryAbi,
    functionName: 'filterFriends',
    args: [account, candidates],
  })) as readonly boolean[];
  return candidates.filter((_, i) => flags[i]);
}

/* -------------------------------- escritura ------------------------------- */

async function write(
  account: `0x${string}`,
  functionName: string,
  args: readonly unknown[],
): Promise<ChainWrite<null>> {
  const wallet = await getSigningClient(account);
  const txHash = await wallet.writeContract({
    address: registry(),
    abi: socialRegistryAbi,
    functionName: functionName as never,
    args: args as never,
    chain: null,
    account: wallet.account!,
  });
  return { txHash, result: null };
}

export const registerUsername = (account: `0x${string}`, username: string) =>
  write(account, 'register', [username.trim().toLowerCase()]);

export const sendFriendRequestOnChain = (account: `0x${string}`, to: `0x${string}`) =>
  write(account, 'sendRequest', [to]);

export const acceptFriendOnChain = (account: `0x${string}`, from: `0x${string}`) =>
  write(account, 'acceptRequest', [from]);

export const rejectFriendOnChain = (account: `0x${string}`, from: `0x${string}`) =>
  write(account, 'rejectRequest', [from]);

export const removeFriendOnChain = (account: `0x${string}`, who: `0x${string}`) =>
  write(account, 'removeFriend', [who]);

/** Reglas del contrato, replicadas para avisar antes de gastar gas. */
export function usernameProblem(username: string): string | null {
  const name = username.trim();
  if (name.length < 3) return 'Al menos 3 caracteres';
  if (name.length > 16) return 'Máximo 16 caracteres';
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return 'Sólo letras sin acento, números y guion bajo';
  return null;
}
