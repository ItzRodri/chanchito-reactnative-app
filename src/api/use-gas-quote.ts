import { useQuery } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';

import { erc20Abi, poolVaultAbi } from './abi';
import { USDT_ADDRESS } from '@/lib/chain';
import { quoteGasless, type WdkTx } from './wdk';
import type { Usdt } from '@/lib/money';

/**
 * Cuánto va a costar la operación, cobrado en USD₮.
 *
 * Se consulta antes de firmar para poder mostrárselo al usuario: alguien que
 * está por poner su plata tiene que ver qué le van a cobrar, aunque nunca haya
 * oído hablar del gas.
 */
export function useDepositGasQuote(poolId: string | undefined, amount: Usdt) {
  return useQuery({
    queryKey: ['gas-quote', 'deposit', poolId, amount.toString()],
    queryFn: async () => {
      const pool = poolId as `0x${string}`;
      const calls: WdkTx[] = [
        {
          to: USDT_ADDRESS,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [pool, amount],
          }),
        },
        {
          to: pool,
          data: encodeFunctionData({
            abi: poolVaultAbi,
            functionName: 'join',
            args: [amount],
          }),
        },
      ];
      return quoteGasless(calls);
    },
    enabled: Boolean(poolId) && amount > 0n,
    // La cotización cambia con el precio del gas: no conviene cachearla mucho.
    staleTime: 20_000,
    retry: 1,
  });
}
