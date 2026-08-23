import WalletManagerEvm7702Gasless from '@tetherto/wdk-wallet-evm-7702-gasless';

import { CHAIN, RPC_URL, USDT_ADDRESS } from '@/lib/chain';
import { revealMnemonic } from './wallet';

/**
 * La capa de firma de Chanchito, sobre WDK de Tether.
 *
 * @dev Reemplaza a la firma directa con viem. No convive con ella: todas las
 *      escrituras de la app —depositar, salir, cerrar, crear, registrar el
 *      nombre, agregar amigos— pasan por acá.
 *
 * Por qué WDK y no firmar a mano:
 *
 *  1. GASLESS. Sin esto, cada wallet nueva arranca sin ETH y no puede hacer
 *     absolutamente nada hasta que alguien le mande gas. Con el paymaster, el
 *     usuario paga la comisión en el mismo USD₮ que está ahorrando y nunca se
 *     entera de que existe el gas.
 *
 *  2. UNA SOLA FIRMA EN VEZ DE DOS. Depositar en un chanchito son dos pasos:
 *     autorizar el gasto del token y después depositar. EIP-7702 los agrupa en
 *     una única operación, así que el usuario firma una vez.
 *
 *  3. LA MISMA DIRECCIÓN. 7702 delega la ejecución de una cuenta que ya existe
 *     en vez de crear una nueva. La dirección derivada de la frase semilla es
 *     idéntica a la que tenía la app antes de esta integración.
 */

/** Contrato de delegación EIP-7702, provisto por el paymaster. */
const DELEGATION_ADDRESS =
  process.env.EXPO_PUBLIC_DELEGATION_ADDRESS ?? '0xe6Cae83BdE06E4c305530e199D7217f42808555B';

/**
 * Bundler y paymaster. Candide los sirve en la misma URL.
 * El endpoint público no necesita key pero tiene límite de uso.
 */
const BUNDLER_URL =
  process.env.EXPO_PUBLIC_BUNDLER_URL ?? `https://api.candide.dev/public/v3/${CHAIN.id}`;

/**
 * Techo de comisión por operación, en unidades de USD₮.
 *
 * Es una red de seguridad, no una estimación: si el gas se dispara, la
 * operación se rechaza en vez de vaciarle la billetera al usuario. En Sepolia
 * una operación batcheada ronda los 2-3 USD₮, así que 10 deja margen sin
 * dejar de proteger.
 */
const MAX_FEE = 10_000_000n;

export type WdkTx = {
  to: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
};

let manager: unknown = null;

/**
 * El gestor de WDK, creado a partir de la frase semilla que la app ya guardaba
 * en el almacenamiento seguro del sistema. No se genera una wallet nueva.
 */
async function getManager() {
  if (manager) return manager as InstanceType<typeof WalletManagerEvm7702Gasless>;

  const seed = await revealMnemonic();
  if (!seed) throw new Error('No hay wallet en este dispositivo');

  manager = new WalletManagerEvm7702Gasless(seed, {
    provider: RPC_URL,
    delegationAddress: DELEGATION_ADDRESS,
    bundlerUrl: BUNDLER_URL,
    // El gas se paga en el mismo token que el usuario está ahorrando.
    paymasterToken: { address: USDT_ADDRESS },
    transferMaxFee: MAX_FEE,
    transactionMaxFee: MAX_FEE,
  });

  return manager as InstanceType<typeof WalletManagerEvm7702Gasless>;
}

/** La cuenta firmante para un índice de derivación. */
export async function getWdkAccount(index = 0) {
  const wallet = await getManager();
  return wallet.getAccount(index);
}

/**
 * Manda una o varias llamadas como UNA sola operación sin gas.
 *
 * Pasar un arreglo es lo que permite que `approve` + `join` viajen juntos:
 * el usuario firma una vez y ve una sola operación.
 */
export async function sendGasless(
  txs: WdkTx | WdkTx[],
  accountIndex = 0,
): Promise<`0x${string}`> {
  const account = await getWdkAccount(accountIndex);
  const result = await account.sendTransaction(txs as never);
  return result.hash as `0x${string}`;
}

/**
 * Cuánto va a costar la operación, en USD₮.
 * Se muestra antes de firmar: el track pide que el usuario vea la comisión.
 */
export async function quoteGasless(
  txs: WdkTx | WdkTx[],
  accountIndex = 0,
): Promise<bigint> {
  const account = await getWdkAccount(accountIndex);
  const quote = await account.quoteSendTransaction(txs as never);
  return BigInt((quote as { fee?: bigint }).fee ?? 0n);
}

/** Se llama al cambiar de wallet, para no reusar una semilla vieja. */
export function resetWdk() {
  manager = null;
}
