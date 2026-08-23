import { createWalletClient, custom, type EIP1193Provider, type WalletClient } from 'viem';

import { CHAIN } from '@/lib/chain';
import { useSessionStore } from '@/store/session';
import { getWalletClient as getEmbeddedClient } from './wallet';

/**
 * Un solo camino de firma para las dos clases de wallet.
 *
 * Chanchito acepta dos: la que genera la app en el teléfono, y una externa
 * conectada por WalletConnect. Podrían haber sido dos implementaciones
 * separadas, pero eso significaba duplicar cada escritura.
 *
 * En vez de eso, las dos terminan en un `WalletClient` de viem. La embebida
 * firma con la cuenta derivada; la externa firma delegando en el proveedor
 * EIP-1193 que expone AppKit. Para `contracts.ts` son indistinguibles.
 */

/**
 * El proveedor de la wallet externa.
 *
 * AppKit sólo lo expone por hook, pero las escrituras no viven en componentes.
 * `<WalletConnectBridge />` lo deposita acá cuando cambia.
 */
let externalProvider: EIP1193Provider | null = null;

export function setExternalProvider(provider: EIP1193Provider | null) {
  externalProvider = provider;
}

export function hasExternalProvider() {
  return externalProvider !== null;
}

/** Cliente listo para firmar, sea cual sea el origen de la wallet. */
export async function getSigningClient(address: `0x${string}`): Promise<WalletClient> {
  const kind = useSessionStore.getState().walletKind;

  if (kind === 'external') {
    if (!externalProvider) {
      throw new Error('Tu wallet se desconectó. Volvé a conectarla desde el perfil.');
    }
    return createWalletClient({
      account: address,
      chain: CHAIN,
      transport: custom(externalProvider),
    });
  }

  return getEmbeddedClient(address);
}
