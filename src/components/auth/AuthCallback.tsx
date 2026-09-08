import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase/client';
import { Loader2, ShieldCheck, AlertCircle, ArrowRight, Scissors } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const { setActiveView } = useApp();
  const [statusMessage, setStatusMessage] = useState('Procesando credenciales de acceso seguro...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processAuthExchange = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const errorDesc = urlParams.get('error_description') || urlParams.get('error');

        if (errorDesc) {
          throw new Error(errorDesc);
        }

        let sessionUser = null;

        if (code) {
          setStatusMessage('Intercambiando código de autenticación con Supabase...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
          sessionUser = data.user;
        } else {
          // Verificar si ya existe una sesión en el cliente (ej. vía hash fragment o cookie)
          const { data: sessionData } = await supabase.auth.getSession();
          sessionUser = sessionData.session?.user || null;
        }

        if (!sessionUser) {
          // Si aún no hay usuario, esperar brevemente al listener de sesión
          const { data: userData } = await supabase.auth.getUser();
          sessionUser = userData.user;
        }

        if (!sessionUser) {
          throw new Error('No se pudo verificar la sesión. Por favor intenta iniciar sesión nuevamente.');
        }

        setStatusMessage('Verificando perfil y permisos de usuario...');

        // Consultar el rol asignado en la base de datos de Acicalados
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, first_name, last_name')
          .eq('id', sessionUser.id)
          .single();

        const userRole = profile?.role || 'cliente';

        if (isMounted) {
          setStatusMessage(`¡Autenticación exitosa! Redirigiendo según tu rol (${userRole})...`);

          setTimeout(() => {
            if (userRole === 'admin' || userRole === 'recepcionista') {
              setActiveView('/dashboard');
            } else {
              setActiveView('/mi-cuenta');
            }
          }, 800);
        }
      } catch (err: any) {
        console.error('Error en callback de autenticación:', err);
        if (isMounted) {
          setError(
            err.message ||
              'Ocurrió un error al procesar la autenticación de Supabase. Vuelve a intentarlo.'
          );
        }
      }
    };

    processAuthExchange();

    return () => {
      isMounted = false;
    };
  }, [setActiveView]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fondo y luces decorativas */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C8A45C]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#141414]/90 backdrop-blur-xl border border-[#C8A45C]/30 rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-center space-y-6 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C8A45C] to-[#997734] text-black shadow-lg shadow-[#C8A45C]/20 mx-auto">
          <Scissors className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="inline-block text-[10px] uppercase font-bold tracking-widest text-[#C8A45C] px-2.5 py-0.5 rounded-full bg-[#C8A45C]/10 border border-[#C8A45C]/20">
            Seguridad & Validación de Acceso
          </span>
          <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white">
            {error ? 'Problema de Autenticación' : 'Conectando con Acicalados'}
          </h2>
        </div>

        {error ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('/auth/login')}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#C8A45C] hover:bg-[#d5b367] text-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Volver a Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center py-3">
              <Loader2 className="w-8 h-8 text-[#C8A45C] animate-spin" />
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed max-w-xs mx-auto animate-pulse">
              {statusMessage}
            </p>

            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cifrado TLS 1.3 & Protocolo Seguro Supabase</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
