CREATE TABLE public.loyalty_accounts (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_balance integer NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','prata','ouro')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_accounts TO authenticated;
GRANT ALL ON public.loyalty_accounts TO service_role;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own loyalty account" ON public.loyalty_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earn','redeem','adjustment')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own loyalty transactions" ON public.loyalty_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_loyalty_tx_user_created ON public.loyalty_transactions (user_id, created_at DESC);

CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cost_points integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_rewards TO authenticated;
GRANT ALL ON public.loyalty_rewards TO service_role;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read active rewards" ON public.loyalty_rewards FOR SELECT TO authenticated USING (active = true);

INSERT INTO public.loyalty_rewards (name, cost_points, active) VALUES
  ('1 Batata Rústica', 800, true),
  ('1 Milkshake', 1800, true),
  ('1 Combo Ember Grátis', 3500, true),
  ('1 Sobremesa da Casa', 1200, true);

CREATE OR REPLACE FUNCTION public.loyalty_tier_for(_points integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN _points >= 3000 THEN 'ouro' WHEN _points >= 1000 THEN 'prata' ELSE 'bronze' END
$$;

CREATE OR REPLACE FUNCTION public.credit_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pts integer;
BEGIN
  _pts := floor(NEW.total_cents / 100.0);
  IF _pts <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.loyalty_transactions (user_id, order_id, points, type)
  VALUES (NEW.customer_id, NEW.id, _pts, 'earn');

  INSERT INTO public.loyalty_accounts (user_id, points_balance, tier, updated_at)
  VALUES (NEW.customer_id, _pts, public.loyalty_tier_for(_pts), now())
  ON CONFLICT (user_id) DO UPDATE
    SET points_balance = public.loyalty_accounts.points_balance + EXCLUDED.points_balance,
        tier = public.loyalty_tier_for(public.loyalty_accounts.points_balance + EXCLUDED.points_balance),
        updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_credit_loyalty
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW
WHEN (NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' AND NEW.customer_id IS NOT NULL)
EXECUTE FUNCTION public.credit_loyalty_points();

CREATE OR REPLACE FUNCTION public.redeem_loyalty_reward(reward_id uuid)
RETURNS public.loyalty_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _cost integer;
  _acct public.loyalty_accounts;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT cost_points INTO _cost FROM public.loyalty_rewards WHERE id = reward_id AND active = true;
  IF _cost IS NULL THEN
    RAISE EXCEPTION 'Recompensa indisponível';
  END IF;

  SELECT * INTO _acct FROM public.loyalty_accounts WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saldo de pontos insuficiente';
  END IF;

  IF _acct.points_balance < _cost THEN
    RAISE EXCEPTION 'Saldo de pontos insuficiente';
  END IF;

  INSERT INTO public.loyalty_transactions (user_id, order_id, points, type)
  VALUES (_uid, NULL, -_cost, 'redeem');

  UPDATE public.loyalty_accounts
     SET points_balance = points_balance - _cost,
         tier = public.loyalty_tier_for(points_balance - _cost),
         updated_at = now()
   WHERE user_id = _uid
   RETURNING * INTO _acct;

  RETURN _acct;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_loyalty_reward(uuid) TO authenticated;