
CREATE TABLE public.rack_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  start_u INTEGER NOT NULL,
  u_size INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rack_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rack items" ON public.rack_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert rack items" ON public.rack_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update rack items" ON public.rack_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete rack items" ON public.rack_items FOR DELETE TO authenticated USING (true);
