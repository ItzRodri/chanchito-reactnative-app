import { create } from 'zustand';

export type Visibility = 'public' | 'private';

/**
 * El formulario de creación trabaja con dólares enteros (`*Whole`) porque eso
 * es lo que el usuario tipea. La conversión a unidades base pasa una sola vez,
 * en `backend.ts`, al crear el chanchito.
 */
export type PoolDraft = {
  name: string;
  tag: string;
  minWhole: number;
  maxWhole: number;
  durationMonths: number;
  capacity: number;
  vis: Visibility;
};

const emptyDraft: PoolDraft = {
  name: '',
  tag: 'Viajes',
  minWhole: 50,
  maxWhole: 200,
  durationMonths: 4,
  capacity: 5,
  vis: 'public',
};

type DraftState = {
  draft: PoolDraft;
  reset: () => void;
  patch: (patch: Partial<PoolDraft>) => void;
};

/** Formulario de "Creá tu chanchito". Se limpia cada vez que se entra. */
export const useDraftStore = create<DraftState>((set) => ({
  draft: emptyDraft,
  reset: () => set({ draft: emptyDraft }),
  patch: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
}));

export function draftProblem(draft: PoolDraft): string | null {
  if (draft.name.trim().length <= 2) return 'Poné un nombre de al menos 3 letras';
  if (draft.minWhole <= 0) return 'El monto mínimo tiene que ser mayor a 0';
  if (draft.maxWhole < draft.minWhole) return 'El máximo no puede ser menor que el mínimo';
  if (draft.durationMonths <= 0) return 'El plazo tiene que ser de al menos 1 mes';
  if (draft.capacity < 2) return 'Un chanchito necesita al menos 2 cupos';
  return null;
}

export function isDraftValid(draft: PoolDraft) {
  return draftProblem(draft) === null;
}
