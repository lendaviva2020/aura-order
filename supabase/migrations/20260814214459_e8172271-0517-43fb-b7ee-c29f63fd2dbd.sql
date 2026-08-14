REVOKE ALL ON FUNCTION public.loyalty_tier_for(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.credit_loyalty_points() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_loyalty_reward(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_reward(uuid) TO authenticated;