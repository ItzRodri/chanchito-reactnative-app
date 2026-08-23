import { erc20Abi, poolFactoryAbi, poolVaultAbi } from './abi';
import {
  POOL_FACTORY_ADDRESS,
  TREASURY_ADDRESS,
  USDT_ADDRESS,
  hasContracts,
  publicClient,
} from '@/lib/chain';
import { sendFee } from '@/lib/fees';
import type { Mood } from '@/components/chanchito-mascot';
import type { Participation, Person, Pool } from '@/data/types';
import type { Usdt } from '@/lib/money';
import type { PoolWithFriends } from './backend';

/**
 * Capa de contratos: traduce lo que hay en la cadena a los tipos que ya usan
 * las pantallas.
 *
 * Deliberadamente devuelve las mismas formas que `backend.ts`, para que los
 * hooks y las pantallas no distingan de dónde vienen los datos.
 */

/** Estado del vault, tal como lo define el enum del contrato. */
const STATUS = ['waiting', 'active', 'closed'] as const;

/** Los moods no viven en la cadena: se derivan del avance, para dar variedad. */
function moodFor(progress: number, status: string): Mood {
  if (status === 'closed') return 'celebrating';
  if (progress >= 85) return 'excited';
  if (progress >= 40) return 'happy';
  return 'normal';
}

/**
 * La categoría tampoco está en la cadena — guardarla costaría gas y no cambia
 * ninguna regla. Se infiere del nombre, y si no hay coincidencia queda "Otros".
 */
const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/viaje|salta|bariloche|mundial|vacacion/i, 'Viajes'],
  [/notebook|compu|celu|tecno|iphone/i, 'Tecnología'],
  [/depto|alquiler|casa|hogar|mudanza/i, 'Hogar'],
  [/facu|cuota|curso|estudio|carrera/i, 'Educación'],
  [/bici|moto|auto|transporte/i, 'Movilidad'],
  [/emergencia|fondo|colchon/i, 'Emergencia'],
];

function categoryFor(name: string): string {
  for (const [pattern, tag] of CATEGORY_HINTS) if (pattern.test(name)) return tag;
  return 'Otros';
}

/* ---------------------------------- lectura ------------------------------- */

function requireFactory(): `0x${string}` {
  if (!POOL_FACTORY_ADDRESS) {
    throw new Error('Falta EXPO_PUBLIC_POOL_FACTORY_ADDRESS en el .env');
  }
  return POOL_FACTORY_ADDRESS;
}

type Summary = {
  name: string;
  asset: `0x${string}`;
  status: number;
  totalAssets: bigint;
  totalShares: bigint;
  minDeposit: bigint;
  maxDeposit: bigint;
  goal: bigint;
  capacity: number;
  filled: number;
  joinDeadline: bigint;
  maturity: bigint;
  activatedAt: bigint;
  duration: bigint;
  aprBps: bigint;
  isPrivate: boolean;
};

function summaryToPool(address: `0x${string}`, s: Summary): Pool {
  const progress = s.goal > 0n ? Number((s.totalAssets * 100n) / s.goal) : 0;
  const status = STATUS[s.status] ?? 'waiting';

  return {
    id: address,
    name: s.name,
    mood: moodFor(progress, status),
    tag: categoryFor(s.name),
    visibility: s.isPrivate ? 'private' : 'public',
    min: s.minDeposit,
    max: s.maxDeposit,
    goal: s.goal,
    raised: s.totalAssets,
    capacity: s.capacity,
    filled: s.filled,
    status,
    // La duración es fija; el vencimiento sólo existe cuando el chanchito arrancó.
    durationMonths: Math.max(1, Math.round(Number(s.duration) / (30 * 86_400))),
    joinDeadline: Number(s.joinDeadline) * 1000,
    activatedAt: s.activatedAt > 0n ? Number(s.activatedAt) * 1000 : null,
    maturity: s.maturity > 0n ? Number(s.maturity) * 1000 : null,
    aprBps: Number(s.aprBps),
  };
}

/** Lee el `summary()` de varios vaults de una sola vez. */
async function readSummaries(addresses: readonly `0x${string}`[]): Promise<Pool[]> {
  if (addresses.length === 0) return [];

  const results = await publicClient.multicall({
    contracts: addresses.map((address) => ({
      address,
      abi: poolVaultAbi,
      functionName: 'summary',
    })),
    allowFailure: true,
  });

  const pools: Pool[] = [];
  results.forEach((result, i) => {
    if (result.status !== 'success') return;
    pools.push(summaryToPool(addresses[i], result.result as unknown as Summary));
  });
  return pools;
}

/** Los últimos `limit` chanchitos públicos. */
export async function fetchPoolsOnChain(limit = 30): Promise<PoolWithFriends[]> {
  const addresses = (await publicClient.readContract({
    address: requireFactory(),
    abi: poolFactoryAbi,
    functionName: 'poolsPage',
    args: [0n, BigInt(limit)],
  })) as readonly `0x${string}`[];

  const pools = await readSummaries(addresses);
  // Los privados no se listan: sólo se llega con el código.
  return pools
    .filter((p) => p.visibility === 'public')
    .map((p) => ({ ...p, friends: [] as Person[] }));
}

export async function fetchPoolOnChain(address: string): Promise<PoolWithFriends | null> {
  try {
    const summary = (await publicClient.readContract({
      address: address as `0x${string}`,
      abi: poolVaultAbi,
      functionName: 'summary',
    })) as unknown as Summary;
    return { ...summaryToPool(address as `0x${string}`, summary), friends: [] };
  } catch {
    return null;
  }
}

/** Resuelve un código de invitación de 6 caracteres a su chanchito privado. */
export async function fetchPoolByCodeOnChain(code: string): Promise<PoolWithFriends | null> {
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== 6) return null;

  // `bytes6` es el código en ASCII, completado con ceros a derecha.
  const hex = Array.from(normalized)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');

  const address = (await publicClient.readContract({
    address: requireFactory(),
    abi: poolFactoryAbi,
    functionName: 'poolByCode',
    args: [`0x${hex}` as `0x${string}`],
  })) as `0x${string}`;

  if (/^0x0+$/.test(address)) return null;
  return fetchPoolOnChain(address);
}

/**
 * En qué chanchitos está una cuenta.
 *
 * @dev Se recorren los vaults preguntando `sharesOf`. Es aceptable con pocas
 *      decenas de chanchitos porque va en un solo multicall; con miles habría
 *      que indexar los eventos `Joined` en un servicio aparte.
 */
export async function fetchParticipationsOnChain(
  account: `0x${string}`,
): Promise<Participation[]> {
  const addresses = (await publicClient.readContract({
    address: requireFactory(),
    abi: poolFactoryAbi,
    functionName: 'poolsPage',
    args: [0n, 100n],
  })) as readonly `0x${string}`[];

  if (addresses.length === 0) return [];

  const shares = await publicClient.multicall({
    contracts: addresses.map((address) => ({
      address,
      abi: poolVaultAbi,
      functionName: 'sharesOf',
      args: [account],
    })),
    allowFailure: true,
  });

  const mine = addresses.filter(
    (_, i) => shares[i].status === 'success' && (shares[i].result as bigint) > 0n,
  );
  if (mine.length === 0) return [];

  const [pools, values, principals] = await Promise.all([
    readSummaries(mine),
    publicClient.multicall({
      contracts: mine.map((address) => ({
        address,
        abi: poolVaultAbi,
        functionName: 'valueOf',
        args: [account],
      })),
      allowFailure: true,
    }),
    publicClient.multicall({
      contracts: mine.map((address) => ({
        address,
        abi: poolVaultAbi,
        functionName: 'principalOf',
        args: [account],
      })),
      allowFailure: true,
    }),
  ]);

  return pools.map((pool, i) => {
    const deposited = (principals[i]?.result as bigint) ?? 0n;
    const value = (values[i]?.result as bigint) ?? deposited;
    return {
      id: pool.id,
      poolId: pool.id,
      name: pool.name,
      mood: pool.mood,
      deposited,
      // La ganancia es la diferencia entre lo que vale hoy y lo que puso.
      yieldEarned: value > deposited ? value - deposited : 0n,
      progress: pool.goal > 0n ? Number((pool.raised * 100n) / pool.goal) : 0,
      activeCount: pool.filled,
      totalCount: pool.capacity,
      durationMonths: pool.durationMonths,
      account,
      status: pool.status,
    };
  });
}

/* --------------------------------- saldos ---------------------------------- */

export async function fetchUsdtBalance(account: `0x${string}`): Promise<Usdt> {
  return publicClient.readContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account],
  });
}

/** Cuánto USDT tiene autorizado el chanchito a mover de esta cuenta. */
export async function fetchAllowance(
  account: `0x${string}`,
  spender: `0x${string}`,
): Promise<Usdt> {
  return publicClient.readContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account, spender],
  });
}

export { hasContracts };

/* --------------------------------- escritura ------------------------------ */

import { encodeFunctionData } from 'viem';

import { DEPLOY_MAX_FEE, sendGasless, type WdkTx, waitForGasless } from './wdk';
import type { PoolDraft } from '@/store/draft';
import { usdtFromWhole } from '@/lib/money';

/** Lo que devuelve toda escritura: el hash con el que se sigue la operación. */
export type ChainWrite<T> = { txHash: `0x${string}`; result: T };

const DAY = 86_400n;

/**
 * Depositar en un chanchito: UNA sola operación, sin gas.
 *
 * Con ERC-20 hacen falta dos pasos —autorizar el gasto del token y después
 * depositar— y antes eran dos transacciones separadas, con su espera en el
 * medio y dos firmas del usuario.
 *
 * EIP-7702 permite agruparlas: se firma una vez, se ve una sola operación, y
 * el paymaster cubre el gas cobrando la comisión en el mismo USD₮ que la
 * persona está ahorrando. Nunca necesita tener ETH.
 */
export async function depositToPool({
  poolId,
  amount,
  account,
}: {
  poolId: string;
  amount: Usdt;
  account: `0x${string}`;
}): Promise<ChainWrite<{ poolId: string; amount: Usdt }>> {
  const pool = poolId as `0x${string}`;
  const calls: WdkTx[] = [];

  // Sólo se autoriza si hace falta: el segundo depósito en el mismo chanchito
  // ya tiene permiso y ahorra una llamada.
  const allowance = await fetchAllowance(account, pool);
  if (allowance < amount) {
    calls.push({
      to: USDT_ADDRESS,
      data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [pool, amount] }),
    });
  }

  calls.push({
    to: pool,
    data: encodeFunctionData({ abi: poolVaultAbi, functionName: 'join', args: [amount] }),
  });

  const txHash = await sendGasless(calls);
  return { txHash, result: { poolId, amount } };
}

export async function createPoolOnChain(
  draft: PoolDraft,
  account: `0x${string}`,
  code: string,
): Promise<ChainWrite<{ id: string }>> {
  // El plazo se cuenta desde la hora de la cadena, no la del teléfono: si el
  // reloj local está atrasado, el contrato rechaza el chanchito.
  const now = (await publicClient.getBlock()).timestamp;
  const joinDeadline = now + 14n * DAY;

  const codeHex = draft.vis === 'private' ? asciiToBytes6(code) : '0x000000000000';

  // Crear despliega un contrato: necesita un techo de comisión mayor que el de
  // una transferencia, o WDK lo rechaza con "Exceeded maximum fee cost".
  const txHash = await sendGasless(
    {
    to: requireFactory(),
    data: encodeFunctionData({
      abi: poolFactoryAbi,
      functionName: 'createPool',
      args: [
        {
          name: draft.name.trim(),
          minDeposit: usdtFromWhole(draft.minWhole),
          maxDeposit: usdtFromWhole(draft.maxWhole),
          capacity: draft.capacity,
          joinDeadline,
          // El plazo se cuenta desde que se llena, no desde ahora.
          duration: BigInt(draft.durationMonths) * 30n * DAY,
          isPrivate: draft.vis === 'private',
          code: codeHex as `0x${string}`,
        },
      ],
    }),
    },
    0,
    DEPLOY_MAX_FEE,
  );

  // La dirección del chanchito nuevo se conoce recién cuando se confirma;
  // se resuelve leyendo la fábrica después del recibo.
  //
  // @dev Acá NO sirve `waitForTransactionReceipt` de viem: lo que se envió es
  //      una UserOperation y su hash no es el de una transacción común, así
  //      que viem lo buscaría para siempre. Es el mismo motivo por el que el
  //      resto de las escrituras usa `waitForGasless`.
  await waitForGasless(txHash);
  const [newest] = (await publicClient.readContract({
    address: requireFactory(),
    abi: poolFactoryAbi,
    functionName: 'poolsPage',
    args: [0n, 1n],
  })) as readonly `0x${string}`[];

  return { txHash, result: { id: newest } };
}

export async function exitPoolEarly(
  poolId: string,
  account: `0x${string}`,
): Promise<ChainWrite<{ id: string }>> {
  const txHash = await sendGasless({
    to: poolId as `0x${string}`,
    data: encodeFunctionData({ abi: poolVaultAbi, functionName: 'exitEarly' }),
  });
  return { txHash, result: { id: poolId } };
}

/** Atajo de demo: cierra el chanchito antes del vencimiento. Sólo el creador. */
export async function closePoolOnChain(
  poolId: string,
  account: `0x${string}`,
): Promise<ChainWrite<{ id: string }>> {
  const txHash = await sendGasless({
    to: poolId as `0x${string}`,
    data: encodeFunctionData({ abi: poolVaultAbi, functionName: 'forceCloseForDemo' }),
  });
  return { txHash, result: { id: poolId } };
}

/** "ABC123" → 0x414243313233, que es lo que espera `bytes6`. */
function asciiToBytes6(code: string): string {
  const hex = Array.from(code.toUpperCase().slice(0, 6))
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex.padEnd(12, '0')}`;
}

/**
 * Manda USDT a otra dirección.
 *
 * Sin esto la plata entra a Chanchito y no sale nunca: el contrato devuelve
 * los fondos a la wallet de la app al cerrar un chanchito, pero de ahí no
 * había forma de moverlos a ningún lado.
 */
export async function sendUsdt({
  to,
  amount,
  account,
}: {
  to: `0x${string}`;
  amount: Usdt;
  account: `0x${string}`;
}): Promise<ChainWrite<{ to: string; amount: Usdt }>> {
  // El envío y la comisión viajan en la MISMA operación. Si fueran dos
  // operaciones separadas se pagaría el gas dos veces, y podría cobrarse la
  // comisión de un envío que después falla.
  const calls: WdkTx[] = [
    {
      to: USDT_ADDRESS,
      data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [to, amount] }),
    },
  ];

  const fee = TREASURY_ADDRESS ? sendFee(amount) : 0n;
  if (fee > 0n && TREASURY_ADDRESS) {
    calls.push({
      to: USDT_ADDRESS,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [TREASURY_ADDRESS, fee],
      }),
    });
  }

  const txHash = await sendGasless(calls);

  return { txHash, result: { to, amount } };
}
