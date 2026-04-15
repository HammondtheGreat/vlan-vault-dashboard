UPDATE public.profiles SET display_name = subq.full_name
FROM (
  SELECT id, raw_user_meta_data->>'full_name' AS full_name
  FROM auth.users
  WHERE raw_user_meta_data->>'full_name' IS NOT NULL
    AND raw_user_meta_data->>'full_name' != ''
) subq
WHERE profiles.user_id = subq.id
  AND (profiles.display_name IS NULL OR profiles.display_name = '' OR profiles.display_name LIKE '%@%');