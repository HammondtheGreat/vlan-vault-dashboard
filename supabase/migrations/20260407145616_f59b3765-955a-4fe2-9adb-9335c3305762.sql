
CREATE TABLE public.cable_drops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  switch_model text NOT NULL DEFAULT '',
  switch_port text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cable_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cable drops" ON public.cable_drops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cable drops" ON public.cable_drops FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cable drops" ON public.cable_drops FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cable drops" ON public.cable_drops FOR DELETE TO authenticated USING (true);
