from supabase_snapshot.snapshot import _interpolar

def test_interpolar_literal():
    assert _interpolar("WHERE extname = %s", ("pg_cron",)) == "WHERE extname = 'pg_cron'"

def test_interpolar_escapa_aspa():
    assert _interpolar("WHERE x = %s", ("it's",)) == "WHERE x = 'it''s'"

def test_interpolar_numero_sem_aspas():
    assert _interpolar("WHERE rn <= %s", (3,)) == "WHERE rn <= 3"

def test_interpolar_preserva_percentual_do_like():
    assert _interpolar("WHERE a LIKE 'pg_%%'", ()) == "WHERE a LIKE 'pg_%'"

def test_interpolar_lista_vira_array():
    assert _interpolar("WHERE a IN %s", (["a"],)) == "WHERE a IN ARRAY['a']"
