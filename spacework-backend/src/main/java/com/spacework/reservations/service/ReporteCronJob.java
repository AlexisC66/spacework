package com.spacework.reservations.service;

import com.spacework.billing.repository.FacturaRepository;
import com.spacework.billing.repository.PagoRepository;
import com.spacework.crm.repository.UsuarioRepository;
import com.spacework.reservations.repository.ReservaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
public class ReporteCronJob {

    private static final Logger log = LoggerFactory.getLogger(ReporteCronJob.class);

    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final FacturaRepository facturaRepository;
    private final PagoRepository pagoRepository;
    private final EmailService emailService;
    private final ReporteService reporteService;

    @Value("${reportes.email.destinatario:admin@spacework.com}")
    private String destinatarioReporte;

    @Autowired
    public ReporteCronJob(ReservaRepository reservaRepository,
                          UsuarioRepository usuarioRepository,
                          FacturaRepository facturaRepository,
                          PagoRepository pagoRepository,
                          EmailService emailService,
                          ReporteService reporteService) {
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.facturaRepository = facturaRepository;
        this.pagoRepository = pagoRepository;
        this.emailService = emailService;
        this.reporteService = reporteService;
    }

    @Scheduled(cron = "0 0 7 * * MON")
    public void enviarReporteSemanal() {
        try {
            LocalDate hoy = LocalDate.now();
            LocalDate inicioSemana = hoy.minusDays(7);
            String periodo = inicioSemana.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    + " - " + hoy.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

            long totalReservas = reservaRepository.count();
            long totalUsuarios = usuarioRepository.count();
            long totalFacturas = facturaRepository.findByEstadoTrue().size();
            long totalPagos = pagoRepository.findAll().size();

            String asunto = "Reporte Semanal SpaceWork - " + periodo;
            String cuerpo = String.format("""
                    Reporte Semanal de Actividad - SpaceWork
                    Período: %s

                    Resumen:
                    - Total reservas: %d
                    - Total usuarios registrados: %d
                    - Facturas emitidas: %d
                    - Pagos registrados: %d

                    Este reporte fue generado automáticamente.
                    """, periodo, totalReservas, totalUsuarios, totalFacturas, totalPagos);

            String htmlCuerpo = String.format("""
                    <h2>Reporte Semanal - SpaceWork</h2>
                    <p><strong>Período:</strong> %s</p>
                    <hr>
                    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
                        <tr style="background:#6366f1;color:#fff;">
                            <th>Métrica</th><th>Valor</th>
                        </tr>
                        <tr><td>Total reservas</td><td>%d</td></tr>
                        <tr><td>Usuarios registrados</td><td>%d</td></tr>
                        <tr><td>Facturas emitidas</td><td>%d</td></tr>
                        <tr><td>Pagos registrados</td><td>%d</td></tr>
                    </table>
                    <p style="color:#64748b;font-size:12px;">Reporte generado automáticamente el %s.</p>
                    """, periodo, totalReservas, totalUsuarios, totalFacturas, totalPagos,
                    LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

            emailService.enviarHtml(destinatarioReporte, asunto, htmlCuerpo, cuerpo);
            log.info("Reporte semanal enviado a {}", destinatarioReporte);
        } catch (Exception e) {
            log.error("Error al enviar reporte semanal: {}", e.getMessage());
        }
    }
}
