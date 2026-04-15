-- Create storage bucket for device documentation PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-docs', 'device-docs', true);

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can view device docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'device-docs');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload device docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'device-docs');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update device docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'device-docs');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete device docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'device-docs');