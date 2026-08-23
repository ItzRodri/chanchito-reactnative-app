import { create } from 'zustand';

import type { Mood } from '@/components/chanchito-mascot';
import type { WalletAccount } from '@/api/wallet';
import { durationLabel } from '@/lib/pool';

type SessionState = {
  /** Onboarding visto (las 3 slides o "Saltar"). */
  onboarded: boolean;
  /** Wallet conectada: gatea el acceso a las tabs. */
  connected: boolean;
  /**
   * De dónde sale la firma: una wallet creada por la app, o una externa
   * conectada por WalletConnect. Cambia quién firma, no qué se firma.
   */
  walletKind: 'embedded' | 'external' | null;
  /**
   * Todas las cuentas derivadas de la misma semilla.
   * Es la "Opción A" del mapeo: una wallet, varias cuentas.
   */
  accounts: WalletAccount[];
  /** La cuenta activa: desde acá sale la plata de los depósitos nuevos. */
  address: `0x${string}` | null;
  handle: string;
  avatar: Mood;

  /** Flags de demo, equivalentes a los props del mockup. */
  demoAccel: boolean;
  reduceMotion: boolean;

  finishOnboarding: () => void;
  connect: (
    accounts: WalletAccount[],
    active: `0x${string}`,
    kind?: 'embedded' | 'external',
  ) => void;
  switchAccount: (address: `0x${string}`) => void;
  disconnect: () => void;
  setAvatar: (mood: Mood) => void;
  toggleDemoAccel: () => void;
  toggleReduceMotion: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  onboarded: false,
  connected: false,
  walletKind: null,
  accounts: [],
  address: null,
  handle: '@meli.crypto',
  avatar: 'happy',

  demoAccel: false,
  /**
   * Arranca activado si `EXPO_PUBLIC_REDUCE_MOTION=1`.
   *
   * Además de accesibilidad, sirve para pruebas automatizadas: las animaciones
   * en bucle (la mascota que flota) impiden que las herramientas de UI de
   * Android alcancen el estado "idle" y no puedan leer la pantalla.
   */
  reduceMotion: process.env.EXPO_PUBLIC_REDUCE_MOTION === '1',

  finishOnboarding: () => set({ onboarded: true }),
  connect: (accounts, active, kind = 'embedded') =>
    set({ connected: true, walletKind: kind, accounts, address: active }),
  switchAccount: (address) => set({ address }),
  disconnect: () =>
    set({ connected: false, walletKind: null, accounts: [], address: null }),
  setAvatar: (avatar) => set({ avatar }),
  toggleDemoAccel: () => set((s) => ({ demoAccel: !s.demoAccel })),
  toggleReduceMotion: () => set((s) => ({ reduceMotion: !s.reduceMotion })),
}));

/** Texto de plazo: "4 meses" o "4 min (demo)" con el modo acelerado. */
export function usePlazoLabel() {
  const demoAccel = useSessionStore((s) => s.demoAccel);
  return (n: number) => durationLabel(n, demoAccel);
}
