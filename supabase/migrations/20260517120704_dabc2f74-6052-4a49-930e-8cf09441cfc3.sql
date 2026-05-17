-- Create coupons table
CREATE TABLE public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL,
    min_order_cents INTEGER DEFAULT 0,
    max_discount_cents INTEGER,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Everyone can view active coupons
CREATE POLICY "Coupons are viewable by everyone" 
ON public.coupons FOR SELECT 
USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- Add index to orders for customer lookup
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- Add coupon_id and discount_cents to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id),
ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0;

-- Insert some demo coupons
INSERT INTO public.coupons (code, description, discount_type, value, min_order_cents)
VALUES 
('EMBER10', '10% de desconto no seu primeiro pedido', 'percentage', 10, 0),
('BURGER5', 'R$ 5,00 de desconto em compras acima de R$ 50', 'fixed', 500, 5000);