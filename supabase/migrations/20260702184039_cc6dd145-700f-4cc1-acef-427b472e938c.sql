
ALTER TABLE public.users_registry
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS users_registry_user_id_key
  ON public.users_registry(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.clear_must_change_password()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.users_registry
     SET must_change_password = false, updated_at = now()
   WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_must_change_password() TO authenticated;
