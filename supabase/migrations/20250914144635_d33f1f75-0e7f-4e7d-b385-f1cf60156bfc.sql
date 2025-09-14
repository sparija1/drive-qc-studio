-- Fix audit log trigger to handle service role calls
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values, new_values)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, new_values)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), TG_TABLE_NAME, NEW.id, 'create', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$