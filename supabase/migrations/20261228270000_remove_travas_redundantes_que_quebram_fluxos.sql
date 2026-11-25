-- Corrige tres travas que hoje existem em producao e quebram fluxos do proprio app.
-- Todas sao relaxamentos: nenhuma linha e apagada e nenhum dado e alterado.
-- As duas primeiras constraints ficam fora do repositorio tambem: a migration
-- 20261228240000 deixou de recria-las (ver comentarios la).

-- 1) Troca de etapas de um procedimento.
-- sequence_steps_unique (UNIQUE IMEDIATA em procedure_id, position) e redundante
-- com sequence_steps_procedure_id_position_key (DEFERRABLE INITIALLY DEFERRED,
-- mesma dupla de colunas). save_sequence_procedure faz SET CONSTRAINTS ALL DEFERRED
-- e atualiza uma etapa por vez (migration 20260728161526, linha 93); com a trava
-- imediata, o estado intermediario da reordenacao e rejeitado.
ALTER TABLE public.sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_unique;

-- 2) Substituicao da pergunta diaria da aposta.
-- wager_questions_scheduled_date_key UNIQUE (scheduled_date) sem condicao impede o
-- fluxo de save_wager_question: ele desativa a pergunta anterior mantendo a data
-- (migration 20260728163529, linhas 96-98) e insere a nova na mesma data (linha 105).
-- O contrato real e "uma pergunta ATIVA por data", garantido pelo indice unico
-- parcial uq_wager_questions_date_active, que permanece.
ALTER TABLE public.wager_questions DROP CONSTRAINT IF EXISTS wager_questions_scheduled_date_key;

-- 3) Metrica com peso zero na guerra de departamentos.
-- O formulario aceita peso zero desde que outra metrica tenha peso positivo
-- (src/lib/departmentWarConfig.ts:339), mas a trava exigia weight > 0.
ALTER TABLE public.department_war_metrics DROP CONSTRAINT IF EXISTS department_war_metrics_weight_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.department_war_metrics ADD CONSTRAINT department_war_metrics_weight_check CHECK ((weight >= (0)::numeric));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'department_war_metrics_weight_check', 'department_war_metrics', SQLERRM;
  END;
END
$do$;