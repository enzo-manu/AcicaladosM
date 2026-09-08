import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserRole,
  Service,
  Product,
  WardrobeItem,
  Employee,
  Booking,
  PaymentLog,
  VentaMostrador,
  Expense,
  EmployeeAttendance,
  PaymentSettings,
  BonusSettings,
  CartItem,
  BookingStatus,
  WardrobeStatus,
} from '../types';
import {
  INITIAL_SERVICES,
  INITIAL_PRODUCTS,
  INITIAL_WARDROBE,
  INITIAL_EMPLOYEES,
  INITIAL_BOOKINGS,
  INITIAL_PAYMENT_LOGS,
  INITIAL_VENTAS_MOSTRADOR,
  INITIAL_EXPENSES,
  INITIAL_ATTENDANCE,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_BONUS_SETTINGS,
  getTodayDateString,
} from '../data/initialData';

interface AppContextType {
  // Navigation & Role
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: UserRole;
  };

  // Data Collections
  services: Service[];
  products: Product[];
  wardrobe: WardrobeItem[];
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  bookings: Booking[];
  paymentLogs: PaymentLog[];
  ventasMostrador: VentaMostrador[];
  expenses: Expense[];
  attendance: EmployeeAttendance[];
  attendanceRecords: EmployeeAttendance[];
  paymentSettings: PaymentSettings;
  bonusSettings: BonusSettings;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Thermal Ticket State
  activeTicket: { type: 'booking' | 'venta'; data: Booking | VentaMostrador } | null;
  openTicketModal: (type: 'booking' | 'venta' | 'pos', data: Booking | VentaMostrador) => void;
  closeTicketModal: () => void;

  // Realtime Simulation
  realtimeConnected: boolean;
  pulseRealtime: () => void;
  lastSyncTimestamp: Date;

  // Business Action Handlers
  addBooking: (booking: Omit<Booking, 'id' | 'code' | 'created_at'>) => Booking;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  registerBookingPayment: (
    bookingId: string,
    amountCents: number,
    method: 'yape' | 'efectivo' | 'mixto',
    cashCents?: number,
    yapeCents?: number,
    voucherUrl?: string
  ) => void;
  voidPayment: (paymentId: string, reason: string) => void;
  liberateServiceEarly: (bookingId: string, serviceIndex: number) => void;

  // POS
  registerVentaMostrador: (venta: Omit<VentaMostrador, 'id' | 'ticket_number' | 'created_at'>) => VentaMostrador;
  registerCounterSale: (venta: Omit<VentaMostrador, 'id' | 'ticket_number' | 'created_at'>) => VentaMostrador;
  deleteVentaMostrador: (id: string) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'voided'>) => void;
  voidExpense: (expenseId: string, reason: string) => void;

  // Employees & Attendance
  addEmployee: (emp: Omit<Employee, 'id' | 'qr_code_uuid'>) => void;
  updateEmployee: (emp: Employee) => void;
  toggleEmployeeActive: (empId: string) => void;
  scanAttendanceQR: (qrCode: string) => { success: boolean; message: string; employee?: Employee; type?: 'check_in' | 'check_out' };
  registerAttendancePunch: (employeeId: string, punchType: 'check_in' | 'check_out') => void;
  manualAdjustBonus: (attendanceId: string, newBonusMinutes: number, reason: string) => void;
  submitJustification: (attendanceId: string, note: string, docUrl?: string) => void;

  // Settings
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => void;
  updateBonusSettings: (settings: Partial<BonusSettings>) => void;

  // Catalog CRUD
  addService: (srv: Omit<Service, 'id'>) => void;
  updateService: (srv: Service) => void;
  addProduct: (prod: Omit<Product, 'id'>) => void;
  updateProduct: (prod: Product) => void;
  addWardrobeItem: (item: Omit<WardrobeItem, 'id'>) => void;
  updateWardrobeItem: (item: WardrobeItem) => void;
  updateWardrobeStatus: (id: string, status: WardrobeStatus) => void;

  // KPI Calculations
  kpis: {
    totalIngresosCents: number;
    totalEgresosCents: number;
    balanceNetoCents: number;
    citasHoyCount: number;
    citasConfirmadasCount: number;
    saldosPorCobrarCents: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>('admin');
  const [activeView, setActiveView] = useState<string>('/dashboard');
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(INITIAL_WARDROBE);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>(INITIAL_PAYMENT_LOGS);
  const [ventasMostrador, setVentasMostrador] = useState<VentaMostrador[]>(INITIAL_VENTAS_MOSTRADOR);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [attendance, setAttendance] = useState<EmployeeAttendance[]>(INITIAL_ATTENDANCE);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(INITIAL_PAYMENT_SETTINGS);
  const [bonusSettings, setBonusSettings] = useState<BonusSettings>(INITIAL_BONUS_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<{ type: 'booking' | 'venta'; data: Booking | VentaMostrador } | null>(null);
  const [realtimeConnected] = useState<boolean>(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date>(new Date());

  const pulseRealtime = useCallback(() => {
    setLastSyncTimestamp(new Date());
  }, []);

  // Sync user profile with role
  const currentUser = useMemo(() => {
    switch (currentRole) {
      case 'admin':
        return {
          id: 'emp-5',
          name: 'Enzo Costa Reyes',
          email: 'admin@acicalados.pe',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
          role: 'admin' as UserRole,
        };
      case 'recepcionista':
        return {
          id: 'emp-4',
          name: 'Camila Zúñiga Paredes',
          email: 'recepcion@acicalados.pe',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
          role: 'recepcionista' as UserRole,
        };
      case 'empleado':
        return {
          id: 'emp-1',
          name: 'Carlos Mendoza Ramos',
          email: 'carlos.mendoza@acicalados.pe',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          role: 'empleado' as UserRole,
        };
      case 'cliente':
        return {
          id: 'cli-1',
          name: 'Sebastián Alarcón Peña',
          email: 's.alarcon@hotmail.com',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          role: 'cliente' as UserRole,
        };
      default:
        return {
          id: 'anon-0',
          name: 'Visitante Invitado',
          email: 'visitante@acicalados.pe',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          role: 'anon' as UserRole,
        };
    }
  }, [currentRole]);

  // Adjust view when role changes if restricted
  const setCurrentRole = useCallback((newRole: UserRole) => {
    setCurrentRoleState(newRole);
    if (newRole === 'cliente' || newRole === 'anon') {
      if (activeView.startsWith('/dashboard')) {
        setActiveView('/');
      }
    } else if (newRole === 'empleado') {
      // Employee role is restricted to dashboard home and attendance
      if (activeView !== '/dashboard' && activeView !== '/dashboard/asistencia') {
        setActiveView('/dashboard');
      }
    }
  }, [activeView]);

  // Thermal Ticket Actions
  const openTicketModal = useCallback((type: 'booking' | 'venta' | 'pos', data: Booking | VentaMostrador) => {
    setActiveTicket({ type: type === 'pos' ? 'venta' : type, data });
  }, []);

  const closeTicketModal = useCallback(() => {
    setActiveTicket(null);
  }, []);

  // Cart Functions
  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // BOOKING HANDLERS
  const addBooking = useCallback((bookingData: Omit<Booking, 'id' | 'code' | 'created_at'>): Booking => {
    const today = getTodayDateString();
    const randomCode = `AC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      code: randomCode,
      created_at: `${today}T12:00:00Z`,
    };

    setBookings((prev) => [newBooking, ...prev]);
    pulseRealtime();
    return newBooking;
  }, [pulseRealtime]);

  const updateBookingStatus = useCallback((id: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    pulseRealtime();
  }, [pulseRealtime]);

  const registerBookingPayment = useCallback((
    bookingId: string,
    amountCents: number,
    method: 'yape' | 'efectivo' | 'mixto',
    cashCents = 0,
    yapeCents = 0,
    voucherUrl?: string
  ) => {
    const today = getTodayDateString();
    setBookings((prev) => {
      return prev.map((b) => {
        if (b.id === bookingId) {
          const newAdvance = b.advance_amount_cents + amountCents;
          const minAdvanceCents = Math.round((b.total_price_cents * paymentSettings.advance_percentage) / 100);

          let newStatus = b.status;
          // Rule: If advance satisfies >= 25%, transition to confirmed
          if (newAdvance >= minAdvanceCents && b.status === 'pendiente') {
            newStatus = 'confirmada';
          }
          if (newAdvance >= b.total_price_cents) {
            newStatus = 'confirmada';
          }

          let paymentStatus: Booking['payment_status'] = 'sin_pago';
          if (newAdvance >= b.total_price_cents) {
            paymentStatus = 'total';
          } else if (newAdvance > 0) {
            paymentStatus = 'parcial';
          }

          return {
            ...b,
            advance_amount_cents: newAdvance,
            status: newStatus,
            payment_status: paymentStatus,
            confirmed_at: b.confirmed_at || (newStatus === 'confirmada' ? `${today}T12:00:00Z` : undefined),
          };
        }
        return b;
      });
    });

    // Log the payment
    const targetBooking = bookings.find((b) => b.id === bookingId);
    const newLog: PaymentLog = {
      id: `pay-${Date.now()}`,
      booking_id: bookingId,
      booking_code: targetBooking?.code || 'AC-0000',
      amount_cents: amountCents,
      payment_method: method,
      cash_cents: cashCents,
      yape_cents: yapeCents,
      voucher_url: voucherUrl,
      created_at: `${today}T12:00:00Z`,
      voided: false,
    };
    setPaymentLogs((prev) => [newLog, ...prev]);
    pulseRealtime();
  }, [bookings, paymentSettings.advance_percentage, pulseRealtime]);

  const voidPayment = useCallback((paymentId: string, reason: string) => {
    // Only admin can void
    const payment = paymentLogs.find((p) => p.id === paymentId);
    if (!payment || payment.voided) return;

    setPaymentLogs((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? { ...p, voided: true, voided_reason: reason, voided_by: currentUser.name }
          : p
      )
    );

    // Adjust booking advance
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === payment.booking_id) {
          const newAdvance = Math.max(0, b.advance_amount_cents - payment.amount_cents);
          let newPayStatus: Booking['payment_status'] = 'sin_pago';
          if (newAdvance >= b.total_price_cents) {
            newPayStatus = 'total';
          } else if (newAdvance > 0) {
            newPayStatus = 'parcial';
          }
          return {
            ...b,
            advance_amount_cents: newAdvance,
            payment_status: newPayStatus,
          };
        }
        return b;
      })
    );
    pulseRealtime();
  }, [currentUser.name, paymentLogs, pulseRealtime]);

  const liberateServiceEarly = useCallback((bookingId: string, serviceIndex: number) => {
    const nowTime = new Date().toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updatedServices = [...b.services];
          if (updatedServices[serviceIndex]) {
            updatedServices[serviceIndex] = {
              ...updatedServices[serviceIndex],
              liberado_at: nowTime,
            };
          }
          return { ...b, services: updatedServices };
        }
        return b;
      })
    );
    pulseRealtime();
  }, [pulseRealtime]);

  // POS HANDLERS
  const registerVentaMostrador = useCallback((
    ventaData: Omit<VentaMostrador, 'id' | 'ticket_number' | 'created_at'>
  ): VentaMostrador => {
    const today = getTodayDateString();
    const newVenta: VentaMostrador = {
      ...ventaData,
      id: `vnt-${Date.now()}`,
      ticket_number: `TK-${Math.floor(10000 + Math.random() * 90000)}`,
      created_at: `${today}T12:00:00Z`,
    };

    setVentasMostrador((prev) => [newVenta, ...prev]);

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) =>
        p.id === ventaData.product_id
          ? { ...p, stock: Math.max(0, p.stock - ventaData.quantity) }
          : p
      )
    );

    pulseRealtime();
    return newVenta;
  }, [pulseRealtime]);

  const deleteVentaMostrador = useCallback((id: string) => {
    setVentasMostrador((prev) => prev.filter((v) => v.id !== id));
    pulseRealtime();
  }, [pulseRealtime]);

  // EXPENSES HANDLERS
  const addExpense = useCallback((expenseData: Omit<Expense, 'id' | 'created_at' | 'voided'>) => {
    const today = getTodayDateString();
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      voided: false,
      created_at: `${today}T12:00:00Z`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    pulseRealtime();
  }, [pulseRealtime]);

  const voidExpense = useCallback((expenseId: string, reason: string) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === expenseId
          ? { ...e, voided: true, voided_reason: reason, voided_by: currentUser.name }
          : e
      )
    );
    pulseRealtime();
  }, [currentUser.name, pulseRealtime]);

  // EMPLOYEE & ATTENDANCE HANDLERS
  const addEmployee = useCallback((empData: Omit<Employee, 'id' | 'qr_code_uuid'>) => {
    const newId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...empData,
      id: newId,
      qr_code_uuid: `qr-${newId}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setEmployees((prev) => [...prev, newEmp]);
    pulseRealtime();
  }, [pulseRealtime]);

  const updateEmployee = useCallback((updated: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    pulseRealtime();
  }, [pulseRealtime]);

  const toggleEmployeeActive = useCallback((empId: string) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, active: !e.active } : e))
    );
    pulseRealtime();
  }, [pulseRealtime]);

  // Check-In / Check-Out QR Scanner with Lima Night Bonus Rule
  const scanAttendanceQR = useCallback((qrCode: string): {
    success: boolean;
    message: string;
    employee?: Employee;
    type?: 'check_in' | 'check_out';
  } => {
    const emp = employees.find((e) => e.qr_code_uuid === qrCode || e.id === qrCode);
    if (!emp) {
      return { success: false, message: 'Credencial QR no reconocida en el sistema de colaboradores.' };
    }

    const today = getTodayDateString();
    const nowLima = new Date().toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const currentAttendance = attendance.find(
      (a) => a.employee_id === emp.id && a.date === today
    );

    if (!currentAttendance) {
      // Check-In
      const newAtt: EmployeeAttendance = {
        id: `att-${Date.now()}`,
        employee_id: emp.id,
        employee_name: emp.full_name,
        employee_type: emp.type,
        date: today,
        check_in: nowLima,
        check_out: null,
        worked_minutes: 0,
        bonus_minutes: 0,
        bonus_calculation_type: 'auto',
        status: nowLima > '09:05' ? 'tardanza' : 'presente',
      };
      setAttendance((prev) => [newAtt, ...prev]);
      pulseRealtime();
      return {
        success: true,
        message: `¡Check-In registrado exitosamente a las ${nowLima}!`,
        employee: emp,
        type: 'check_in',
      };
    }

    if (currentAttendance && !currentAttendance.check_out) {
      // Check-Out: Compute hours and Night Bonus Minutes (America/Lima)
      const [inH, inM] = currentAttendance.check_in.split(':').map(Number);
      const [outH, outM] = nowLima.split(':').map(Number);
      const inMinutes = inH * 60 + inM;
      const outMinutes = outH * 60 + outM;
      const workedMinutes = Math.max(0, outMinutes - inMinutes);

      // Night bonus calculation
      // Rule: Monday-Saturday starts at 21:10 (1270 min); Sunday starts at 20:10 (1210 min)
      const dayOfWeek = new Date().getDay(); // 0 is Sunday
      const cutoffStr = dayOfWeek === 0 ? bonusSettings.sunday_cutoff : bonusSettings.weekday_cutoff;
      const [cutH, cutM] = cutoffStr.split(':').map(Number);
      const cutoffMinutes = cutH * 60 + cutM;

      let bonusMinutes = 0;
      if (outMinutes > cutoffMinutes) {
        bonusMinutes = outMinutes - cutoffMinutes;
      }

      setAttendance((prev) =>
        prev.map((a) =>
          a.id === currentAttendance.id
            ? {
                ...a,
                check_out: nowLima,
                worked_minutes: workedMinutes,
                bonus_minutes: bonusMinutes,
                bonus_calculation_type: 'auto',
                status: a.status === 'tardanza' ? 'tardanza' : 'presente',
              }
            : a
        )
      );
      pulseRealtime();
      return {
        success: true,
        message: `¡Check-Out registrado a las ${nowLima}! Minutos de bono nocturno calculados: ${bonusMinutes} min.`,
        employee: emp,
        type: 'check_out',
      };
    }

    return {
      success: true,
      message: `${emp.full_name} ya completó su jornada de hoy (Entrada: ${currentAttendance.check_in}, Salida: ${currentAttendance.check_out}).`,
      employee: emp,
    };
  }, [attendance, bonusSettings.sunday_cutoff, bonusSettings.weekday_cutoff, employees, pulseRealtime]);

  const registerAttendancePunch = useCallback((employeeId: string, punchType: 'check_in' | 'check_out') => {
    const emp = employees.find((e) => e.id === employeeId || e.qr_code_uuid === employeeId);
    if (!emp) return;
    const today = getTodayDateString();
    const nowLima = new Date().toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (punchType === 'check_in') {
      setAttendance((prev) => {
        const existing = prev.find((a) => a.employee_id === emp.id && a.date === today);
        if (existing) {
          return prev.map((a) => (a.id === existing.id ? { ...a, check_in: nowLima } : a));
        }
        const newAtt: EmployeeAttendance = {
          id: `att-${Date.now()}`,
          employee_id: emp.id,
          employee_name: emp.full_name,
          employee_type: emp.type,
          date: today,
          check_in: nowLima,
          check_out: null,
          worked_minutes: 0,
          bonus_minutes: 0,
          bonus_calculation_type: 'auto',
          status: nowLima > '09:05' ? 'tardanza' : 'presente',
        };
        return [newAtt, ...prev];
      });
    } else {
      setAttendance((prev) => {
        const existing = prev.find((a) => a.employee_id === emp.id && a.date === today);
        const inTime = existing?.check_in || '09:00';
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = nowLima.split(':').map(Number);
        const inMinutes = inH * 60 + inM;
        const outMinutes = outH * 60 + outM;
        const workedMinutes = Math.max(0, outMinutes - inMinutes);

        const dayOfWeek = new Date().getDay();
        const cutoffStr = dayOfWeek === 0 ? bonusSettings.sunday_cutoff : bonusSettings.weekday_cutoff;
        const [cutH, cutM] = cutoffStr.split(':').map(Number);
        const cutoffMinutes = cutH * 60 + cutM;

        let bonusMinutes = 0;
        if (outMinutes > cutoffMinutes) {
          bonusMinutes = outMinutes - cutoffMinutes;
        }

        if (existing) {
          return prev.map((a) =>
            a.id === existing.id
              ? {
                  ...a,
                  check_out: nowLima,
                  worked_minutes: workedMinutes,
                  bonus_minutes: bonusMinutes,
                  bonus_calculation_type: 'auto',
                }
              : a
          );
        } else {
          const newAtt: EmployeeAttendance = {
            id: `att-${Date.now()}`,
            employee_id: emp.id,
            employee_name: emp.full_name,
            employee_type: emp.type,
            date: today,
            check_in: '09:00',
            check_out: nowLima,
            worked_minutes: workedMinutes,
            bonus_minutes: bonusMinutes,
            bonus_calculation_type: 'auto',
            status: 'presente',
          };
          return [newAtt, ...prev];
        }
      });
    }
    pulseRealtime();
  }, [bonusSettings.sunday_cutoff, bonusSettings.weekday_cutoff, employees, pulseRealtime]);

  const manualAdjustBonus = useCallback((attendanceId: string, newBonusMinutes: number, reason: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.id === attendanceId
          ? {
              ...a,
              bonus_minutes: newBonusMinutes,
              bonus_calculation_type: 'manual',
              justification_note: a.justification_note
                ? `${a.justification_note} | Ajuste Bono: ${reason}`
                : `Ajuste Bono: ${reason}`,
            }
          : a
      )
    );
    pulseRealtime();
  }, [pulseRealtime]);

  const submitJustification = useCallback((attendanceId: string, note: string, docUrl?: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.id === attendanceId
          ? {
              ...a,
              justification_note: note,
              justification_document_url: docUrl,
              status: 'falta_justificada',
            }
          : a
      )
    );
    pulseRealtime();
  }, [pulseRealtime]);

  // SETTINGS HANDLERS
  const updatePaymentSettings = useCallback((newSettings: Partial<PaymentSettings>) => {
    setPaymentSettings((prev) => ({ ...prev, ...newSettings }));
    pulseRealtime();
  }, [pulseRealtime]);

  const updateBonusSettings = useCallback((newSettings: Partial<BonusSettings>) => {
    setBonusSettings((prev) => ({ ...prev, ...newSettings }));
    pulseRealtime();
  }, [pulseRealtime]);

  // CATALOG CRUD
  const addService = useCallback((srvData: Omit<Service, 'id'>) => {
    const newSrv: Service = { ...srvData, id: `srv-${Date.now()}` };
    setServices((prev) => [...prev, newSrv]);
    pulseRealtime();
  }, [pulseRealtime]);

  const updateService = useCallback((srv: Service) => {
    setServices((prev) => prev.map((s) => (s.id === srv.id ? s : s)));
    pulseRealtime();
  }, [pulseRealtime]);

  const addProduct = useCallback((prodData: Omit<Product, 'id'>) => {
    const newProd: Product = { ...prodData, id: `prod-${Date.now()}` };
    setProducts((prev) => [...prev, newProd]);
    pulseRealtime();
  }, [pulseRealtime]);

  const updateProduct = useCallback((prod: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
    pulseRealtime();
  }, [pulseRealtime]);

  const addWardrobeItem = useCallback((itemData: Omit<WardrobeItem, 'id'>) => {
    const newItem: WardrobeItem = { ...itemData, id: `ward-${Date.now()}` };
    setWardrobe((prev) => [...prev, newItem]);
    pulseRealtime();
  }, [pulseRealtime]);

  const updateWardrobeItem = useCallback((item: WardrobeItem) => {
    setWardrobe((prev) => prev.map((w) => (w.id === item.id ? item : w)));
    pulseRealtime();
  }, [pulseRealtime]);

  const updateWardrobeStatus = useCallback((id: string, status: WardrobeStatus) => {
    setWardrobe((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
    pulseRealtime();
  }, [pulseRealtime]);

  // KPI CALCULATIONS (Strict rules from Section C.1 & C.5)
  // Regla Estricta de Ingresos: Solo citas 'confirmada' o 'completada' aportan al total cobrado (advance_amount_cents)
  // Ventas de mostrador activas suman al total de ingresos brutos
  // Egresos activos (no voided) se descuentan para el balance neto
  const kpis = useMemo(() => {
    const today = getTodayDateString();

    const confirmedBookings = bookings.filter(
      (b) => b.status === 'confirmada' || b.status === 'completada'
    );

    const ingresosServiciosCents = confirmedBookings.reduce(
      (acc, b) => acc + (b.advance_amount_cents || 0),
      0
    );

    const ventasMostradorCents = ventasMostrador.reduce(
      (acc, v) => acc + (v.total_price_cents || 0),
      0
    );

    const totalIngresosCents = ingresosServiciosCents + ventasMostradorCents;

    const activeExpenses = expenses.filter((e) => !e.voided);
    const totalEgresosCents = activeExpenses.reduce(
      (acc, e) => acc + (e.amount_cents || 0),
      0
    );

    const balanceNetoCents = totalIngresosCents - totalEgresosCents;

    const citasHoy = bookings.filter((b) => b.date === today);
    const citasConfirmadas = bookings.filter((b) => b.status === 'confirmada');

    // Saldos por cobrar: De citas confirmadas que aún no tienen pago total
    const saldosPorCobrarCents = confirmedBookings.reduce((acc, b) => {
      const saldo = b.total_price_cents - (b.advance_amount_cents || 0);
      return acc + (saldo > 0 ? saldo : 0);
    }, 0);

    return {
      totalIngresosCents,
      totalEgresosCents,
      balanceNetoCents,
      citasHoyCount: citasHoy.length,
      citasConfirmadasCount: citasConfirmadas.length,
      saldosPorCobrarCents,
    };
  }, [bookings, expenses, ventasMostrador]);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        activeView,
        setActiveView,
        currentUser,
        services,
        products,
        wardrobe,
        employees,
        setEmployees,
        bookings,
        paymentLogs,
        ventasMostrador,
        expenses,
        attendance,
        attendanceRecords: attendance,
        paymentSettings,
        bonusSettings,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        activeTicket,
        openTicketModal,
        closeTicketModal,
        realtimeConnected,
        pulseRealtime,
        lastSyncTimestamp,
        addBooking,
        updateBookingStatus,
        registerBookingPayment,
        voidPayment,
        liberateServiceEarly,
        registerVentaMostrador,
        registerCounterSale: registerVentaMostrador,
        deleteVentaMostrador,
        addExpense,
        voidExpense,
        addEmployee,
        updateEmployee,
        toggleEmployeeActive,
        scanAttendanceQR,
        registerAttendancePunch,
        manualAdjustBonus,
        submitJustification,
        updatePaymentSettings,
        updateBonusSettings,
        addService,
        updateService,
        addProduct,
        updateProduct,
        addWardrobeItem,
        updateWardrobeItem,
        updateWardrobeStatus,
        kpis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
