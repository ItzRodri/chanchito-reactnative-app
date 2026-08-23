import { create } from 'zustand';

/**
 * Seguimiento de operaciones que escriben en la cadena.
 *
 * Con el mock, apretar un botón era instantáneo. Con contratos reales pasa
 * esto: el usuario firma (~2 s), la operación se manda y recién 15-30 segundos
 * después se confirma. En el medio el usuario navega, cambia de tab, o cierra
 * la pantalla.
 *
 * Por eso el estado de la transacción no puede vivir en la pantalla que la
 * disparó: vive acá, y `<TxBanner />` lo muestra desde cualquier lado.
 */

export type TxKind = 'deposit' | 'exit' | 'create' | 'close' | 'send';

export type TxStatus =
  /** Esperando la firma del usuario en la wallet. */
  | 'signing'
  /** Ya se mandó; esperando que la red la incluya. */
  | 'pending'
  | 'confirmed'
  | 'failed';

export type Tx = {
  id: string;
  kind: TxKind;
  /** Texto para el usuario: "Depositando $120 en Viaje a Salta". */
  label: string;
  status: TxStatus;
  hash?: string;
  error?: string;
  startedAt: number;
};

type TxState = {
  txs: Tx[];
  start: (kind: TxKind, label: string) => string;
  submitted: (id: string, hash: string) => void;
  confirm: (id: string) => void;
  fail: (id: string, error: string) => void;
  dismiss: (id: string) => void;
  clearSettled: () => void;
};

let counter = 0;

export const useTxStore = create<TxState>((set) => ({
  txs: [],

  start: (kind, label) => {
    const id = `tx-${++counter}`;
    set((s) => ({
      txs: [...s.txs, { id, kind, label, status: 'signing', startedAt: Date.now() }],
    }));
    return id;
  },

  submitted: (id, hash) =>
    set((s) => ({
      txs: s.txs.map((t) => (t.id === id ? { ...t, status: 'pending', hash } : t)),
    })),

  confirm: (id) =>
    set((s) => ({
      txs: s.txs.map((t) => (t.id === id ? { ...t, status: 'confirmed' } : t)),
    })),

  fail: (id, error) =>
    set((s) => ({
      txs: s.txs.map((t) => (t.id === id ? { ...t, status: 'failed', error } : t)),
    })),

  dismiss: (id) => set((s) => ({ txs: s.txs.filter((t) => t.id !== id) })),

  clearSettled: () =>
    set((s) => ({ txs: s.txs.filter((t) => t.status === 'signing' || t.status === 'pending') })),
}));

/** La operación en curso más reciente, o la última que terminó. */
export function useCurrentTx(): Tx | null {
  return useTxStore((s) => {
    const active = s.txs.filter((t) => t.status === 'signing' || t.status === 'pending');
    if (active.length > 0) return active[active.length - 1];
    return s.txs.length > 0 ? s.txs[s.txs.length - 1] : null;
  });
}

export function useHasPendingTx(): boolean {
  return useTxStore((s) =>
    s.txs.some((t) => t.status === 'signing' || t.status === 'pending'),
  );
}
