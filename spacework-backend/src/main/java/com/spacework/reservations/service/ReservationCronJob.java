package com.spacework.reservations.service;

import com.spacework.reservations.model.EstadoReserva;
import com.spacework.reservations.model.Reserva;
import com.spacework.reservations.repository.EstadoReservaRepository;
import com.spacework.reservations.repository.ReservaRepository;
import com.spacework.reservations.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ReservationCronJob {

    private static final Logger logger = LoggerFactory.getLogger(ReservationCronJob.class);

    private final ReservaRepository reservaRepository;
    private final EstadoReservaRepository estadoReservaRepository;
    private final EmailService emailService;
    private final long pendingCutoffHours;

    @Autowired
    public ReservationCronJob(ReservaRepository reservaRepository,
                              EstadoReservaRepository estadoReservaRepository,
                              EmailService emailService,
                              @Value("${cron.reservation-cancel.pending-cutoff-hours:2}") long pendingCutoffHours) {
        this.reservaRepository = reservaRepository;
        this.estadoReservaRepository = estadoReservaRepository;
        this.emailService = emailService;
        this.pendingCutoffHours = pendingCutoffHours;
    }

    @Scheduled(fixedRateString = "${cron.reservation-cancel.fixed-rate}")
    public void cancelarReservasPendientesExpiradas() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(pendingCutoffHours);
        
        List<Reserva> expiradas = reservaRepository.findByEstadoReservaNombreEstadoAndFechaReservaBefore("PENDIENTE", cutoff);
        
        if (!expiradas.isEmpty()) {
            EstadoReserva estadoCancelada = estadoReservaRepository.findByNombreEstado("CANCELADA")
                    .orElseThrow(() -> new IllegalStateException("Estado CANCELADA no configurado en la base de datos."));
            
            for (Reserva r : expiradas) {
                r.setEstadoReserva(estadoCancelada);
                reservaRepository.save(r);
                
                // Notificar al usuario opcionalmente
                String body = "Hola " + r.getUsuario().getNombre() + ",\n\nTu reserva " + r.getCodigoReserva() + 
                              " ha sido cancelada por el sistema debido a la falta de confirmación de pago en el tiempo límite (2 horas).\n\n" +
                              "Si deseas, puedes volver a realizar una nueva reserva en nuestra plataforma.";
                emailService.sendEmail(r.getUsuario().getCorreoElectronico(), "Reserva Cancelada por Tiempo de Espera - SpaceWork", body);
            }
            logger.info("CronJob: Se han cancelado {} reservas por falta de pago.", expiradas.size());
        }
    }
}
