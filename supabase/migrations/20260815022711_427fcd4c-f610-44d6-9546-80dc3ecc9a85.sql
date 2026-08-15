CREATE TABLE public.product_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_addons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_addons TO authenticated;
GRANT ALL ON public.product_addons TO service_role;

ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addons readable by all" ON public.product_addons FOR SELECT USING (true);
CREATE POLICY "Admins manage addons" ON public.product_addons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_product_addons_updated BEFORE UPDATE ON public.product_addons
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_product_addons_product ON public.product_addons(product_id);

ALTER TABLE public.order_items ADD COLUMN addons_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb;