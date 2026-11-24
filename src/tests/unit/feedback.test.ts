import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  allowedRelationshipsForCycle,
  aggregateFeedbackSummary,
  feedbackService,
} from '../../services/feedbackService';

type QueryResult = { data: unknown; error: unknown };
type QueryCall = { table: string; op: string };

interface Chain {
  select: (columns?: unknown) => Chain;
  order: () => Chain;
  in: (column?: unknown, values?: unknown) => Chain;
  eq: (column?: unknown, value?: unknown) => Chain;
  insert: (payload?: unknown) => Chain;
  update: (payload?: unknown) => Chain;
  single: () => QueryResult;
  maybeSingle: () => QueryResult;
  then: (
    onFulfilled: (value: QueryResult) => unknown,
    onRejected: (reason: unknown) => unknown
  ) => Promise<unknown>;
}

const h = vi.hoisted(() => {
  const results = new Map<string, QueryResult[]>();
  const calls: QueryCall[] = [];

  const nextResult = (table: string): QueryResult => {
    const queueForTable = results.get(table) ?? [];
    return queueForTable.shift() ?? { data: null, error: null };
  };

  const chain = (table: string, op: string): Chain => {
    calls.push({ table, op });
    const node: Chain = {
      select: (columns?: unknown) =>
        chain(table, columns === undefined ? 'select' : `select:${String(columns)}`),
      order: () => chain(table, 'order'),
      in: () => chain(table, 'in'),
      eq: () => chain(table, 'eq'),
      insert: () => chain(table, 'insert'),
      update: () => chain(table, 'update'),
      single: () => {
        calls.push({ table, op: 'single' });
        return nextResult(table);
      },
      maybeSingle: () => {
        calls.push({ table, op: 'maybeSingle' });
        return nextResult(table);
      },
      then: (onFulfilled, onRejected) => Promise.resolve(nextResult(table)).then(onFulfilled, onRejected),
    };
    return node;
  };

  return {
    calls,
    queue: (table: string, ...items: QueryResult[]) =>
      results.set(table, [...(results.get(table) ?? []), ...items]),
    reset: () => {
      results.clear();
      calls.length = 0;
    },
    from: (table: string) => chain(table, 'from'),
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
  };
});

vi.mock('../../integrations/supabase/client', () => ({
  supabase: { from: h.from, auth: h.auth },
}));

const opCount = (table: string, op: string) =>
  h.calls.filter(call => call.table === table && call.op === op).length;

const selectStatements = () =>
  h.calls.filter(call => call.op.startsWith('select')).map(call => call.op);

describe('feedbackService', () => {
  beforeEach(() => {
    h.reset();
  });

  describe('createFeedbackRequest', () => {
    it('le a linha inserida com maybeSingle, para nao derrubar a criacao quando a policy esconde a linha', async () => {
      h.queue('feedback_requests', { data: null, error: null });

      const created = await feedbackService.createFeedbackRequest('c1', 'u2', 'u3', 'manager');

      expect(created).toBeNull();
      expect(opCount('feedback_requests', 'insert')).toBe(1);
      expect(opCount('feedback_requests', 'maybeSingle')).toBe(1);
      expect(opCount('feedback_requests', 'single')).toBe(0);
    });

    it('devolve o pedido quando a leitura e permitida', async () => {
      h.queue('feedback_requests', { data: { id: 'req1', relationship: 'manager' }, error: null });

      const created = await feedbackService.createFeedbackRequest('c1', 'u1', 'u2', 'manager');

      expect(created?.id).toBe('req1');
    });
  });

  describe('submitFeedback', () => {
    it('insere a resposta e marca o pedido como enviado', async () => {
      h.queue('feedback_responses', { data: null, error: null });
      h.queue('feedback_responses', { data: { id: 'resp1', request_id: 'r1' }, error: null });
      h.queue('feedback_requests', { data: null, error: null });

      const result = await feedbackService.submitFeedback('r1', { q1: 'bom' });

      expect(result.id).toBe('resp1');
      expect(opCount('feedback_responses', 'insert')).toBe(1);
      expect(opCount('feedback_requests', 'update')).toBe(1);
    });

    it('reaproveita a resposta existente em vez de duplicar no retry', async () => {
      h.queue('feedback_responses', { data: { id: 'resp1', request_id: 'r1' }, error: null });
      h.queue('feedback_requests', { data: null, error: null });

      const result = await feedbackService.submitFeedback('r1', { q1: 'bom' });

      expect(result.id).toBe('resp1');
      expect(opCount('feedback_responses', 'insert')).toBe(0);
      expect(opCount('feedback_requests', 'update')).toBe(1);
    });

    it('propaga o erro da checagem de resposta existente e nao insere nada', async () => {
      h.queue('feedback_responses', { data: null, error: { message: 'sem permissao' } });

      await expect(feedbackService.submitFeedback('r1', {})).rejects.toThrow('sem permissao');
      expect(opCount('feedback_responses', 'insert')).toBe(0);
    });
  });

  describe('getMyPendingRequests', () => {
    it('resolve quem recebe numa segunda query, sem depender de embed de profiles', async () => {
      h.queue('feedback_requests', {
        data: [
          {
            id: 'r1',
            from_user_id: 'u1',
            to_user_id: 'u2',
            relationship: 'peer',
            status: 'pending',
            cycle: null,
          },
        ],
        error: null,
      });
      h.queue('profiles', { data: [{ id: 'u2', display_name: 'Ana', avatar_url: null }], error: null });

      const pending = await feedbackService.getMyPendingRequests();

      expect(pending[0].to_user?.display_name).toBe('Ana');
      expect(selectStatements().some(statement => statement.includes('profiles!'))).toBe(false);
    });
  });
});

describe('aggregateFeedbackSummary', () => {
  it('exclui respostas anonimas do resumo de quem foi avaliado', () => {
    const summary = aggregateFeedbackSummary([
      {
        relationship: 'peer',
        responses: [
          { overall_rating: 5, strengths: 'comunicacao', improvements: null, is_anonymous: true },
          { overall_rating: 3, strengths: null, improvements: 'prazos', is_anonymous: false },
        ],
      },
    ]);

    expect(summary.totalResponses).toBe(1);
    expect(summary.avgRating).toBe(3);
    expect(summary.commonStrengths).toEqual([]);
    expect(summary.commonImprovements).toEqual(['prazos']);
  });
});

describe('allowedRelationshipsForCycle', () => {
  it('restringe o tipo de avaliacao conforme o tipo do ciclo', () => {
    expect(allowedRelationshipsForCycle('peer')).toEqual(['peer']);
    expect(allowedRelationshipsForCycle('self')).toEqual(['self']);
    expect(allowedRelationshipsForCycle('manager')).not.toContain('peer');
    expect(allowedRelationshipsForCycle('360')).toEqual(['manager', 'direct_report', 'peer', 'self']);
  });
});