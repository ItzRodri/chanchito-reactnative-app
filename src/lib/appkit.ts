// Tiene que ser la PRIMERA línea del archivo: instala los polyfills que
// WalletConnect necesita antes de que se cargue cualquier otra cosa.
import '@walletconnect/react-native-compat';

import { createAppKit } from '@reown/appkit-react-native';
import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CHAIN } from './chain';

/**
 * Conexión con wallets externas (MetaMask, Rainbow, Trust y ~600 más).
 *
 * Convive con la wallet embebida: quien no tiene nada se crea una en el
 * teléfono, y quien ya usa cripto conecta la suya. Las dos terminan en el mismo
 * lugar — ver `getWalletClient` en `src/api/wallet.ts`.
 */

const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

export const hasWalletConnect = projectId.length > 0;

/** AppKit define su propia interfaz de almacenamiento; la mapeamos a AsyncStorage. */
const storage = {
  async getKeys() {
    return [...(await AsyncStorage.getAllKeys())];
  },
  async getEntries<T = unknown>() {
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);
    return entries.map(([key, value]) => [key, value ? JSON.parse(value) : undefined]) as [
      string,
      T,
    ][];
  },
  async getItem<T = unknown>(key: string) {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : undefined;
  },
  async setItem<T = unknown>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

export const appKit = hasWalletConnect
  ? createAppKit({
      projectId,
      networks: [CHAIN],
      defaultNetwork: CHAIN,
      adapters: [new EthersAdapter()],
      storage,
      metadata: {
        name: 'Chanchito',
        description: 'Ahorro grupal con tus amigos',
        url: 'https://chanchito.app',
        icons: ['https://chanchito.app/icon.png'],
        redirect: {
          // Tiene que coincidir con `scheme` en app.json, o la wallet no sabe
          // cómo devolver al usuario a Chanchito después de firmar.
          native: 'chanchito://',
        },
      },
    })
  : null;
