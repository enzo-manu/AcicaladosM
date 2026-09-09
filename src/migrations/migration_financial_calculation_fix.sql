-- ==============================================================================
-- MIGRACIÓN: AJUSTE DE CÁLCULO FINANCIERO Y FUNCIÓN RPC DE BALANCES REALES
-- Destino Autorizado:
-- Organización: Manu-Crack's Org
-- Proyecto: acicaladosMej (ydvqzgyhymjgbyfkxqhd)
--
-- Regla de Negocio Estricta:
-- Solo se computa dinero real efectivamente cobrado:
-- - Citas en estado "PAGADO" (total, completada, o advance >= total): suma 100% de total_price_cents
-- - Citas con adelanto (pago parcial): suma ÚNICAMENTE advance_amount_cents
-- - Citas pendientes o sin abono (o canceladas/expiradas): aporta S/ 0.00
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_financial_balances(p_date date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ingresos_servicios integer := 0;
  v_ventas_mostrador integer := 0;
  v_egresos integer := 0;
  v_total_ingresos integer := 0;
  v_balance_neto integer := 0;
BEGIN
  -- 1. Citas activas: Si está pagada total -> total_price_cents; si tiene adelanto -> advance_amount_cents; si no -> 0
  SELECT COALESCE(SUM(
    CASE 
      WHEN status IN ('cancelada', 'expirada') THEN 0
      WHEN payment_status = 'total' OR status = 'completada' OR COALESCE(advance_amount_cents, 0) >= COALESCE(total_price_cents, 0)
        THEN GREATEST(COALESCE(total_price_cents, 0), COALESCE(advance_amount_cents, 0))
      WHEN COALESCE(advance_amount_cents, 0) > 0 OR payment_status = 'parcial'
        THEN LEAST(COALESCE(advance_amount_cents, 0), COALESCE(total_price_cents, advance_amount_cents))
      ELSE 0
    END
  ), 0)
  INTO v_ingresos_servicios
  FROM public.bookings
  WHERE (p_date IS NULL OR booking_date = p_date);

  -- 2. Ventas mostrador concluidas
  SELECT COALESCE(SUM(ROUND(COALESCE(total, 0) * 100)::integer), 0)
  INTO v_ventas_mostrador
  FROM public.ventas_mostrador
  WHERE (p_date IS NULL OR COALESCE(fecha, created_at)::date = p_date);

  -- 3. Egresos operativos activos
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_egresos
  FROM public.expenses
  WHERE (status IS NULL OR status <> 'voided')
    AND voided_at IS NULL
    AND (p_date IS NULL OR expense_date = p_date OR (expense_date IS NULL AND created_at::date = p_date));

  v_total_ingresos := v_ingresos_servicios + v_ventas_mostrador;
  v_balance_neto := v_total_ingresos - v_egresos;

  RETURN json_build_object(
    'ingresos_servicios_cents', v_ingresos_servicios,
    'ventas_mostrador_cents', v_ventas_mostrador,
    'total_ingresos_cents', v_total_ingresos,
    'total_egresos_cents', v_egresos,
    'balance_neto_cents', v_balance_neto
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_balances(date) TO authenticated, anon, service_role;
