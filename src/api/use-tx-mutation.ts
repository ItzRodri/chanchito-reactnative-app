import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { publicClient } from '@/lib/chain';
import { useTxStore, type TxKind } from '@/store/tx';
import { USING_CHAIN } from './source';

type WriteResult<T> = { txHash: string; result: T };

/** Espera simulada cuando se corre contra el mock, sin red de por medio. */
const MOCK_CONFIRMATION_MS = 4_000;

type Options<TVars, TResult> = {
  kind: TxKind;
  /** Texto para el banner, armado con las variables de la llamada. */
  label: (vars: TVars) => string;
  mutationFn: (vars: TVars) => Promise<WriteResult<TResult>>;
  /** Query keys a refrescar cuando la operación se confirma. */
  invalidate: QueryKey[];
  /** Refresco adicional, para casos que no encajan en una key sola. */
  onSettledExtra?: () => void;
};

/**
 * Mutación que sigue el ciclo de vida real de una transacción.
 *
 * La clave está en cuándo resuelve: **apenas la operación se manda**, no
 * cuando se confirma. Así la pantalla puede navegar enseguida (el usuario ya
 * firmó, no tiene sentido dejarlo mirando un spinner 20 segundos) y la
 * confirmación sigue de fondo, visible en el banner.
 *
 * Los datos se refrescan recién al confirmar, que es cuando la cadena
 * realmente cambió.
 */
export function useTxMutation<TVars, TResult>({
  kind,
  label,
  mutationFn,
  invalidate,
  onSettledExtra,
}: Options<TVars, TResult>) {
  const client = useQueryClient();
  const txStore = useTxStore;

  return useMutation({
    mutationFn: async (vars: TVars): Promise<TResult> => {
      const id = txStore.getState().start(kind, label(vars));

      let write: WriteResult<TResult>;
      try {
        write = await mutationFn(vars);
      } catch (error) {
        txStore
          .getState()
          .fail(id, error instanceof Error ? error.message : 'La operación falló');
        throw error;
      }

      txStore.getState().submitted(id, write.txHash);

      // Deliberadamente sin `await`: la confirmación no bloquea a la pantalla.
      confirmInBackground(id, write.txHash, () => {
        for (const key of invalidate) client.invalidateQueries({ queryKey: key });
        onSettledExtra?.();
      });

      return write.result;
    },
  });
}

/**
 * Sigue la transacción hasta que la red la incluye.
 *
 * Contra la cadena real espera el recibo y revisa su estado: una transacción
 * puede minarse igual y haber revertido, y en ese caso el usuario tiene que
 * enterarse en vez de ver un "listo" falso.
 */
function confirmInBackground(id: string, hash: string, onConfirmed: () => void) {
  const stillPending = () =>
    useTxStore.getState().txs.find((t) => t.id === id)?.status === 'pending';

  if (!USING_CHAIN) {
    setTimeout(() => {
      if (!stillPending()) return;
      useTxStore.getState().confirm(id);
      onConfirmed();
    }, MOCK_CONFIRMATION_MS);
    return;
  }

  publicClient
    .waitForTransactionReceipt({ hash: hash as `0x${string}`, timeout: 120_000 })
    .then((receipt) => {
      if (!stillPending()) return;
      if (receipt.status === 'success') {
        useTxStore.getState().confirm(id);
        onConfirmed();
      } else {
        useTxStore.getState().fail(id, 'La red rechazó la operación');
      }
    })
    .catch(() => {
      if (stillPending()) {
        useTxStore.getState().fail(id, 'No pudimos confirmar la operación');
      }
    });
}
