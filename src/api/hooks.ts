import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { money } from '@/lib/money';
import { useSessionStore } from '@/store/session';
import type { PoolDraft } from '@/store/draft';
import * as source from './source';
import { qk } from './keys';
import { useTxMutation } from './use-tx-mutation';

/* ---------------------------------- pools -------------------------------- */

export function usePools() {
  return useQuery({ queryKey: qk.pools.list(), queryFn: source.fetchPools });
}

export function usePool(id: string | undefined) {
  return useQuery({
    queryKey: qk.pools.detail(id ?? ''),
    queryFn: () => source.fetchPool(id!),
    enabled: Boolean(id),
  });
}

export function usePoolsWithFriendsCount() {
  return useQuery({
    queryKey: qk.pools.withFriendsCount(),
    queryFn: source.fetchPoolsWithFriendsCount,
  });
}

/**
 * Búsqueda: filtra y ordena en cliente sobre la lista cacheada.
 * Cuando haya backend, esto pasa a ser un `useQuery` con los filtros en la key.
 */
export function useSearchResults({
  query,
  tag,
  onlyFriends,
}: {
  query: string;
  tag: string;
  onlyFriends: boolean;
}) {
  const poolsQuery = usePools();
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    const pools = poolsQuery.data ?? [];
    return pools
      .filter((p) => tag === 'Todos' || p.tag === tag)
      .filter((p) => !onlyFriends || p.friends.length > 0)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q))
      .sort((a, b) => b.friends.length - a.friends.length);
  }, [poolsQuery.data, tag, onlyFriends, q]);

  return { ...poolsQuery, results };
}

export function useCreatePool() {
  const account = useSessionStore((s) => s.address);
  return useTxMutation({
    kind: 'create',
    label: (vars: { draft: PoolDraft; code: string }) =>
      `Creando "${vars.draft.name.trim() || 'tu chanchito'}"`,
    mutationFn: (vars: { draft: PoolDraft; code: string }) =>
      source.createPool({ ...vars, account }),
    invalidate: [qk.pools.all],
  });
}

/** Lectura, no escritura: no genera transacción. */
export function useJoinByCode() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => source.fetchPoolByCode(code),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.pools.all }),
  });
}

/* ----------------------------- participaciones ---------------------------- */

export function useParticipations() {
  const account = useSessionStore((s) => s.address);
  return useQuery({
    queryKey: [...qk.participations.list(), account],
    queryFn: () => source.fetchParticipations(account),
  });
}

export function useParticipation(id: string | undefined) {
  const account = useSessionStore((s) => s.address);
  return useQuery({
    queryKey: [...qk.participations.detail(id ?? ''), account],
    queryFn: () => source.fetchParticipation(id!, account),
    enabled: Boolean(id),
  });
}

export function useJoinPool() {
  const account = useSessionStore((s) => s.address);
  return useTxMutation({
    kind: 'deposit',
    label: (vars: { poolId: string; amount: bigint }) => `Depositando ${money(vars.amount)}`,
    mutationFn: (vars: { poolId: string; amount: bigint }) =>
      source.joinPool({ ...vars, account }),
    invalidate: [qk.participations.all, qk.pools.all],
  });
}

export function useExitParticipation() {
  const account = useSessionStore((s) => s.address);
  return useTxMutation({
    kind: 'exit',
    label: () => 'Saliendo del chanchito',
    mutationFn: (id: string) => source.exitParticipation({ id, account }),
    invalidate: [qk.participations.all, qk.pools.all],
  });
}

export function useCompleteParticipation() {
  const account = useSessionStore((s) => s.address);
  return useTxMutation({
    kind: 'close',
    label: () => 'Cerrando el chanchito',
    mutationFn: (id: string) => source.completeParticipation({ id, account }),
    invalidate: [qk.participations.all, qk.pools.all],
  });
}

export function useSendUsdt() {
  const account = useSessionStore((s) => s.address);
  return useTxMutation({
    kind: 'send',
    label: (vars: { to: string; amount: bigint }) => `Enviando ${money(vars.amount)}`,
    mutationFn: (vars: { to: `0x${string}`; amount: bigint }) =>
      source.sendUsdt({ ...vars, account }),
    invalidate: [['usdt-balance']],
  });
}

/* --------------------------------- notifs --------------------------------- */

export function useNotifications() {
  return useQuery({ queryKey: qk.notifications, queryFn: source.fetchNotifications });
}

/* --------------------------------- amigos --------------------------------- */

export function useFriends() {
  return useQuery({ queryKey: qk.friends.list(), queryFn: source.fetchFriends });
}

export function useFriendRequests() {
  return useQuery({ queryKey: qk.friends.requests(), queryFn: source.fetchFriendRequests });
}

export function useSuggestions(query: string) {
  const suggestions = useQuery({
    queryKey: qk.friends.suggestions(),
    queryFn: source.fetchSuggestions,
  });
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    const list = suggestions.data ?? [];
    if (!q) return list;
    return list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q),
    );
  }, [suggestions.data, q]);

  return { ...suggestions, results };
}

function useFriendMutation(fn: (id: string) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.friends.all });
      client.invalidateQueries({ queryKey: qk.pools.all });
    },
  });
}

export const useAcceptRequest = () => useFriendMutation(source.acceptRequest);
export const useRejectRequest = () => useFriendMutation(source.rejectRequest);
export const useRemoveFriend = () => useFriendMutation(source.removeFriend);
export const useSendFriendRequest = () => useFriendMutation(source.sendFriendRequest);

/* --------------------------------- perfil --------------------------------- */

export function useProfileStats() {
  return useQuery({ queryKey: qk.profileStats, queryFn: source.fetchProfileStats });
}
