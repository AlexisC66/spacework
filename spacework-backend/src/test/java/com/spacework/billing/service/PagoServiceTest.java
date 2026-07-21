package com.spacework.billing.service;

import com.spacework.billing.model.FormaPago;
import com.spacework.billing.model.Pago;
import com.spacework.billing.repository.PagoRepository;
import com.spacework.crm.model.Usuario;
import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.model.EstadoReserva;
import com.spacework.reservations.model.Reserva;
import com.spacework.billing.repository.FormaPagoRepository;
import com.spacework.reservations.repository.ReservaRepository;
import com.spacework.reservations.repository.EstadoReservaRepository;
import com.spacework.reservations.service.EmailService;
import com.spacework.core.monitoring.BusinessMetricsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PagoServiceTest {

    @Mock
    private PagoRepository pagoRepository;
    @Mock
    private ReservaRepository reservaRepository;
    @Mock
    private FormaPagoRepository formaPagoRepository;
    @Mock
    private EstadoReservaRepository estadoReservaRepository;
    @Mock
    private FacturaService facturaService;
    @Mock
    private EmailService emailService;
    @Mock
    private BusinessMetricsService metricsService;

    @InjectMocks
    private PagoService pagoService;

    private Reserva reserva;
    private FormaPago tarjeta;
    private FormaPago transferencia;
    private EstadoReserva estadoConfirmada;
    private EstadoReserva estadoPendiente;

    @BeforeEach
    void setUp() {
        Usuario usuario = new Usuario();
        usuario.setId(1);
        usuario.setNombre("Juan");
        usuario.setCorreoElectronico("juan@example.com");

        Espacio espacio = new Espacio();
        espacio.setId(1);
        espacio.setNombreEspacio("Sala A");

        estadoPendiente = new EstadoReserva();
        estadoPendiente.setId(1);
        estadoPendiente.setNombreEstado("PENDIENTE");

        estadoConfirmada = new EstadoReserva();
        estadoConfirmada.setId(2);
        estadoConfirmada.setNombreEstado("CONFIRMADA");

        reserva = new Reserva();
        reserva.setId(100);
        reserva.setUsuario(usuario);
        reserva.setEspacio(espacio);
        reserva.setEstadoReserva(estadoPendiente);
        reserva.setMontoTotal(new BigDecimal("200.00"));

        tarjeta = new FormaPago();
        tarjeta.setId(1);
        tarjeta.setNombreForma("Tarjeta Credito");

        transferencia = new FormaPago();
        transferencia.setId(2);
        transferencia.setNombreForma("Transferencia Bancaria");
    }

    @Test
    void procesarPagoConTarjetaDebeConfirmarReservaYGenerarFactura() {
        when(reservaRepository.findById(100)).thenReturn(Optional.of(reserva));
        when(formaPagoRepository.findById(1)).thenReturn(Optional.of(tarjeta));
        when(estadoReservaRepository.findByNombreEstado("CONFIRMADA"))
                .thenReturn(Optional.of(estadoConfirmada));
        when(facturaService.obtenerTodasLasFacturas()).thenReturn(List.of());
        when(facturaService.generarFacturaDeReserva(any(Reserva.class)))
                .thenReturn(null);
        when(pagoRepository.save(any(Pago.class))).thenAnswer(i -> i.getArgument(0));
        Pago resultado = pagoService.procesarPago(100, 1, new BigDecimal("200.00"), "TXN-001");

        assertNotNull(resultado);
        assertEquals("PAGADO", resultado.getEstadoPago());
        assertEquals("CONFIRMADA", reserva.getEstadoReserva().getNombreEstado());
        verify(reservaRepository, times(1)).save(reserva);
        verify(facturaService).generarFacturaDeReserva(reserva);
    }

    @Test
    void procesarPagoConTransferenciaDebeCrearPagoPendiente() {
        when(reservaRepository.findById(100)).thenReturn(Optional.of(reserva));
        when(formaPagoRepository.findById(2)).thenReturn(Optional.of(transferencia));
        when(pagoRepository.save(any(Pago.class))).thenAnswer(i -> i.getArgument(0));

        Pago resultado = pagoService.procesarPago(100, 2, new BigDecimal("200.00"), "TXN-002");

        assertNotNull(resultado);
        assertEquals("PENDIENTE_VERIFICACION", resultado.getEstadoPago());
        assertEquals("PENDIENTE", reserva.getEstadoReserva().getNombreEstado());
        verify(emailService, never()).enviarHtml(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void procesarPagoDebeRechazarMontoCero() {
        assertThrows(IllegalArgumentException.class,
                () -> pagoService.procesarPago(100, 1, BigDecimal.ZERO, "TXN-003"));
    }

    @Test
    void procesarPagoDebeRechazarMontoNegativo() {
        assertThrows(IllegalArgumentException.class,
                () -> pagoService.procesarPago(100, 1, new BigDecimal("-50.00"), "TXN-003"));
    }

    @Test
    void procesarPagoDebeRechazarReservaInexistente() {
        when(reservaRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> pagoService.procesarPago(999, 1, new BigDecimal("200.00"), "TXN-004"));
    }

    @Test
    void aprobarPagoDebeConfirmarReservaYGenerarFactura() {
        Pago pagoPendiente = new Pago();
        pagoPendiente.setId(1);
        pagoPendiente.setReserva(reserva);
        pagoPendiente.setMontoPago(new BigDecimal("200.00"));
        pagoPendiente.setEstadoPago("PENDIENTE_VERIFICACION");
        pagoPendiente.setReferenciaTransaccion("TXN-005");

        when(pagoRepository.findById(1)).thenReturn(Optional.of(pagoPendiente));
        when(estadoReservaRepository.findByNombreEstado("CONFIRMADA"))
                .thenReturn(Optional.of(estadoConfirmada));
        when(facturaService.obtenerTodasLasFacturas()).thenReturn(List.of());
        when(facturaService.generarFacturaDeReserva(any(Reserva.class)))
                .thenReturn(null);
        when(pagoRepository.save(any(Pago.class))).thenReturn(pagoPendiente);
        when(reservaRepository.save(any(Reserva.class))).thenReturn(reserva);

        Pago resultado = pagoService.aprobarPago(1);

        assertNotNull(resultado);
        assertEquals("PAGADO", resultado.getEstadoPago());
        verify(facturaService).generarFacturaDeReserva(reserva);
    }

    @Test
    void aprobarPagoDebeRechazarPagoYaAprobado() {
        Pago pagoPagado = new Pago();
        pagoPagado.setId(2);
        pagoPagado.setEstadoPago("PAGADO");

        when(pagoRepository.findById(2)).thenReturn(Optional.of(pagoPagado));

        assertThrows(IllegalStateException.class,
                () -> pagoService.aprobarPago(2));
    }

    @Test
    void obtenerTodosDebeRetornarPagina() {
        PageRequest pageable = PageRequest.of(0, 10);
        when(pagoRepository.findAll(pageable))
                .thenReturn(new PageImpl<>(List.of(new Pago())));

        Page<Pago> resultado = pagoService.obtenerTodos(pageable);

        assertEquals(1, resultado.getTotalElements());
    }
}
