package com.spacework.billing.service;

import com.spacework.billing.model.DetalleFactura;
import com.spacework.billing.model.Factura;
import com.spacework.billing.repository.DetalleFacturaRepository;
import com.spacework.billing.repository.FacturaRepository;
import com.spacework.core.model.Impuesto;
import com.spacework.core.repository.ImpuestoRepository;
import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.model.Reserva;
import com.spacework.crm.model.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FacturaServiceTest {

    @Mock
    private FacturaRepository facturaRepository;
    @Mock
    private DetalleFacturaRepository detalleFacturaRepository;
    @Mock
    private ImpuestoRepository impuestoRepository;

    @InjectMocks
    private FacturaService facturaService;

    private Reserva reserva;
    private Factura facturaExistente;
    private Impuesto igv;

    @BeforeEach
    void setUp() {
        Usuario usuario = new Usuario();
        usuario.setId(1);

        Espacio espacio = new Espacio();
        espacio.setId(1);
        espacio.setNombreEspacio("Sala A");

        reserva = new Reserva();
        reserva.setId(100);
        reserva.setUsuario(usuario);
        reserva.setEspacio(espacio);
        reserva.setMontoTotal(new BigDecimal("236.00"));
        reserva.setEstado(true);

        igv = new Impuesto();
        igv.setId(1);
        igv.setNombre("IGV");
        igv.setPorcentaje(new BigDecimal("18.00"));
        igv.setEstado(true);

        facturaExistente = new Factura();
        facturaExistente.setId(1);
        facturaExistente.setNumeroFactura("B001-00000001");
        facturaExistente.setReserva(reserva);
        facturaExistente.setTotalGeneral(new BigDecimal("236.00"));
        facturaExistente.setEstadoFactura("EMITIDA");
    }

    @Test
    void generarFacturaDeReservaDebeCrearFacturaCorrectamente() {
        when(facturaRepository.findByReservaIdAndEstadoTrue(100)).thenReturn(List.of());
        when(impuestoRepository.findByNombreAndEstadoTrue("IGV")).thenReturn(Optional.of(igv));
        when(facturaRepository.findTopByNumeroFacturaStartingWith("B001-")).thenReturn(Optional.empty());
        when(facturaRepository.save(any(Factura.class))).thenReturn(facturaExistente);

        Factura resultado = facturaService.generarFacturaDeReserva(reserva);

        assertNotNull(resultado);
        assertEquals("B001-00000001", resultado.getNumeroFactura());
        verify(facturaRepository).save(any(Factura.class));
        verify(detalleFacturaRepository).save(any(DetalleFactura.class));
    }

    @Test
    void generarFacturaDeReservaDebeRetornarExistenteSiYaHayFactura() {
        when(facturaRepository.findByReservaIdAndEstadoTrue(100))
                .thenReturn(List.of(facturaExistente));

        Factura resultado = facturaService.generarFacturaDeReserva(reserva);

        assertNotNull(resultado);
        assertEquals(1, resultado.getId());
        verify(facturaRepository, never()).save(any());
    }

    @Test
    void generarFacturaAdicionalDebeCrearFactura() {
        when(impuestoRepository.findByNombreAndEstadoTrue("IGV")).thenReturn(Optional.of(igv));
        when(facturaRepository.findTopByNumeroFacturaStartingWith("B001-")).thenReturn(Optional.of(facturaExistente));
        when(facturaRepository.save(any(Factura.class))).thenAnswer(i -> i.getArgument(0));

        Factura resultado = facturaService.generarFacturaAdicional(reserva, new BigDecimal("50.00"), "Servicio Extra");

        assertNotNull(resultado);
        assertTrue(resultado.getNumeroFactura().contains("00000002"));
    }

    @Test
    void generarFacturaDeReservaDebeLanzarExcepcionSiNoHayIGV() {
        when(facturaRepository.findByReservaIdAndEstadoTrue(100)).thenReturn(List.of());
        when(impuestoRepository.findByNombreAndEstadoTrue("IGV")).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class,
                () -> facturaService.generarFacturaDeReserva(reserva));
    }

    @Test
    void generarFacturaDeReservaDebeGenerarFacturaCuandoTieneEmpresa() {
        Usuario usuarioConEmpresa = new Usuario();
        usuarioConEmpresa.setId(2);
        com.spacework.crm.model.Empresa empresa = new com.spacework.crm.model.Empresa();
        empresa.setId(1);
        empresa.setRazonSocial("Empresa SAC");
        usuarioConEmpresa.setEmpresa(empresa);

        Espacio espacio = new Espacio();
        espacio.setId(1);
        espacio.setNombreEspacio("Oficina B");

        Reserva reservaEmpresa = new Reserva();
        reservaEmpresa.setId(200);
        reservaEmpresa.setUsuario(usuarioConEmpresa);
        reservaEmpresa.setEspacio(espacio);
        reservaEmpresa.setMontoTotal(new BigDecimal("500.00"));

        when(facturaRepository.findByReservaIdAndEstadoTrue(200)).thenReturn(List.of());
        when(impuestoRepository.findByNombreAndEstadoTrue("IGV")).thenReturn(Optional.of(igv));
        when(facturaRepository.findTopByNumeroFacturaStartingWith("F001-")).thenReturn(Optional.empty());
        when(facturaRepository.save(any(Factura.class))).thenAnswer(i -> i.getArgument(0));

        Factura resultado = facturaService.generarFacturaDeReserva(reservaEmpresa);

        assertNotNull(resultado);
        assertTrue(resultado.getNumeroFactura().startsWith("F001"));
    }

    @Test
    void obtenerTodasLasFacturasDebeRetornarLista() {
        when(facturaRepository.findByEstadoTrue()).thenReturn(List.of(facturaExistente));

        List<Factura> resultado = facturaService.obtenerTodasLasFacturas();

        assertEquals(1, resultado.size());
    }
}
