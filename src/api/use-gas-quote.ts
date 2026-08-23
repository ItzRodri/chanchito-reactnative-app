import { useQuery } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';

import { erc20Abi, poolVaultAbi } from './abi';
import { TREASURY_ADDRESS, USDT_ADDRESS } from '@/lib/chain';
import { sendFee } from '@/lib/fees';
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

/**
 * Lo mismo para un envío.
 *
 * Cotiza el lote exacto que se va a firmar —incluida la transferencia de la
 * comisión—, porque agregar esa segunda llamada cambia el costo: cotizar sólo
 * el envío mostraría un número más bajo del que después se cobra.
 */
export function useSendGasQuote(to: `0x${string}` | undefined, amount: Usdt) {
  return useQuery({
    queryKey: ['gas-quote', 'send', to, amount.toString()],
    queryFn: async () => {
      const calls: WdkTx[] = [
        {
          to: USDT_ADDRESS,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [to as `0x${string}`, amount],
          }),
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
      return quoteGasless(calls);
    },
    enabled: Boolean(to) && amount > 0n,
    staleTime: 20_000,
    retry: 1,
  });
}
