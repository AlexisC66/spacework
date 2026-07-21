package com.spacework.billing.service;

import com.spacework.billing.model.Pago;
import com.spacework.reservations.model.Reserva;
import com.spacework.billing.model.FormaPago;
import com.spacework.reservations.model.EstadoReserva;
import com.spacework.billing.repository.PagoRepository;
import com.spacework.reservations.repository.ReservaRepository;
import com.spacework.billing.repository.FormaPagoRepository;
import com.spacework.reservations.repository.EstadoReservaRepository;
import com.spacework.reservations.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.spacework.core.monitoring.BusinessMetricsService;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PagoService {

    private static final Logger logger = LoggerFactory.getLogger(PagoService.class);

    private final PagoRepository pagoRepository;
    private final ReservaRepository reservaRepository;
    private final FormaPagoRepository formaPagoRepository;
    private final EstadoReservaRepository estadoReservaRepository;
    private final FacturaService facturaService;
    private final EmailService emailService;
    private final BusinessMetricsService metricsService;

    @Autowired
    public PagoService(PagoRepository pagoRepository,
                       ReservaRepository reservaRepository,
                       FormaPagoRepository formaPagoRepository,
                       EstadoReservaRepository estadoReservaRepository,
                       FacturaService facturaService,
                       EmailService emailService,
                       BusinessMetricsService metricsService) {
        this.pagoRepository = pagoRepository;
        this.reservaRepository = reservaRepository;
        this.formaPagoRepository = formaPagoRepository;
        this.estadoReservaRepository = estadoReservaRepository;
        this.facturaService = facturaService;
        this.emailService = emailService;
        this.metricsService = metricsService;
    }

    @Transactional(readOnly = true)
    public Page<Pago> obtenerTodos(Pageable pageable) {
        return pagoRepository.findAll(pageable);
    }

    @Transactional
    public Pago procesarPago(Integer reservaId, Integer formaPagoId, BigDecimal monto, String referencia) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El monto de pago debe ser mayor a cero.");
        }

        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada."));

        if (!"CONFIRMADA".equalsIgnoreCase(reserva.getEstadoReserva().getNombreEstado()) && !"FINALIZADA".equalsIgnoreCase(reserva.getEstadoReserva().getNombreEstado())) {
            if (monto.compareTo(reserva.getMontoTotal()) < 0) {
                throw new IllegalArgumentException("El monto de pago no cubre el total de la reserva.");
            }
        }

        FormaPago formaPago = formaPagoRepository.findById(formaPagoId)
                .orElseThrow(() -> new IllegalArgumentException("Forma de pago no encontrada."));

        boolean esPagoInmediato = formaPago.getNombreForma().toLowerCase().contains("tarjeta");

        if (esPagoInmediato) {
            // actualizamos el estado de la reserva a CONFIRMADA inmediatamente
            EstadoReserva estadoConfirmada = estadoReservaRepository.findByNombreEstado("CONFIRMADA")
                    .orElseThrow(() -> new IllegalStateException("Estado CONFIRMADA no configurado en el sistema."));
            reserva.setEstadoReserva(estadoConfirmada);
            reservaRepository.save(reserva);
            
            // generamos factura automática
            if (facturaService.obtenerTodasLasFacturas().stream().anyMatch(f -> f.getReserva().getId().equals(reserva.getId()))) {
                facturaService.generarFacturaAdicional(reserva, monto, "Servicio Adicional (Extra)");
            } else {
                facturaService.generarFacturaDeReserva(reserva);
            }
        }

        // crear el registro de pago
        Pago pago = new Pago();
        pago.setReserva(reserva);
        pago.setFormaPago(formaPago);
        pago.setMontoPago(monto);
        pago.setFechaPago(LocalDateTime.now());
        pago.setReferenciaTransaccion(referencia != null ? referencia : "TXN-" + System.currentTimeMillis());
        pago.setEstadoPago(esPagoInmediato ? "PAGADO" : "PENDIENTE_VERIFICACION");
        pago.setEstado(true);

        // NOTA: No se almacenan datos de tarjeta por cumplimiento PCI DSS.
        // El procesamiento de tarjeta debe realizarse mediante un tokenizador externo (culqi, niubiz, etc.)
        // y solo almacenar el token de referencia.

        Pago savedPago = pagoRepository.save(pago);

        if (esPagoInmediato) {
            try {
                String fechaFormateada = reserva.getFechaInicioReserva().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
                String subject = "Confirmación de Pago - SpaceWork";
                String nombre = reserva.getUsuario().getNombre();
                String espacio = reserva.getEspacio().getNombreEspacio();
                String ref = savedPago.getReferenciaTransaccion();
                String montoStr = String.format("S/. %.2f", monto);

                String html = generarPlantillaPago(nombre, espacio, fechaFormateada, montoStr, ref);
                String textoPlano = String.format("""
                    Hola %s,
                    Tu pago por S/. %.2f ha sido procesado exitosamente.
                    Espacio: %s
                    Fecha de inicio: %s
                    Monto pagado: S/. %.2f
                    Referencia: %s
                    ¡Gracias por reservar con SpaceWork!
                    """, nombre, monto, espacio, fechaFormateada, monto, ref);

                emailService.enviarHtml(reserva.getUsuario().getCorreoElectronico(), subject, html, textoPlano);
            } catch (Exception e) {
                logger.warn("No se pudo enviar el correo de confirmación de pago: {}", e.getMessage());
            }
        }

        if (esPagoInmediato) {
            metricsService.incrementarPagosExitosos();
        }

        return savedPago;
    }

    @Transactional
    public Pago aprobarPago(Integer pagoId) {
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado."));

        if (!"PENDIENTE_VERIFICACION".equals(pago.getEstadoPago())) {
            throw new IllegalStateException("El pago ya ha sido procesado o cancelado.");
        }

        // marcar pago como PAGADO
        pago.setEstadoPago("PAGADO");
        pagoRepository.save(pago);

        // marcar reserva vinculada como CONFIRMADA
        Reserva reserva = pago.getReserva();
        EstadoReserva estadoConfirmada = estadoReservaRepository.findByNombreEstado("CONFIRMADA")
                .orElseThrow(() -> new IllegalStateException("Estado CONFIRMADA no configurado en el sistema."));
        reserva.setEstadoReserva(estadoConfirmada);
        reservaRepository.save(reserva);
        
        // generamos factura automática
        if (facturaService.obtenerTodasLasFacturas().stream().anyMatch(f -> f.getReserva().getId().equals(reserva.getId()))) {
            facturaService.generarFacturaAdicional(reserva, pago.getMontoPago(), "Servicio Adicional (Extra)");
        } else {
            facturaService.generarFacturaDeReserva(reserva);
        }

        try {
            String fechaFormateada = reserva.getFechaInicioReserva().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            String subject = "Pago Aprobado - SpaceWork";
            String nombre = reserva.getUsuario().getNombre();
            String espacio = reserva.getEspacio().getNombreEspacio();
            String ref = pago.getReferenciaTransaccion();
            String montoStr = String.format("S/. %.2f", pago.getMontoPago());
            String html = generarPlantillaPago(nombre, espacio, fechaFormateada, montoStr, ref);
            String textoPlano = String.format("""
                Hola %s,
                Tu pago por transferencia ha sido aprobado.
                Espacio: %s
                Fecha de inicio: %s
                Monto pagado: %s
                Referencia: %s
                ¡Gracias por reservar con SpaceWork!
                """, nombre, espacio, fechaFormateada, montoStr, ref);
            emailService.enviarHtml(reserva.getUsuario().getCorreoElectronico(), subject, html, textoPlano);
        } catch (Exception e) {
            logger.warn("No se pudo enviar el correo de aprobación de pago: {}", e.getMessage());
        }

        metricsService.incrementarPagosExitosos();
        return pago;
    }

    private String generarPlantillaPago(String nombre, String espacio, String fecha, String monto, String referencia) {
        String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data="
                     + java.net.URLEncoder.encode(referencia, java.nio.charset.StandardCharsets.UTF_8);
        return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'></head>"
            + "<body style='margin:0;padding:0;background:#f1f5f9;font-family:\"Segoe UI\",Arial,sans-serif;'>"
            + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f1f5f9;padding:32px 0;'>"
            + "<tr><td align='center'>"
            + "<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>"
            + "<tr><td style='background:linear-gradient(135deg,#6366f1,#06b6d4);padding:36px 40px;"
            + "border-radius:12px 12px 0 0;text-align:center;'>"
            + "<p style='margin:0 0 6px;color:#c7d2fe;font-size:12px;letter-spacing:2px;"
            + "text-transform:uppercase;font-weight:600;'>SpaceWork</p>"
            + "<h1 style='margin:0 0 4px;color:#fff;font-size:26px;font-weight:700;'>Coworking & Espacios</h1>"
            + "<div style='display:inline-block;background:rgba(255,255,255,0.15);"
            + "border:2px solid rgba(255,255,255,0.4);border-radius:50px;padding:8px 22px;margin-top:16px;'>"
            + "<span style='color:#fff;font-size:15px;font-weight:600;'>Pago Confirmado</span>"
            + "</div></td></tr>"
            + "<tr><td style='background:#fff;padding:32px 40px;'>"
            + "<p style='margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;'>"
            + "Hola <span style='color:#6366f1;'>" + nombre + "</span>,</p>"
            + "<p style='margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;'>"
            + "Tu pago ha sido procesado exitosamente. Aquí están los detalles de tu reserva:</p>"
            + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;'>"
            + "<tr><td style='padding:6px 0;'><span style='color:#64748b;font-size:13px;'>Espacio</span><br>"
            + "<span style='color:#0f172a;font-size:15px;font-weight:600;'>" + espacio + "</span></td></tr>"
            + "<tr><td style='padding:6px 0;'><span style='color:#64748b;font-size:13px;'>Fecha de inicio</span><br>"
            + "<span style='color:#0f172a;font-size:15px;font-weight:600;'>" + fecha + "</span></td></tr>"
            + "<tr><td style='padding:6px 0;'><span style='color:#64748b;font-size:13px;'>Monto pagado</span><br>"
            + "<span style='color:#059669;font-size:18px;font-weight:700;'>" + monto + "</span></td></tr>"
            + "<tr><td style='padding:6px 0;'><span style='color:#64748b;font-size:13px;'>Referencia</span><br>"
            + "<span style='color:#0f172a;font-size:14px;'>" + referencia + "</span></td></tr>"
            + "<tr><td style='padding:6px 0;'><span style='color:#64748b;font-size:13px;'>Estado</span><br>"
            + "<span style='color:#059669;font-size:14px;font-weight:600;'>PAGADO</span></td></tr>"
            + "</table>"
            + "<table width='100%' cellpadding='0' cellspacing='0'>"
            + "<tr><td align='center' style='padding:16px 0;'>"
            + "<p style='margin:0 0 12px;font-size:14px;color:#64748b;font-weight:600;'>"
            + "Escanea el c\u00F3digo QR para ver tu comprobante:</p>"
            + "<img src='" + qrUrl + "' alt='QR Comprobante' "
            + "style='width:150px;height:150px;border-radius:8px;border:2px solid #e2e8f0;'/>"
            + "<p style='margin:8px 0 0;font-size:12px;color:#94a3b8;'>Ref: " + referencia + "</p>"
            + "</td></tr></table>"
            + "<p style='margin:16px 0 0;font-size:14px;color:#475569;line-height:1.6;'>"
            + "¡Gracias por reservar con SpaceWork! Si tienes alguna pregunta, no dudes en contactarnos.</p>"
            + "</td></tr>"
            + "<tr><td style='background:#0f172a;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;'>"
            + "<p style='margin:0 0 4px;color:#fff;font-size:15px;font-weight:700;'>SpaceWork</p>"
            + "<p style='margin:0;color:#475569;font-size:11px;'>"
            + "© 2026 SpaceWork — Todos los derechos reservados.</p>"
            + "</td></tr></table></td></tr></table></body></html>";
    }
}
