package com.spacework.reservations.service;

import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.model.EstadoReserva;
import com.spacework.reservations.model.Reserva;
import com.spacework.crm.model.Usuario;
import com.spacework.reservations.repository.EstadoReservaRepository;
import com.spacework.reservations.repository.ReservaRepository;
import com.spacework.core.monitoring.BusinessMetricsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReservaServiceTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EstadoReservaRepository estadoReservaRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private com.spacework.reservations.repository.PrecioRepository precioRepository;

    @Mock
    private com.spacework.reservations.repository.ServicioAdicionalRepository servicioAdicionalRepository;

    @Mock
    private com.spacework.reservations.repository.ReservaServicioRepository reservaServicioRepository;

    @Mock
    private BusinessMetricsService metricsService;

    @InjectMocks
    private ReservaService reservaService;

    private Espacio espacio;
    private Usuario usuario;
    private EstadoReserva estadoPendiente;
    private LocalDateTime inicio;
    private LocalDateTime fin;

    @BeforeEach
    public void setUp() {
        espacio = new Espacio();
        espacio.setId(1);
        espacio.setNombreEspacio("Sala A");
        espacio.setHoraApertura(java.time.LocalTime.of(8, 0));
        espacio.setHoraCierre(java.time.LocalTime.of(20, 0));
        
        usuario = new Usuario();
        usuario.setId(1);
        usuario.setNombre("Jhunior");

        estadoPendiente = new EstadoReserva();
        estadoPendiente.setId(1);
        estadoPendiente.setNombreEstado("PENDIENTE");

        inicio = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        fin = inicio.plusHours(2);
    }

    @Test
    public void testCrearReservaExito() {
        // Arrange
        when(reservaRepository.findOverlappingReservations(espacio, inicio, fin))
                .thenReturn(Collections.emptyList());
        when(estadoReservaRepository.findByNombreEstado("PENDIENTE"))
                .thenReturn(Optional.of(estadoPendiente));
        
        Reserva mockSavedReserva = new Reserva();
        mockSavedReserva.setId(100);
        mockSavedReserva.setCodigoReserva("RES-001");
        mockSavedReserva.setEspacio(espacio);
        mockSavedReserva.setUsuario(usuario);
        mockSavedReserva.setFechaInicioReserva(inicio);
        mockSavedReserva.setFechaFinReserva(fin);
        mockSavedReserva.setMontoTotal(new BigDecimal("100.00"));
        mockSavedReserva.setEstadoReserva(estadoPendiente);

        com.spacework.reservations.model.Precio precioMock = new com.spacework.reservations.model.Precio();
        precioMock.setMonto(new BigDecimal("200.00"));
        when(precioRepository.findFirstByEspacioIdAndEstadoTrue(espacio.getId())).thenReturn(Optional.of(precioMock));

        when(reservaRepository.save(any(Reserva.class))).thenReturn(mockSavedReserva);

        // Act
        Reserva result = reservaService.crearReserva(usuario, espacio, inicio, fin, new BigDecimal("100.00"), BigDecimal.ZERO, "Ninguna", null, new HashMap<>(), "BOLETA", "12345678", "", "");

        // Assert
        assertNotNull(result);
        assertEquals(100, result.getId());
        assertEquals("RES-001", result.getCodigoReserva());
        assertEquals("PENDIENTE", result.getEstadoReserva().getNombreEstado());
        verify(reservaRepository, times(1)).save(any(Reserva.class));
    }

    @Test
    public void testCrearReservaErrorSolapamiento() {
        // Arrange
        ArrayList<Reserva> overlappingList = new ArrayList<>();
        overlappingList.add(new Reserva()); // Simula solapamiento
        
        when(reservaRepository.findOverlappingReservations(espacio, inicio, fin))
                .thenReturn(overlappingList);

        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            reservaService.crearReserva(usuario, espacio, inicio, fin, new BigDecimal("100.00"), BigDecimal.ZERO, "Ninguna", null, new HashMap<>(), "BOLETA", "12345678", "", "");
        });

        assertEquals("El espacio ya se encuentra reservado en el rango de tiempo seleccionado.", exception.getMessage());
        verify(reservaRepository, never()).save(any(Reserva.class));
    }
}

