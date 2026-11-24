import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useWeeklyChallenge } from '../../hooks/useWeeklyChallenge';

const mockCreateNotification = vi.hoisted(() => vi.fn());
const mockGetCurrentChallenge = vi.hoisted(() => vi.fn());
const mockCreateChallenge = vi.hoisted(() => vi.fn());
const mockGetById = vi.hoisted(() => vi.fn());
const mockProfilesOrder = vi.hoisted(() => vi.fn());

vi.mock('../../services/notificationsService', () => ({
  notificationsService: { create: mockCreateNotification },
}));

vi.mock('../../services/weeklyChallengesService', () => ({
  weeklyChallengesService: {
    getCurrentChallenge: mockGetCurrentChallenge,
    findOpponent: vi.fn().mockResolvedValue({ id: 'u2' }),
    createChallenge: mockCreateChallenge,
    updateXpGained: vi.fn().mockResolvedValue(undefined),
    completeChallenge: vi.fn().mockResolvedValue(undefined),
    getPastChallenges: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/profilesService', () => ({
  profilesService: {
    getById: mockGetById,
    addXp: vi.fn(),
    addCoins: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

vi.mock('../../integrations/supabase/client', () => {
  const channel: Record<string, unknown> = {};
  channel.on = () => channel;
  channel.subscribe = () => channel;
  return {
    supabase: {
      from: () => ({ select: () => ({ order: mockProfilesOrder }) }),
      channel: () => channel,
      removeChannel: vi.fn(),
    },
  };
});

const profile = { id: 'u1', xp: 100, display_name: 'Eu', avatar_url: null, level: 1 };

const buildChallenge = (id: string) => ({
  id,
  challenger_id: 'u1',
  opponent_id: 'u2',
  challenger_xp_start: 100,
  opponent_xp_start: 100,
  challenger_xp_gained: 0,
  opponent_xp_gained: 0,
  xp_reward: 50,
  coin_reward: 10,
  status: 'active',
  week_start: '2026-11-23',
  week_end: '2026-11-30T00:00:00Z',
  created_at: '2026-11-23T00:00:00Z',
});

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

async function createChallengeAndCollectPayloads(challengeId: string) {
  mockGetCurrentChallenge.mockResolvedValue(null);
  mockGetById.mockResolvedValue(profile);
  mockProfilesOrder.mockResolvedValue({
    data: [
      { id: 'u1', xp: 100 },
      { id: 'u2', xp: 100 },
    ],
  });
  mockCreateChallenge.mockResolvedValue(buildChallenge(challengeId));
  mockCreateNotification.mockClear();

  const { unmount } = renderHook(() => useWeeklyChallenge(), { wrapper: makeWrapper() });
  await waitFor(() => expect(mockCreateNotification).toHaveBeenCalledTimes(2));
  const payloads = mockCreateNotification.mock.calls.map(([arg]) => JSON.stringify(arg.data));
  unmount();
  return payloads;
}

describe('useWeeklyChallenge - notificacao do desafio', () => {
  it('inclui o id do desafio no payload das notificacoes', async () => {
    const payloads = await createChallengeAndCollectPayloads('c1');

    expect(payloads).toEqual([
      JSON.stringify({ challenge_id: 'c1' }),
      JSON.stringify({ challenge_id: 'c1' }),
    ]);
  });

  it('gera payloads distintos em desafios de semanas diferentes (nao colide no indice unico)', async () => {
    const semana1 = await createChallengeAndCollectPayloads('c1');
    const semana2 = await createChallengeAndCollectPayloads('c2');

    expect(new Set([...semana1, ...semana2]).size).toBe(2);
  });
});
