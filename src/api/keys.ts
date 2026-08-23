/** Fábrica única de query keys, para invalidar sin adivinar strings. */
export const qk = {
  pools: {
    all: ['pools'] as const,
    list: () => [...qk.pools.all, 'list'] as const,
    detail: (id: string) => [...qk.pools.all, 'detail', id] as const,
    byCode: (code: string) => [...qk.pools.all, 'code', code] as const,
    withFriendsCount: () => [...qk.pools.all, 'with-friends-count'] as const,
  },
  participations: {
    all: ['participations'] as const,
    list: () => [...qk.participations.all, 'list'] as const,
    detail: (id: string) => [...qk.participations.all, 'detail', id] as const,
  },
  friends: {
    all: ['friends'] as const,
    list: () => [...qk.friends.all, 'list'] as const,
    requests: () => [...qk.friends.all, 'requests'] as const,
    suggestions: () => [...qk.friends.all, 'suggestions'] as const,
  },
  notifications: ['notifications'] as const,
  profileStats: ['profile-stats'] as const,
};
