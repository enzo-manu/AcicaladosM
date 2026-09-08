import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Shirt,
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  DollarSign,
  Layers,
  Tag,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WardrobeItem, WardrobeCategory, WardrobeStatus, formatSoles } from '../../types';
import { supabase } from '../../lib/supabase/client';

// ==========================================
// LAS 5 CATEGORÍAS OFICIALES EXACTAS
// ==========================================
export const EVENT_CATEGORIES: WardrobeCategory[] = [
  'Bodas y Matrimonio',
  'Quinceañeras',
  'Gala y Noche',
  'Trajes Típicos y Costumbristas',
  'Casual y Sesiones de Fotos',
];

// ==========================================
// COMPRESIÓN DE IMAGEN A WEBP EN CLIENTE
// ==========================================
async function compressImageToWebP(file: File, quality = 0.85, maxWidth = 1200): Promise<{ blob: Blob; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el lienzo para compresión'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const sizeKb = Math.round(blob.size / 1024);
              resolve({ blob, sizeKb });
            } else {
              reject(new Error('Falló la conversión de la imagen a WebP'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Error al procesar la imagen seleccionada'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
}

// ==========================================
// COMPONENTE PRINCIPAL: VESTUARIO MANAGER
// ==========================================
export const VestuarioManager: React.FC = () => {
  const { wardrobe, currentRole, addWardrobeItem, updateWardrobeItem, deleteWardrobeItem, toggleWardrobeActive } = useApp();

  // Permisos: Administrador o Recepcionista
  const isAuthorized = currentRole === 'admin' || currentRole === 'recepcionista';

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Campos del Formulario
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<WardrobeCategory>('Bodas y Matrimonio');
  const [formCode, setFormCode] = useState('A');
  const [formDescription, setFormDescription] = useState('');
  const [formPriceSoles, setFormPriceSoles] = useState<string>('180.00');
  const [formDepositSoles, setFormDepositSoles] = useState<string>('50.00');
  const [formSize, setFormSize] = useState('Standard / Ajustable');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formImageUrl, setFormImageUrl] = useState<string>('');

  // Estado de Carga de Imagen
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageCompressionInfo, setImageCompressionInfo] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de retroalimentación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de Confirmación de Eliminación
  const [itemToDelete, setItemToDelete] = useState<WardrobeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mostrar Toast temporal
  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Sugerir la siguiente letra disponible para el código interno (A, B, C...)
  const getNextAvailableCode = useCallback(() => {
    const existingCodes = new Set(
      wardrobe
        .map((w) => (w.code || '').trim().toUpperCase())
        .filter((c) => /^[A-Z]$/.test(c))
    );
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i); // 'A'...'Z'
      if (!existingCodes.has(letter)) {
        return letter;
      }
    }
    return 'A';
  }, [wardrobe]);

  // Abrir Modal para Crear
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingItemId(null);
    setFormName('');
    setFormCategory('Bodas y Matrimonio');
    setFormCode(getNextAvailableCode());
    setFormDescription('');
    setFormPriceSoles('180.00');
    setFormDepositSoles('50.00');
    setFormSize('Standard / Ajustable');
    setFormIsActive(true);
    setFormImageUrl('https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80');
    setImageCompressionInfo(null);
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar
  const handleOpenEditModal = (item: WardrobeItem) => {
    setModalMode('edit');
    setEditingItemId(item.id);
    setFormName(item.name);
    // Asegurar categoría válida o fallback
    const matchedCategory = EVENT_CATEGORIES.find((c) => c.toLowerCase() === item.category.toLowerCase());
    setFormCategory(matchedCategory || 'Bodas y Matrimonio');
    setFormCode((item.code || 'A').toUpperCase().trim());
    setFormDescription(item.description || '');
    setFormPriceSoles((item.rental_price_cents / 100).toFixed(2));
    setFormDepositSoles(((item.deposit_cents || 0) / 100).toFixed(2));
    setFormSize(item.size || 'Standard / Ajustable');
    setFormIsActive(item.active !== false);
    setFormImageUrl(item.image_url || '');
    setImageCompressionInfo(null);
    setIsModalOpen(true);
  };

  // Procesamiento y Carga de Fotografía con Compresión WebP
  const handleProcessAndUploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    try {
      setUploadingImage(true);
      setImageCompressionInfo('Comprimiendo imagen a WebP...');

      // 1. Compresión en frontend a WebP
      const originalSizeKb = Math.round(file.size / 1024);
      const { blob: webpBlob, sizeKb: webpSizeKb } = await compressImageToWebP(file, 0.85, 1200);

      setImageCompressionInfo(`WebP optimizado: ${webpSizeKb} KB (original: ${originalSizeKb} KB)`);

      // 2. Subida a Supabase Storage: bucket wardrobe-images
      const cleanCode = (formCode || 'A').toUpperCase().trim();
      const cleanName = (formName || 'vestuario')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-');
      const fileName = `wardrobe-${cleanCode}-${cleanName}-${Date.now()}.webp`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(fileName, webpBlob, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error al subir a Supabase Storage:', uploadError);
        // Generar URL temporal local en caso de restricción
        const localPreviewUrl = URL.createObjectURL(webpBlob);
        setFormImageUrl(localPreviewUrl);
        showToast('error', `Aviso de almacenamiento: ${uploadError.message}. Se asignó vista previa.`);
        return;
      }

      // 3. Obtener URL pública permanente
      const { data: publicUrlData } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(uploadData.path || fileName);

      if (publicUrlData?.publicUrl) {
        setFormImageUrl(publicUrlData.publicUrl);
        showToast('success', 'Fotografía WebP optimizada y almacenada exitosamente.');
      }
    } catch (err: any) {
      console.error('Error al optimizar imagen:', err);
      showToast('error', `Error al optimizar imagen: ${err.message || 'Error desconocido'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessAndUploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessAndUploadImage(e.target.files[0]);
    }
  };

  // Guardar Prenda (Crear / Editar)
  const handleSubmitWardrobe = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones obligatorias
    if (!formName.trim()) {
      showToast('error', 'El título de la prenda es obligatorio.');
      return;
    }
    if (!formCode.trim()) {
      showToast('error', 'El código interno alfabético (A - Z) es obligatorio.');
      return;
    }

    const priceNum = parseFloat(formPriceSoles);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('error', 'Ingresa un precio de referencia válido en Soles (S/).');
      return;
    }

    const depositNum = parseFloat(formDepositSoles) || 0;
    const priceCents = Math.round(priceNum * 100);
    const depositCents = Math.round(depositNum * 100);
    const codeNormalized = formCode.trim().toUpperCase();

    const finalImageUrl =
      formImageUrl.trim() ||
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80';

    try {
      setIsSubmitting(true);

      if (modalMode === 'create') {
        const success = await addWardrobeItem({
          name: formName.trim(),
          code: codeNormalized,
          category: formCategory,
          rental_price_cents: priceCents,
          deposit_cents: depositCents,
          status: 'disponible',
          active: formIsActive,
          image_url: finalImageUrl,
          size: formSize.trim() || 'Standard / Ajustable',
          description: formDescription.trim(),
        });

        if (success) {
          showToast('success', `¡Prenda [Código ${codeNormalized}] creada con éxito!`);
          setIsModalOpen(false);
        } else {
          showToast('error', 'No se pudo guardar la prenda en la base de datos.');
        }
      } else if (modalMode === 'edit' && editingItemId) {
        const success = await updateWardrobeItem({
          id: editingItemId,
          name: formName.trim(),
          code: codeNormalized,
          category: formCategory,
          rental_price_cents: priceCents,
          deposit_cents: depositCents,
          status: 'disponible',
          active: formIsActive,
          image_url: finalImageUrl,
          size: formSize.trim() || 'Standard / Ajustable',
          description: formDescription.trim(),
        });

        if (success) {
          showToast('success', `¡Prenda [Código ${codeNormalized}] actualizada correctamente!`);
          setIsModalOpen(false);
        } else {
          showToast('error', 'No se pudo actualizar la prenda en la base de datos.');
        }
      }
    } catch (err: any) {
      console.error('Error al guardar prenda:', err);
      showToast('error', `Error al procesar: ${err.message || 'Error del sistema'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alternar Estado Activo / Oculto Directo desde la Grilla
  const handleToggleActiveDirect = async (item: WardrobeItem) => {
    try {
      const currentActive = item.active !== false;
      const ok = await toggleWardrobeActive(item.id, currentActive);
      if (ok) {
        showToast(
          'success',
          `Prenda [${item.code || 'A'}] marcada como "${!currentActive ? 'Activo' : 'Oculto'}" ${
            !currentActive ? '(Visible en catálogo público)' : '(Oculta del catálogo público)'
          }.`
        );
      }
    } catch (err) {
      showToast('error', 'Error al cambiar la visibilidad de la prenda.');
    }
  };

  // Confirmar y Ejecutar Eliminación
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const ok = await deleteWardrobeItem(itemToDelete.id);
      if (ok) {
        showToast('success', `Prenda [Código ${itemToDelete.code || 'A'}] eliminada con éxito.`);
        setItemToDelete(null);
      } else {
        showToast('error', 'No se pudo eliminar la prenda de la base de datos.');
      }
    } catch (err) {
      showToast('error', 'Error al eliminar la prenda.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrado reactivo de prendas
  const filteredItems = useMemo(() => {
    return wardrobe.filter((w) => {
      // Filtro por texto o código
      const q = searchQuery.toLowerCase().trim();
      const matchesText =
        !q ||
        w.name.toLowerCase().includes(q) ||
        (w.code && w.code.toLowerCase().includes(q)) ||
        (w.description && w.description.toLowerCase().includes(q));

      // Filtro por categoría de evento
      const matchesCategory =
        selectedCategoryFilter === 'all' ||
        w.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

      // Filtro por estado activo / oculto
      const isItemActive = w.active !== false;
      const matchesStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'active' && isItemActive) ||
        (selectedStatusFilter === 'hidden' && !isItemActive);

      return matchesText && matchesCategory && matchesStatus;
    });
  }, [wardrobe, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  // Contadores de métricas superiores
  const stats = useMemo(() => {
    const total = wardrobe.length;
    const activeCount = wardrobe.filter((w) => w.active !== false).length;
    const hiddenCount = total - activeCount;
    return { total, activeCount, hiddenCount };
  }, [wardrobe]);

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-[#141414] border border-amber-900/50 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-serif-luxury font-bold text-white">Acceso Restringido</h2>
          <p className="text-sm text-neutral-400">
            La gestión del Catálogo de Vestuario está habilitada exclusivamente para el rol de
            Administrador y Recepción.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* ========================================== */}
      {/* NOTIFICACIÓN TOAST FLOTANTE */}
      {/* ========================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 transform translate-y-0">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-[#121A14]/95 border-emerald-500/40 text-emerald-300'
                : 'bg-[#1E1212]/95 border-rose-500/40 text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CABECERA PRINCIPAL */}
      {/* ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C8A45C] to-[#997328] text-black flex items-center justify-center shadow-lg shadow-[#C8A45C]/20">
              <Shirt className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-white tracking-wide">
              Control de Vestuario & Alquiler
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 flex items-center gap-2">
            <span>Gestión de prendas de alta etiqueta, códigos alfabéticos e inventario</span>
            <span className="inline-block w-1 h-1 rounded-full bg-[#C8A45C]" />
            <span className="text-[#C8A45C] font-medium capitalize">Rol: {currentRole}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C8A45C] via-[#E2C37D] to-[#C8A45C] text-black font-bold text-xs sm:text-sm shadow-xl shadow-[#C8A45C]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Prenda de Vestuario</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* RESUMEN DE MÉTRICAS */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#121212] border border-neutral-800/80 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-neutral-800/60 flex items-center justify-center text-[#C8A45C]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-[11px] text-neutral-400 font-medium">Prendas en Inventario</div>
          </div>
        </div>

        <div className="bg-[#121212] border border-neutral-800/80 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">{stats.activeCount}</div>
            <div className="text-[11px] text-neutral-400 font-medium">Activas en Catálogo Público</div>
          </div>
        </div>

        <div className="bg-[#121212] border border-neutral-800/80 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-neutral-800/60 flex items-center justify-center text-neutral-400">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-300">{stats.hiddenCount}</div>
            <div className="text-[11px] text-neutral-400 font-medium">Prendas Ocultas (Privadas)</div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      {/* ========================================== */}
      <div className="bg-[#121212] border border-neutral-800/80 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Buscador de texto o código */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (ej. A), título, evento o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181818] border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#C8A45C] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtro por Categoría de Evento */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-[#181818] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-[#C8A45C] transition-colors"
          >
            <option value="all">Todas las Categorías</option>
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Filtros por Estado Activo / Oculto */}
        <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-neutral-700/70 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatusFilter === 'all'
                ? 'bg-[#C8A45C] text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Activos
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('hidden')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatusFilter === 'hidden'
                ? 'bg-neutral-700 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Ocultos
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* LISTADO / GRILLA DE PRENDAS */}
      {/* ========================================== */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-12 text-center space-y-3">
          <Shirt className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No se encontraron prendas de vestuario</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery
              ? `No hay coincidencias para "${searchQuery}". Prueba con otros términos.`
              : 'No hay prendas en este filtro. Agrega una nueva prenda con el botón superior.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#C8A45C] text-black hover:brightness-110 cursor-pointer"
          >
            + Nueva Prenda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isItemActive = item.active !== false;
            const priceFormatted = (item.rental_price_cents / 100).toFixed(2);
            const codeDisplay = (item.code || 'A').toUpperCase().trim();

            return (
              <div
                key={item.id}
                className="group bg-[#121212] border border-neutral-800/90 hover:border-[#C8A45C]/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#C8A45C]/5"
              >
                {/* Imagen y Badges */}
                <div className="relative aspect-[4/3] w-full bg-neutral-900 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Badge Dorado del Código Interno (Requerimiento Principal) */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C8A45C] to-[#A27F38] text-black font-extrabold text-xs tracking-wider shadow-lg shadow-[#C8A45C]/30 flex items-center gap-1.5 border border-[#FFE7A8]">
                      <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Código: {codeDisplay}</span>
                    </div>

                    {/* Badge Estado Activo/Oculto */}
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow flex items-center gap-1 ${
                        isItemActive
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-neutral-900/80 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isItemActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                        }`}
                      />
                      {isItemActive ? 'Activo' : 'Oculto'}
                    </span>
                  </div>

                  {/* Badge de Categoría de Evento */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/75 text-neutral-200 border border-neutral-700/80 backdrop-blur-md shadow">
                      {item.category}
                    </span>
                  </div>

                  {/* Precio de Referencia en Soles */}
                  <div className="absolute bottom-3 right-3">
                    <div className="px-3 py-1.5 rounded-xl bg-black/85 border border-[#C8A45C]/50 backdrop-blur-md shadow flex items-baseline gap-1">
                      <span className="text-[10px] text-[#C8A45C] font-semibold">S/</span>
                      <span className="text-base font-bold text-white tracking-tight">
                        {priceFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenido de la Tarjeta */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif-luxury font-bold text-base text-white group-hover:text-[#C8A45C] transition-colors leading-snug">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.description || 'Prenda de alta etiqueta sin detalles adicionales.'}
                    </p>
                  </div>

                  {/* Fila con detalles de talla y garantía */}
                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="text-neutral-400">
                      Talla: <strong className="text-white">{item.size || 'Ajustable'}</strong>
                    </span>
                    {item.deposit_cents ? (
                      <span className="text-neutral-400">
                        Garantía: <span className="text-neutral-300 font-mono">{formatSoles(item.deposit_cents)}</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Switch Toggle Activo/Oculto y Botones de Acción */}
                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/60">
                    {/* Botón Toggle Directo Activo / Oculto */}
                    <button
                      type="button"
                      onClick={() => handleToggleActiveDirect(item)}
                      title={
                        isItemActive
                          ? 'Ocultar del catálogo público (solo visible en panel admin)'
                          : 'Activar en catálogo público'
                      }
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isItemActive
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {isItemActive ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                      <span>{isItemActive ? 'Público (Activo)' : 'Oculto (Admin)'}</span>
                    </button>

                    {/* Botón Editar */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      title="Editar prenda de vestuario"
                      className="p-2 rounded-xl bg-[#1A1A1A] border border-neutral-700/70 hover:border-[#C8A45C] text-neutral-300 hover:text-[#C8A45C] transition-all cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      title="Eliminar prenda de vestuario"
                      className="p-2 rounded-xl bg-[#1A1A1A] border border-neutral-700/70 hover:border-rose-500/70 text-neutral-400 hover:text-rose-400 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL "NUEVA PRENDA DE VESTUARIO" / EDITAR */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#121212] border border-[#C8A45C]/40 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Header del Modal */}
            <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-[#181818] to-[#121212]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C8A45C] text-black flex items-center justify-center shadow">
                  {modalMode === 'create' ? <Plus className="w-5 h-5" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-white">
                    {modalMode === 'create' ? 'Nueva Prenda de Vestuario' : 'Editar Prenda de Vestuario'}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Registro de trajes con código alfabético, categorías de evento y optimización WebP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitWardrobe} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* 1. Título y Código Interno */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Título de la prenda */}
                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    Título de la Prenda / Vestuario <span className="text-[#C8A45C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Smoking Italiano Solapa Satín / Vestido Gala Alta Costura"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#C8A45C] transition-colors"
                  />
                </div>

                {/* Código Interno (A - Z Case-Insensitive) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Código <span className="text-[#C8A45C]">*</span></span>
                    <span className="text-[10px] text-neutral-400">(A-Z)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="A"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#181818] border border-[#C8A45C]/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-center font-extrabold text-[#C8A45C] uppercase focus:outline-none focus:border-[#C8A45C] transition-colors shadow-sm shadow-[#C8A45C]/10"
                  />
                </div>
              </div>

              {/* 2. Categoría del Evento (Las 5 Opciones Exactas) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Categoría del Evento <span className="text-[#C8A45C]">*</span>
                </label>
                <select
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as WardrobeCategory)}
                  className="w-full bg-[#181818] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#C8A45C] transition-colors"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400">
                  Selecciona la categoría oficial del evento para la indexación y filtros públicos.
                </p>
              </div>

              {/* 3. Descripción */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Descripción (Detalles del traje, telas o acabados)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de la confección, tipo de tela (lana fría, satén, lino), botones o complementos incluidos..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#C8A45C] transition-colors resize-none"
                />
              </div>

              {/* 4. Precio de Referencia (S/) y Talla */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#181818]/60 p-4 rounded-2xl border border-neutral-800">
                {/* Precio de Referencia en Soles */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Precio Alquiler (S/) <span className="text-[#C8A45C]">*</span></span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#C8A45C]">
                      S/
                    </span>
                    <input
                      type="number"
                      step="1.00"
                      min="0"
                      required
                      placeholder="180.00"
                      value={formPriceSoles}
                      onChange={(e) => setFormPriceSoles(e.target.value)}
                      className="w-full bg-[#141414] border border-neutral-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#C8A45C] transition-colors"
                    />
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    En BD: <span className="text-white font-mono">{Math.round((parseFloat(formPriceSoles) || 0) * 100)} cents</span>
                  </div>
                </div>

                {/* Garantía en Soles */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    Garantía (S/)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      S/
                    </span>
                    <input
                      type="number"
                      step="1.00"
                      min="0"
                      placeholder="50.00"
                      value={formDepositSoles}
                      onChange={(e) => setFormDepositSoles(e.target.value)}
                      className="w-full bg-[#141414] border border-neutral-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#C8A45C] transition-colors"
                    />
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Reembolsable a la devolución
                  </div>
                </div>

                {/* Talla / Medidas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    Talla / Medidas
                  </label>
                  <input
                    type="text"
                    placeholder="Talla 40 / Ajustable"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full bg-[#141414] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#C8A45C] transition-colors"
                  />
                  <div className="text-[10px] text-neutral-400">
                    Ej. S, M, L o Talla de sastre
                  </div>
                </div>
              </div>

              {/* 5. Carga y Optimización de Imágenes con WebP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-[#C8A45C]" />
                    <span>Fotografía de la Prenda (Conversión automática a WebP)</span>
                  </label>
                  {imageCompressionInfo && (
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ {imageCompressionInfo}
                    </span>
                  )}
                </div>

                {/* Zona Drag and Drop */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col sm:flex-row items-center gap-4 ${
                    isDragOver
                      ? 'border-[#C8A45C] bg-[#C8A45C]/10'
                      : 'border-neutral-700/80 bg-[#161616] hover:border-neutral-500'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Vista Previa */}
                  <div className="w-24 h-24 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {formImageUrl ? (
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-neutral-600" />
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-[#C8A45C] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="text-left space-y-1 flex-1">
                    <p className="text-xs font-semibold text-white">
                      {uploadingImage
                        ? 'Procesando y subiendo WebP...'
                        : 'Haz clic o arrastra la foto del traje aquí'}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Se comprime en frontend a formato WebP ligero y se sube automáticamente al bucket <code className="text-[#C8A45C]">wardrobe-images</code> de Supabase.
                    </p>
                  </div>
                </div>

                {/* Input opcional directo para URL */}
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500">O ingresa una URL directa de imagen:</span>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-300 font-mono focus:outline-none focus:border-[#C8A45C]"
                  />
                </div>
              </div>

              {/* 6. Estado Activo / Oculto */}
              <div className="p-3.5 bg-[#181818] rounded-xl border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Estado: Activo / Visible al Público</div>
                  <div className="text-[11px] text-neutral-400">
                    Si está inactivo (Oculto), desaparece automáticamente del catálogo de clientes (/vestuario)
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C8A45C]" />
                </label>
              </div>

              {/* Botones del Footer del Modal */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#C8A45C] to-[#A5823E] text-black shadow-lg shadow-[#C8A45C]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Guardando en Base de Datos...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{modalMode === 'create' ? 'Guardar Prenda' : 'Actualizar Prenda'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {/* ========================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-rose-900/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Eliminar Prenda de Vestuario</h3>
                <p className="text-xs text-neutral-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la prenda{' '}
              <strong className="text-white">
                [Código {itemToDelete.code || 'A'}] "{itemToDelete.name}"
              </strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
