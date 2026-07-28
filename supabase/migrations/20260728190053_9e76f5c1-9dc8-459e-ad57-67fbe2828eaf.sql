DROP POLICY IF EXISTS "board_tiles_select" ON public.board_tiles;
CREATE POLICY "board_tiles_select" ON public.board_tiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.board_trails t
    WHERE t.id = board_tiles.trail_id
      AND (t.status = 'active' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  ));