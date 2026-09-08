import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Shield, UserCheck, Scissors, ShoppingBag, Eye, Sparkles } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentRole, setCurrentRole, activeView, setActiveView } = useApp();

  const roles: { role: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      role: 'admin',
      label: 'Administrador',
      icon: <Shield className="w-3.5 h-3.5 text-[#E6C875]" />,
      desc: 'Acceso total, anulación con motivo, reportes históricos, configuración Yape y bonos',
    },
    {
      role: 'recepcionista',
      label: 'Recepcionista',
      icon: <UserCheck className="w-3.5 h-3.5 text-blue-400" />,
      desc: 'Caja, agenda y POS. Reportes restringidos a "Hoy". Sin permisos de anulación',
    },
    {
      role: 'empleado',
      label: 'Colaborador (Barbero/Spa)',
      icon: <Scissors className="w-3.5 h-3.5 text-emerald-400" />,
      desc: 'Marcación de asistencia QR, turnos asignados y bonos nocturnos',
    },
    {
      role: 'cliente',
      label: 'Cliente Registrado',
      icon: <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />,
      desc: 'Portal /mi-cuenta, reservas, tienda con carrito y pago de saldos QR',
    },
    {
      role: 'anon',
      label: 'Visitante Público',
      icon: <Eye className="w-3.5 h-3.5 text-neutral-400" />,
      desc: 'Landing page, catálogo de servicios, vestuario y reserva asistida',
    },
  ];

  return (
    <div className="bg-[#111111] border-b border-[#C8A45C]/20 px-3 py-1.5 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-neutral-400">
          <Sparkles className="w-3.5 h-3.5 text-[#C8A45C]" />
          <span className="font-medium text-neutral-300">Simulador de Rol RBAC:</span>
          <span className="hidden sm:inline text-[11px] text-neutral-400">
            (Especificación v2.6 Acicalados)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {roles.map((r) => {
            const isActive = currentRole === r.role;
            return (
              <button
                key={r.role}
                id={`role-btn-${r.role}`}
                onClick={() => {
                  setCurrentRole(r.role);
                  if (r.role === 'admin' || r.role === 'recepcionista') {
                    if (!activeView.startsWith('/dashboard')) {
                      setActiveView('/dashboard');
                    }
                  } else if (r.role === 'empleado') {
                    setActiveView('/dashboard');
                  } else if (r.role === 'cliente') {
                    setActiveView('/mi-cuenta');
                  } else {
                    setActiveView('/');
                  }
                }}
                title={r.desc}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#C8A45C] text-black shadow-sm font-semibold'
                    : 'bg-[#1A1A1A] text-neutral-300 hover:bg-[#252525] hover:text-white border border-neutral-800'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
