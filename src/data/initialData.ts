import {
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
} from '../types';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Corte Tradicional & Degradado Fade',
    slug: 'corte-tradicional-fade',
    category: 'barberia',
    price_cents: 3500, // S/ 35.00
    duration_minutes: 40,
    capacity: 4,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    description: 'Corte de alta precisión con lavado energizante, peinado texturizado y perfilado con navaja.',
  },
  {
    id: 'srv-2',
    name: 'Ritual Barba Spa Toalla Caliente',
    slug: 'ritual-barba-spa',
    category: 'barberia',
    price_cents: 3000, // S/ 30.00
    duration_minutes: 35,
    capacity: 3,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80',
    description: 'Vaporización aromática, toalla caliente con aceites esenciales, afeitado fino y bálsamo hidratante.',
  },
  {
    id: 'srv-3',
    name: 'Combo Ejecutivo: Corte + Barba + Exfoliación',
    slug: 'combo-ejecutivo-acicalados',
    category: 'barberia',
    price_cents: 6000, // S/ 60.00
    duration_minutes: 65,
    capacity: 3,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80',
    description: 'Experiencia completa de barbería con exfoliación facial refrescante y masaje de hombros.',
  },
  {
    id: 'srv-4',
    name: 'Masaje Descontracturante & Piedras Calientes',
    slug: 'masaje-descontracturante-piedras',
    category: 'spa',
    price_cents: 9000, // S/ 90.00
    duration_minutes: 60,
    capacity: 2,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80',
    description: 'Terapia relajante profunda de cuerpo entero con aceites orgánicos y piedras volcánicas térmicas.',
  },
  {
    id: 'srv-5',
    name: 'Limpieza Facial Profunda con Hidrodermoabrasión',
    slug: 'limpieza-facial-profunda',
    category: 'spa',
    price_cents: 8000, // S/ 80.00
    duration_minutes: 50,
    capacity: 2,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
    description: 'Extracción de impurezas, microdermoabrasión, mascarilla nutritiva de oro y sellado colágeno.',
  },
  {
    id: 'srv-6',
    name: 'Manicura & Pedicura Spa Imperial',
    slug: 'manicura-pedicura-spa-imperial',
    category: 'spa',
    price_cents: 5500, // S/ 55.00
    duration_minutes: 55,
    capacity: 2,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
    description: 'Exfoliación con sales minerales, limado, hidratación con parafina tibia y esmaltado profesional.',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Cera Mate Pomade Fijación Fuerte (100g)',
    slug: 'cera-mate-pomade',
    category: 'ceras_pomadas',
    price_cents: 4200, // S/ 42.00
    stock: 24,
    image_url: 'https://images.unsplash.com/photo-1585232351009-aa87416fca90?auto=format&fit=crop&w=600&q=80',
    description: 'Acabado natural sin brillo, fijación duradera y fácil de lavar con agua.',
  },
  {
    id: 'prod-2',
    name: 'Aceite de Barba Artesanal Sándalo & Bergamota (50ml)',
    slug: 'aceite-barba-sandalo',
    category: 'barba_afeitado',
    price_cents: 3800, // S/ 38.00
    stock: 18,
    image_url: 'https://images.unsplash.com/photo-1608248597359-24757c9efee5?auto=format&fit=crop&w=600&q=80',
    description: 'Nutre e hidrata el vello facial, elimina la picazón y deja un aroma amaderado refinado.',
  },
  {
    id: 'prod-3',
    name: 'Champú Revitalizante con Árbol de Té & Menta (250ml)',
    slug: 'champu-arbol-te-menta',
    category: 'shampoos',
    price_cents: 4500, // S/ 45.00
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
    description: 'Limpieza profunda refrescante, estimula la circulación del cuero cabelludo.',
  },
  {
    id: 'prod-4',
    name: 'Sérum Facial Rejuvenecedor con Ácido Hialurónico (30ml)',
    slug: 'serum-facial-hialuronico',
    category: 'tratamientos',
    price_cents: 6500, // S/ 65.00
    stock: 12,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    description: 'Fórmula hidratante intensa de rápida absorción que atenúa líneas de expresión.',
  },
];

export const INITIAL_WARDROBE: WardrobeItem[] = [
  {
    id: 'ward-1',
    name: 'Smoking Italiano Solapa Satín Negra',
    category: 'etiqueta_negra',
    rental_price_cents: 18000, // S/ 180.00
    deposit_cents: 10000, // S/ 100.00
    status: 'disponible',
    size: 'M (Talla 40)',
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    description: 'Traje de corte sastre en lana fría, incluye pantalón con vivo de seda, faja y corbatín.',
  },
  {
    id: 'ward-2',
    name: 'Tuxedo Azul Noche Slim Fit',
    category: 'bodas',
    rental_price_cents: 19500, // S/ 195.00
    deposit_cents: 10000,
    status: 'disponible',
    size: 'L (Talla 42)',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    description: 'Elegancia contemporánea en azul noche con solapa mantón en terciopelo.',
  },
  {
    id: 'ward-3',
    name: 'Vestido de Gala Escote Sirena Borgoña',
    category: 'graduaciones',
    rental_price_cents: 22000, // S/ 220.00
    deposit_cents: 12000,
    status: 'reservado',
    size: 'S (Talla 28)',
    image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
    description: 'Vestido confeccionado en satén pesado color vino tinto con pedrería fina en cintura.',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    full_name: 'Carlos Mendoza Ramos',
    role: 'empleado',
    type: 'barberia',
    skills: ['srv-1', 'srv-2', 'srv-3'],
    active: true,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    qr_code_uuid: 'emp-carlos-mendoza-9821',
    phone: '984512341',
    dni: '47891234',
    rotation_order: 1,
  },
  {
    id: 'emp-2',
    full_name: 'Mateo Guerrero Quispe',
    role: 'empleado',
    type: 'barberia',
    skills: ['srv-1', 'srv-2'],
    active: true,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    qr_code_uuid: 'emp-mateo-guerrero-4391',
    phone: '971234891',
    dni: '71239845',
    rotation_order: 2,
  },
  {
    id: 'emp-3',
    full_name: 'Valeria Benavides Rojas',
    role: 'empleado',
    type: 'spa',
    skills: ['srv-4', 'srv-5', 'srv-6'],
    active: true,
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    qr_code_uuid: 'emp-valeria-benavides-6712',
    phone: '965782109',
    dni: '45902187',
    rotation_order: 3,
  },
  {
    id: 'emp-4',
    full_name: 'Camila Zúñiga Paredes',
    role: 'recepcionista',
    type: 'recepcion',
    skills: [],
    active: true,
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    qr_code_uuid: 'emp-camila-zuniga-1102',
    phone: '993451289',
    dni: '74129853',
    rotation_order: 4,
  },
  {
    id: 'emp-5',
    full_name: 'Enzo Costa Reyes',
    role: 'admin',
    type: 'barberia',
    skills: ['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5', 'srv-6'],
    active: true,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    qr_code_uuid: 'admin-enzo-costa-0001',
    phone: '987654321',
    dni: '42187590',
    rotation_order: 0,
  },
];

// Today in America/Lima format YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

// Current time in America/Lima format HH:MM:SS
export function getLimaTimeString(): string {
  const d = new Date();
  return d.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

const todayStr = getTodayDateString();

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    code: 'AC-7821',
    client_name: 'Diego Morales Silva',
    client_phone: '991223344',
    client_email: 'diego.morales@gmail.com',
    client_dni: '45129840',
    date: todayStr,
    start_time: '10:00',
    end_time: '11:05',
    type: 'barberia',
    services: [
      {
        service_id: 'srv-3',
        service_name: 'Combo Ejecutivo: Corte + Barba + Exfoliación',
        employee_id: 'emp-1',
        employee_name: 'Carlos Mendoza',
        price_cents: 6000,
        duration_minutes: 65,
      },
    ],
    total_price_cents: 6000, // S/ 60.00
    advance_amount_cents: 6000, // Pagado completo
    status: 'confirmada',
    payment_status: 'total',
    created_at: `${todayStr}T08:15:00Z`,
    confirmed_at: `${todayStr}T08:20:00Z`,
    notes: 'Cliente prefiere café americano al llegar.',
  },
  {
    id: 'bk-2',
    code: 'AC-8492',
    client_name: 'Sebastián Alarcón Peña',
    client_phone: '988445566',
    client_email: 's.alarcon@hotmail.com',
    client_dni: '72389104',
    date: todayStr,
    start_time: '11:30',
    end_time: '12:10',
    type: 'barberia',
    services: [
      {
        service_id: 'srv-1',
        service_name: 'Corte Tradicional & Degradado Fade',
        employee_id: 'emp-2',
        employee_name: 'Mateo Guerrero',
        price_cents: 3500,
        duration_minutes: 40,
      },
    ],
    total_price_cents: 3500, // S/ 35.00
    advance_amount_cents: 1500, // Adelanto del >25% (S/ 15.00)
    status: 'confirmada',
    payment_status: 'parcial',
    created_at: `${todayStr}T09:00:00Z`,
    confirmed_at: `${todayStr}T09:05:00Z`,
  },
  {
    id: 'bk-3',
    code: 'AC-9104',
    client_name: 'Luciana Salazar Vane',
    client_phone: '977112233',
    client_email: 'luciana.salazar@outlook.com',
    date: todayStr,
    start_time: '14:00',
    end_time: '15:00',
    type: 'spa',
    services: [
      {
        service_id: 'srv-4',
        service_name: 'Masaje Descontracturante & Piedras Calientes',
        employee_id: 'emp-3',
        employee_name: 'Valeria Benavides',
        price_cents: 9000,
        duration_minutes: 60,
      },
    ],
    total_price_cents: 9000,
    advance_amount_cents: 3000, // S/ 30.00 adelanto verificado
    status: 'confirmada',
    payment_status: 'parcial',
    created_at: `${todayStr}T09:30:00Z`,
    confirmed_at: `${todayStr}T09:40:00Z`,
  },
  {
    id: 'bk-4',
    code: 'AC-5520',
    client_name: 'Renato Cárdenas Gil',
    client_phone: '966889900',
    client_email: 'renato.cardenas@gmail.com',
    date: todayStr,
    start_time: '16:00',
    end_time: '16:35',
    type: 'barberia',
    services: [
      {
        service_id: 'srv-2',
        service_name: 'Ritual Barba Spa Toalla Caliente',
        employee_id: 'emp-1',
        employee_name: 'Carlos Mendoza',
        price_cents: 3000,
        duration_minutes: 35,
      },
    ],
    total_price_cents: 3000,
    advance_amount_cents: 0,
    status: 'pendiente',
    payment_status: 'sin_pago',
    created_at: `${todayStr}T10:00:00Z`,
  },
  {
    id: 'bk-5',
    code: 'AC-3301',
    client_name: 'Gabriel Farfán Rivas',
    client_phone: '955776655',
    client_email: 'gfarfan@empresa.pe',
    date: todayStr,
    start_time: '17:30',
    end_time: '19:10',
    type: 'mixto',
    services: [
      {
        service_id: 'srv-1',
        service_name: 'Corte Tradicional & Degradado Fade',
        employee_id: 'emp-2',
        employee_name: 'Mateo Guerrero',
        price_cents: 3500,
        duration_minutes: 40,
      },
      {
        service_id: 'srv-5',
        service_name: 'Limpieza Facial Profunda con Hidrodermoabrasión',
        employee_id: 'emp-3',
        employee_name: 'Valeria Benavides',
        price_cents: 8000,
        duration_minutes: 50,
      },
    ],
    total_price_cents: 11500, // S/ 115.00
    advance_amount_cents: 4000, // Adelanto Yape
    status: 'confirmada',
    payment_status: 'parcial',
    created_at: `${todayStr}T10:30:00Z`,
    confirmed_at: `${todayStr}T10:45:00Z`,
  },
];

export const INITIAL_PAYMENT_LOGS: PaymentLog[] = [
  {
    id: 'pay-1',
    booking_id: 'bk-1',
    booking_code: 'AC-7821',
    amount_cents: 6000,
    payment_method: 'yape',
    yape_cents: 6000,
    created_at: `${todayStr}T08:20:00Z`,
    voided: false,
  },
  {
    id: 'pay-2',
    booking_id: 'bk-2',
    booking_code: 'AC-8492',
    amount_cents: 1500,
    payment_method: 'efectivo',
    cash_cents: 1500,
    created_at: `${todayStr}T09:05:00Z`,
    voided: false,
  },
  {
    id: 'pay-3',
    booking_id: 'bk-3',
    booking_code: 'AC-9104',
    amount_cents: 3000,
    payment_method: 'yape',
    yape_cents: 3000,
    created_at: `${todayStr}T09:40:00Z`,
    voided: false,
  },
  {
    id: 'pay-4',
    booking_id: 'bk-5',
    booking_code: 'AC-3301',
    amount_cents: 4000,
    payment_method: 'mixto',
    cash_cents: 2000,
    yape_cents: 2000,
    created_at: `${todayStr}T10:45:00Z`,
    voided: false,
  },
];

export const INITIAL_VENTAS_MOSTRADOR: VentaMostrador[] = [
  {
    id: 'vnt-1',
    ticket_number: 'TK-00821',
    client_name: 'Carlos Vega Romero',
    product_id: 'prod-1',
    product_name: 'Cera Mate Pomade Fijación Fuerte (100g)',
    quantity: 1,
    unit_price_cents: 4200,
    total_price_cents: 4200,
    payment_method: 'efectivo',
    cash_cents: 4200,
    notes: 'Entregado en mostrador.',
    created_at: `${todayStr}T09:15:00Z`,
  },
  {
    id: 'vnt-2',
    ticket_number: 'TK-00822',
    client_name: 'Cliente Mostrador',
    product_id: 'prod-2',
    product_name: 'Aceite de Barba Artesanal Sándalo & Bergamota (50ml)',
    quantity: 2,
    unit_price_cents: 3800,
    total_price_cents: 7600,
    payment_method: 'yape',
    yape_cents: 7600,
    notes: 'Comprobante Yape verificado.',
    created_at: `${todayStr}T11:00:00Z`,
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    description: 'Compra de toallas desechables y navajas Derby profesionales',
    category: 'insumos',
    amount_cents: 4500, // S/ 45.00
    payment_method: 'efectivo',
    beneficiary: 'Distribuidora Barber Perú',
    date: todayStr,
    voided: false,
    created_at: `${todayStr}T08:30:00Z`,
  },
  {
    id: 'exp-2',
    description: 'Recarga de bidones de agua mineral San Luis para clientes',
    category: 'servicios_basicos',
    amount_cents: 2800, // S/ 28.00
    payment_method: 'efectivo',
    beneficiary: 'Agua San Luis',
    date: todayStr,
    voided: false,
    created_at: `${todayStr}T09:45:00Z`,
  },
];

export const INITIAL_ATTENDANCE: EmployeeAttendance[] = [
  {
    id: 'att-1',
    employee_id: 'emp-1',
    employee_name: 'Carlos Mendoza Ramos',
    employee_type: 'barberia',
    date: todayStr,
    check_in: '08:50',
    check_out: null,
    worked_minutes: 240,
    bonus_minutes: 0,
    bonus_calculation_type: 'auto',
    status: 'presente',
  },
  {
    id: 'att-2',
    employee_id: 'emp-2',
    employee_name: 'Mateo Guerrero Quispe',
    employee_type: 'barberia',
    date: todayStr,
    check_in: '09:20',
    check_out: null,
    worked_minutes: 210,
    bonus_minutes: 0,
    bonus_calculation_type: 'auto',
    status: 'tardanza',
    justification_note: 'Tráfico pesado en Av. Javier Prado.',
  },
  {
    id: 'att-3',
    employee_id: 'emp-3',
    employee_name: 'Valeria Benavides Rojas',
    employee_type: 'spa',
    date: todayStr,
    check_in: '08:55',
    check_out: null,
    worked_minutes: 235,
    bonus_minutes: 0,
    bonus_calculation_type: 'auto',
    status: 'presente',
  },
  {
    id: 'att-4',
    employee_id: 'emp-4',
    employee_name: 'Camila Zúñiga Paredes',
    employee_type: 'recepcion',
    date: todayStr,
    check_in: '08:45',
    check_out: null,
    worked_minutes: 245,
    bonus_minutes: 0,
    bonus_calculation_type: 'auto',
    status: 'presente',
  },
];

export const INITIAL_PAYMENT_SETTINGS: PaymentSettings = {
  advance_percentage: 25,
  yape_phone: '987 654 321',
  yape_holder: 'Acicalados Spa & Barber Shop S.A.C.',
  yape_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126580014pe.yape.pe01129876543215204000053036045802PE5925ACICALADOS+SPA+BARBER+SHOP6004LIMA6304E64A',
};

export const INITIAL_BONUS_SETTINGS: BonusSettings = {
  weekday_cutoff: '21:10',
  sunday_cutoff: '20:10',
};
