package com.spacework.core.monitoring;

import com.spacework.reservations.repository.ReservaRepository;
import com.spacework.crm.repository.UsuarioRepository;
import com.spacework.billing.repository.PagoRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BusinessMetricsService {

    private final MeterRegistry meterRegistry;
    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PagoRepository pagoRepository;

    private Counter reservasCreadasCounter;
    private Counter pagosExitososCounter;

    @Autowired
    public BusinessMetricsService(MeterRegistry meterRegistry,
                                  ReservaRepository reservaRepository,
                                  UsuarioRepository usuarioRepository,
                                  PagoRepository pagoRepository) {
        this.meterRegistry = meterRegistry;
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.pagoRepository = pagoRepository;
    }

    @PostConstruct
    public void init() {
        reservasCreadasCounter = Counter.builder("spacework.reservas.creadas")
                .description("Total de reservas creadas")
                .register(meterRegistry);

        pagosExitososCounter = Counter.builder("spacework.pagos.exitosos")
                .description("Total de pagos exitosos")
                .register(meterRegistry);

        Gauge.builder("spacework.usuarios.activos", usuarioRepository,
                        repo -> repo.countByEstadoTrue())
                .description("Usuarios activos en el sistema")
                .register(meterRegistry);

        Gauge.builder("spacework.reservas.activas", reservaRepository,
                        repo -> {
                            try {
                                return repo.countByEstadoTrue();
                            } catch (Exception e) {
                                return 0.0;
                            }
                        })
                .description("Reservas activas actualmente")
                .register(meterRegistry);
    }

    public void incrementarReservasCreadas() {
        reservasCreadasCounter.increment();
    }

    public void incrementarPagosExitosos() {
        pagosExitososCounter.increment();
    }
}
