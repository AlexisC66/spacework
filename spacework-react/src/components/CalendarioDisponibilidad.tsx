import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay,
  isToday, isBefore, startOfDay, addMonths, subMonths, parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { apiService } from '../services/api';
import type { SlotDTO } from '../types';

interface CalendarioDisponibilidadProps {
  espacioId?: number;
  fechaSeleccionada?: Date | null;
  fechaFin?: Date | null;
  onFechaSeleccionada?: (fecha: Date) => void;
  onRangoSeleccionado?: (inicio: Date, fin: Date) => void;
  modo?: 'catalogo' | 'reserva';
}

type DiaEstado = 'libre' | 'parcial' | 'ocupado' | 'pasado' | 'futuro';

const CalendarioDisponibilidad: React.FC<CalendarioDisponibilidadProps> = ({
  espacioId,
  fechaSeleccionada,
  fechaFin,
  onFechaSeleccionada,
  onRangoSeleccionado,
  modo = 'catalogo'
}) => {
  const [mesActual, setMesActual] = useState(() => startOfMonth(new Date()));
  const [ocupacionesMap, setOcupacionesMap] = useState<Record<string, SlotDTO[]>>({});
  const [cargando, setCargando] = useState(false);
  const [tooltipDay, setTooltipDay] = useState<Date | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(mesActual);
    const monthEnd = endOfMonth(mesActual);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [mesActual]);

  const desde = useMemo(() => format(startOfWeek(startOfMonth(mesActual), { weekStartsOn: 1 }), "yyyy-MM-dd'T'00:00:00"), [mesActual]);
  const hasta = useMemo(() => format(endOfWeek(endOfMonth(mesActual), { weekStartsOn: 1 }), "yyyy-MM-dd'T'23:59:59"), [mesActual]);

  const cargarOcupaciones = useCallback(async () => {
    setCargando(true);
    try {
      console.log('[Calendario] Fetching ocupaciones para', { espacioId, desde, hasta });
      const res = espacioId
        ? await apiService.getDisponibilidad(espacioId, desde, hasta)
        : await apiService.getDisponibilidadGeneral(desde, hasta);

      const data = res.data;
      console.log('[Calendario] Respuesta completa:', JSON.stringify(data).slice(0, 500));

      const map: Record<string, SlotDTO[]> = {};
      const items = Array.isArray(data) ? data : [data];
      items.forEach((item: { ocupaciones?: SlotDTO[] }) => {
        (item.ocupaciones || []).forEach((slot: SlotDTO) => {
          const inicio = parseISO(slot.inicio);
          const fin = parseISO(slot.fin);
          if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
            console.warn('[Calendario] Fecha inválida en slot:', slot);
            return;
          }
          const days = eachDayOfInterval({ start: inicio, end: fin });
          days.forEach(d => {
            const key = format(d, 'yyyy-MM-dd');
            if (!map[key]) map[key] = [];
            map[key].push(slot);
          });
        });
      });
      console.log('[Calendario] Mapa generado:', Object.keys(map));
      setOcupacionesMap(map);
    } catch (err) {
      console.error('Error al cargar disponibilidad:', err);
    } finally {
      setCargando(false);
    }
  }, [espacioId, desde, hasta]);

  useEffect(() => {
    cargarOcupaciones();
  }, [cargarOcupaciones]);

  const estadoDelDia = (day: Date): DiaEstado => {
    const hoy = startOfDay(new Date());
    if (isBefore(day, hoy) && !isSameDay(day, hoy)) return 'pasado';

    const key = format(day, 'yyyy-MM-dd');
    const slots = ocupacionesMap[key];
    if (!slots || slots.length === 0) return 'libre';

    return 'parcial';
  };

  const ocupacionesDelDia = (day: Date): SlotDTO[] => {
    const key = format(day, 'yyyy-MM-dd');
    return ocupacionesMap[key] || [];
  };

  const irAlMes = (dir: -1 | 1) => {
    setMesActual(dir === -1 ? subMonths(mesActual, 1) : addMonths(mesActual, 1));
  };

  const manejarClickDia = (day: Date) => {
    if (isBefore(day, startOfDay(new Date())) && !isSameDay(day, new Date())) return;

    if (modo === 'reserva' && fechaSeleccionada && !fechaFin) {
      if (isBefore(day, fechaSeleccionada)) {
        if (onRangoSeleccionado) onRangoSeleccionado(day, fechaSeleccionada);
        if (onFechaSeleccionada) onFechaSeleccionada(day);
      } else {
        if (onRangoSeleccionado) onRangoSeleccionado(fechaSeleccionada, day);
        if (onFechaSeleccionada) onFechaSeleccionada(fechaSeleccionada);
      }
    } else {
      if (onFechaSeleccionada) onFechaSeleccionada(day);
    }
  };

  const handleMouseEnter = (day: Date, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setTooltipDay(day);
  };

  const handleMouseLeave = () => {
    setTooltipDay(null);
  };

  const nombreDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="calendario-disponibilidad">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary border-0"
          onClick={() => irAlMes(-1)}
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
          {format(mesActual, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary border-0"
          onClick={() => irAlMes(1)}
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>

      {cargando && (
        <div className="text-center py-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}

      <div className="cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {nombreDias.map(n => (
          <div key={n} className="text-center small text-muted fw-semibold py-1" style={{ fontSize: '0.7rem' }}>
            {n}
          </div>
        ))}
        {daysInMonth.map((day, i) => {
          const estado = estadoDelDia(day);
          const sameMonth = isSameMonth(day, mesActual);
          const selected = fechaSeleccionada && isSameDay(day, fechaSeleccionada);
          const inRange = fechaSeleccionada && fechaFin && day >= fechaSeleccionada && day <= fechaFin;
          const hoy = isToday(day);

          let bgColor = 'transparent';
          let textColor = '#64748b';
          let borderColor = 'transparent';

          if (!sameMonth) {
            textColor = '#e2e8f0';
          } else if (estado === 'pasado') {
            textColor = '#cbd5e1';
          } else if (selected || inRange) {
            bgColor = '#3b82f6';
            textColor = '#fff';
            borderColor = '#2563eb';
          } else if (estado === 'parcial') {
            bgColor = '#fef3c7';
            textColor = '#92400e';
            borderColor = '#fcd34d';
          } else if (estado === 'libre') {
            bgColor = '#d1fae5';
            textColor = '#065f46';
            borderColor = '#6ee7b7';
          }

          if (hoy && !selected && !inRange) {
            borderColor = '#3b82f6';
          }

          const slots = ocupacionesDelDia(day);
          const showTooltip = tooltipDay && isSameDay(day, tooltipDay) && slots.length > 0;

          return (
            <div key={i} style={{ position: 'relative' }}>
              <div
                className="text-center rounded-2"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  border: `2px solid ${borderColor}`,
                  cursor: sameMonth && estado !== 'pasado' ? 'pointer' : 'default',
                  padding: '6px 0',
                  fontSize: '0.8rem',
                  fontWeight: selected || inRange ? 700 : 500,
                  transition: 'all 0.15s ease',
                  opacity: sameMonth ? 1 : 0.4,
                  userSelect: 'none'
                }}
                onClick={() => sameMonth && manejarClickDia(day)}
                onMouseEnter={(e) => sameMonth && slots.length > 0 && handleMouseEnter(day, e)}
                onMouseLeave={handleMouseLeave}
              >
                {format(day, 'd')}
              </div>

              {showTooltip && (
                <div
                  className="position-fixed bg-dark text-white small rounded-3 shadow-lg p-2 z-3"
                  style={{
                    left: tooltipPos.x,
                    top: tooltipPos.y,
                    transform: 'translate(-50%, -100%)',
                    maxWidth: '220px',
                    pointerEvents: 'none',
                    zIndex: 9999
                  }}
                >
                  <div className="fw-bold mb-1 border-bottom border-secondary pb-1">
                    {format(day, 'dd/MM/yyyy')}
                  </div>
                  {slots.map((s, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', lineHeight: 1.6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                      {format(parseISO(s.inicio), 'HH:mm')} - {format(parseISO(s.fin), 'HH:mm')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="d-flex justify-content-center gap-3 mt-2 small text-muted" style={{ fontSize: '0.7rem' }}>
        <span className="d-flex align-items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#d1fae5', border: '2px solid #6ee7b7', display: 'inline-block' }}></span>
          Libre
        </span>
        <span className="d-flex align-items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fef3c7', border: '2px solid #fcd34d', display: 'inline-block' }}></span>
          Ocupado (parcial)
        </span>
        <span className="d-flex align-items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#dbeafe', border: '2px solid #3b82f6', display: 'inline-block' }}></span>
          Seleccionado
        </span>
      </div>

      <style>{`
        .calendario-disponibilidad .cal-grid > div:hover > div:not([style*="cursor: default"]) {
          opacity: 0.85;
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default CalendarioDisponibilidad;
