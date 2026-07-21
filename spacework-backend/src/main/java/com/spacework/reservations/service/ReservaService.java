package com.spacework.reservations.service;

import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.model.EstadoReserva;
import com.spacework.reservations.model.Reserva;
import com.spacework.crm.model.Usuario;
import com.spacework.reservations.repository.EstadoReservaRepository;
import com.spacework.reservations.repository.ReservaRepository;
import com.spacework.reservations.repository.PrecioRepository;
import com.spacework.reservations.model.Precio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.spacework.reservations.model.ServicioAdicional;
import com.spacework.reservations.model.ReservaServicio;
import com.spacework.reservations.repository.ServicioAdicionalRepository;
import com.spacework.reservations.repository.ReservaServicioRepository;
import com.spacework.auditoria.aop.Auditable;
import com.spacework.core.monitoring.BusinessMetricsService;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final EstadoReservaRepository estadoReservaRepository;
    private final EmailService emailService;
    private final ServicioAdicionalRepository servicioAdicionalRepository;
    private final ReservaServicioRepository reservaServicioRepository;
    private final PrecioRepository precioRepository;
    private final BusinessMetricsService metricsService;

    @Autowired
    public ReservaService(ReservaRepository reservaRepository, 
                          EstadoReservaRepository estadoReservaRepository,
                          EmailService emailService,
                          ServicioAdicionalRepository servicioAdicionalRepository,
                          ReservaServicioRepository reservaServicioRepository,
                          PrecioRepository precioRepository,
                          BusinessMetricsService metricsService) {
        this.reservaRepository = reservaRepository;
        this.estadoReservaRepository = estadoReservaRepository;
        this.emailService = emailService;
        this.servicioAdicionalRepository = servicioAdicionalRepository;
        this.reservaServicioRepository = reservaServicioRepository;
        this.precioRepository = precioRepository;
        this.metricsService = metricsService;
    }

    @Transactional
    @Auditable(accion = "CREAR_RESERVA", entidad = "Reservas")
    public Reserva crearReserva(Usuario usuario, Espacio espacio, LocalDateTime inicio, LocalDateTime fin, BigDecimal montoTotal, BigDecimal descuentoAplicado, String observaciones, Integer asistentes, Map<Integer, Integer> serviciosAdicionales, String tipoComprobante, String documentoIdentidad, String razonSocial, String direccion) {
        // Primero nos aseguramos de que no nos estén enviando datos nulos o fechas imposibles
        if (inicio.isAfter(fin) || inicio.isEqual(fin)) {
            throw new IllegalArgumentException("La fecha de inicio debe ser anterior a la fecha de fin.");
        }
        if (inicio.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("La reserva no puede ser en el pasado.");
        }

        // Ojo aquí: el cliente no puede saltarse el horario de atención de la sede
        java.time.LocalTime horaInicio = inicio.toLocalTime();
        java.time.LocalTime horaFin = fin.toLocalTime();
        if (horaInicio.isBefore(espacio.getHoraApertura()) || horaFin.isAfter(espacio.getHoraCierre())) {
            throw new IllegalArgumentException(String.format("La hora de la reserva debe estar dentro del horario de atención del local (%s - %s).",
                    espacio.getHoraApertura(), espacio.getHoraCierre()));
        }

        // Regla de negocio core: Evitar doble reserva en la misma sala y a la misma hora
        List<Reserva> overlapping = reservaRepository.findOverlappingReservations(espacio, inicio, fin);
        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("El espacio ya se encuentra reservado en el rango de tiempo seleccionado.");
        }

        // Buscamos el estado inicial (quemado a PENDIENTE por ahora)
        EstadoReserva estado = estadoReservaRepository.findByNombreEstado("PENDIENTE")
                .orElseThrow(() -> new IllegalStateException("Estado PENDIENTE no configurado en la base de datos."));

        // Calculamos el precio real en el backend, ignorando el montoTotal del frontend por seguridad
        BigDecimal montoCalculadoSeguro = calcularMontoSeguro(espacio, inicio, fin, asistentes, serviciosAdicionales);

        // Armamos el objeto de la reserva
        Reserva reserva = new Reserva();
        reserva.setCodigoReserva("RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        reserva.setUsuario(usuario);
        reserva.setEspacio(espacio);
        reserva.setFechaInicioReserva(inicio);
        reserva.setFechaFinReserva(fin);
        reserva.setMontoTotal(montoCalculadoSeguro);
        
        if (descuentoAplicado != null) {
            reserva.setDescuentoAplicado(descuentoAplicado);
        } else {
            reserva.setDescuentoAplicado(BigDecimal.ZERO);
        }
        reserva.setEstadoReserva(estado);
        reserva.setObservaciones(observaciones);
        reserva.setTipoComprobante(tipoComprobante);
        reserva.setDocumentoIdentidad(documentoIdentidad);
        reserva.setRazonSocial(razonSocial);
        reserva.setDireccion(direccion);

        Reserva nuevaReserva = reservaRepository.save(reserva);

        // Si compraron sillas extras o proyector, los guardamos de una vez
        if (serviciosAdicionales != null && !serviciosAdicionales.isEmpty()) {
            for (Map.Entry<Integer, Integer> entry : serviciosAdicionales.entrySet()) {
                Integer servicioId = entry.getKey();
                Integer cantidad = entry.getValue();
                if (cantidad > 0) {
                    ServicioAdicional sa = servicioAdicionalRepository.findById(servicioId).orElse(null);
                    if (sa != null) {
                        // Verificar stock disponible
                        if (sa.getStockTotal() != null && cantidad > sa.getStockTotal()) {
                            throw new IllegalArgumentException(
                                "Stock insuficiente para '" + sa.getNombre() +
                                "'. Disponible: " + sa.getStockTotal() + ", solicitado: " + cantidad);
                        }
                        ReservaServicio rs = new ReservaServicio();
                        rs.setReserva(nuevaReserva);
                        rs.setServicioAdicional(sa);
                        rs.setCantidad(cantidad);
                        BigDecimal subtotalServicio = sa.getPrecioBase().multiply(BigDecimal.valueOf(cantidad));
                        rs.setSubtotal(subtotalServicio);
                        reservaServicioRepository.save(rs);
                        // Send email/notification to third party logic can go here in the future
                    }
                }
            }
        }

        // Enviar email después del commit para evitar enviar notificaciones
        // de reservas que luego hagan rollback
        final String codigoReserva = nuevaReserva.getCodigoReserva();
        final String emailUsuario = usuario.getCorreoElectronico();
        final String nombreUsuario = usuario.getNombre();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                String subject = "Confirmación de Reserva - SpaceWork (" + codigoReserva + ")";
                String body = String.format(
                        "Hola %s,\n\nTu reserva para el espacio '%s' ha sido registrada exitosamente.\n\n" +
                        "Detalles de la Reserva:\n" +
                        "- Código: %s\n" +
                        "- Inicio: %s\n" +
                        "- Fin: %s\n" +
                        "- Monto Total: S/. %s\n" +
                        "- Estado: %s\n\n" +
                        "Gracias por utilizar SpaceWork.\n",
                        nombreUsuario,
                        espacio.getNombreEspacio(),
                        codigoReserva,
                        nuevaReserva.getFechaInicioReserva(),
                        nuevaReserva.getFechaFinReserva(),
                        nuevaReserva.getMontoTotal(),
                        nuevaReserva.getEstadoReserva().getNombreEstado()
                );
                emailService.sendEmail(emailUsuario, subject, body);
            }
        });

        metricsService.incrementarReservasCreadas();
        return nuevaReserva;
    }

    private BigDecimal calcularMontoSeguro(Espacio espacio, LocalDateTime inicio, LocalDateTime fin, Integer asistentes, Map<Integer, Integer> serviciosAdicionales) {
        Precio precioObj = precioRepository.findFirstByEspacioIdAndEstadoTrue(espacio.getId()).orElse(null);
        BigDecimal precioBase = precioObj != null && precioObj.getMonto() != null ? precioObj.getMonto() : BigDecimal.ZERO;
        BigDecimal descBase = precioObj != null && precioObj.getDescuento() != null ? precioObj.getDescuento() : BigDecimal.ZERO;

        long diffMs = java.time.Duration.between(inicio, fin).toMillis();
        long diffDaysExact = diffMs / (1000 * 60 * 60 * 24);
        long diffDays = diffDaysExact;
        long remainder = diffMs % (1000L * 60 * 60 * 24);

        if (remainder > 0) {
            double endHour = fin.getHour() + (fin.getMinute() / 60.0);
            if (endHour >= 12) diffDays += 1;
            else if (diffDays == 0) diffDays = 1;
        }
        if (diffDays == 0) diffDays = 1;
        long diasEfectivos = diffDays;

        BigDecimal subtotal = BigDecimal.ZERO;
        if (espacio.getTipoEspacio() != null && espacio.getTipoEspacio().getId() == 1) {
            double horasACobrar = diffMs / (1000.0 * 60 * 60);
            double startHour = inicio.getHour() + (inicio.getMinute() / 60.0);
            double endHour = fin.getHour() + (fin.getMinute() / 60.0);
            boolean isSameDay = inicio.toLocalDate().equals(fin.toLocalDate());
            
            if (isSameDay && startHour < 12 && endHour >= 12) {
                horasACobrar = 8;
                diasEfectivos = 1;
            }
            BigDecimal precioH = precioBase.compareTo(BigDecimal.ZERO) > 0 ? precioBase.divide(BigDecimal.valueOf(8), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
            subtotal = precioH.multiply(BigDecimal.valueOf(horasACobrar));
        } else {
            subtotal = precioBase.multiply(BigDecimal.valueOf(diasEfectivos));
        }

        BigDecimal descMonto = subtotal.multiply(descBase).divide(BigDecimal.valueOf(100));

        BigDecimal totalSrv = BigDecimal.ZERO;
        if (serviciosAdicionales != null) {
            for (Map.Entry<Integer, Integer> entry : serviciosAdicionales.entrySet()) {
                if (entry.getValue() > 0) {
                    ServicioAdicional sa = servicioAdicionalRepository.findById(entry.getKey()).orElse(null);
                    if (sa != null) {
                        totalSrv = totalSrv.add(sa.getPrecioBase().multiply(BigDecimal.valueOf(entry.getValue())).multiply(BigDecimal.valueOf(diasEfectivos)));
                    }
                }
            }
        }

        BigDecimal costoAforoExtra = BigDecimal.ZERO;
        if (espacio.getCapacidadEquipos() != null && asistentes > espacio.getCapacidadEquipos() && asistentes <= espacio.getCapacidad()) {
            int pExtra = asistentes - espacio.getCapacidadEquipos();
            BigDecimal precioExtra = BigDecimal.valueOf(espacio.getPrecioPersonaExtra() != null ? espacio.getPrecioPersonaExtra() : 0.0);
            costoAforoExtra = precioExtra.multiply(BigDecimal.valueOf(pExtra)).multiply(BigDecimal.valueOf(diasEfectivos));
        }

        return subtotal.subtract(descMonto).add(totalSrv).add(costoAforoExtra);
    }

    @Transactional
    public List<ReservaServicio> agregarServiciosExtra(Integer reservaId, List<Map<String, Object>> serviciosReq, Usuario usuarioSolicitante) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        String rolSolicitante = usuarioSolicitante.getRol().getNombreRol().toUpperCase();
        boolean isAdmin = rolSolicitante.equals("ADMIN") || rolSolicitante.equals("ADMINISTRADOR") || rolSolicitante.equals("SUPERADMIN");

        // Bloqueamos el intento si alguien quiere meterse a la reserva de otro cliente usando su propio JWT
        if (!isAdmin && !reserva.getUsuario().getId().equals(usuarioSolicitante.getId())) {
            throw new IllegalArgumentException("Violación de Seguridad: El token JWT no corresponde al dueño de la reserva.");
        }
                
        // Ojo, si la reserva ya pasó, no tiene sentido agregarle sillas o proyectores
        if (LocalDateTime.now().isAfter(reserva.getFechaFinReserva())) {
            throw new IllegalArgumentException("No se pueden agregar servicios a una reserva que ya ha finalizado.");
        }

        BigDecimal totalAGregar = BigDecimal.ZERO;
        List<ReservaServicio> serviciosAgregados = new java.util.ArrayList<>();

        for (Map<String, Object> req : serviciosReq) {
            Integer servicioId = ((Number) req.get("servicioId")).intValue();
            Integer cantidad = ((Number) req.get("cantidad")).intValue();
            LocalDate fechaUso = LocalDate.parse((String) req.get("fechaUso"));

            ServicioAdicional servicio = servicioAdicionalRepository.findById(servicioId)
                    .orElseThrow(() -> new IllegalArgumentException("Servicio no encontrado: " + servicioId));

            // Asegurarnos de que pidan el servicio para los días que dura la reserva
            if (fechaUso.isBefore(reserva.getFechaInicioReserva().toLocalDate()) || 
                fechaUso.isAfter(reserva.getFechaFinReserva().toLocalDate())) {
                throw new IllegalArgumentException("La fecha de uso debe estar dentro de los días de la reserva.");
            }

            // Que no intenten pedir un servicio para ayer 😂
            if (fechaUso.isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("La fecha de uso no puede ser en el pasado.");
            }

            BigDecimal subtotalServicio = servicio.getPrecioBase().multiply(BigDecimal.valueOf(cantidad));
            totalAGregar = totalAGregar.add(subtotalServicio);

            // Mapeamos y guardamos el servicio
            ReservaServicio rs = new ReservaServicio();
            rs.setReserva(reserva);
            rs.setServicioAdicional(servicio);
            rs.setCantidad(cantidad);
            rs.setSubtotal(subtotalServicio);
            rs.setFechaUso(fechaUso);
            reservaServicioRepository.save(rs);
            serviciosAgregados.add(rs);
        }

        // Le sumamos el costo extra al monto total de la reserva
        if ("PENDIENTE".equalsIgnoreCase(reserva.getEstadoReserva().getNombreEstado()) || "CONFIRMADA".equalsIgnoreCase(reserva.getEstadoReserva().getNombreEstado())) {
            reserva.setMontoTotal(reserva.getMontoTotal().add(totalAGregar));
            reservaRepository.save(reserva);
        }

        return serviciosAgregados;
    }

    @Transactional
    @Auditable(accion = "CANCELAR_RESERVA", entidad = "Reservas")
    public void cancelarReserva(Integer reservaId, Usuario usuarioSolicitante) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        String rolSolicitante = usuarioSolicitante.getRol().getNombreRol().toUpperCase();
        boolean isAdmin = rolSolicitante.equals("ADMIN") || rolSolicitante.equals("ADMINISTRADOR") || rolSolicitante.equals("SUPERADMIN");

        // Por seguridad, confirmamos que el que cancela es dueño de la reserva o es admin
        if (!isAdmin && !reserva.getUsuario().getId().equals(usuarioSolicitante.getId())) {
            throw new IllegalArgumentException("No tienes permiso para cancelar esta reserva.");
        }

        String estadoActual = reserva.getEstadoReserva().getNombreEstado();
        if ("CANCELADA".equalsIgnoreCase(estadoActual) || "FINALIZADA".equalsIgnoreCase(estadoActual)) {
            throw new IllegalArgumentException("La reserva ya está " + estadoActual.toLowerCase() + ".");
        }

        // Regla estricta: No devolvemos plata ni dejamos cancelar si falta menos de un día (24h)
        // Ojo: los administradores sí pueden saltarse esta regla para casos excepcionales
        if (!isAdmin) {
            LocalDateTime limiteCancelacion = reserva.getFechaInicioReserva().minusHours(24);
            if (LocalDateTime.now().isAfter(limiteCancelacion)) {
                throw new IllegalArgumentException("No se puede cancelar la reserva con menos de 24 horas de anticipación.");
            }
        }

        EstadoReserva estadoCancelada = estadoReservaRepository.findByNombreEstado("CANCELADA")
                .orElseThrow(() -> new IllegalStateException("Estado CANCELADA no configurado en la base de datos."));

        reserva.setEstadoReserva(estadoCancelada);
        reservaRepository.save(reserva);

        // Notificamos al usuario por correo para evitar reclamos
        String subject = "Cancelación de Reserva - SpaceWork (" + reserva.getCodigoReserva() + ")";
        String body = String.format(
                "Hola %s,\n\nTu reserva para el espacio '%s' (Código: %s) ha sido CANCELADA exitosamente.\n\n" +
                "Si realizaste un pago, el proceso de reembolso (de aplicar según nuestras políticas) se iniciará en breve.\n\n" +
                "Gracias por utilizar SpaceWork.\n",
                reserva.getUsuario().getNombre(),
                reserva.getEspacio().getNombreEspacio(),
                reserva.getCodigoReserva()
        );
        emailService.sendEmail(reserva.getUsuario().getCorreoElectronico(), subject, body);
    }
}
