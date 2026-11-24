-- Assercoes versionadas do motor de Pesquisa de Clima.
-- Rodar sobre stubs.sql + supabase/migrations/20261123180000_climate_survey_engine.sql.
-- Exige psql com ON_ERROR_STOP=1: qualquer falha aborta o script.
\set ON_ERROR_STOP on

-- Contexto do criador/admin usado pelas funcoes que exigem auth.uid().
set app.user_id = '99999999-9999-9999-9999-999999999999';
set app.is_admin = 'true';

\echo '== fixtures =='
insert into public.climate_surveys (id, title, status, created_by, starts_at, ends_at) values
  ('10000000-0000-0000-0000-000000000001', 'Clima A', 'active', '99999999-9999-9999-9999-999999999999', now() - interval '1 day', now() + interval '1 day'),
  ('20000000-0000-0000-0000-000000000001', 'Clima B', 'active', '99999999-9999-9999-9999-999999999999', now() - interval '1 day', now() + interval '1 day'),
  ('30000000-0000-0000-0000-000000000001', 'Clima C', 'active', '99999999-9999-9999-9999-999999999999', now() - interval '1 day', now() + interval '1 day'),
  ('40000000-0000-0000-0000-000000000001', 'Clima D', 'active', '99999999-9999-9999-9999-999999999999', now() - interval '1 day', now() + interval '1 day'),
  ('50000000-0000-0000-0000-000000000001', 'Clima E', 'active', '99999999-9999-9999-9999-999999999999', now() - interval '1 day', now() + interval '1 day'),
  ('60000000-0000-0000-0000-000000000001', 'Clima F', 'active', '99999999-9999-9999-9999-999999999999', now() - interval '3 day', now() - interval '1 day'),
  ('70000000-0000-0000-0000-000000000001', 'Clima G', 'active', '99999999-9999-9999-9999-999999999999', now() + interval '1 day', now() + interval '3 day'),
  ('80000000-0000-0000-0000-000000000001', 'Clima H', 'active', '99999999-9999-9999-9999-999999999999', now() - interval '1 day', now() + interval '1 day'),
  ('90000000-0000-0000-0000-000000000001', 'Clima I', 'draft',  'bbbbbbbb-0000-0000-0000-000000000001', now() - interval '1 day', now() + interval '1 day');

insert into public.climate_survey_questions (id, survey_id, pillar, question_text, question_type) values
  ('1a000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'peers',      'Pares',      'likert_5'),
  ('1a000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'leadership', 'Lideranca',  'likert_10'),
  ('2a000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'peers',      'Pares',      'likert_5'),
  ('2a000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'autonomy',   'Autonomia',  'likert_10'),
  ('3a000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'peers',      'Pares',      'likert_5'),
  ('4a000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'purpose',    'Recomenda?', 'nps'),
  ('5a000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'purpose',    'Recomenda?', 'nps'),
  ('6a000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'peers',      'Pares',      'likert_5'),
  ('7a000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'peers',      'Pares',      'likert_5'),
  ('8a000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'peers',      'Pares',      'likert_5'),
  ('9a000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'peers',      'Pares',      'likert_5');

-- S1: 5 respondentes completos; peers=3 (=>50) e leadership=8 (=>80)
with resp as (
  insert into public.climate_survey_responses (survey_id, user_id, is_complete, completed_at)
  select '10000000-0000-0000-0000-000000000001', gen_random_uuid(), true, now() from generate_series(1, 5)
  returning id
)
insert into public.climate_question_answers (response_id, question_id, score)
select resp.id, q.id, case q.pillar when 'peers' then 3 else 8 end
from resp cross join public.climate_survey_questions q
where q.survey_id = '10000000-0000-0000-0000-000000000001';

-- S2: 5 respondem peers=4 (=>75); apenas 2 respondem autonomy=10 (=> amostra propria insuficiente)
with resp as (
  insert into public.climate_survey_responses (survey_id, user_id, is_complete, completed_at)
  select '20000000-0000-0000-0000-000000000001', gen_random_uuid(), true, now() from generate_series(1, 5)
  returning id
)
insert into public.climate_question_answers (response_id, question_id, score)
select resp.id, '2a000000-0000-0000-0000-000000000001'::uuid, 4 from resp
union all
select t.id, '2a000000-0000-0000-0000-000000000002'::uuid, 10 from (select id from resp limit 2) t;

-- S3: 5 respondentes, so pergunta likert_5 (nenhuma nota elegivel para eNPS)
with resp as (
  insert into public.climate_survey_responses (survey_id, user_id, is_complete, completed_at)
  select '30000000-0000-0000-0000-000000000001', gen_random_uuid(), true, now() from generate_series(1, 5)
  returning id
)
insert into public.climate_question_answers (response_id, question_id, score)
select resp.id, '3a000000-0000-0000-0000-000000000001', 4 from resp;

-- S4: 5 respondentes NPS: 4 promotores (9) e 1 detrator (3) => eNPS 60
with resp as (
  insert into public.climate_survey_responses (survey_id, user_id, is_complete, completed_at)
  select '40000000-0000-0000-0000-000000000001', gen_random_uuid(), true, now() from generate_series(1, 5)
  returning id
)
insert into public.climate_question_answers (response_id, question_id, score)
select resp.id, '4a000000-0000-0000-0000-000000000001',
       case when resp.id = (select id from resp offset 4 limit 1) then 3 else 9 end
from resp;

-- S5: apenas 4 respondentes NPS (amostra total abaixo do piso, mesmo com p_min_responses = 1)
with resp as (
  insert into public.climate_survey_responses (survey_id, user_id, is_complete, completed_at)
  select '50000000-0000-0000-0000-000000000001', gen_random_uuid(), true, now() from generate_series(1, 4)
  returning id
)
insert into public.climate_question_answers (response_id, question_id, score)
select resp.id, '5a000000-0000-0000-0000-000000000001', 10 from resp;

-- S8: resposta de OUTRO usuario (para provar que admin nao le de quem e a nota)
with resp as (
  insert into public.climate_survey_responses (id, survey_id, user_id, is_complete, completed_at)
  values ('cccccccc-1111-1111-1111-111111111111', '80000000-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', true, now())
  returning id
)
insert into public.climate_question_answers (response_id, question_id, score)
select resp.id, '8a000000-0000-0000-0000-000000000001', 5 from resp;

\echo '== asserts: placar por pilar =='
do $$
declare
  v_n integer;
  v_rows integer;
  v_peers numeric;
  v_lead numeric;
begin
  v_n := public._climate_recompute_pillar_scores('10000000-0000-0000-0000-000000000001', 5);
  if v_n <> 2 then raise exception 'esperava 2 pilares escritos, veio %', v_n; end if;

  select count(*) into v_rows from public.climate_pillar_scores where survey_id = '10000000-0000-0000-0000-000000000001';
  if v_rows <> 2 then raise exception 'esperava 2 linhas de placar, veio %', v_rows; end if;

  select score into v_peers from public.climate_pillar_scores where survey_id = '10000000-0000-0000-0000-000000000001' and pillar = 'peers';
  select score into v_lead from public.climate_pillar_scores where survey_id = '10000000-0000-0000-0000-000000000001' and pillar = 'leadership';
  if v_peers <> 50 then raise exception 'peers deveria ser 50, veio %', v_peers; end if;
  if v_lead <> 80 then raise exception 'leadership deveria ser 80, veio %', v_lead; end if;

  perform public._climate_recompute_pillar_scores('10000000-0000-0000-0000-000000000001', 5);
  select count(*) into v_rows from public.climate_pillar_scores where survey_id = '10000000-0000-0000-0000-000000000001';
  if v_rows <> 2 then raise exception 'reexecucao duplicou o placar: % linhas', v_rows; end if;
  select score into v_lead from public.climate_pillar_scores where survey_id = '10000000-0000-0000-0000-000000000001' and pillar = 'leadership';
  if v_lead <> 80 then raise exception 'reexecucao corrompeu leadership: %', v_lead; end if;

  perform public._climate_recompute_pillar_scores('10000000-0000-0000-0000-000000000001', 6);
  select count(*) into v_rows from public.climate_pillar_scores
   where survey_id = '10000000-0000-0000-0000-000000000001' and response_count > 0;
  if v_rows <> 0 then raise exception 'amostra insuficiente deixou % pilar(es) pontuando', v_rows; end if;

  perform public._climate_recompute_pillar_scores('10000000-0000-0000-0000-000000000001', 5);
  delete from public.climate_survey_questions where id = '1a000000-0000-0000-0000-000000000001';
  perform public._climate_recompute_pillar_scores('10000000-0000-0000-0000-000000000001', 5);
  select count(*) into v_rows from public.climate_pillar_scores
   where survey_id = '10000000-0000-0000-0000-000000000001' and pillar = 'peers' and response_count > 0;
  if v_rows <> 0 then raise exception 'pilar removido da pesquisa continua pontuando'; end if;
  select score into v_lead from public.climate_pillar_scores where survey_id = '10000000-0000-0000-0000-000000000001' and pillar = 'leadership';
  if v_lead <> 80 then raise exception 'pilar restante perdeu o placar: %', v_lead; end if;

  if public._climate_recompute_pillar_scores('00000000-0000-0000-0000-000000000000', 5) <> 0 then
    raise exception 'pesquisa inexistente escreveu placar';
  end if;

  raise notice 'OK placar por pilar (2 pilares, 50/80, reexecucao idempotente, amostra curta zerada)';
end $$;

\echo '== asserts: piso de anonimato por pilar =='
do $$
declare
  v_n integer;
  v_rows integer;
  v_peers numeric;
begin
  v_n := public._climate_recompute_pillar_scores('20000000-0000-0000-0000-000000000001', 5);
  if v_n <> 1 then raise exception 'pilar com amostra propria curta deveria ser omitido: escreveu %', v_n; end if;
  select score into v_peers from public.climate_pillar_scores
   where survey_id = '20000000-0000-0000-0000-000000000001' and pillar = 'peers';
  if v_peers <> 75 then raise exception 'peers deveria ser 75, veio %', v_peers; end if;

  v_n := public._climate_recompute_pillar_scores('20000000-0000-0000-0000-000000000001', 1);
  if v_n <> 1 then raise exception 'cliente nao pode reduzir o piso de 5: escreveu %', v_n; end if;
  select count(*) into v_rows from public.climate_pillar_scores
   where survey_id = '20000000-0000-0000-0000-000000000001' and pillar = 'autonomy';
  if v_rows <> 0 then raise exception 'autonomy (2 de 5) foi exposto'; end if;

  perform public._climate_recompute_pillar_scores('50000000-0000-0000-0000-000000000001', 1);
  select count(*) into v_rows from public.climate_pillar_scores
   where survey_id = '50000000-0000-0000-0000-000000000001' and response_count > 0;
  if v_rows <> 0 then raise exception 'pesquisa com 4 de 5 respondentes gerou placar'; end if;

  raise notice 'OK piso de anonimato (5) respeitado por pilar e por pesquisa';
end $$;

\echo '== asserts: eNPS =='
do $$
declare
  v jsonb;
  v_ok boolean;
begin
  v := public.climate_survey_enps('40000000-0000-0000-0000-000000000001', 5);
  if (v ->> 'suppressed')::boolean then raise exception 'eNPS de 5 notas nao deveria ser suprimido'; end if;
  if (v ->> 'enps')::integer <> 60 then raise exception 'eNPS deveria ser 60, veio %', v ->> 'enps'; end if;
  if (v ->> 'promoters')::integer <> 4 or (v ->> 'detractors')::integer <> 1 then
    raise exception 'promotores/detratores errados: %', v;
  end if;
  if (v ->> 'total')::integer <> 5 or (v ->> 'response_count')::integer <> 5 then
    raise exception 'contagens erradas: %', v;
  end if;

  v := public.climate_survey_enps('40000000-0000-0000-0000-000000000001', 1);
  if (v ->> 'min_responses')::integer <> 5 then
    raise exception 'cliente reduziu o minimo de anonimato do eNPS: %', v;
  end if;
  if (v ->> 'suppressed')::boolean then raise exception 'eNPS nao deveria suprimir com 5 respondentes'; end if;

  v := public.climate_survey_enps('30000000-0000-0000-0000-000000000001', 5);
  if not (v ->> 'suppressed')::boolean then
    raise exception 'sem nota elegivel o eNPS deve ser suprimido, nao anunciado: %', v;
  end if;
  if (v ->> 'response_count')::integer <> 5 then
    raise exception 'response_count deveria preservar os 5 respondentes: %', v;
  end if;

  v := public.climate_survey_enps('50000000-0000-0000-0000-000000000001', 1);
  if not (v ->> 'suppressed')::boolean then raise exception '4 respondentes deveriam suprimir o eNPS: %', v; end if;
  if (v ->> 'response_count')::integer <> 4 then raise exception 'response_count esperado 4: %', v; end if;

  v_ok := false;
  begin
    perform public.climate_survey_enps('00000000-0000-0000-0000-000000000000', 5);
  exception when others then
    v_ok := sqlerrm = 'survey not found';
  end;
  if not v_ok then raise exception 'eNPS de pesquisa inexistente deveria falhar com survey not found'; end if;

  raise notice 'OK eNPS (60 com 5 notas, suprimido sem nota elegivel e com 4 respondentes)';
end $$;

\echo '== asserts: envio atomico e periodo =='
do $$
declare
  v_id uuid;
  v_rows integer;
  v_msg text;
begin
  v_msg := null;
  begin
    perform public.climate_submit_response('60000000-0000-0000-0000-000000000001',
      '[{"question_id":"6a000000-0000-0000-0000-000000000001","score":3}]'::jsonb);
  exception when others then v_msg := sqlerrm;
  end;
  if v_msg is distinct from 'survey period is over' then raise exception 'pesquisa encerrada deveria recusar envio, veio: %', coalesce(v_msg, 'sem erro'); end if;

  v_msg := null;
  begin
    perform public.climate_submit_response('70000000-0000-0000-0000-000000000001',
      '[{"question_id":"7a000000-0000-0000-0000-000000000001","score":3}]'::jsonb);
  exception when others then v_msg := sqlerrm;
  end;
  if v_msg is distinct from 'survey is not open yet' then raise exception 'pesquisa futura deveria recusar envio, veio: %', coalesce(v_msg, 'sem erro'); end if;

  v_msg := null;
  begin
    perform public.climate_submit_response('90000000-0000-0000-0000-000000000001',
      '[{"question_id":"9a000000-0000-0000-0000-000000000001","score":3}]'::jsonb);
  exception when others then v_msg := sqlerrm;
  end;
  if v_msg is distinct from 'survey is not active' then raise exception 'rascunho deveria recusar envio, veio: %', coalesce(v_msg, 'sem erro'); end if;

  v_msg := null;
  begin
    perform public.climate_submit_response('00000000-0000-0000-0000-000000000000',
      '[{"question_id":"6a000000-0000-0000-0000-000000000001","score":3}]'::jsonb);
  exception when others then v_msg := sqlerrm;
  end;
  if v_msg is distinct from 'survey not found' then raise exception 'pesquisa inexistente deveria falhar, veio: %', coalesce(v_msg, 'sem erro'); end if;

  v_msg := null;
  begin
    perform public.climate_submit_response('80000000-0000-0000-0000-000000000001', '[]'::jsonb);
  exception when others then v_msg := sqlerrm;
  end;
  if v_msg is distinct from 'answers required' then raise exception 'payload vazio deveria falhar, veio: %', coalesce(v_msg, 'sem erro'); end if;

  v_msg := null;
  begin
    perform public.climate_submit_response('80000000-0000-0000-0000-000000000001',
      '[{"question_id":"8a000000-0000-0000-0000-000000000001","score":99}]'::jsonb);
  exception when others then v_msg := sqlerrm;
  end;
  if v_msg is distinct from 'invalid answers' then raise exception 'nota fora da escala deveria falhar, veio: %', coalesce(v_msg, 'sem erro'); end if;

  v_msg := null;
  begin
    perform public.climate_submit_response('80000000-0000-0000-0000-000000000001',
      '[{"question_id":"1a000000-0000-0000-0000-000000000002","score":5}]'::jsonb);
  exception when others then v_msg := sqlerrm;
  end;
  if v_msg is distinct from 'invalid answers' then raise exception 'pergunta de outra pesquisa deveria falhar, veio: %', coalesce(v_msg, 'sem erro'); end if;

  v_id := public.climate_submit_response('80000000-0000-0000-0000-000000000001',
    '[{"question_id":"8a000000-0000-0000-0000-000000000001","score":4}]'::jsonb);
  if v_id is null then raise exception 'envio valido nao devolveu a resposta'; end if;

  select count(*) into v_rows from public.climate_survey_responses
   where survey_id = '80000000-0000-0000-0000-000000000001' and is_complete;
  if v_rows <> 2 then raise exception 'esperava 2 respostas completas em S8, veio %', v_rows; end if;

  select count(*) into v_rows from public.climate_pillar_scores
   where survey_id = '80000000-0000-0000-0000-000000000001' and response_count > 0;
  if v_rows <> 0 then raise exception 'recalculo automatico publicou placar com 2 respondentes'; end if;

  v_msg := null;
  begin
    perform public.climate_submit_response('80000000-0000-0000-0000-000000000001',
      '[{"question_id":"8a000000-0000-0000-0000-000000000001","score":5}]'::jsonb);
  exception when unique_violation then v_msg := 'duplicado';
  end;
  if v_msg is distinct from 'duplicado' then raise exception 'envio duplicado deveria violar unicidade'; end if;

  raise notice 'OK envio atomico (periodo, escala, pesquisa, duplicidade)';
end $$;

\echo '== asserts: RLS (escrita e leitura) =='
set role authenticated;
set app.is_admin = 'false';
set app.user_id = 'bbbbbbbb-0000-0000-0000-000000000001';

do $$
declare
  v_rows integer;
  v_id uuid;
  v_ok boolean;
begin
  v_ok := false;
  begin
    insert into public.climate_survey_responses (survey_id, user_id, is_complete)
    values ('80000000-0000-0000-0000-000000000001', auth.uid(), true);
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'cliente conseguiu inserir resposta direto na tabela'; end if;

  v_ok := false;
  begin
    insert into public.climate_question_answers (response_id, question_id, score)
    values ('cccccccc-1111-1111-1111-111111111111', '8a000000-0000-0000-0000-000000000001', 5);
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'cliente conseguiu inserir nota direto na tabela'; end if;

  select count(*) into v_rows from public.climate_survey_responses
   where survey_id = '80000000-0000-0000-0000-000000000001';
  if v_rows <> 0 then raise exception 'resposta de outro usuario ficou visivel: % linha(s)', v_rows; end if;

  select count(*) into v_rows from public.climate_question_answers
   where question_id = '8a000000-0000-0000-0000-000000000001';
  if v_rows <> 0 then raise exception 'nota de outro usuario ficou visivel: % linha(s)', v_rows; end if;

  update public.climate_survey_responses set is_complete = false
   where survey_id = '80000000-0000-0000-0000-000000000001';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'cliente alterou resposta alheia'; end if;

  v_ok := false;
  begin
    perform public._climate_recompute_pillar_scores('10000000-0000-0000-0000-000000000001', 5);
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'cliente chamou o recalculo interno'; end if;

  v_ok := false;
  begin
    perform public.climate_survey_enps('40000000-0000-0000-0000-000000000001', 5);
  exception when others then v_ok := sqlerrm = 'not authorized';
  end;
  if not v_ok then raise exception 'nao-admin sem vinculo leu eNPS de pesquisa alheia'; end if;

  v_ok := false;
  begin
    insert into public.climate_survey_questions (survey_id, pillar, question_text, question_type)
    values ('80000000-0000-0000-0000-000000000001', 'growth', 'Nova', 'likert_5');
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'nao-admin inseriu pergunta em pesquisa alheia'; end if;

  delete from public.climate_survey_questions where id = '8a000000-0000-0000-0000-000000000001';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'pergunta publicada foi excluida pela RLS'; end if;
  if not exists (select 1 from public.climate_survey_questions where id = '8a000000-0000-0000-0000-000000000001') then
    raise exception 'pergunta publicada sumiu';
  end if;

  -- Envio pela RPC (SECURITY DEFINER) continua funcionando.
  v_id := public.climate_submit_response('80000000-0000-0000-0000-000000000001',
    '[{"question_id":"8a000000-0000-0000-0000-000000000001","score":2}]'::jsonb);
  if v_id is null then raise exception 'RPC de envio falhou para usuario autenticado'; end if;

  select count(*) into v_rows from public.climate_survey_responses
   where survey_id = '80000000-0000-0000-0000-000000000001';
  if v_rows <> 1 then raise exception 'autor deveria ver apenas a propria resposta, viu %', v_rows; end if;

  raise notice 'OK RLS: cliente nao escreve, autor so ve a propria resposta, pergunta publicada protegida';
end $$;

-- Pergunta de rascunho continua removivel pelo criador.
delete from public.climate_survey_questions where id = '9a000000-0000-0000-0000-000000000001';
do $$
begin
  if exists (select 1 from public.climate_survey_questions where id = '9a000000-0000-0000-0000-000000000001') then
    raise exception 'criador nao conseguiu excluir pergunta de rascunho';
  end if;
  raise notice 'OK rascunho: pergunta removivel pelo criador';
end $$;

-- Admin tambem nao le identidade (6.2).
set app.is_admin = 'true';
do $$
declare v_rows integer;
begin
  select count(*) into v_rows from public.climate_survey_responses
   where survey_id = '80000000-0000-0000-0000-000000000001';
  if v_rows <> 1 then raise exception 'admin deveria ver apenas a propria resposta, viu %', v_rows; end if;
  select count(*) into v_rows from public.climate_question_answers
   where question_id = '8a000000-0000-0000-0000-000000000001';
  if v_rows <> 1 then raise exception 'admin deveria ver apenas a propria nota, viu %', v_rows; end if;
  raise notice 'OK anonimato: admin nao identifica autor';
end $$;

reset role;
\echo '== tudo OK =='