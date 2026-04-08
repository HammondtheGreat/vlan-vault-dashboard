
CREATE TABLE public.wireless_networks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ssid TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wireless_networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view wireless networks" ON public.wireless_networks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert wireless networks" ON public.wireless_networks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update wireless networks" ON public.wireless_networks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete wireless networks" ON public.wireless_networks FOR DELETE TO authenticated USING (true);
