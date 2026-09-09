/**
 * Especificación de Tipos y Modelos de Datos
 * Acicalados Spa & Barber Shop - Versión 2.6
 * Moneda: Soles Peruanos (PEN) almacenado en céntimos (cents)
 * Zona Horaria: America/Lima (UTC-5)
 */

export type UserRole = 'admin' | 'recepcionista' | 'empleado' | 'cliente' | 'anon';

export type BusinessCategory = 'barberia' | 'spa' | 'mixto';

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: 'barberia' | 'spa';
  price_cents: number;
  duration_minutes: number;
  capacity: number;
  active: boolean;
  image_url: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'ceras_pomadas' | 'shampoos' | 'barba_afeitado' | 'tratamientos' | 'accesorios';
  price_cents: number;
  stock: number;
  image_url: string;
  description: string;
}

export type WardrobeStatus = 'disponible' | 'reservado' | 'en_uso' | 'mantenimiento';

export type WardrobeCategory =
  | 'Bodas y Matrimonio'
  | 'Quinceañeras'
  | 'Gala y Noche'
  | 'Trajes Típicos y Costumbristas'
  | 'Casual y Sesiones de Fotos';

export interface WardrobeItem {
  id: string;
  code?: string;
  name: string;
  category: WardrobeCategory | string;
  rental_price_cents: number;
  deposit_cents: number;
  status: WardrobeStatus;
  active?: boolean;
  image_url: string;
  size: string;
  description: string;
}

export type EmployeeType = 'barbero' | 'spa' | 'recepcionista';

export interface Employee {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  role?: 'admin' | 'recepcionista' | 'empleado';
  type: string;
  skills: string[]; // Service IDs
  active: boolean;
  handles_reception?: boolean;
  avatar_url?: string;
  avatar?: string;
  qr_code_uuid?: string;
  qr_code?: string;
  phone: string;
  dni?: string;
  email?: string;
  shift_start?: string;
  shift_end?: string;
  commission_percentage?: number;
  rotation_order?: number;
}

export type AttendanceStatus =
  | 'presente'
  | 'tardanza'
  | 'salida_temprana'
  | 'falta_justificada'
  | 'falta_injustificada'
  | 'en_permiso';

export interface EmployeeAttendance {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_type: 'barberia' | 'spa' | 'recepcion';
  date: string; // YYYY-MM-DD
  check_in: string; // HH:mm
  check_out: string | null; // HH:mm
  worked_minutes: number;
  bonus_minutes: number;
  bonus_calculation_type: 'auto' | 'manual';
  status: AttendanceStatus;
  tardy_minutes?: number;
  overtime_minutes?: number;
  justification_note?: string;
  justification_document_url?: string;
}

export interface EmployeeBlock {
  id: string;
  employee_id: string;
  employee_name?: string;
  block_date?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  leave_type?: string;
  document_url?: string;
  is_full_day?: boolean;
  status?: 'aprobado' | 'pendiente' | string;
  created_at?: string;
}

export interface BookingServiceItem {
  service_id: string;
  service_name: string;
  employee_id: string;
  employee_name: string;
  price_cents: number;
  duration_minutes: number;
  hora_inicio?: string; // HH:mm
  hora_fin?: string; // HH:mm
  start_time?: string; // HH:mm
  end_time?: string; // HH:mm
  liberado_at?: string; // If service finished early
}

export type BookingStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'expirada';
export type PaymentStatus = 'sin_pago' | 'parcial' | 'total';

export interface Booking {
  id: string;
  code: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_dni?: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  type: BusinessCategory;
  services: BookingServiceItem[];
  total_price_cents: number;
  advance_amount_cents: number; // Verificado cobrado
  status: BookingStatus;
  payment_status: PaymentStatus;
  created_at: string;
  confirmed_at?: string;
  notes?: string;
}

export interface PaymentLog {
  id: string;
  booking_id: string;
  booking_code: string;
  amount_cents: number;
  payment_method: 'yape' | 'efectivo' | 'mixto';
  cash_cents?: number;
  yape_cents?: number;
  voucher_url?: string;
  created_at: string;
  voided: boolean;
  voided_reason?: string;
  voided_by?: string;
}

export interface VentaMostrador {
  id: string;
  ticket_number: string;
  client_name: string;
  client_dni?: string;
  client_phone?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  payment_method: 'efectivo' | 'yape' | 'transferencia' | 'mixto' | 'MIXTO';
  cash_cents?: number;
  yape_cents?: number;
  transfer_cents?: number;
  monto_efectivo?: number;
  monto_yape?: number;
  monto_transferencia?: number;
  detalles_pago?: {
    efectivo?: number;
    yape?: number;
    transferencia?: number;
    metodos?: string[];
    [key: string]: any;
  };
  notes?: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'insumos'
  | 'productos'
  | 'servicios_basicos'
  | 'mantenimiento'
  | 'personal'
  | 'transporte'
  | 'otros';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount_cents: number;
  payment_method: 'efectivo' | 'yape' | 'transferencia';
  beneficiary?: string;
  voucher_url?: string;
  date: string; // YYYY-MM-DD
  voided: boolean;
  voided_reason?: string;
  voided_by?: string;
  created_at: string;
}

export interface PaymentSettings {
  advance_percentage: number; // e.g. 25
  yape_phone: string;
  yape_holder: string;
  yape_qr_url: string;
}

export interface BonusSettings {
  weekday_cutoff: string; // "21:10"
  sunday_cutoff: string; // "20:10"
}

export interface AttendanceSettings {
  id?: string;
  shift_entry_time: string; // e.g. "09:00"
  shift_exit_time: string; // e.g. "19:00"
  entry_tolerance_minutes: number; // e.g. 15
  exit_tolerance_minutes: number; // e.g. 15
}

export interface CartItem {
  product: Product;
  quantity: number;
}

/** Formateo monetario oficial en Soles Peruanos */
export function formatSoles(cents: number): string {
  const soles = cents / 100;
  return `S/ ${soles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Formateo de fecha según zona horaria oficial America/Lima */
export function formatLimaDate(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch {
    // fallback
  }
  return dateString;
}

export interface LightboxData {
  url: string;
  title: string;
  description?: string;
  category?: string;
  badge?: string;
  code?: string;
  price?: string;
  metadata?: string;
}
