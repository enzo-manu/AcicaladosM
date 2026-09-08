import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase/client';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Scissors,
  AlertCircle,
  Loader2,
  User,
  CheckCircle2,
  Sparkles,
  Phone,
  ArrowLeft,
} from 'lucide-react';
import {
  sanitizePhone,
  isValidPhone,
  handleNumericKeyDown,
  PHONE_PLACEHOLDER,
  PHONE_ERROR_MESSAGE,
} from '../../lib/validators';

export const LoginView: React.FC = () => {
  const { setActiveView } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Iniciar sesión con Google (Gmail OAuth)
  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setErrorMessage(null);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Error al iniciar con Google:', err);
      setErrorMessage(
        err.message ||
          'No se pudo conectar con el servicio de Google. Verifica la configuración en Supabase.'
      );
      setOauthLoading(false);
    }
  };

  // Iniciar sesión con Correo y Contraseña
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Por favor completa tu correo y contraseña.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          setSuccessMessage('¡Bienvenido! Redirigiendo a tu cuenta...');

          // Consultar rol en profiles para redirigir
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          const role = profile?.role || 'cliente';
          setTimeout(() => {
            if (role === 'admin' || role === 'recepcionista') {
              setActiveView('/dashboard');
            } else {
              setActiveView('/mi-cuenta');
            }
          }, 600);
        }
      } else {
        // Registro de nuevo cliente
        if (!fullName.trim()) {
          throw new Error('Por favor ingresa tus nombres y apellidos.');
        }
        if (!email.trim() || !password) {
          throw new Error('Por favor ingresa un correo y contraseña válidos.');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        if (phone.trim() && !isValidPhone(phone.trim())) {
          throw new Error(PHONE_ERROR_MESSAGE);
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              name: fullName.trim(),
              phone: phone.trim() || undefined,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          if (data.session) {
            setSuccessMessage('¡Cuenta creada con éxito! Ingresando...');
            setTimeout(() => {
              setActiveView('/mi-cuenta');
            }, 800);
          } else {
            setSuccessMessage(
              '¡Cuenta registrada! Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada.'
            );
          }
        }
      }
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      let message = err.message || 'Ocurrió un error inesperado al iniciar sesión.';
      if (message.includes('Invalid login credentials')) {
        message = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      } else if (message.includes('User already registered')) {
        message = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
      }
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Luces de ambientación dorada */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C8A45C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-neutral-800/20 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Botón Volver al Inicio */}
        <button
          type="button"
          onClick={() => setActiveView('/')}
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-[#C8A45C] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Inicio</span>
        </button>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="bg-[#141414]/90 backdrop-blur-xl border border-[#C8A45C]/30 rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] space-y-7">
          {/* Encabezado */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C8A45C] to-[#997734] text-black shadow-lg shadow-[#C8A45C]/20 mx-auto">
              <Scissors className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="inline-block text-[10px] uppercase font-bold tracking-widest text-[#C8A45C] px-2.5 py-0.5 rounded-full bg-[#C8A45C]/10 border border-[#C8A45C]/20">
                Club Privado & Estética Masculina
              </span>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear tu Cuenta'}
              </h1>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                {mode === 'login'
                  ? 'Accede a tus citas agendadas, historial de servicios o portal operativo.'
                  : 'Regístrate para reservar citas exclusivas y acceder a beneficios VIP.'}
              </p>
            </div>
          </div>

          {/* Mensajes de error y éxito */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* 1. Botón de Google OAuth */}
          <div className="space-y-3">
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={oauthLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-xs sm:text-sm bg-[#1A1A1A] hover:bg-[#222222] text-white border border-neutral-700/80 hover:border-[#C8A45C]/60 transition-all duration-200 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {oauthLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C8A45C]" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="tracking-wide">
                {oauthLoading ? 'Conectando con Google...' : 'Continuar con Google (Gmail)'}
              </span>
            </button>
          </div>

          {/* Separador Visual */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-neutral-800 w-full" />
            <span className="bg-[#141414] px-3 text-[11px] uppercase tracking-wider text-neutral-500 font-medium whitespace-nowrap">
              O continúa con correo
            </span>
            <div className="border-t border-neutral-800 w-full" />
          </div>

          {/* 2. Formulario con Correo y Contraseña */}
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-300">
                    Nombres y Apellidos <span className="text-[#C8A45C]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Mario Vargas Llosa"
                      className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-neutral-300">
                      Teléfono WhatsApp (Opcional)
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">9 dígitos</span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{9}"
                      maxLength={9}
                      value={phone}
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                      placeholder={PHONE_PLACEHOLDER}
                      className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none transition-colors font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                Correo Electrónico <span className="text-[#C8A45C]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  id="login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-neutral-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-neutral-300">
                  Contraseña <span className="text-[#C8A45C]">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        'Para restablecer tu contraseña, ingresa tu correo y contacta al administrador de Acicalados o solicita un enlace de recuperación.'
                      )
                    }
                    className="text-[11px] text-neutral-400 hover:text-[#C8A45C] transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white rounded-xl pl-10 pr-10 py-2.5 text-xs outline-none transition-colors placeholder:text-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || oauthLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#C8A45C] to-[#E6C875] hover:from-[#d5b367] hover:to-[#edd182] text-black shadow-lg shadow-[#C8A45C]/20 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Iniciar Sesión' : 'Completar Registro'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Enlace para alternar entre Login y Registro */}
          <div className="text-center pt-2 border-t border-neutral-800/80">
            {mode === 'login' ? (
              <p className="text-xs text-neutral-400">
                ¿Aún no tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[#C8A45C] font-semibold hover:underline cursor-pointer"
                >
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p className="text-xs text-neutral-400">
                ¿Ya tienes una cuenta registrada?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[#C8A45C] font-semibold hover:underline cursor-pointer"
                >
                  Inicia sesión aquí
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
