# Especificación Visual y Funcional del Sistema Acicalados Spa & Barber Shop

**Versión del Sistema:** 2.6 (Next.js 16 App Router + React 19 + Supabase PostgreSQL 17)  
**Entorno de Datos:** Supabase Project `flnqzaybqaqwptujtgzl` (`acicaladossiu`)  
**Zona Horaria Operativa Oficial:** `America/Lima` (UTC-5)  
**Moneda Oficial:** Soles Peruanos (`PEN` / `S/`)  
**Documento Contextual de Soporte:** [Auditoría de Supabase](file:///d:/SistemasMANU/ACICALADOSF/docs/auditoria-supabase.md)  
**Propósito:** Guía maestra de arquitectura UX/UI, diseño de interacción, validaciones de interfaz y lógica de negocio visible para replicabilidad técnica completa.

---

## A. Visión General del Sistema

### A.1 Naturaleza de la Aplicación
**Acicalados Spa & Barber Shop** es una aplicación web híbrida fullstack corporativa y comercial desarrollada bajo **Next.js (App Router)**. Combina:
1. **Portal Comercial Público (SSR + ISR + Client Hydration):** Landing page de alto impacto visual, catálogo de servicios, tienda online de productos capilares con carrito de compras en memoria (`CartProvider`), galería fotográfica de vestuario en alquiler y un asistente multi-paso de reservas online conectado a WhatsApp y pagos por código QR (Yape / Efectivo).
2. **Portal de Autoservicio de Clientes (`/mi-cuenta`):** Panel autenticado para clientes donde visualizan el historial de sus reservas, estados de pago (con widget QR para liquidar saldos) y edición de datos personales (DNI, teléfono, nombre).
3. **Panel de Gestión Operativa y Financiera (`/dashboard/*`):** Single Page Application (SPA) enriquecida con componentes React del lado del cliente, conexión reactiva vía WebSockets mediante **Supabase Realtime**, escáner de cámara integrado para credenciales QR de asistencia y módulos avanzados de agenda, caja y finanzas.

### A.2 Stack Tecnológico Principal del Frontend
- **Framework Base:** Next.js 16.2.6 con React 19.2.4 y TypeScript 5.
- **Enrutamiento y Layouts:** Next.js App Router estructurado en rutas públicas, de autenticación (`/auth/*`), de clientes (`/mi-cuenta`) y de administración (`/dashboard/*`).
- **Diseño y Estilos:** Tailwind CSS v4 complementado con un robusto sistema de diseño en Vanilla CSS (`globals.css`) que utiliza una paleta cromática de lujo: fondos oscuros profundos (`#0A0A0A`, `#141414`), acentos dorados oro viejo (`#D4AF37`, `#C8A45C`, `#C2872B`), tipografía sans-serif limpia (**Inter**) combinada con encabezados serif clásicos (**Playfair Display**), y un fondo fotográfico fijo con viñeta suave (`fondo1.webp`).
- **Gestión de Estado:** Context API de React (`CartProvider` para el carrito comercial público) y estados locales desacoplados (`useState`, `useReducer`, `useMemo`, `useCallback`) con sincronización en tiempo real vía eventos personalizados (`ventas-sync.ts`) y canales WebSocket de Supabase.
- **Capa de Comunicación con Backend:** Clientes tipados de Supabase (`@supabase/ssr` en servidor, cliente de navegador en componentes cliente y cliente privilegiado `service_role` en API Routes) combinados con consumo de Next.js Route Handlers REST.
- **Hardware y Periféricos:**
  - Lector QR en tiempo real con cámara web/móvil mediante librerías `jsqr` y `html5-qrcode`.
  - Generación dinámica de códigos QR descargables e imprimibles mediante `qrcode`.
  - Impresión directa de tickets térmicos (80mm y 58mm) optimizados vía reglas `@media print` en el navegador.
  - Exportación de reportes ejecutivos en archivos reales binarios Excel (`.xlsx` multi-hoja formateado con `exceljs`) y documentos PDF vectoriales (`jspdf` + `jspdf-autotable`).

### A.3 Roles de Usuario del Sistema
El sistema implementa un modelo de control de acceso basado en roles (RBAC) validado en frontend por contexto y en backend mediante middleware y políticas RLS:

1. **Administrador (`admin`):** Rol con privilegios absolutos. Controla la configuración del negocio (porcentajes de adelanto, datos de cobro de Yape), gestiona empleados y sus habilidades, autoriza o rechaza justificaciones y permisos de agenda, anula pagos y egresos con motivo de auditoría, accede a reportes consolidados históricos (semanales, mensuales, anuales o personalizados) y elimina registros.
2. **Recepcionista (`recepcionista`):** Operador de caja y atención en salón. Gestiona la agenda del día, registra citas manuales, emite tickets térmicos, cobra pagos y adelantos de clientes (Yape, Efectivo, Mixto), registra ventas de mostrador y gastos operativos de caja chica. Por salvaguarda visual y de negocio, su vista de reportes está bloqueada de forma inmutable al **día actual**, y no puede anular pagos ni modificar parámetros del negocio.
3. **Colaborador / Especialista (`empleado` / ADI - Atención Directa e Incidencias):** Barbero, estilista o terapeuta de spa. Accede al sistema principalmente para la lectura de su credencial de asistencia con código QR, marcación de jornada laboral, consulta de sus citas asignadas y tiempos acumulados de bonificación horaria nocturna. No tiene acceso a módulos financieros ni de configuración.
4. **Cliente Registrado (`cliente`):** Usuario final autenticado vía correo/contraseña o Google OAuth. Accede al catálogo público, realiza reservas en línea asociadas a su perfil, sube comprobantes de pago de transferencias o Yape y gestiona sus citas desde `/mi-cuenta`.
5. **Visitante Anónimo (`anon` / público):** Navega libremente por la landing page, catálogo de servicios, tienda y vestuario; puede iniciar el asistente de reserva en modo invitado sin crear cuenta obligatoria previa.

### A.4 Módulos Funcionales Principales
1. **Recepción e Inicio del Panel (`/dashboard`):** Monitor operativo en tiempo real de las citas de la jornada, métricas de ocupación semanal y balance financiero rápido de caja.
2. **Agenda y Calendario (`/dashboard/calendario`):** Visualización interactiva de citas, turnos y bloqueos de agenda en modalidades Día, Semana y Mes, con exportación de agenda diaria en PDF.
3. **Gestión de Reservas y Caja de Citas (`/dashboard/reservas`):** Módulo central de citas, estado de atención, asignación de colaboradores, verificación del 25% de adelanto, desglose de pagos e impresión de tickets térmicos.
4. **Ventas de Mostrador (`/dashboard/ventas`):** Terminal punto de venta (POS) rápido para comercializar productos capilares y estética sin cita previa, con emisión inmediata de tickets de venta.
5. **Reportes Financieros y Cierre de Caja (`/dashboard/reportes`):** Balance integral de ingresos recaudados, ventas, egresos y resultado neto; liquidación por colaborador, exportación en Excel/PDF y envío automático del resumen de cierre de caja por WhatsApp.
6. **Egresos y Gastos Operativos (`/dashboard/egresos`):** Registro y control clasificado de compras de insumos, servicios básicos, mantenimiento y gastos menores con adjunto de comprobantes y anulación auditada.
7. **Personal, Colaboradores y Asignaciones (`/dashboard/empleados`):** Directorio de colaboradores, configuración de habilidades (`skills`), panel Kanban de asignaciones horarias en vivo, generación de credenciales QR y gestión de permisos por rango de fechas.
8. **Control de Asistencia, QR y Bonificaciones (`/dashboard/asistencia`):** Escaneo de credenciales con cámara para check-in/check-out, cálculo automatizado de bonificaciones nocturnas (`America/Lima`), justificaciones de tardanzas y ajustes manuales.
9. **Catálogo de Servicios (`/dashboard/servicios`):** Mantenimiento de servicios de Barbería y Spa, fijación de precios en centavos, duración en minutos y carga de fotografías en Storage.
10. **Catálogo de Productos (`/dashboard/productos`):** Mantenimiento de productos para la venta en tienda física y web, control de stock y fijación de precios.
11. **Galería de Vestuario (`/dashboard/vestuario`):** Control del inventario de trajes de etiqueta, vestidos y accesorios para alquiler de sesiones y eventos.
12. **Portal Comercial y Reserva Online (`/`, `/reservar`, `/tienda`, `/vestuario`, `/mi-cuenta`):** Plataforma orientada al cliente para descubrimiento de servicios, reserva guiada y autoservicio.

---

## B. Mapa de Navegación y Roles

### B.1 Estructura Global de Navegación

```
                                  [ Portal Acicalados ]
                                            │
         ┌──────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                    ▼
  [ Portal Público / Clientes ]                                    [ Panel Interno Dashboard ]
  ├── / (Inicio)                                                   ├── /dashboard (Inicio / Recepción)
  ├── /servicios (Catálogo)                                        ├── /dashboard/calendario
  ├── /reservar (Asistente 5 pasos)                                ├── /dashboard/reservas
  ├── /tienda (Catálogo + Carrito)                                 ├── /dashboard/ventas
  ├── /vestuario (Galería de Trajes)                               ├── /dashboard/reportes
  ├── /ubicacion (Mapa / Contacto)                                 ├── /dashboard/egresos
  ├── /auth/login & /auth/register                                 ├── /dashboard/empleados
  └── /mi-cuenta (Portal Cliente Autenticado)                      ├── /dashboard/asistencia
                                                                   ├── /dashboard/servicios
                                                                   ├── /dashboard/vestuario
                                                                   └── /dashboard/productos
```

### B.2 Navegación en el Panel de Gestión (`AdminSidebar`)
El panel administrativo utiliza una barra lateral fija en escritorio (`width: 260px`) con estética oscura de lujo y un cajón deslizable (*drawer*) en dispositivos móviles con botón disparador flotante.

#### Elementos del Menú Lateral y Matriz de Acceso por Rol

| Enlace / Ruta | Etiqueta Visual | Ícono Asociado | Rol `admin` | Rol `recepcionista` | Rol `empleado` |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `/dashboard` | **Inicio** | `/iconsAdmi/Inicio.svg` | Visible | Visible | Visible |
| `/dashboard/calendario` | **Calendario** | `/iconsAdmi/Calendario.svg` | Visible | Visible | Oculto |
| `/dashboard/reservas` | **Reservas** | `/iconsAdmi/Reservas.svg` | Visible | Visible | Oculto |
| `/dashboard/ventas` | **Ventas** | `/iconsAdmi/Ventas.svg` | Visible | Visible | Oculto |
| `/dashboard/reportes` | **Reportes** | `/iconsAdmi/Reportes.svg` | Visible | Visible *(Día actual)* | Oculto |
| `/dashboard/egresos` | **Egresos** | `/iconsAdmi/Egresos.svg` | Visible | Visible *(Sin anular)* | Oculto |
| `/dashboard/empleados` | **Empleados** | `/iconsAdmi/Empleados.svg` | Visible | Visible *(Solo lectura)* | Oculto |
| `/dashboard/asistencia` | **Asistencia** | `/iconsAdmi/Asistencia.svg` | Visible | Visible *(Solo lectura/QR)* | Oculto |
| `/dashboard/servicios` | **Servicios** | `/iconsAdmi/Servicios.svg` | Visible | Visible | Oculto |
| `/dashboard/vestuario` | **Vestuario** | `/iconsAdmi/Vestuario.svg` | Visible | Visible | Oculto |
| `/dashboard/productos` | **Productos** | `/iconsAdmi/Productos.svg` | Visible | Visible | Oculto |

#### Pie de la Barra Lateral (`Sidebar Footer`)
- **Identificación de Usuario:** Muestra el nombre completo del usuario conectado (obtenido de `profiles` o metadata OAuth), un ícono vectorial de usuario en relieve dorado y una etiqueta con el rol activo (`badge-gold`).
- **Línea Divisoria Decorativa:** Degradado dorado suave (`rgba(200, 164, 92, 0.25)`).
- **Botón de Cierre de Sesión:** Botón rojo suave (`rgba(239, 68, 68, 0.08)`) con spinner reactivo que invoca `supabase.auth.signOut()` y redirige a `/auth/login`.

---

## C. Especificación Visual por Módulo

---

### C.1 Módulo: Recepción e Inicio Operativo

#### 1. Propósito del Módulo
Concentrar en una única pantalla de comando toda la actividad del salón para el turno activo: estado de las citas en curso, ingresos cobrados del día, egresos acumulados, ventas de mostrador y balance de caja neto. Es utilizado continuamente por el Recepcionista y el Administrador.
- **Entidades Supabase de Soporte:** `bookings`, `booking_services`, `payment_logs`, `expenses`, `egresos`, `ventas_mostrador`.

#### 2. Vistas del Módulo

##### Vista: Monitor de Recepción y Control Financiero Rápido
- **Ruta:** `/dashboard`
- **Roles con Acceso:** `admin`, `recepcionista`, `empleado` (el empleado solo visualiza sus citas asignadas).
- **Descripción Visual:**
  - **Cabecera del Dashboard:** Título "Panel de Gestión", selector de rango temporal para el bloque financiero (*Hoy, Semana, Mes, Todo*) e indicador visual circular en verde/gris que informa el estado de conexión con **Supabase Realtime** (*"En vivo"*).
  - **Grilla de Tarjetas KPI:**
    1. *Total Ingresos Cobrados:* Destacado en tipografía dorada grande con símbolo `S/`. Suma el dinero efectivamente recaudado de reservas confirmadas/completadas más las ventas de mostrador.
    2. *Total Egresos Operativos:* Resaltado con borde rojo suave, mostrando los gastos registrados en el periodo seleccionado.
    3. *Balance Neto de Caja:* Indicador con color condicional (verde si es positivo, rojo si es negativo), resultado de restar los egresos a los ingresos.
    4. *Citas de la Semana / Día:* Conteo numérico exacto de citas confirmadas y completadas.
  - **Pestañas de Detalle de Movimientos:** Cuatro pestañas (*Todos*, *Servicios/Reservas*, *Ventas Mostrador*, *Egresos*) que filtran dinámicamente la tabla inferior de transacciones.
  - **Bloque Operativo "Agenda de Hoy":** Lista cronológica de citas del día con hora de inicio, nombre y teléfono del cliente, código de reserva, tipo de servicio (Barbería/Spa), badge de estado de cita y badge de estado de pago.
- **Acciones del Usuario:**
  - Alternar rango financiero mediante botones segmentados (*Hoy / Esta Semana / Este Mes / Todo*).
  - Cambiar de pestaña para aislar ingresos, ventas o gastos.
  - Hacer clic en una cita para navegar directamente a su gestión en `/dashboard/reservas`.
- **Validaciones y Reglas Visibles:**
  - **Regla Estricta de Ingresos:** Solo las citas en estado `confirmada` o `completada` aportan al total de ingresos. Además, solo suma el dinero verificado cobrado (`advance_amount_cents`), nunca el valor presupuestado total si aún no se ha pagado.
  - Las citas canceladas, expiradas o pendientes no suman un solo centavo al total.
- **Estados de la Vista:**
  - *Cargando:* Esqueleto de carga con pulsaciones doradas suaves (`loading.tsx`).
  - *Vacío:* Ilustración y mensaje *"No hay citas programadas para hoy"* con botón para crear una nueva reserva.
  - *Tiempo Real:* Cuando entra una nueva reserva o se registra un pago en otro dispositivo, la fila parpadea brevemente en dorado y los totales se actualizan sin recargar la página.

#### 3. Componentes Reutilizables del Módulo
- `DashboardHome.tsx`: Componente contenedor principal cliente conectado a canales WebSocket de Supabase.
- Tarjetas KPI de Resumen Financiero: Muestra etiqueta, valor formateado en Soles y tendencia.

#### 4. Flujos Principales del Módulo
- **Monitoreo en Tiempo Real:** El recepcionista mantiene la pantalla abierta en la caja del salón; al llegar un cliente o generarse un pago en la web, el sistema actualiza automáticamente el estado de la cita a `confirmada` y recalcula el saldo de caja.

---

### C.2 Módulo: Gestión de Reservas y Caja de Citas

#### 1. Propósito del Módulo
Gestionar el ciclo de vida completo de cada cita: desde su creación manual en recepción o ingreso web, hasta la asignación de colaboradores, registro de pagos de adelanto o cancelación de saldos, liberación anticipada de servicios concluidos, emisión de comprobantes y ticket térmico.
- **Entidades Supabase de Soporte:** `bookings`, `booking_services`, `services`, `employees`, `payment_logs`, `payment_settings`, `profiles`.

#### 2. Vistas del Módulo

##### Vista: Tablero Maestro de Reservas
- **Ruta:** `/dashboard/reservas`
- **Roles con Acceso:** `admin`, `recepcionista`.
- **Descripción Visual:**
  - **Barra Superior de Herramientas y Acciones:**
    - Botón primario dorado: `➕ Nueva Reserva` (abre `NewBookingModal`).
    - Botón secundario con engranaje: `⚙️ Configurar Pagos` (solo visible para `admin`, abre `PaymentSettingsModal`).
    - Filtro rápido de fecha: Botones *"Hoy"*, *"Mañana"*, *"Todas"* y un selector de fecha nativo.
    - Filtro por estado: Desplegable con opciones (*Todos, Pendiente, Confirmada, Completada, Cancelada, Expirada*).
    - Filtro por categoría: *Barbería*, *Spa*, *Mixto*.
    - Campo de búsqueda en vivo: Filtra por nombre de cliente, apellido, teléfono o código alfanumérico de reserva.
  - **Tabla Principal de Citas:**
    - Columnas: *Código*, *Cliente*, *Fecha y Hora*, *Tipo/Servicios*, *Total*, *Adelanto Cobrado*, *Saldo Pendiente*, *Estado Cita*, *Estado Pago*, *Acciones*.
    - Fila Expandible: Al hacer clic en una fila, se despliega un panel secundario mostrando cada uno de los servicios individuales contratados en la cita, el especialista asignado a cada uno, los horarios de inicio y fin programados, y un botón para "Liberar Especialista" si el servicio terminó antes de tiempo.
  - **Badges Visuales de Estado de Cita:**
    - `pendiente`: Amarillo/Ámbar (`badge-warning`).
    - `confirmada`: Verde esmeralda (`badge-success`).
    - `completada`: Oro metálico (`badge-gold`).
    - `cancelada`: Rojo carmesí (`badge-error`).
    - `expirada`: Gris apagado (`badge-neutral`).
  - **Badges Visuales de Estado de Pago:**
    - `sin_pago` / `pendiente`: Fondo rojo claro, texto rojo en negrita: **"SIN PAGO"**.
    - `parcial`: Fondo ámbar claro, texto ámbar: **"SALDO PENDIENTE"**.
    - `total`: Fondo verde claro, texto verde: **"PAGADO COMPLETO"**.
- **Acciones del Usuario:**
  - **Registrar / Modificar Pago:** Abre `PaymentModal`. Permite registrar cobros en Efectivo, Yape o Mixto.
  - **Ver Historial de Pagos:** Abre `PaymentHistoryModal` para auditar los comprobantes registrados, montos parciales y anular pagos erróneos (anulación solo permitida al Administrador).
  - **Imprimir Ticket Térmico:** Abre `TicketTermico` para imprimir en formato de 80mm o 58mm en impresoras térmicas de punto de venta.
  - **Notificar por WhatsApp:** Genera un enlace a `https://wa.me/` con texto preformateado conteniendo el código de cita, fecha, hora y detalle de montos para el cliente.
  - **Liberar Servicio Individual:** Botón dentro de la fila expandida que marca el servicio como concluido, registrando la hora de liberación (`liberado_at`) para devolver la disponibilidad al colaborador en la agenda.
  - **Cambiar Estado de Reserva:** Menú desplegable para transicionar la cita a *Confirmada*, *Completada* o *Cancelada*.
- **Validaciones y Reglas Visibles:**
  - **Regla del 25% de Adelanto:** Una cita no puede confirmarse automáticamente a menos que los pagos verificados cubran al menos el 25% de la tarifa total. Al registrar un pago que satisfaga este umbral, el sistema cambia el estado a `confirmada` y asigna la fecha `confirmed_at`.
  - **Invariante de Saldo:** El saldo pendiente nunca puede ser negativo. Si el cliente paga de más, el sistema muestra error o advierte el sobrante.
  - **Asignación de Personal Especializado:** Solo se pueden asignar colaboradores que posean la habilidad (`employee_skills`) requerida para el servicio.

#### 3. Componentes Reutilizables del Módulo
- `NewBookingModal.tsx`: Modal multi-sección para crear reservas en recepción seleccionando cliente, servicios, horarios y colaboradores con detección de choques de agenda.
- `PaymentModal.tsx`: Interfaz de cobro rápido con cálculo en tiempo real de saldos, desglose de montos en Efectivo/Yape y subida de comprobante.
- `PaymentHistoryModal.tsx`: Visualizador de auditoría de pagos con enlace a vouchers en Storage y botón de anulación con motivo.
- `PaymentSettingsModal.tsx`: Modal exclusivo de administrador para editar el titular de la cuenta Yape, número telefónico, imagen del código QR y porcentaje mínimo de adelanto.
- `TicketTermico.tsx`: Componente de impresión directa con estilos `@media print`, compatible con impresoras de tickets Epson, Xprinter y Bixolon.

#### 4. Flujos Principales del Módulo

##### Flujo: "Registrar Pago y Confirmar Reserva"
1. El recepcionista ubica la reserva en la tabla y hace clic en el botón `💳 Cobrar`.
2. Se abre el `PaymentModal` con el resumen financiero: Total, Adelanto Mínimo Requerido, Monto Ya Cobrado y Saldo Pendiente.
3. El operador elige el método: *Yape*, *Efectivo* o *Mixto*.
   - Si es *Mixto*, el formulario despliega dos inputs numéricos: "Monto en Efectivo" y "Monto en Yape". Ambos deben sumar exactamente el monto a registrar.
4. El operador ingresa el importe recibido (por ejemplo, el adelanto de S/ 30.00) y opcionalmente adjunta el voucher o captura de pantalla.
5. Al hacer clic en `Guardar Pago`, el sistema registra la fila en `payment_logs`. El trigger de base de datos recalcula el saldo; si se alcanzó el 25%, la reserva pasa a estado `confirmada` y el badge de pago cambia a `SALDO PENDIENTE` o `PAGADO COMPLETO`.
6. La pantalla ofrece un botón instantáneo para `🖨️ Imprimir Ticket de Pago`.

---

### C.3 Módulo: Ventas de Mostrador (POS Rápido)

#### 1. Propósito del Módulo
Permitir la comercialización ágil de productos capilares, ceras, pomadas, champús y tratamientos en el mostrador del establecimiento sin obligar a registrar una cita previa ni crear un perfil de cliente complejo.
- **Entidades Supabase de Soporte:** `ventas_mostrador`, `products`, `auth.users`.

#### 2. Vistas del Módulo

##### Vista: Terminal de Venta Rápida y Registro de Caja
- **Ruta:** `/dashboard/ventas`
- **Roles con Acceso:** `admin`, `recepcionista`.
- **Descripción Visual:**
  - **Panel Izquierdo / Superior (Formulario de Venta):**
    - Campo *Nombre del Cliente* (texto libre, por ejemplo: "Cliente Mostrador", "Carlos Vega").
    - Campo *Producto*: Entrada de texto con autocompletado inteligente alimentado del catálogo maestro de productos (`products`), permitiendo seleccionar un producto existente o escribir un ítem manual si es necesario.
    - Campo *Cantidad*: Input numérico entero (mínimo 1).
    - Campo *Precio Unitario*: Input numérico en Soles (se autocompleta con el precio de catálogo al elegir un producto sugerido, pero puede ser editado para aplicar descuentos en mostrador).
    - Campo *Total a Cobrar*: Texto destacado en oro de gran tamaño calculado automáticamente (`Cantidad × Precio Unitario`).
    - Selector de *Método de Pago*: Botones tipo pill (*Efectivo*, *Yape*, *Transferencia*, *Mixto*).
    - Campo *Notas Adicionales*: Texto opcional para registrar observaciones (ej. "Entregado con bolsa de regalo").
    - Botón principal de acción: `⚡ Registrar Venta e Imprimir Ticket`.
  - **Panel Derecho / Inferior (Historial de Ventas del Turno):**
    - Filtros por periodo: *Hoy*, *Esta Semana*, *Este Mes*, *Todas*.
    - Barra de búsqueda de ventas por cliente o producto.
    - Tabla con fecha/hora, cliente, producto, cantidad, precio unitario, total, método de pago y acciones.
    - Acciones por fila: `🖨️ Re-imprimir Ticket`, `✏️ Edición Rápida` (modificar cantidad o precio de error inmediato) y `🗑️ Eliminar` (solo disponible para el Administrador).
- **Acciones del Usuario:**
  - Registrar venta rápida con un solo clic.
  - Abrir y visualizar el ticket térmico con desglose de ítems (`TicketVentaTermico`).
  - Filtrar ventas históricas para cuadres de caja.
- **Validaciones y Reglas Visibles:**
  - Cantidad obligatoria $\ge 1$.
  - Precio unitario obligatorio $\ge 0$.
  - Sincronización en vivo: Cada venta dispara un evento a través de `ventas-sync.ts`, impactando inmediatamente en los totales del `DashboardHome` y de `ReportsManager` sin necesidad de recargar la página.
- **Estados de la Vista:**
  - *Éxito:* Notificación verde temporal con el mensaje *"Venta registrada exitosamente"* y apertura automática del diálogo de impresión del ticket.

#### 3. Componentes Reutilizables del Módulo
- `VentasManager.tsx`: Componente unificado de formulario de caja e histórico.
- `TicketVentaTermico.tsx`: Formato de ticket optimizado para tiras térmicas con logo de Acicalados, RUC/datos fiscales, fecha, número de comprobante, detalle de producto y pie de agradecimiento.

---

### C.4 Módulo: Agenda y Calendario por Empleado

#### 1. Propósito del Módulo
Brindar una visualización temporal gráfica de toda la capacidad instalada del salón: citas programadas, horas bloqueadas, permisos de colaboradores y asistencias. Permite a recepción y administración detectar huecos libres y evitar la sobreventa de turnos.
- **Entidades Supabase de Soporte:** `bookings`, `booking_services`, `employees`, `employee_blocks`, `employee_attendances`.

#### 2. Vistas del Módulo

##### Vista: Calendario Multi-Vista (Día / Semana / Mes)
- **Ruta:** `/dashboard/calendario`
- **Roles con Acceso:** `admin`, `recepcionista`.
- **Descripción Visual:**
  - **Barra de Navegación del Calendario:**
    - Botones de navegación temporal: `← Anterior`, `Hoy`, `Siguiente →`.
    - Selector de Modo de Visualización: Botones segmentados `Día` | `Semana` | `Mes`.
    - Selector de Colaborador: Menú desplegable para ver la agenda de *"Todos los empleados"* o aislar la agenda de un barbero/terapeuta específico.
    - Filtros de Tipo de Evento (Toggles):
      - `📅 Reservas / Citas` (Color azul/dorado según estado).
      - `🟡 Permisos / Bloqueos` (Color amarillo/ámbar).
    - Botón de exportación: `📄 Exportar Agenda del Día (PDF)` (genera documento imprimible con los turnos del día ordenados por sillón/especialista).
    - Botón de acción: `➕ Nuevo Permiso / Bloqueo` (abre `EmployeeAbsenceRangeModal`).
  - **Área de Cuadrícula:**
    - *Modo Mes:* Grilla clásica de 7 columnas (Lunes a Domingo) donde cada celda muestra los eventos comprimidos en chips coloreados. Al hacer clic en un día con múltiples citas, se abre `CalendarDayEventsModal`.
    - *Modo Semana / Día:* Eje vertical de horas desde las 08:00 hasta las 22:00, con bloques visuales cuya altura es proporcional a la duración del servicio en minutos.
  - **Modal de Detalle de Evento (`CalendarEventModal`):**
    - Muestra al hacer clic en cualquier bloque: Código de cita, Nombre del cliente, Teléfono, Servicio, Colaborador asignado, Horario exacto, Total a cobrar, Saldo pendiente y Estado. Incluye botón para saltar directo a la gestión de la reserva.
- **Validaciones y Reglas Visibles:**
  - Las citas confirmadas se diferencian claramente de las citas pendientes por color y borde.
  - Los permisos aprobados aparecen con franja rayada impidiendo agendar citas sobre ellos.

#### 3. Componentes Reutilizables del Módulo
- `CalendarManager.tsx`: Controlador interactivo principal de la cuadrícula.
- `CalendarEventModal.tsx`: Visualizador emergente de detalle de cita/permiso.
- `CalendarDayEventsModal.tsx`: Lista ampliada de todas las citas de un día determinado.
- `daily-calendar-agenda-pdf.ts`: Generador PDF de la hoja de trabajo diaria para los especialistas.

---

### C.5 Módulo: Reportes Financieros y Cierre de Caja

#### 1. Propósito del Módulo
Auditar el rendimiento económico del negocio, liquidar comisiones y productividad por colaborador, supervisar la caja diaria y exportar información contable en formatos oficiales.
- **Entidades Supabase de Soporte:** `bookings`, `payment_logs`, `expenses`, `ventas_mostrador`, `employees`, `services`.

#### 2. Vistas del Módulo

##### Vista: Consolidado Financiero y Liquidaciones
- **Ruta:** `/dashboard/reportes`
- **Roles con Acceso:** `admin` (acceso histórico total), `recepcionista` (acceso estrictamente restringido al día en curso).
- **Descripción Visual:**
  - **Barra de Filtros:**
    - Botones de Periodo: *Día*, *Semana*, *Mes*, *Año*, *Personalizado* (para el Recepcionista, estos botones están ocultos o bloqueados forzosamente en "Día / Hoy").
    - Selectores de fecha inicio y fin.
    - Filtro por Categoría de Negocio: *Todos*, *Solo Barbería*, *Solo Spa*.
    - Filtro por Colaborador: Permite liquidar la producción individual de un trabajador.
    - Botones de Exportación en Cabecera:
      - `📗 Exportar Excel (.xlsx)`
      - `📕 Exportar PDF`
      - `📲 Cierre de Caja (WhatsApp)` (abre `DailyClosingWhatsAppModal`).
  - **Tarjetas de Balance Financiero (Executive KPI Grid):**
    1. *Ingresos por Servicios (Cobrado Real):* Fondos verificados recaudados en citas.
    2. *Ventas de Mostrador:* Ingresos por ventas de productos.
    3. *Total Ingresos Brutos:* Suma de servicios cobrados + ventas de mostrador.
    4. *Total Egresos Operativos:* Gastos de caja chica activos en el periodo.
    5. *Resultado Neto de Caja:* `Ingresos Brutos - Egresos Operativos`.
    6. *Saldos por Cobrar:* Dinero presupuestado de citas confirmadas que aún no ha sido cancelado por los clientes.
  - **Pestañas de Detalle Analítico:**
    - *Pestaña 1: Resumen de Citas y Cobros:* Tabla de todas las reservas con estado, montos y métodos de pago (Yape/Efectivo).
    - *Pestaña 2: Ventas de Mostrador:* Desglose de cada venta de productos de mostrador.
    - *Pestaña 3: Productividad por Empleado:* Tabla con cada especialista, cantidad de servicios realizados, total facturado y comisión estimada.
    - *Pestaña 4: Detalle de Gastos:* Lista clasificada de compras y desembolsos operativos.
- **Acciones del Usuario:**
  - Exportar dataset en Excel con un solo clic.
  - Descargar reporte ejecutivo en PDF con tablas formateadas.
  - Abrir el modal de Cierre de Caja diario: consolida automáticamente los montos por método de pago (*Efectivo en caja*, *Yape recibido*, *Egresos pagados en efectivo*, *Efectivo neto a entregar*) y genera el mensaje de WhatsApp para los dueños.
- **Validaciones y Reglas Visibles:**
  - **Salvaguarda de Rol Recepcionista:** La interfaz deshabilita cualquier intento de cambiar fechas hacia días pasados o futuros, garantizando que el personal de recepción solo gestione la caja del día presente.
  - **Protección contra Inyección de Fórmulas en Excel:** Los textos exportados son sanitizados automáticamente en frontend y backend ante caracteres como `=`, `+`, `-`, `@`.

#### 3. Componentes Reutilizables del Módulo
- `ReportsManager.tsx`: Administrador de reportes con cómputo reactivo y renderizado de tablas.
- `DailyClosingWhatsAppModal.tsx`: Generador del arqueo y cierre diario con previsualización y botón de envío directo a WhatsApp.

---

### C.6 Módulo: Control de Egresos y Gastos Operativos

#### 1. Propósito del Módulo
Llevar un libro de egresos transparente para compras de insumos (shampoos, tintes, toallas), pago de servicios básicos, alimentación o mantenimiento del local, descontando automáticamente del flujo de caja.
- **Entidades Supabase de Soporte:** `expenses`, `employees`, `auth.users`.

#### 2. Vistas del Módulo

##### Vista: Libro de Gastos y Egresos
- **Ruta:** `/dashboard/egresos`
- **Roles con Acceso:** `admin`, `recepcionista`.
- **Descripción Visual:**
  - Cabecera con botón `➕ Nuevo Egreso` (abre `ExpenseFormModal`).
  - Tarjetas de resumen: *Total Gastos del Periodo* (Soles) y *Número de Gastos Activos*.
  - Filtros: Fecha de inicio, fecha de fin, categoría (*Insumos, Productos, Servicios Básicos, Mantenimiento, Personal, Transporte, Otros*) y estado (*Activo / Anulado*).
  - Tabla de Egresos: Fecha, categoría con ícono característico, descripción del gasto, proveedor o colaborador asociado, monto en Soles (`S/ xx.xx`), método de pago, comprobante adjunto (ícono con enlace directo a ver el recibo) y badge de estado.
  - Acciones por fila: Botón `🚫 Anular Egreso` (exclusivo para el Administrador).
- **Validaciones y Reglas Visibles:**
  - Monto del egreso obligatorio y mayor a 0.
  - Descripción obligatoria (mínimo 3 caracteres).
  - Categoría obligatoria.
  - **Anulación con Auditoría:** Para anular un egreso, el Administrador debe ingresar obligatoriamente un motivo de anulación de al menos 5 caracteres. El gasto no se borra físicamente (`soft-delete`), pasa a estado `voided` con fecha y usuario que anuló, excluyéndose de los cálculos netos de caja.

#### 3. Componentes Reutilizables del Módulo
- `ExpensesManager.tsx`: Tabla y filtros de gastos.
- `ExpenseFormModal.tsx`: Formulario de creación de gasto con soporte de carga de fotos de comprobantes a Storage.

---

### C.7 Módulo: Personal, Colaboradores y Asignaciones

#### 1. Propósito del Módulo
Administrar al equipo de profesionales (barberos, estilistas, recepcionistas), definir qué servicios domina cada uno (`skills`), visualizar la asignación horaria en tiempo real (Kanban de sillones/turnos) y gestionar descansos o licencias.
- **Entidades Supabase de Soporte:** `employees`, `employee_skills`, `services`, `employee_blocks`, `profiles`.

#### 2. Vistas del Módulo

##### Vista: Gestión de Colaboradores y Asignaciones de Citas
- **Ruta:** `/dashboard/empleados`
- **Roles con Acceso:** `admin` (edición completa), `recepcionista` (consulta y reasignaciones).
- **Descripción Visual:**
  - Pestañas superiores: `👥 Empleados` | `📌 Asignación de Citas`.
  - **En Pestaña "Empleados":**
    - Botón `➕ Nuevo Empleado` (abre modal de registro: Nombres, Apellidos, Tipo [Barbería/Spa/Recepción], Orden de rotación, Selector de servicios que puede realizar con checkboxes agrupados).
    - Tarjetas o Tabla de Colaboradores: Foto/avatar, nombre completo, cargo, estado activo/inactivo (toggle switch), cantidad de habilidades asignadas.
    - Botones de acción por colaborador:
      - `🪪 Badge QR`: Abre `EmployeeQRBadgeModal` para previsualizar e imprimir la credencial física de asistencia con código QR único.
      - `🏖️ Permisos / Bloqueos`: Abre `EmployeeAbsenceRangeModal` para registrar vacaciones, permisos médicos o días libres.
      - `📄 Descargar Agenda`: Genera PDF con la agenda de citas del empleado.
      - `✏️ Editar`: Modifica habilidades o datos del colaborador.
  - **En Pestaña "Asignación de Citas" (Tablero Kanban Horario):**
    - Vista organizada por colaborador donde cada tarjeta representa una cita asignada para el día seleccionado.
    - Muestra la hora de inicio y fin, el cliente y el servicio.
    - Permite cambiar el especialista asignado en caliente mediante un selector interactivo si un colaborador se desocupa antes o si ocurre un retraso en el salón.
- **Validaciones y Reglas Visibles:**
  - Nombre y apellido obligatorios.
  - Tipo de empleado obligatorio (`barberia`, `spa`, `recepcionista`).
  - Detección de colisiones: Al registrar un permiso en `EmployeeAbsenceRangeModal`, si el colaborador tiene citas programadas en ese intervalo, el sistema lista las citas en conflicto advirtiendo al usuario para que las reasigne antes de aprobar el permiso.

#### 3. Componentes Reutilizables del Módulo
- `EmployeesManager.tsx`: Administrador general con soporte de dos pestañas.
- `EmployeeQRBadgeModal.tsx`: Generador e imprimible de tarjeta de identificación con QR para marcación de reloj control.
- `EmployeeAbsenceRangeModal.tsx`: Formulario de permisos por rango de fechas/horas con control de motivos y advertencia de citas comprometidas.

---

### C.8 Módulo: Control de Asistencia, QR y Bonificaciones

#### 1. Propósito del Módulo
Monitorear la puntualidad y asistencia del personal del salón en tiempo real mediante tecnología QR sin contacto, auditar justificaciones de inasistencia/tardanza y calcular automáticamente las horas extras o bonificaciones nocturnas basadas en la reglamentación del negocio en horario de Lima.
- **Entidades Supabase de Soporte:** `employee_attendances`, `attendance_justifications`, `bonus_settings`, `employees`, `auth.users`.

#### 2. Vistas del Módulo

##### Vista: Marcador de Asistencia y Panel de Asistencias Diarias
- **Ruta:** `/dashboard/asistencia`
- **Roles con Acceso:** `admin`, `recepcionista`, `empleado` (acceso enfocado al escáner).
- **Descripción Visual:**
  - **Botones de Cabecera:**
    - Botón prominente dorado: `📷 Abrir Escáner QR de Asistencia` (abre `AttendanceQRScannerModal`).
    - Botón `⚙️ Reglas de Bonificación` (abre `BonusSettingsModal`, exclusivo admin).
  - **Filtros Temporales y de Área:**
    - Selector de rango: *Día*, *Semana*, *Mes*, *Año*.
    - Selector de fecha específica.
    - Filtro por tipo de personal: *Todos*, *Barbería*, *Spa*, *Recepción*.
    - Barra de búsqueda de colaborador por nombre.
  - **Tabla de Registros de Asistencia:**
    - Columnas: *Empleado*, *Fecha*, *Hora de Entrada (Check-In)*, *Hora de Salida (Check-Out)*, *Horas Trabajadas*, *Minutos de Bono*, *Estado*, *Acciones*.
    - Badges de Estado: `presente` (verde), `tardanza` (amarillo), `salida_temprana` (naranja), `falta_justificada` (azul), `falta_injustificada` (rojo), `en_permiso` (morado).
    - Acciones por fila:
      - `📝 Justificar`: Abre `JustificationModal` para adjuntar certificado médico o motivo de tardanza/ausencia.
      - `⏱️ Ajustar Bono`: Abre `BonusAdjustmentModal` (solo admin) para corregir manualmente minutos de bonificación con motivo auditado.
      - `📜 Historial`: Abre `EmployeeHistoryModal` con el registro mensual del colaborador.
      - `✏️ Edición Manual`: Permite al Administrador corregir horas de entrada y salida olvidadas.
- **El Escáner QR (`AttendanceQRScannerModal`):**
  - Activa la cámara del dispositivo móvil o tablet de recepción en un marco cuadrado con animación de escaneo.
  - Al posicionar la credencial QR del empleado frente a la lente:
    - Si el empleado no ha marcado hoy: registra **Check-In** con la hora exacta en `America/Lima`, muestra foto y nombre en verde y emite un pitido audible de confirmación.
    - Si el empleado ya tenía Check-In abierto: registra **Check-Out**, calcula automáticamente si superó el umbral nocturno y computa los `bonus_minutes`.
- **Validaciones y Reglas Visibles:**
  - **Regla Estricta de Bonificación Nocturna (`bonus_settings`):**
    - Lunes a Sábado: la bonificación empieza a contarse a partir de las **21:10**.
    - Domingo: la bonificación empieza a las **20:10**.
    - Fórmula visual: Si el check-out es a las 21:45 un martes, el sistema calcula automáticamente `35 minutos` de bonificación.
  - Si un administrador ajusta manualmente el bono, el registro queda marcado con `bonus_calculation_type = 'manual'` para protegerlo de recálculos automáticos posteriores.

#### 3. Componentes Reutilizables del Módulo
- `AttendanceManager.tsx`: Vista principal de asistencia.
- `AttendanceQRScannerModal.tsx`: Componente con canvas de video HTML5 y decodificación QR en tiempo real.
- `JustificationModal.tsx`: Formulario de justificación con subida de comprobantes médicos a Storage.
- `BonusSettingsModal.tsx`: Panel administrativo para fijar las horas de corte por día de la semana.
- `BonusAdjustmentModal.tsx`: Modal para ingreso de minutos manuales y motivo.

---

### C.9 Módulo: Catálogos Maestros (Servicios, Productos y Vestuario)

#### 1. Propósito del Módulo
Administrar la oferta de servicios, el inventario de productos para venta en mostrador/tienda y la colección de trajes y vestidos de etiqueta para sesiones y eventos.
- **Entidades Supabase de Soporte:** `services`, `products`, `wardrobe_items`, `storage.buckets`, `storage.objects`.

#### 2. Vistas del Módulo

##### Vista 1: Catálogo de Servicios (`/dashboard/servicios`)
- **Roles:** `admin`, `recepcionista`.
- **Descripción Visual:** Grilla de tarjetas o tabla con imagen en miniatura, nombre, slug, categoría (*Barbería* o *Spa*), precio en Soles, duración en minutos, capacidad simultánea y estado público/activo. Botón `➕ Nuevo Servicio` abre `ServiceFormModal` con campos de texto, selector de categoría, duración y componente drag-and-drop para subir imágenes a `services-images`.

##### Vista 2: Catálogo de Productos (`/dashboard/productos`)
- **Roles:** `admin`, `recepcionista`.
- **Descripción Visual:** Listado de productos con stock actual, precio, categoría y estado. Botón `➕ Nuevo Producto` abre `ProductFormModal` para ingresar nombre, slug automático, descripción, stock numérico, precio en centavos y fotos subidas a `products-images`.

##### Vista 3: Colección de Vestuario (`/dashboard/vestuario`)
- **Roles:** `admin`, `recepcionista`.
- **Descripción Visual:** Galería de prendas con estado de disponibilidad (*Disponible, Reservado, En Uso, En Mantenimiento*), precios de alquiler, depósito en garantía y categoría (ej. "Bodas & Matrimonios"). Botón `➕ Nueva Prenda` abre `WardrobeFormModal` conectado al bucket `wardrobe-images`.

---

### C.10 Módulo: Portal Comercial y Reserva Online del Cliente

#### 1. Propósito del Módulo
Permitir a los clientes descubrir servicios, conocer las instalaciones, comprar productos capilares y reservar su cita online en 5 pasos guiados sin fricción.
- **Entidades Supabase de Soporte:** `services`, `products`, `wardrobe_items`, `bookings`, `booking_services`, `payment_settings`, `profiles`.

#### 2. Vistas del Módulo

##### Vista 1: Landing Page Pública (`/`)
- **Componentes:** Carrusel hero (`HeroImageCarousel`) con transiciones suaves, tarjetas de servicios destacados de Barbería y Spa, testimonios de clientes, llamado a la acción hacia `/reservar` y pie de página institucional con redes sociales y datos de ubicación.

##### Vista 2: Asistente de Reserva Online (`/reservar`)
- **Flujo en 5 Pasos:**
  1. *Paso 1: Tipo de Servicio (`type`):* Selección visual entre **Barbería Clásica & Moderna** y **Spa & Relajación**.
  2. *Paso 2: Selección de Servicios (`services`):* Catálogo interactivo donde el cliente agrega servicios a su canasta con precio y duración acumulada. Soporta reservas mixtas (servicios de barbería + spa en una sola cita).
  3. *Paso 3: Fecha y Horario (`datetime`):* Calendario mensual para elegir la fecha. Al seleccionar día, consulta `/api/availability` en vivo y pinta los bloques horarios disponibles (deshabilitando aquellos que ya alcanzaron la capacidad máxima de sillones o que coinciden con permisos de personal).
  4. *Paso 4: Datos de Contacto (`contact`):* Nombres, apellidos, teléfono (WhatsApp), DNI y correo electrónico. Si el cliente está autenticado, los datos se autocompletan desde su perfil.
  5. *Paso 5: Confirmación y Pago de Adelanto (`success`):* Pinta el código de reserva único de 8 caracteres (ej. `a1b2c3d4`), el desglose de precios, el monto del adelanto mínimo requerido (25%) y embebe el componente `PaymentQRWidget`:
     - Código QR de Yape de alta resolución con botón de ampliación (*Lightbox*).
     - Nombre del titular de la cuenta y número telefónico para transferir.
     - Botón `Subir Comprobante de Pago`: Permite al cliente subir una foto del voucher.
     - Botón verde prominente `Confirmar por WhatsApp`: Abre WhatsApp con un mensaje pre-cargado que incluye todos los detalles para coordinar la cita con recepción.

##### Vista 3: Tienda Online con Carrito (`/tienda`)
- Catálogo de productos con filtros por categoría. Botón *"Agregar al Carrito"* que interactúa con el `CartProvider` y abre el panel lateral deslizable `CartDrawer` con resumen de compra y redirección de pedido a WhatsApp.

##### Vista 4: Portal del Cliente (`/mi-cuenta`)
- Acceso exclusivo para clientes autenticados.
- Formulario para actualizar nombres, teléfono y DNI (`ProfileForm`).
- Historial de citas pasadas y futuras con estado de reserva, total presupuestado, adelanto pagado y saldo pendiente. Si la cita tiene saldo pendiente, se despliega el widget de QR para que el cliente pueda pagar el saldo restante en cualquier momento.

---

## D. Patrones de Interfaz Transversales

### D.1 Visualización de Listados y Tablas
- **Filas Alternadas y Efectos Hover:** Tablas de fondo oscuro (`#141414`) con filas que se iluminan suavemente en dorado translúcido (`rgba(200, 164, 92, 0.05)`) al pasar el cursor.
- **Acciones Rápidas en Extremo Derecho:** Todas las tablas ubican sus botones de acción (cobrar, editar, ticket, anular) en la última columna, fijada visualmente o alineada a la derecha.
- **Paginación y Límites de Rendimiento:** Las consultas principales están configuradas con límites seguros (ej. 200 a 500 registros) y filtros de fecha por defecto hacia el día de hoy para garantizar cargas ultrarrápidas.

### D.2 Modales y Formularios
- **Superposiciones (*Backdrops*):** Capa semitransparente oscura con desenfoque de fondo (`backdrop-filter: blur(8px)`).
- **Estructura Estándar de Modal:** Cabecera con título e ícono temático, cuerpo scrollable para formularios extensos y pie fijo con botón secundario de cancelar (`btn-ghost`) y botón primario de acción (`btn-primary` o `btn-gold`).
- **Bloqueo durante Envío:** Al pulsar guardar, el botón de acción cambia a estado de carga con spinner SVG circular y se deshabilitan todos los campos para evitar doble envío accidental.

### D.3 Notificaciones y Mensajería de Feedback
- **Toasts y Alertas Flotantes:** Mensajes breves que emergen en la esquina superior derecha o bajo la cabecera.
  - *Éxito:* Borde y texto en verde esmeralda (`#22C55E`), fondo verde al 10%.
  - *Error:* Borde y texto en rojo carmesí (`#EF4444`), fondo rojo al 10%.
  - *Advertencia:* Borde y texto en amarillo/ámbar (`#F59E0B`).

### D.4 Estados de Carga (*Loading States*)
- **Esqueletos de Carga (*Skeletons*):** Bloques con gradiente animado de gris a gris claro en tablas y tarjetas durante la primera carga.
- **Barra de Progreso Superior:** Durante transiciones entre rutas en el panel de administración, se despliega una delgada línea animada de 3px con gradiente dorado en la parte superior del navegador (`AdminSidebar.tsx`).

### D.5 Formateo Numérico y Monetario
- **Moneda Peruana:** Todo monto monetario se expresa en Soles con prefijo `S/ ` y dos decimales (`S/ 25.00`, `S/ 150.00`).
- **Almacenamiento en Centavos:** A nivel de código y base de datos, los valores se manipulan como enteros en centavos (`total_price_cents: 2500` = `S/ 25.00`) para prevenir errores de coma flotante en JavaScript.
- **Tiempo y Duración:** Horarios expresados en formato de 24 horas (`HH:mm`, ej. `09:30`, `18:45`) y duraciones en minutos u horas legibles (`45 min`, `1h 30m`).

---

## E. Roles y Experiencia por Perfil

### E.1 Perfil: Administrador (`admin`)
- **Acceso:** Total e irrestricto a todos los módulos y submódulos.
- **Capacidades Exclusivas:**
  - Anular pagos en `payment_logs` indicando motivo de auditoría.
  - Anular egresos en `expenses`.
  - Configurar las credenciales de cobro de Yape, teléfono y porcentaje de adelanto (`payment_settings`).
  - Ajustar manualmente minutos de bonificación de personal (`BonusAdjustmentModal`).
  - Crear, editar o eliminar colaboradores y asignarles habilidades técnicas.
  - Consultar reportes financieros en cualquier rango de fechas histórico y exportar a Excel y PDF.
- **Experiencia Visual:** Visualiza el menú lateral completo de 11 opciones, todos los botones de acción administrativa habilitados y la insignia dorada `Admin` en su perfil.

### E.2 Perfil: Recepcionista (`recepcionista`)
- **Acceso:** Operativo en sala de espera, caja, agenda y catálogos.
- **Restricciones Visuales Clave:**
  - **Bloqueo Inmutable de Reportes:** En `/dashboard/reportes`, la vista está forzada de forma estricta al día actual; no puede seleccionar semanas o meses pasados ni ver balances consolidados anuales.
  - **Prohibición de Anulación:** No visualiza los botones de anular pagos ni anular egresos (debe solicitarlo al Administrador si hubo una equivocación).
  - **Configuración Oculta:** No visualiza el botón de configurar pagos de Yape ni las reglas de corte de bonificación.
- **Experiencia Visual:** Menú lateral completo enfocado a agendar, cobrar, registrar ventas de mostrador y emitir tickets térmicos.

### E.3 Perfil: Colaborador / Especialista (`empleado` / ADI)
- **Acceso:** Restringido a su ámbito laboral.
- **Restricciones Visuales:**
  - El menú lateral únicamente muestra el enlace a `/dashboard` (Inicio) y la opción de cerrar sesión.
  - Si intenta ingresar manualmente por URL a `/dashboard/reportes` o `/dashboard/egresos`, el layout lo intercepta y redirige.
- **Experiencia Visual:** Pantalla limpia enfocada en su agenda del día, los clientes que debe atender en sus turnos y la confirmación de su asistencia.

### E.4 Perfil: Cliente (`cliente`)
- **Acceso:** Portal público y `/mi-cuenta`.
- **Experiencia Visual:** Navegación por la barra superior (`Navbar`), catálogo de servicios, carrito de compras, seguimiento de citas con semáforos de pago y widget de pago QR para regularizar saldos.

---

## F. Catálogo de Vistas del Sistema

| Módulo | Nombre de la Vista | Ruta del Sistema | Rol(es) Autorizados | Propósito Operativo | Tablas Supabase Relacionadas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Recepción** | Inicio / Monitor Operativo | `/dashboard` | `admin`, `recepcionista`, `empleado` | Monitoreo en tiempo real de citas del día y balance rápido de caja. | `bookings`, `expenses`, `ventas_mostrador` |
| **Agenda** | Calendario Interactivo | `/dashboard/calendario` | `admin`, `recepcionista` | Visualización en grilla (Día/Semana/Mes) de citas y permisos; exportación PDF. | `bookings`, `employee_blocks`, `employees` |
| **Reservas** | Tablero de Reservas y Caja | `/dashboard/reservas` | `admin`, `recepcionista` | Gestión de citas, control de adelanto (25%), cobro Yape/Efectivo y tickets térmicos. | `bookings`, `booking_services`, `payment_logs` |
| **Ventas** | Terminal POS de Mostrador | `/dashboard/ventas` | `admin`, `recepcionista` | Venta directa de productos capilares sin cita e impresión de comprobante térmico. | `ventas_mostrador`, `products` |
| **Reportes** | Consolidado Financiero | `/dashboard/reportes` | `admin`, `recepcionista` *(Solo Hoy)* | Auditoría de ingresos vs egresos, liquidación por empleado, Excel y PDF. | `bookings`, `payment_logs`, `expenses`, `ventas_mostrador` |
| **Egresos** | Control de Caja Chica | `/dashboard/egresos` | `admin`, `recepcionista` | Registro de compras de insumos y mantenimiento con anulación auditada. | `expenses`, `egresos`, `employees` |
| **Personal** | Colaboradores y Horarios | `/dashboard/empleados` | `admin`, `recepcionista` | CRUD de personal, matriz de habilidades, badges QR y permisos por rango. | `employees`, `employee_skills`, `employee_blocks` |
| **Asistencia**| Control de Asistencia y QR | `/dashboard/asistencia` | `admin`, `recepcionista`, `empleado` | Marcación por cámara QR, bonificaciones nocturnas y justificaciones. | `employee_attendances`, `attendance_justifications`, `bonus_settings` |
| **Servicios** | Catálogo de Servicios | `/dashboard/servicios` | `admin`, `recepcionista` | Gestión de servicios, precios, tiempos y fotos en Storage. | `services`, Storage `services-images` |
| **Productos** | Catálogo de Productos | `/dashboard/productos` | `admin`, `recepcionista` | Gestión de productos para venta, precios y stock. | `products`, Storage `products-images` |
| **Vestuario** | Galería de Vestuario | `/dashboard/vestuario` | `admin`, `recepcionista` | Control de prendas de alquiler, depósitos y disponibilidad. | `wardrobe_items`, Storage `wardrobe-images` |
| **Público** | Landing Page Principal | `/` | Público (`anon`, `cliente`) | Presentación de la marca, servicios destacados y accesos directos. | `services`, `gallery_items` |
| **Público** | Catálogo de Servicios | `/servicios` | Público (`anon`, `cliente`) | Exploración de la carta completa de servicios de Barbería y Spa. | `services` |
| **Público** | Asistente de Reserva | `/reservar` | Público (`anon`, `cliente`) | Flujo en 5 pasos para agendar citas con verificación de slots y QR de pago. | `services`, `bookings`, `payment_settings` |
| **Público** | Tienda Online | `/tienda` | Público (`anon`, `cliente`) | Tienda con carrito flotante y pedidos hacia WhatsApp. | `products` |
| **Público** | Galería de Vestuario | `/vestuario` | Público (`anon`, `cliente`) | Catálogo visual de vestidos y trajes para eventos. | `wardrobe_items` |
| **Público** | Ubicación y Locales | `/ubicacion` | Público (`anon`, `cliente`) | Información física del local, horarios y mapa interactivo. | `business_config` |
| **Auth** | Inicio de Sesión | `/auth/login` | Público | Acceso seguro mediante correo/contraseña o Google OAuth. | `auth.users`, `profiles` |
| **Auth** | Registro de Usuario | `/auth/register` | Público | Creación de cuentas nuevas para clientes finales. | `auth.users`, `profiles` |
| **Cliente** | Portal de Autoservicio | `/mi-cuenta` | `cliente` (autenticado) | Historial de citas, pagos de saldos vía QR y datos de perfil. | `profiles`, `bookings` |

---

## G. Glosario de Términos de Negocio

- **Adelanto Requerido (25%):** Umbral monetario fijado por política del salón para garantizar el turno. Una cita en estado `pendiente` no se considera `confirmada` hasta que el cliente abone al menos dicho porcentaje del total presupuestado.
- **ADI / Colaborador / Especialista:** Personal técnico de salón (barbero, estilista, cosmetóloga o masajista) asignado a ejecutar uno o varios servicios dentro de una cita.
- **Asignación Multiservicio:** Capacidad del sistema para que una misma cita con múltiples servicios (ej. Corte de Cabello + Masaje Relajante) sea atendida por diferentes especialistas en horarios secuenciales o solapados.
- **Badge QR de Asistencia:** Código QR único generado a partir del UUID del empleado que se imprime en una credencial plástica para marcar entrada y salida frente a la cámara del salón.
- **Balance Neto:** Métrica de caja que resulta de la fórmula: `(Ingresos Cobrados por Citas + Ventas de Mostrador) - Egresos Operativos Activos`.
- **Bloqueo / Permiso de Agenda (`employee_blocks`):** Intervalo de tiempo en el que un especialista no puede recibir citas debido a vacaciones, enfermedad o descanso semanal.
- **Cierre de Caja Diario:** Proceso de arqueo donde recepción cuadra el dinero físico en gaveta contra los cobros digitales en Yape y los gastos en efectivo, generando una plantilla formal enviada a los propietarios por WhatsApp.
- **Liberación Anticipada de Servicio:** Acción operativa mediante la cual el recepcionista marca que un colaborador finalizó su atención antes del tiempo estimado, liberando inmediatamente su disponibilidad en la agenda.
- **Minutos de Bonificación Nocturna (`bonus_minutes`):** Tiempo compensatorio acumulado por colaboradores que extienden su salida más allá del horario límite establecido en `America/Lima` (21:10 de Lunes a Sábado, 20:10 los Domingos).
- **Payment QR Widget:** Componente de interfaz que genera en pantalla el código QR oficial de Yape, el monto a pagar y permite adjuntar la captura del comprobante.
- **Reserva Mixta:** Cita que combina servicios de las dos ramas del negocio (Barbería masculina y Spa/Estética femenina) en una misma transacción.
- **Ticket Térmico:** Comprobante físico impreso en bobina continua de 80mm o 58mm para entregar al cliente en caja.
- **Venta de Mostrador:** Venta directa de producto en tienda física sin cita previa asociada.

---

## H. Recomendaciones para Replicar el Sistema

1. **Mantener la Integridad del Esquema Monetario en Centavos:**
   - Nunca almacenar precios en tipos `float` o `numeric` con decimales en JavaScript. Todos los cálculos en UI y API deben mantenerse en centavos enteros (`cents`), formateando a Soles únicamente en la capa visual final.
2. **Respetar la Zona Horaria Única `America/Lima`:**
   - Dado que el sistema calcula asistencias, bonificaciones nocturnas y aperturas de caja, todos los formateadores de fecha en cliente y servidor deben utilizar explícitamente `timeZone: "America/Lima"`. Evitar el uso de `new Date().toISOString()` sin normalización horaria.
3. **Replicar la Salvaguarda de Roles en Frontend:**
   - La restricción de que el `recepcionista` solo pueda auditar reportes del día actual debe aplicarse en la vista (`ReportsManager.tsx`) y protegerse en los endpoints de backend (`/api/admin/reports/*`).
4. **Preservar el Mecanismo de Impresión Térmica:**
   - La estructura de componentes como `TicketTermico.tsx` y `TicketVentaTermico.tsx` utiliza CSS optimizado para fuentes monoespaciadas legibles en impresoras térmicas ESC/POS. Conservar los estilos `@media print` para no romper la compatibilidad con terminales de caja.
5. **Aislamiento de la Función `private.get_user_role()`:**
   - Las reglas de acceso RLS en Supabase y los componentes de UI dependen de consultar el rol en `public.profiles` a través de esta función de seguridad definer para evitar la suplantación de privilegios en el token de cliente.

---

## I. Vacíos de Observabilidad

1. **Módulo de Blog Descontinuado:**
   - Existen rastros en documentación antigua sobre un módulo de blog (`008_drop_blog_module.sql` y una política en Storage para `blog-images`), pero las tablas y páginas del blog fueron removidas deliberadamente del código productivo actual.
2. **Facturación Electrónica Directa SUNAT:**
   - La tabla `bookings` cuenta con campos preparados para facturación (`comprobante_tipo`, `comprobante_serie`, `comprobante_numero`, `pdf_url`), pero la emisión formal de XML y firma digital con un Operador de Servicios Electrónicos (OSE) se ejecuta externamente o de manera asíncrona, no mediante un botón de timbrado directo en esta base de código.
3. **Control Automático de Stock en Mostrador:**
   - Las ventas de mostrador (`ventas_mostrador`) registran la transacción y se sincronizan financieramente, pero la deducción automática del campo `stock` en la tabla `products` se realiza a través de inventarios periódicos manuales o scripts complementarios, no mediante un trigger automático obligatorio en base de datos.

---

*Documento generado en modo solo lectura; no modifica código ni base de datos.*
