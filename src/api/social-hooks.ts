import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { hasSocialRegistry } from '@/lib/chain';
import { useSessionStore } from '@/store/session';
import * as social from './social';
import { useTxMutation } from './use-tx-mutation';

/** Todo lo social vive en el registro on-chain. */
export const SOCIAL_ENABLED = hasSocialRegistry();

const keys = {
  username: (a: string | null) => ['social', 'username', a] as const,
  friends: (a: string | null) => ['social', 'friends', a] as const,
  requests: (a: string | null) => ['social', 'requests', a] as const,
  lookup: (q: string) => ['social', 'lookup', q] as const,
};

export function useMyUsername() {
  const account = useSessionStore((s) => s.address);
  return useQuery({
    queryKey: keys.username(account),
    queryFn: () => (account ? social.fetchUsername(account) : null),
    enabled: Boolean(account) && SOCIAL_ENABLED,
    staleTime: 60_000,
  });
}

export function useFriendsOnChain() {
  const account = useSessionStore((s) => s.address);
  return useQuery({
    queryKey: keys.friends(account),
    queryFn: () => (account ? social.fetchFriendsOnChain(account) : []),
    enabled: Boolean(account) && SOCIAL_ENABLED,
  });
}

export function useFriendRequestsOnChain() {
  const account = useSessionStore((s) => s.address);
  return useQuery({
    queryKey: keys.requests(account),
    queryFn: () => (account ? social.fetchRequestsOnChain(account) : []),
    enabled: Boolean(account) && SOCIAL_ENABLED,
  });
}

/** Busca a alguien por nombre mientras se escribe. */
export function useUsernameLookup(query: string) {
  const trimmed = query.trim().toLowerCase();
  return useQuery({
    queryKey: keys.lookup(trimmed),
    queryFn: () => social.findByUsername(trimmed),
    enabled: SOCIAL_ENABLED && trimmed.length >= 3 && social.usernameProblem(trimmed) === null,
    staleTime: 30_000,
  });
}

/** Amigos que están dentro de un chanchito, cruzado en el contrato. */
export function useFriendsInPool(participants: readonly `0x${string}`[] | undefined) {
  const account = useSessionStore((s) => s.address);
  return useQuery({
    queryKey: ['social', 'in-pool', account, participants?.join(',') ?? ''],
    queryFn: () => (account ? social.filterFriends(account, participants ?? []) : []),
    enabled: Boolean(account) && SOCIAL_ENABLED && (participants?.length ?? 0) > 0,
  });
}

/* -------------------------------- escritura ------------------------------- */

function useSocialWrite(
  kind: 'register' | 'friend',
  label: string,
  fn: (account: `0x${string}`, arg: string) => Promise<{ txHash: string; result: null }>,
) {
  const account = useSessionStore((s) => s.address);
  const client = useQueryClient();

  return useTxMutation({
    kind: kind === 'register' ? 'create' : 'send',
    label: () => label,
    mutationFn: (arg: string) => {
      if (!account) throw new Error('Conectá tu wallet primero');
      return fn(account, arg);
    },
    invalidate: [['social']],
    onSettledExtra: () => client.invalidateQueries({ queryKey: ['social'] }),
  });
}

export const useRegisterUsername = () =>
  useSocialWrite('register', 'Registrando tu nombre', (a, name) =>
    social.registerUsername(a, name),
  );

export const useSendFriendRequestOnChain = () =>
  useSocialWrite('friend', 'Enviando solicitud', (a, to) =>
    social.sendFriendRequestOnChain(a, to as `0x${string}`),
  );

export const useAcceptFriendOnChain = () =>
  useSocialWrite('friend', 'Aceptando solicitud', (a, from) =>
    social.acceptFriendOnChain(a, from as `0x${string}`),
  );

export const useRejectFriendOnChain = () =>
  useSocialWrite('friend', 'Rechazando solicitud', (a, from) =>
    social.rejectFriendOnChain(a, from as `0x${string}`),
  );

export const useRemoveFriendOnChain = () =>
  useSocialWrite('friend', 'Quitando amigo', (a, who) =>
    social.removeFriendOnChain(a, who as `0x${string}`),
  );

export { usernameProblem } from './social';

/* --------------------- amigos dentro de cada chanchito -------------------- */

import { useQueries } from '@tanstack/react-query';

import { poolVaultAbi } from './abi';
import { publicClient } from '@/lib/chain';
import * as socialLib from './social';

/** Los participantes de un chanchito, leídos del contrato. */
export function usePoolParticipants(poolId: string | undefined) {
  return useQuery({
    queryKey: ['pool-participants', poolId],
    queryFn: async () =>
      (await publicClient.readContract({
        address: poolId as `0x${string}`,
        abi: poolVaultAbi,
        functionName: 'participantsList',
      })) as readonly `0x${string}`[],
    enabled: Boolean(poolId) && poolId!.startsWith('0x'),
  });
}

/**
 * Cuáles de tus amigos están dentro de un chanchito.
 *
 * Cruza los participantes reales contra tu lista real, todo en el contrato.
 * Antes esto era decorativo: se inventaban amigos según la dirección.
 */
export function usePoolFriends(poolId: string | undefined) {
  const account = useSessionStore((s) => s.address);
  const participants = usePoolParticipants(poolId);

  const matches = useQuery({
    queryKey: ['pool-friends', poolId, account, participants.data?.length ?? 0],
    queryFn: () =>
      account ? socialLib.filterFriends(account, participants.data ?? []) : [],
    enabled:
      Boolean(account) && SOCIAL_ENABLED && (participants.data?.length ?? 0) > 0,
  });

  const names = useQuery({
    queryKey: ['pool-friend-names', matches.data?.join(',') ?? ''],
    queryFn: async () => {
      const list = matches.data ?? [];
      if (list.length === 0) return [];
      const all = await socialLib.fetchFriendsOnChain(account!);
      return all.filter((f) =>
        list.some((a) => a.toLowerCase() === f.address.toLowerCase()),
      );
    },
    enabled: Boolean(account) && (matches.data?.length ?? 0) > 0,
  });

  return {
    participants: participants.data ?? [],
    friends: names.data ?? [],
    isPending: participants.isPending || matches.isPending,
  };
}
