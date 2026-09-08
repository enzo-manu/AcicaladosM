# Walkthrough: Módulo de Asistencia con Escaneo QR, Control de Puntualidad y Configuración de Turnos

Se ha actualizado e integrado completamente el módulo de Asistencia (`/dashboard/asistencia`) en Acicalados Spa & Barber Shop, conectándolo con Supabase (`ydvqzgyhymjgbyfkxqhd`), incorporando el lector de códigos QR biométricos para fotochecks, el cálculo automático de puntualidad/tardanzas, horas extra a favor del trabajador y la configuración de turnos y tolerancias exclusiva para administradores.

---

## 1. Migración y Base de Datos Supabase (`ydvqzgyhymjgbyfkxqhd`)

Se crearon y actualizaron las estructuras correspondientes en la base de datos de Supabase autorizada:

- **Tabla `public.attendance_settings`**:
  - `id`: identificador UUID (`gen_random_uuid()`).
  - `shift_entry_time`: hora oficial de entrada (por defecto `'09:00'`).
  - `shift_exit_time`: hora oficial de salida (por defecto `'19:00'`).
  - `entry_tolerance_minutes`: tolerancia de entrada en minutos (por defecto `15`).
  - `exit_tolerance_minutes`: tolerancia de salida en minutos (por defecto `15`).
  - Políticas RLS: Lectura pública autenticada y escritura para administración.
  - Registro base sembrado automáticamente.
- **Ampliación de `public.employee_attendances`**:
  - Columna `tardy_minutes integer DEFAULT 0`.
  - Columna `overtime_minutes integer DEFAULT 0`.
- **Actualización de Tipos TypeScript (`database.types.ts` y `types.ts`)**:
  - Sincronización oficial del esquema generado directamente desde Supabase.

---

## 2. Escáner de Códigos QR para Fotochecks ([`QRScannerModal.tsx`](file:///d:/SistemasMANU/AcicaladosM/src/components/dashboard/QRScannerModal.tsx))

El nuevo modal de escaneo biométrico incorpora:
1. **Lector en Vivo por Cámara Web / Móvil**:
   - Acceso seguro mediante `navigator.mediaDevices.getUserMedia`.
   - Procesamiento en tiempo real cuadro a cuadro con HTML5 Canvas y biblioteca `jsQR`.
   - Mira de encuadre con esquinas doradas estilo lujo, barra láser de escaneo animada y botón de alternancia entre cámara frontal y trasera (para smartphones y tablets).
   - Confirmación sonora mediante Web Audio API (chime armónico para éxito, tono grave para error).
2. **Pestaña de Subida de Imagen de Fotocheck**:
   - Arrastre o selección de captura/foto de carnet QR con procesamiento inmediato.
3. **Pestaña de Marcación Rápida Manual**:
   - Buscador por nombre o DNI de colaborador para registrar entrada/salida directamente sin cámara.
4. **Flujo Inteligente de Marcación**:
   - **Primer escaneo del día**: Registra automáticamente la **Entrada** con la hora exacta de Lima (UTC-5).
   - **Segundo escaneo del día**: Registra automáticamente la **Salida**, calculando el tiempo laborado y las horas extra acumuladas.
   - **Tercer escaneo**: Notifica que el colaborador ya completó su jornada diaria.
   - **Tarjeta de Feedback Visual**: Muestra foto del colaborador, nombre, tipo de marcación (Entrada / Salida), hora registrada y badges de puntualidad (*Puntual*, *Tardanza +X min*, *Horas Extra +X min*).

---

## 3. Configuración de Turnos y Tolerancias ([`AttendanceSettingsModal.tsx`](file:///d:/SistemasMANU/AcicaladosM/src/components/dashboard/AttendanceSettingsModal.tsx))

- **Exclusividad de Rol**:
  - Botón y modal visibles **únicamente** cuando `currentRole === 'admin'`.
  - Oculto para recepcionistas y demás roles del sistema.
- **Campos Moldeables**:
  - Hora oficial de entrada (ejemplo: `09:00 AM`).
  - Hora oficial de salida (ejemplo: `07:00 PM / 19:00`).
  - Tolerancia de entrada en minutos (ejemplo: `15 min`).
  - Tolerancia de salida en minutos (ejemplo: `15 min`).
- **Persistencia en Supabase**:
  - Los valores se guardan en la tabla `attendance_settings` y se actualizan en el contexto global en tiempo real mediante `supabase.channel('schema-db-changes')`.

---

## 4. Lógica de Puntualidad y Horas Extra ([`AppContext.tsx`](file:///d:/SistemasMANU/AcicaladosM/src/context/AppContext.tsx))

- **Control de Tardanza**:
  $$\text{Hora Entrada} \le \text{Entrada Oficial} + \text{Tolerancia Entrada} \implies \textbf{Puntual}$$
  $$\text{Hora Entrada} > \text{Entrada Oficial} + \text{Tolerancia Entrada} \implies \textbf{Tardanza}$$
  Se calculan y almacenan los minutos de retraso acumulados respecto a la hora oficial de entrada.
- **Control de Horas Extra**:
  $$\text{Hora Salida} > \text{Salida Oficial} + \text{Tolerancia Salida} \implies \textbf{Horas Extra}$$
  Se contabiliza el excedente exacto respecto a la hora oficial de salida como saldo de minutos/horas que el negocio adeuda al colaborador.

---

## 5. Historial Diario y Rediseño de Vista ([`AsistenciaView.tsx`](file:///d:/SistemasMANU/AcicaladosM/src/components/dashboard/AsistenciaView.tsx))

- **Banner Superior**:
  - Reloj en vivo de Lima (UTC-5).
  - Indicador de reglas activas del turno actual (hora de entrada, salida y tolerancias).
  - Botones destacados: **"Escanear Asistencia QR"** y **"Configuración de Horarios y Tolerancias"** (Admin).
- **Tarjetas KPI en Tiempo Real**:
  - Colaboradores Presentes hoy.
  - Llegadas Puntuales (% de puntualidad).
  - Tardanzas Detectadas.
  - Total de Horas Extra generadas a favor del personal.
- **Tabla de Historial Diario**:
  - Selector de fecha con botones rápidos ("Hoy", "Ayer") y buscador por colaborador o rol.
  - Columnas:
    1. **Colaborador** (Avatar, Nombre completo, DNI).
    2. **Rol / Especialidad** (Badge temático para Barbería, Spa, Recepción).
    3. **Hora de Entrada** (con badge verde *Puntual* o ámbar *Tardanza +X min*).
    4. **Hora de Salida** (con indicador *En turno activo* o hora de salida).
    5. **Jornada Cumplida** (formato `Xh Ym`).
    6. **Saldo Horas Extra** (badge dorado `+X min (Y.Z hrs a favor)`).
    7. **Acciones**: Botón para visualizar e imprimir el **Fotocheck Digital QR** del empleado.

---

## 6. Verificación Técnica

- **TypeScript (`npx tsc --noEmit`)**: 0 errores de compilación.
- **Build de Producción (`npm run build`)**: Generado limpiamente en 4.51s sin advertencias de tipos.
- **Servidor Local Vite**: Corriendo y respondiendo HTTP 200 en `http://localhost:3000`.
- **Nota sobre el Subagente de Navegador**: Se detectó una incidencia externa de descarga del binario de Playwright (`playwright-1.57.0-win32_x64.zip 404`), por lo que la validación visual final se delega a la sesión del navegador local del usuario.
