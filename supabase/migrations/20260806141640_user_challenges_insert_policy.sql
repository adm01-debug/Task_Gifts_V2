-- Restore INSERT on user_challenges for the authenticated user (their own rows).
-- Reason: autoChallengesService.generateWeeklyChallenges runs on the client
-- (anon key) and inserts the user's own weekly challenges. The previous
-- hardening migration (20260728190509) revoked INSERT FROM authenticated,
-- so the policy would have been inert anyway. We grant the privilege back
-- and add an explicit INSERT policy so users can only write their own rows.

GRANT INSERT ON public.user_challenges TO authenticated;

DROP POLICY IF EXISTS "Users can insert their own challenges" ON public.user_challenges;

CREATE POLICY "Users can insert their own challenges"
ON public.user_challenges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
</content>
</invoke>