package com.spacework.reservations.service;

import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.model.Precio;
import com.spacework.reservations.model.Caracteristica;
import com.spacework.reservations.model.FotoEspacio;
import com.spacework.reservations.model.TipoEspacio;
import com.spacework.reservations.model.Ubicacion;
import com.spacework.reservations.repository.EspacioRepository;
import com.spacework.reservations.repository.TipoEspacioRepository;
import com.spacework.reservations.repository.UbicacionRepository;
import com.spacework.reservations.repository.CaracteristicaRepository;
import com.spacework.reservations.repository.PrecioRepository;
import com.spacework.reservations.dto.request.EspacioRequestDTO;
import com.spacework.reservations.dto.response.EspacioResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EspacioServiceTest {

    @Mock
    private EspacioRepository espacioRepository;
    @Mock
    private TipoEspacioRepository tipoEspacioRepository;
    @Mock
    private UbicacionRepository ubicacionRepository;
    @Mock
    private CaracteristicaRepository caracteristicaRepository;
    @Mock
    private PrecioRepository precioRepository;
    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private EspacioService espacioService;

    private Espacio espacio;
    private TipoEspacio tipoEspacio;
    private Ubicacion ubicacion;
    private Precio precio;

    @BeforeEach
    void setUp() {
        tipoEspacio = new TipoEspacio();
        tipoEspacio.setId(1);
        tipoEspacio.setNombreTipo("SALA DE REUNIONES");

        ubicacion = new Ubicacion();
        ubicacion.setId(1);
        ubicacion.setNombreUbicacion("SEDE SAN ISIDRO");

        espacio = new Espacio();
        espacio.setId(1);
        espacio.setNombreEspacio("Sala A");
        espacio.setCodigoEspacio("SR-ISI-001");
        espacio.setCapacidad(10);
        espacio.setEstadoEspacio("DISPONIBLE");
        espacio.setHoraApertura(LocalTime.of(8, 0));
        espacio.setHoraCierre(LocalTime.of(20, 0));
        espacio.setEstado(true);
        espacio.setTipoEspacio(tipoEspacio);
        espacio.setUbicacion(ubicacion);
        espacio.setPrecio(new BigDecimal("200.00"));
        espacio.setDescuento(BigDecimal.ZERO);

        precio = new Precio();
        precio.setId(1);
        precio.setMonto(new BigDecimal("200.00"));
        precio.setDescuento(BigDecimal.ZERO);
        precio.setEstado(true);
        precio.setEspacio(espacio);
        espacio.setId(1);
        espacio.setNombreEspacio("Sala A");
        espacio.setCodigoEspacio("SR-ISI-001");
        espacio.setCapacidad(10);
        espacio.setEstadoEspacio("DISPONIBLE");
        espacio.setHoraApertura(LocalTime.of(8, 0));
        espacio.setHoraCierre(LocalTime.of(20, 0));
        espacio.setEstado(true);
        espacio.setTipoEspacio(tipoEspacio);
        espacio.setUbicacion(ubicacion);
        espacio.setPrecio(new BigDecimal("200.00"));
        espacio.setDescuento(BigDecimal.ZERO);
    }

    @Test
    void listarDebeRetornarListaDeEspacios() {
        when(espacioRepository.findByEstadoTrue()).thenReturn(List.of(espacio));
        when(precioRepository.findByEspacioIdInAndEstadoTrue(anyList()))
                .thenReturn(List.of(precio));
        when(modelMapper.map(any(Espacio.class), eq(EspacioResponseDTO.class)))
                .thenReturn(new EspacioResponseDTO());

        List<EspacioResponseDTO> resultado = espacioService.listar();

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(espacioRepository).findByEstadoTrue();
    }

    @Test
    void listarDebeRetornarListaVaciaCuandoNoHayEspacios() {
        when(espacioRepository.findByEstadoTrue()).thenReturn(Collections.emptyList());

        List<EspacioResponseDTO> resultado = espacioService.listar();

        assertTrue(resultado.isEmpty());
    }

    @Test
    void filtrarDebeRetornarEspaciosPorTipo() {
        when(espacioRepository.findByTipoEspacioIdAndEstadoTrue(1))
                .thenReturn(List.of(espacio));
        when(precioRepository.findByEspacioIdInAndEstadoTrue(anyList()))
                .thenReturn(List.of(precio));
        when(modelMapper.map(any(Espacio.class), eq(EspacioResponseDTO.class)))
                .thenReturn(new EspacioResponseDTO());

        List<EspacioResponseDTO> resultado = espacioService.filtrar(1);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
    }

    @Test
    void crearDebeGuardarEspacioConValoresPorDefecto() {
        EspacioRequestDTO dto = new EspacioRequestDTO();
        dto.setNombreEspacio("Sala B");
        dto.setCapacidad(5);
        dto.setEstadoEspacio("DISPONIBLE");
        dto.setHoraApertura(LocalTime.of(8, 0));
        dto.setHoraCierre(LocalTime.of(20, 0));

        EspacioRequestDTO.RelacionDTO tipoRel = new EspacioRequestDTO.RelacionDTO();
        tipoRel.setId(1);
        dto.setTipoEspacio(tipoRel);

        EspacioRequestDTO.RelacionDTO ubiRel = new EspacioRequestDTO.RelacionDTO();
        ubiRel.setId(1);
        dto.setUbicacion(ubiRel);

        dto.setPrecio(new BigDecimal("150.00"));

        when(modelMapper.map(any(EspacioRequestDTO.class), eq(Espacio.class)))
                .thenReturn(espacio);
        when(tipoEspacioRepository.findById(1)).thenReturn(Optional.of(tipoEspacio));
        when(ubicacionRepository.findById(1)).thenReturn(Optional.of(ubicacion));
        when(espacioRepository.findMaxCodigoByPrefix(anyString())).thenReturn("SR-ISI-001");
        when(espacioRepository.save(any(Espacio.class))).thenReturn(espacio);
        when(modelMapper.map(any(Espacio.class), eq(EspacioResponseDTO.class)))
                .thenReturn(new EspacioResponseDTO());

        EspacioResponseDTO resultado = espacioService.crear(dto);

        assertNotNull(resultado);
        verify(espacioRepository).save(any(Espacio.class));
        verify(precioRepository).save(any(Precio.class));
    }

    @Test
    void eliminarDebeRealizarSoftDelete() {
        when(espacioRepository.findById(1)).thenReturn(Optional.of(espacio));
        when(espacioRepository.save(any(Espacio.class))).thenReturn(espacio);

        espacioService.eliminar(1);

        assertFalse(espacio.isEstado());
        verify(espacioRepository).save(espacio);
    }

    @Test
    void eliminarDebeLanzarExcepcionCuandoNoExiste() {
        when(espacioRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> espacioService.eliminar(99));
    }

    @Test
    void actualizarDebeModificarCamposCorrectamente() {
        EspacioRequestDTO dto = new EspacioRequestDTO();
        dto.setNombreEspacio("Sala A Actualizada");
        dto.setCapacidad(15);
        dto.setEstadoEspacio("DISPONIBLE");
        dto.setPrecio(new BigDecimal("250.00"));

        Espacio espacioExistente = new Espacio();
        espacioExistente.setId(1);
        espacioExistente.setNombreEspacio("Sala A");
        espacioExistente.setEstado(true);

        when(espacioRepository.findById(1)).thenReturn(Optional.of(espacioExistente));
        when(modelMapper.map(any(EspacioRequestDTO.class), eq(Espacio.class)))
                .thenReturn(espacio);
        when(espacioRepository.save(any(Espacio.class))).thenReturn(espacioExistente);
        when(modelMapper.map(any(Espacio.class), eq(EspacioResponseDTO.class)))
                .thenReturn(new EspacioResponseDTO());

        EspacioResponseDTO resultado = espacioService.actualizar(1, dto);

        assertNotNull(resultado);
        verify(espacioRepository).save(espacioExistente);
    }

    @Test
    void actualizarDebeLanzarExcepcionCuandoNoExiste() {
        EspacioRequestDTO dto = new EspacioRequestDTO();

        when(espacioRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> espacioService.actualizar(99, dto));
    }
}
