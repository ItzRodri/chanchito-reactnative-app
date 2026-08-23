import { useQuery } from '@tanstack/react-query';

import { getUsdtBalance } from './wallet';
import { USING_CHAIN } from './source';
import { usdtFromWhole } from '@/lib/money';
import { useSessionStore } from '@/store/session';

/**
 * Saldo de USDT de la cuenta activa.
 *
 * Se refresca solo cada 20 segundos y después de cada operación, porque es lo
 * que decide si un depósito puede salir o no.
 */
export function useUsdtBalance() {
  const account = useSessionStore((s) => s.address);

  return useQuery({
    queryKey: ['usdt-balance', account],
    queryFn: async () => {
      if (!account) return 0n;
      // Sin contratos, se simula un saldo holgado para poder recorrer la app.
      if (!USING_CHAIN) return usdtFromWhole(1000);
      return getUsdtBalance(account);
    },
    enabled: Boolean(account),
    refetchInterval: 20_000,
    staleTime: 10_000,
  });
}
