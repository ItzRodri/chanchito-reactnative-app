import { useProvider } from '@reown/appkit-react-native';
import { useEffect } from 'react';
import type { EIP1193Provider } from 'viem';

import { setExternalProvider } from '@/api/signer';

/**
 * Traslada el proveedor de AppKit (que sólo existe como hook) al módulo de
 * firma, que se usa fuera de React. No dibuja nada.
 */
export function WalletConnectBridge() {
  const { provider } = useProvider();

  useEffect(() => {
    setExternalProvider((provider as EIP1193Provider | undefined) ?? null);
    return () => setExternalProvider(null);
  }, [provider]);

  return null;
}
