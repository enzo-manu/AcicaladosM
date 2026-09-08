-- ==============================================================================
-- MIGRACIÓN DE ROLES, TRIGGER Y POLÍTICAS RLS ESTRICTAS
-- Destino Autorizado:
-- Organización: Manu-Crack's Org
-- Proyecto: acicaladosMej (ydvqzgyhymjgbyfkxqhd)
-- ==============================================================================

-- 1. ACTUALIZAR FUNCIÓN Y TRIGGER handle_new_user EN auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role text := 'cliente';
  user_email text;
BEGIN
  user_email := LOWER(COALESCE(NEW.email, ''));

  -- Asignación estricta de roles específicos
  IF user_email = 'enzocostareyes@gmail.com' THEN
    assigned_role := 'admin';
  ELSIF user_email = 'spaicort@gmail.com' THEN
    assigned_role := 'recepcionista';
  ELSE
    assigned_role := 'cliente';
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      substr(
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        length(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)) + 2
      ),
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = CASE WHEN EXCLUDED.first_name <> '' THEN EXCLUDED.first_name ELSE public.profiles.first_name END,
    last_name = CASE WHEN EXCLUDED.last_name <> '' THEN EXCLUDED.last_name ELSE public.profiles.last_name END,
    avatar_url = CASE WHEN EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url ELSE public.profiles.avatar_url END,
    role = assigned_role;

  RETURN NEW;
END;
$$;

-- Asegurar que el trigger esté asignado a auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. ACTUALIZAR PERFILES EXISTENTES EN public.profiles
-- Rol Administrador
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE LOWER(email) = 'enzocostareyes@gmail.com'
);

-- Rol Recepcionista
UPDATE public.profiles
SET role = 'recepcionista'
WHERE id IN (
  SELECT id FROM auth.users WHERE LOWER(email) = 'spaicort@gmail.com'
);

-- Demás usuarios como cliente
UPDATE public.profiles
SET role = 'cliente'
WHERE id NOT IN (
  SELECT id FROM auth.users WHERE LOWER(email) IN ('enzocostareyes@gmail.com', 'spaicort@gmail.com')
);

-- 3. ENDURECER POLÍTICAS RLS EN public.bookings
-- Asegurar que RLS esté habilitado
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas permisivas residuales
DROP POLICY IF EXISTS "bookings_delete_all" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_all" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_all" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_admin_recep" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_employee_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_all" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_strict" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_strict" ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete_strict" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_strict" ON public.bookings;

-- SELECT: 'admin' y 'recepcionista' pueden ver todo; 'cliente' solo sus citas; empleado solo las asignadas
CREATE POLICY "bookings_select_strict" ON public.bookings
  FOR SELECT
  TO public
  USING (
    (private.get_user_role() IN ('admin', 'recepcionista'))
    OR (user_id = (SELECT auth.uid()))
    OR (client_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())))
    OR (
      (private.get_user_role() = 'empleado') 
      AND (assigned_employee_id IN (SELECT id FROM public.employees WHERE profile_id = (SELECT auth.uid())))
    )
  );

-- INSERT: Permitido para creación pública y por personal de recepción/admin
CREATE POLICY "bookings_insert_strict" ON public.bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- UPDATE: Exclusivo para 'admin' y 'recepcionista'
CREATE POLICY "bookings_update_strict" ON public.bookings
  FOR UPDATE
  TO public
  USING (
    private.get_user_role() IN ('admin', 'recepcionista')
  )
  WITH CHECK (
    private.get_user_role() IN ('admin', 'recepcionista')
  );

-- DELETE: Exclusivo para 'admin'. Recepcionista tiene estrictamente prohibido el borrado.
CREATE POLICY "bookings_delete_strict" ON public.bookings
  FOR DELETE
  TO public
  USING (
    private.get_user_role() = 'admin'
  );

-- 4. ENDURECER POLÍTICAS RLS EN public.booking_services
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas permisivas residuales
DROP POLICY IF EXISTS "booking_services_delete_all" ON public.booking_services;
DROP POLICY IF EXISTS "booking_services_update_all" ON public.booking_services;
DROP POLICY IF EXISTS "booking_services_select_all" ON public.booking_services;
DROP POLICY IF EXISTS "booking_services_insert_all" ON public.booking_services;
DROP POLICY IF EXISTS "booking_services_select_strict" ON public.booking_services;
DROP POLICY IF EXISTS "booking_services_insert_strict" ON public.booking_services;
DROP POLICY IF EXISTS "booking_services_update_strict" ON public.booking_services;
DROP POLICY IF EXISTS "booking_services_delete_strict" ON public.booking_services;

-- SELECT: Permitido para lectura del detalle
CREATE POLICY "booking_services_select_strict" ON public.booking_services
  FOR SELECT
  TO public
  USING (
    (private.get_user_role() IN ('admin', 'recepcionista'))
    OR EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_services.booking_id 
      AND (b.user_id = (SELECT auth.uid()) OR (SELECT auth.uid()) IS NULL)
    )
  );

-- INSERT: Permitido para asociar servicios al crear reserva
CREATE POLICY "booking_services_insert_strict" ON public.booking_services
  FOR INSERT
  TO public
  WITH CHECK (true);

-- UPDATE: Permitido para 'admin' y 'recepcionista' (cambios de estado y liberación de horarios)
CREATE POLICY "booking_services_update_strict" ON public.booking_services
  FOR UPDATE
  TO public
  USING (
    private.get_user_role() IN ('admin', 'recepcionista')
  )
  WITH CHECK (
    private.get_user_role() IN ('admin', 'recepcionista')
  );

-- DELETE: Exclusivo para 'admin'
CREATE POLICY "booking_services_delete_strict" ON public.booking_services
  FOR DELETE
  TO public
  USING (
    private.get_user_role() = 'admin'
  );
