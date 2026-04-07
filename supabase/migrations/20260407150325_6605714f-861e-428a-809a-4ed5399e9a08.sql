
CREATE TABLE public.pdu_outlets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outlet_number integer NOT NULL,
  device_name text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pdu_outlets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pdu outlets" ON public.pdu_outlets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pdu outlets" ON public.pdu_outlets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pdu outlets" ON public.pdu_outlets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete pdu outlets" ON public.pdu_outlets FOR DELETE TO authenticated USING (true);
