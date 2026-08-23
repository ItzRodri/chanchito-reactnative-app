import { sepolia } from 'viem/chains';
import { createPublicClient, http, type Chain } from 'viem';

/**
 * Configuración de red.
 *
 * Todo sale de variables de entorno `EXPO_PUBLIC_*`, que quedan embebidas en
 * el bundle. Está bien para el RPC y las direcciones de contratos —son datos
 * públicos de todos modos— pero nunca poner acá una clave privada ni la key de
 * un paymaster.
 */

export const CHAIN: Chain = sepolia;

export const RPC_URL =
  process.env.EXPO_PUBLIC_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com';

/** USDT de prueba del mercado de Aave en Sepolia. */
export const USDT_ADDRESS = (process.env.EXPO_PUBLIC_USDT_ADDRESS ??
  '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0') as `0x${string}`;

export const POOL_FACTORY_ADDRESS = process.env.EXPO_PUBLIC_POOL_FACTORY_ADDRESS as
  | `0x${string}`
  | undefined;

/** Nombres de usuario y amistades. */
export const SOCIAL_REGISTRY_ADDRESS = process.env.EXPO_PUBLIC_SOCIAL_REGISTRY_ADDRESS as
  | `0x${string}`
  | undefined;

/**
 * Dónde caen las comisiones de servicio.
 *
 * Si no está configurada, la app no cobra: es preferible no cobrar nada a
 * mandarle la comisión a la dirección cero, que la quemaría sin aviso.
 */
export const TREASURY_ADDRESS = process.env.EXPO_PUBLIC_TREASURY_ADDRESS as
  | `0x${string}`
  | undefined;

export function chargesFees(): boolean {
  return Boolean(TREASURY_ADDRESS);
}

export function hasSocialRegistry(): boolean {
  return Boolean(SOCIAL_REGISTRY_ADDRESS);
}

/** Cliente de sólo lectura. Se comparte: abrir uno por llamada es un desperdicio. */
export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

/** ¿Están cargadas las direcciones de los contratos? */
export function hasContracts(): boolean {
  return Boolean(POOL_FACTORY_ADDRESS);
}

export function explorerTxUrl(hash: string) {
  return `${CHAIN.blockExplorers?.default.url}/tx/${hash}`;
}

export function explorerAddressUrl(address: string) {
  return `${CHAIN.blockExplorers?.default.url}/address/${address}`;
}
