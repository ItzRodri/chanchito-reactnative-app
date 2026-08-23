// El generador de aleatoriedad de la plataforma tiene que estar antes que viem.
import 'react-native-get-random-values';

import * as SecureStore from 'expo-secure-store';
import { createWalletClient, formatUnits, http, erc20Abi } from 'viem';
import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { HDAccount } from 'viem/accounts';

import { CHAIN, RPC_URL, publicClient, USDT_ADDRESS } from '@/lib/chain';
import { USDT_DECIMALS, type Usdt } from '@/lib/money';

/**
 * Wallet embebida.
 *
 * La app genera y guarda su propia frase semilla en el almacenamiento seguro
 * del sistema (Keychain en iOS, Keystore en Android). No hay que instalar
 * MetaMask ni emparejar por WalletConnect.
 *
 * Se eligió así por dos motivos concretos:
 *
 *  1. Es el flujo que describe el producto: alguien que no sabe qué es una
 *     wallet abre la app y deposita. Pedirle que instale otra aplicación y
 *     escanee un QR es exactamente la fricción que Chanchito quiere evitar.
 *
 *  2. Para la demo, emparejar por WalletConnect depende del wifi del lugar y
 *     falla seguido. Esto no depende de nada externo.
 *
 * De una sola semilla se derivan varias cuentas (la ruta estándar BIP-44), que
 * es lo que alimenta el selector de cuentas: una wallet, varias cuentas.
 */

const MNEMONIC_KEY = 'chanchito.mnemonic.v1';
/**
 * Direcciones ya derivadas.
 *
 * Derivar una cuenta desde la frase semilla es criptografía cara (BIP-39 hace
 * 2048 rondas de PBKDF2) y Hermes no la acelera: en el teléfono tardaba unos
 * 20 segundos abrir la wallet. Como la derivación es determinista, las
 * direcciones se calculan una sola vez y después se leen de acá.
 *
 * La semilla sigue siendo la única fuente de verdad: esto es sólo caché.
 */
const ACCOUNTS_KEY = 'chanchito.accounts.v1';

/** Cuántas cuentas se derivan de la semilla. */
export const ACCOUNT_COUNT = 3;

export type WalletAccount = {
  address: `0x${string}`;
  /** Índice de derivación, 0 es la principal. */
  index: number;
};

export type ConnectedWallet = {
  accounts: WalletAccount[];
  activeAddress: `0x${string}`;
};

let cachedMnemonic: string | null = null;
/** Cuentas firmantes ya derivadas en esta sesión, por índice. */
const signerCache = new Map<number, HDAccount>();

/* ------------------------------- almacenamiento --------------------------- */

async function loadMnemonic(): Promise<string | null> {
  if (cachedMnemonic) return cachedMnemonic;
  const stored = await SecureStore.getItemAsync(MNEMONIC_KEY);
  cachedMnemonic = stored;
  return stored;
}

async function saveMnemonic(mnemonic: string) {
  await SecureStore.setItemAsync(MNEMONIC_KEY, mnemonic, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  cachedMnemonic = mnemonic;
}

/** ¿Ya existe una wallet en este dispositivo? */
export async function hasWallet(): Promise<boolean> {
  return (await loadMnemonic()) !== null;
}

/** Marca de que el usuario dijo haber anotado su frase. */
const BACKED_UP_KEY = 'chanchito.backedup.v1';

export async function isBackedUp(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BACKED_UP_KEY)) === 'yes';
}

export async function markBackedUp() {
  await SecureStore.setItemAsync(BACKED_UP_KEY, 'yes');
}

/* ---------------------------------- cuentas -------------------------------- */

function deriveAccounts(mnemonic: string): WalletAccount[] {
  return Array.from({ length: ACCOUNT_COUNT }, (_, index) => {
    const account = mnemonicToAccount(mnemonic, { addressIndex: index });
    signerCache.set(index, account);
    return { address: account.address, index };
  });
}

async function loadCachedAccounts(): Promise<WalletAccount[] | null> {
  const raw = await SecureStore.getItemAsync(ACCOUNTS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WalletAccount[];
    return Array.isArray(parsed) && parsed.length === ACCOUNT_COUNT ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Devuelve la wallet, creándola la primera vez.
 * Es la única función que la pantalla de conexión necesita llamar.
 */
export async function connectWallet(): Promise<ConnectedWallet> {
  let mnemonic = await loadMnemonic();
  if (!mnemonic) {
    mnemonic = generateMnemonic(english);
    await saveMnemonic(mnemonic);
  }

  // Camino rápido: si ya se derivaron antes, no se vuelve a pagar el costo.
  const cached = await loadCachedAccounts();
  if (cached) return { accounts: cached, activeAddress: cached[0].address };

  const accounts = deriveAccounts(mnemonic);
  await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(accounts));
  return { accounts, activeAddress: accounts[0].address };
}

/** La cuenta firmante para un índice dado. Nunca sale de este módulo. */
async function accountAt(index: number): Promise<HDAccount> {
  const memo = signerCache.get(index);
  if (memo) return memo;

  const mnemonic = await loadMnemonic();
  if (!mnemonic) throw new Error('No hay wallet en este dispositivo');

  const account = mnemonicToAccount(mnemonic, { addressIndex: index });
  signerCache.set(index, account);
  return account;
}

/** El índice de derivación de una dirección conocida. */
export async function indexOfAddress(address: `0x${string}`): Promise<number> {
  const accounts = (await loadCachedAccounts()) ?? [];
  const found = accounts.find((a) => a.address.toLowerCase() === address.toLowerCase());
  if (!found) throw new Error('Esa cuenta no pertenece a esta wallet');
  return found.index;
}

/** Cliente de escritura de viem para una cuenta de la wallet. */
export async function getWalletClient(address: `0x${string}`) {
  const index = await indexOfAddress(address);
  const account = await accountAt(index);
  return createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });
}

/**
 * Borra la wallet del dispositivo.
 * @dev Sin la semilla anotada, los fondos se pierden. Sólo para testnet.
 */
export async function forgetWallet() {
  await SecureStore.deleteItemAsync(MNEMONIC_KEY);
  await SecureStore.deleteItemAsync(ACCOUNTS_KEY);
  cachedMnemonic = null;
  signerCache.clear();
}

/**
 * La frase semilla, para que el usuario pueda anotarla.
 * @dev Nunca mandarla a ningún lado ni loguearla.
 */
export async function revealMnemonic(): Promise<string | null> {
  return loadMnemonic();
}

/**
 * Restaura una wallet a partir de su frase de 12 palabras.
 *
 * Sirve para volver a entrar a TU wallet de Chanchito desde otro teléfono.
 *
 * @dev No es el camino para usar una wallet de otra app: para eso está
 *      "Conectar wallet" (WalletConnect), donde la clave nunca sale de la
 *      wallet original. Pedirle a alguien que pegue acá la frase de su
 *      MetaMask es el mismo gesto que usan las apps de phishing, y la UI lo
 *      dice explícitamente.
 */
export async function restoreWallet(phrase: string): Promise<ConnectedWallet> {
  const normalized = phrase.trim().toLowerCase().replace(/\s+/g, ' ');

  if (!validateMnemonic(normalized, wordlist)) {
    throw new Error('Esa frase no es válida. Revisá que sean las 12 palabras, en orden.');
  }

  await saveMnemonic(normalized);
  signerCache.clear();
  await SecureStore.deleteItemAsync(ACCOUNTS_KEY);

  const accounts = deriveAccounts(normalized);
  await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(accounts));
  // Quien restaura ya tiene la frase anotada: no hace falta pedírsela otra vez.
  await markBackedUp();

  return { accounts, activeAddress: accounts[0].address };
}

/** Valida sin guardar nada, para dar feedback mientras se escribe. */
export function isValidMnemonic(phrase: string): boolean {
  return validateMnemonic(phrase.trim().toLowerCase().replace(/\s+/g, ' '), wordlist);
}

/* --------------------------------- lecturas -------------------------------- */

/** Saldo de USDT de una cuenta, en unidades base. */
export async function getUsdtBalance(address: `0x${string}`): Promise<Usdt> {
  return publicClient.readContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });
}

/** Saldo de ETH, sólo informativo: con gasless el usuario no debería necesitarlo. */
export async function getEthBalance(address: `0x${string}`): Promise<string> {
  const wei = await publicClient.getBalance({ address });
  return formatUnits(wei, 18);
}

export { accountAt, USDT_DECIMALS };
