-- ==============================================================================
-- MIGRACIÓN: ENDURECIMIENTO DE SEGURIDAD EN SUPABASE STORAGE (storage.objects)
-- Destino Autorizado:
-- Organización: Manu-Crack's Org
-- Proyecto: acicaladosMej (ydvqzgyhymjgbyfkxqhd)
-- ==============================================================================

-- 1. ELIMINAR POLÍTICAS SELECT AMPLIAS EN storage.objects
-- En buckets públicos (public = true), la entrega de contenido se realiza
-- directamente mediante el endpoint CDN (/storage/v1/object/public/...) sin requerir
-- permisos de lectura en la tabla storage.objects.
-- Las políticas SELECT con rol {public} o {anon} permitían la enumeración total
-- de archivos vía list(), disparando la advertencia de seguridad de Supabase.

DROP POLICY IF EXISTS "public_read_products_images" ON storage.objects;
DROP POLICY IF EXISTS "public_read_gallery_images" ON storage.objects;
DROP POLICY IF EXISTS "public_read_employee_leaves" ON storage.objects;
DROP POLICY IF EXISTS "public_read_services_images" ON storage.objects;
DROP POLICY IF EXISTS "public_read_wardrobe_images" ON storage.objects;

-- 2. ELIMINAR POLÍTICAS DE ESCRITURA INSEGURAS ANTERIORES
-- Las políticas anteriores estaban asignadas erróneamente al rol {public} sin verificar roles.
DROP POLICY IF EXISTS "staff_upload_services_images" ON storage.objects;
DROP POLICY IF EXISTS "staff_update_services_images" ON storage.objects;
DROP POLICY IF EXISTS "staff_delete_services_images" ON storage.objects;

DROP POLICY IF EXISTS "staff_upload_wardrobe_images" ON storage.objects;
DROP POLICY IF EXISTS "staff_update_wardrobe_images" ON storage.objects;
DROP POLICY IF EXISTS "staff_delete_wardrobe_images" ON storage.objects;

DROP POLICY IF EXISTS "staff_upload_employee_leaves" ON storage.objects;
DROP POLICY IF EXISTS "staff_update_employee_leaves" ON storage.objects;
DROP POLICY IF EXISTS "staff_delete_employee_leaves" ON storage.objects;

-- Limpiar versiones previas de políticas unificadas
DROP POLICY IF EXISTS "staff_select_storage_objects" ON storage.objects;
DROP POLICY IF EXISTS "staff_insert_storage_objects" ON storage.objects;
DROP POLICY IF EXISTS "staff_update_storage_objects" ON storage.objects;
DROP POLICY IF EXISTS "staff_delete_storage_objects" ON storage.objects;

-- 3. POLÍTICAS ESTRICTAS EXCLUSIVAS PARA PERSONAL AUTENTICADO ('admin', 'recepcionista')

-- SELECT: Permitir listar/leer objetos únicamente al personal administrativo autenticado
CREATE POLICY "staff_select_storage_objects" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('services-images', 'wardrobe-images', 'products-images', 'gallery-images', 'employee-leaves')
    AND public.get_user_role() IN ('admin', 'recepcionista')
  );

-- INSERT: Permitir subir archivos en los buckets de la aplicación únicamente al personal autorizado
CREATE POLICY "staff_insert_storage_objects" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('services-images', 'wardrobe-images', 'products-images', 'gallery-images', 'employee-leaves')
    AND public.get_user_role() IN ('admin', 'recepcionista')
  );

-- UPDATE: Permitir actualizar archivos existentes únicamente al personal autorizado
CREATE POLICY "staff_update_storage_objects" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('services-images', 'wardrobe-images', 'products-images', 'gallery-images', 'employee-leaves')
    AND public.get_user_role() IN ('admin', 'recepcionista')
  )
  WITH CHECK (
    bucket_id IN ('services-images', 'wardrobe-images', 'products-images', 'gallery-images', 'employee-leaves')
    AND public.get_user_role() IN ('admin', 'recepcionista')
  );

-- DELETE: Permitir eliminar archivos de los buckets únicamente al personal autorizado
CREATE POLICY "staff_delete_storage_objects" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('services-images', 'wardrobe-images', 'products-images', 'gallery-images', 'employee-leaves')
    AND public.get_user_role() IN ('admin', 'recepcionista')
  );
