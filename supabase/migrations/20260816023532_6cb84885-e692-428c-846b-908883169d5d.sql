ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS preparing_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivering_at timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_ready_at timestamptz;

CREATE OR REPLACE FUNCTION public.stamp_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'preparing' AND NEW.preparing_at IS NULL THEN
      NEW.preparing_at = now();
    ELSIF NEW.status = 'ready' AND NEW.ready_at IS NULL THEN
      NEW.ready_at = now();
    ELSIF NEW.status = 'delivering' AND NEW.delivering_at IS NULL THEN
      NEW.delivering_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_stamp_status ON public.orders;
CREATE TRIGGER trg_orders_stamp_status
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.stamp_order_status_transition();