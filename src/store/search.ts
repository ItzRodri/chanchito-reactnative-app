import { create } from 'zustand';

type SearchState = {
  query: string;
  tag: string;
  onlyFriends: boolean;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  setTag: (tag: string) => void;
  toggleOnlyFriends: () => void;
};

/**
 * Vive en el store (y no en el componente) para que los filtros
 * sobrevivan al cambio de tab y al ida y vuelta al detalle.
 */
export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  tag: 'Todos',
  onlyFriends: false,
  setQuery: (query) => set({ query }),
  clearQuery: () => set({ query: '' }),
  setTag: (tag) => set({ tag }),
  toggleOnlyFriends: () => set((s) => ({ onlyFriends: !s.onlyFriends })),
}));
