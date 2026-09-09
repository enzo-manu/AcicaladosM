/**
 * Utilidades de cálculo de disponibilidad y aforo en tiempo real para reservas
 * Acicalados Spa & Barber Shop
 * Zona Horaria: America/Lima (UTC-5)
 * Bloques de 30 minutos (09:00 a 20:30 hrs)
 */

import { Service, Employee, EmployeeBlock, Booking } from '../types';

export const BUSINESS_HOURS = {
  open: '09:00',
  close: '21:00',
  openMinutes: 9 * 60, // 540
  closeMinutes: 21 * 60, // 1260
  slotIntervalMinutes: 30,
};

// Generar los 24 bloques exactos de 30 minutos desde 09:00 hasta 20:30
export const ALL_30MIN_SLOTS: string[] = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30',
];

export type SlotStatus = 'disponible' | 'pasado' | 'lleno';
export type SlotStatusLabel = 'Libre' | 'Pasado' | 'Lleno';

export interface ServiceExecutionPlan {
  serviceId: string;
  serviceName: string;
  employeeId: string;
  employeeName: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  priceCents: number;
}

export interface ComputedSlot {
  time: string; // HH:mm
  status: SlotStatus;
  statusLabel: SlotStatusLabel;
  isSelectable: boolean;
  totalDurationMinutes: number;
  overallEndTime: string;
  servicePlans?: ServiceExecutionPlan[];
  reason?: string;
}

/**
 * Convierte un string de hora "HH:mm" a minutos desde medianoche
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.substring(0, 5).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convierte minutos desde medianoche a formato "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Obtiene la fecha y hora oficial en zona horaria America/Lima (UTC-5)
 */
export function getLimaDateTime(dateOverride?: Date): {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  totalMinutes: number;
} {
  const d = dateOverride || new Date();
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const timeStr = d.toLocaleTimeString('en-GB', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return {
    dateStr,
    timeStr,
    totalMinutes: timeToMinutes(timeStr),
  };
}

/**
 * Determina los colaboradores activos aptos para brindar un servicio específico
 */
export function getEligibleEmployeesForService(
  service: Service,
  employees: Employee[]
): Employee[] {
  if (!employees || employees.length === 0) return [];

  // 1. Coincidencia directa por habilidades asignadas (skills)
  const withSkill = employees.filter(
    (e) => e.active && e.skills && e.skills.includes(service.id)
  );
  if (withSkill.length > 0) return withSkill;

  // 2. Coincidencia por tipo/categoría de servicio (barbero para barbería, spa para spa)
  const matchingCategory = employees.filter((e) => {
    if (!e.active) return false;
    if (e.type === 'recepcionista' || e.role === 'recepcionista') return false;
    if (service.category === 'barberia') {
      return e.type === 'barbero' || e.type === 'barberia';
    }
    if (service.category === 'spa') {
      return e.type === 'spa';
    }
    return true;
  });
  if (matchingCategory.length > 0) return matchingCategory;

  // 3. Fallback: cualquier colaborador activo que no sea recepcionista
  return employees.filter(
    (e) => e.active && e.type !== 'recepcionista' && e.role !== 'recepcionista'
  );
}

/**
 * Verifica si un colaborador tiene un permiso o bloqueo aprobado en el intervalo
 */
export function isEmployeeBlocked(
  empId: string,
  date: string,
  startMin: number,
  endMin: number,
  employeeBlocks: EmployeeBlock[]
): boolean {
  if (!employeeBlocks || employeeBlocks.length === 0) return false;

  return employeeBlocks.some((b) => {
    if (b.employee_id !== empId) return false;
    if (b.status && b.status !== 'aprobado' && b.status !== 'activo') return false;

    const bDate = b.block_date || b.date || b.start_date;
    const bEndDate = b.end_date || bDate;
    const inDateRange =
      bDate && bEndDate ? date >= bDate && date <= bEndDate : bDate === date;
    if (!inDateRange) return false;

    // Bloqueo de día completo
    if (b.is_full_day || (!b.start_time && !b.end_time)) return true;

    const bStart = timeToMinutes(b.start_time || '00:00');
    const bEnd = timeToMinutes(b.end_time || '23:59');

    // Solapamiento de intervalos [startMin, endMin) con [bStart, bEnd)
    return startMin < bEnd && endMin > bStart;
  });
}

/**
 * Verifica si un colaborador ya tiene una cita asignada en ese intervalo
 */
export function isEmployeeBooked(
  empId: string,
  date: string,
  startMin: number,
  endMin: number,
  bookings: Booking[]
): boolean {
  if (!bookings || bookings.length === 0) return false;

  return bookings.some((b) => {
    if (b.date !== date) return false;
    if (b.status === 'cancelada' || b.status === 'expirada') return false;

    // Verificar si el colaborador está asignado a nivel de reserva general
    const isMainAssigned = (b as any).assigned_employee_id === empId;

    // Verificar si el colaborador está asignado a nivel de algún servicio específico
    const matchingService = b.services?.find((s) => s.employee_id === empId);

    if (!isMainAssigned && !matchingService) return false;

    // Si el servicio tiene horario individual asignado
    if (matchingService && (matchingService.hora_inicio || matchingService.start_time)) {
      const sStart = timeToMinutes(
        matchingService.hora_inicio || matchingService.start_time || b.start_time
      );
      const sEnd = timeToMinutes(
        matchingService.hora_fin || matchingService.end_time || b.end_time
      );
      return startMin < sEnd && endMin > sStart;
    }

    // Intervalo general de la reserva
    const bStart = timeToMinutes(b.start_time);
    const bEnd = timeToMinutes(b.end_time);
    return startMin < bEnd && endMin > bStart;
  });
}

/**
 * Cuenta reservas activas no asignadas que solapan el intervalo para el mismo tipo de servicio
 */
export function countUnassignedBookings(
  service: Service,
  date: string,
  startMin: number,
  endMin: number,
  bookings: Booking[]
): number {
  if (!bookings || bookings.length === 0) return 0;

  return bookings.filter((b) => {
    if (b.date !== date) return false;
    if (b.status === 'cancelada' || b.status === 'expirada') return false;

    // Si no tiene asignado colaborador principal ni en servicios
    const hasAssigned =
      !!(b as any).assigned_employee_id ||
      b.services?.some((s) => !!s.employee_id && s.employee_id.trim() !== '');
    if (hasAssigned) return false;

    // Verificar coincidencia de tipo/categoría
    const isCategoryMatch =
      b.type === 'mixto' ||
      (service.category === 'barberia' && b.type === 'barberia') ||
      (service.category === 'spa' && b.type === 'spa');
    if (!isCategoryMatch) return false;

    const bStart = timeToMinutes(b.start_time);
    const bEnd = timeToMinutes(b.end_time);
    return startMin < bEnd && endMin > bStart;
  }).length;
}

/**
 * Calcula la disponibilidad completa de todos los slots de 30 minutos
 * considerando la fecha seleccionada, hora actual en Lima, y capacidad por especialista
 */
export function computeSlotsAvailability(params: {
  bookingDate: string; // YYYY-MM-DD
  selectedServices: Service[];
  employees: Employee[];
  employeeBlocks: EmployeeBlock[];
  bookings: Booking[];
  currentLimaDateTime?: { dateStr: string; timeStr: string; totalMinutes: number };
}): ComputedSlot[] {
  const {
    bookingDate,
    selectedServices,
    employees,
    employeeBlocks,
    bookings,
    currentLimaDateTime,
  } = params;

  const limaNow = currentLimaDateTime || getLimaDateTime();
  const isSelectedDateToday = bookingDate === limaNow.dateStr;
  const isSelectedDatePast = bookingDate < limaNow.dateStr;

  // Si no hay servicios seleccionados, duración estimada de 45 min
  const effectiveServices: Service[] =
    selectedServices.length > 0
      ? selectedServices
      : [
          {
            id: 'default-service',
            name: 'Servicio Estándar',
            slug: 'servicio-estandar',
            category: 'barberia',
            price_cents: 3500,
            duration_minutes: 45,
            capacity: 1,
            active: true,
            image_url: '',
            description: '',
          },
        ];

  const totalDuration = effectiveServices.reduce(
    (acc, s) => acc + (s.duration_minutes || 30),
    0
  );

  return ALL_30MIN_SLOTS.map((slotTime) => {
    const slotStartMin = timeToMinutes(slotTime);
    const overallEndMin = slotStartMin + totalDuration;
    const overallEndTime = minutesToTime(overallEndMin);

    // 1. REGLA DE TIEMPO REAL (ZONA HORARIA AMERICA/LIMA UTC-5):
    // Si la fecha es anterior a hoy, o si es hoy y el slot es menor o igual a la hora actual
    if (isSelectedDatePast) {
      return {
        time: slotTime,
        status: 'pasado',
        statusLabel: 'Pasado',
        isSelectable: false,
        totalDurationMinutes: totalDuration,
        overallEndTime,
        reason: 'Fecha anterior transcurrida',
      };
    }

    if (isSelectedDateToday && slotStartMin <= limaNow.totalMinutes) {
      return {
        time: slotTime,
        status: 'pasado',
        statusLabel: 'Pasado',
        isSelectable: false,
        totalDurationMinutes: totalDuration,
        overallEndTime,
        reason: 'Hora pasada en tiempo real (UTC-5)',
      };
    }

    // 2. REGLA DE HORARIO DE ATENCIÓN:
    // El servicio completo no puede exceder las 21:00 (hora de cierre)
    if (overallEndMin > BUSINESS_HOURS.closeMinutes) {
      return {
        time: slotTime,
        status: 'lleno',
        statusLabel: 'Lleno',
        isSelectable: false,
        totalDurationMinutes: totalDuration,
        overallEndTime,
        reason: 'Excede el horario de cierre (21:00 hrs)',
      };
    }

    // 3. REGLA DE CONCURRENCIA EQUITATIVA Y CAPACIDAD POR ESPECIALISTA:
    // Evaluar cada servicio de forma independiente y secuencial
    let currentServiceStartMin = slotStartMin;
    const servicePlans: ServiceExecutionPlan[] = [];
    let hasCapacityForAllServices = true;
    let bottleneckReason = '';

    for (const srv of effectiveServices) {
      const srvDuration = srv.duration_minutes || 30;
      const srvEndMin = currentServiceStartMin + srvDuration;

      // Especialistas aptos y activos para este servicio
      const eligibleEmps = getEligibleEmployeesForService(srv, employees);

      if (eligibleEmps.length === 0) {
        hasCapacityForAllServices = false;
        bottleneckReason = `Sin especialistas aptos para ${srv.name}`;
        break;
      }

      // Filtrar especialistas que estén libres en la ventana [currentServiceStartMin, srvEndMin)
      const freeSpecialists = eligibleEmps.filter((emp) => {
        // Bloqueos/permisos del colaborador
        const blocked = isEmployeeBlocked(
          emp.id,
          bookingDate,
          currentServiceStartMin,
          srvEndMin,
          employeeBlocks
        );
        if (blocked) return false;

        // Citas ya agendadas
        const booked = isEmployeeBooked(
          emp.id,
          bookingDate,
          currentServiceStartMin,
          srvEndMin,
          bookings
        );
        if (booked) return false;

        return true;
      });

      // Contar reservas sin asignar que compiten por el mismo cupo
      const unassignedCount = countUnassignedBookings(
        srv,
        bookingDate,
        currentServiceStartMin,
        srvEndMin,
        bookings
      );

      const netAvailableCount = Math.max(0, freeSpecialists.length - unassignedCount);

      if (netAvailableCount === 0 || freeSpecialists.length === 0) {
        hasCapacityForAllServices = false;
        bottleneckReason = `Aforo completo para ${srv.name}`;
        break;
      }

      // Seleccionar el primer especialista libre disponible para este servicio
      const selectedEmp = freeSpecialists[0];
      servicePlans.push({
        serviceId: srv.id,
        serviceName: srv.name,
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.full_name,
        startTime: minutesToTime(currentServiceStartMin),
        endTime: minutesToTime(srvEndMin),
        durationMinutes: srvDuration,
        priceCents: srv.price_cents,
      });

      // El siguiente servicio inicia cuando concluye el actual
      currentServiceStartMin = srvEndMin;
    }

    if (!hasCapacityForAllServices) {
      return {
        time: slotTime,
        status: 'lleno',
        statusLabel: 'Lleno',
        isSelectable: false,
        totalDurationMinutes: totalDuration,
        overallEndTime,
        reason: bottleneckReason || 'Aforo completo',
      };
    }

    return {
      time: slotTime,
      status: 'disponible',
      statusLabel: 'Libre',
      isSelectable: true,
      totalDurationMinutes: totalDuration,
      overallEndTime,
      servicePlans,
    };
  });
}
