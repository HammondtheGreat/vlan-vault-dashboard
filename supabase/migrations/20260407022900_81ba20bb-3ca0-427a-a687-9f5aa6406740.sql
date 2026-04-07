
-- VLANs table
CREATE TABLE public.vlans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vlan_id integer NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  subnet text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'var(--vlan-infra)',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vlans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vlans" ON public.vlans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vlans" ON public.vlans
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vlans" ON public.vlans
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete vlans" ON public.vlans
  FOR DELETE TO authenticated USING (true);

-- Devices table
CREATE TABLE public.devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vlan_id integer NOT NULL REFERENCES public.vlans(vlan_id) ON DELETE CASCADE,
  ip_address text NOT NULL DEFAULT '',
  device_name text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  docs text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view devices" ON public.devices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert devices" ON public.devices
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update devices" ON public.devices
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete devices" ON public.devices
  FOR DELETE TO authenticated USING (true);

-- Audit log table
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert audit log" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_devices_vlan_id ON public.devices(vlan_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
