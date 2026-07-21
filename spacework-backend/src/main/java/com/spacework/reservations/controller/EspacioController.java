package com.spacework.reservations.controller;

import com.spacework.reservations.repository.TipoEspacioRepository;
import com.spacework.reservations.repository.UbicacionRepository;
import com.spacework.reservations.repository.CaracteristicaRepository;
import com.spacework.reservations.service.EspacioService;
import com.spacework.reservations.service.DisponibilidadService;
import com.spacework.reservations.dto.response.DisponibilidadResponseDTO;
import com.spacework.reservations.dto.request.EspacioRequestDTO;
import com.spacework.reservations.dto.response.EspacioResponseDTO;
import com.spacework.auditoria.aop.Auditable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.time.LocalDateTime;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/espacios")
public class EspacioController {

    private final EspacioService espacioService;
    private final TipoEspacioRepository tipoEspacioRepository;
    private final UbicacionRepository ubicacionRepository;
    private final CaracteristicaRepository caracteristicaRepository;
    private final DisponibilidadService disponibilidadService;

    @Autowired
    public EspacioController(EspacioService espacioService,
                             TipoEspacioRepository tipoEspacioRepository,
                             UbicacionRepository ubicacionRepository,
                             CaracteristicaRepository caracteristicaRepository,
                             DisponibilidadService disponibilidadService) {
        this.espacioService = espacioService;
        this.tipoEspacioRepository = tipoEspacioRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.caracteristicaRepository = caracteristicaRepository;
        this.disponibilidadService = disponibilidadService;
    }

    @GetMapping
    public ResponseEntity<List<EspacioResponseDTO>> listar() {
        return ResponseEntity.ok(espacioService.listar());
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<EspacioResponseDTO>> filtrar(@RequestParam Integer tipoEspacioId) {
        return ResponseEntity.ok(espacioService.filtrar(tipoEspacioId));
    }

    @GetMapping("/tipos")
    public ResponseEntity<?> listarTipos() {
        return ResponseEntity.ok(tipoEspacioRepository.findByEstadoTrue());
    }

    @GetMapping("/ubicaciones")
    public ResponseEntity<?> listarUbicaciones() {
        return ResponseEntity.ok(ubicacionRepository.findByEstadoTrue());
    }

    @GetMapping("/caracteristicas")
    public ResponseEntity<?> listarCaracteristicas() {
        return ResponseEntity.ok(caracteristicaRepository.findByEstadoTrue());
    }

    @GetMapping("/{id}/disponibilidad")
    public ResponseEntity<?> disponibilidad(
            @PathVariable Integer id,
            @RequestParam String desde,
            @RequestParam String hasta) {
        LocalDateTime fechaDesde = LocalDateTime.parse(desde);
        LocalDateTime fechaHasta = LocalDateTime.parse(hasta);
        DisponibilidadResponseDTO dto = disponibilidadService.obtenerDisponibilidad(id, fechaDesde, fechaHasta);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<?> disponibilidadGeneral(
            @RequestParam String desde,
            @RequestParam String hasta) {
        LocalDateTime fechaDesde = LocalDateTime.parse(desde);
        LocalDateTime fechaHasta = LocalDateTime.parse(hasta);
        List<DisponibilidadResponseDTO> lista = disponibilidadService.obtenerDisponibilidadGeneral(fechaDesde, fechaHasta);
        return ResponseEntity.ok(lista);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "CREAR_ESPACIO", entidad = "Espacios")
    public ResponseEntity<EspacioResponseDTO> crear(@Valid @RequestBody EspacioRequestDTO requestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(espacioService.crear(requestDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "ACTUALIZAR_ESPACIO", entidad = "Espacios")
    public ResponseEntity<EspacioResponseDTO> actualizar(@PathVariable Integer id, @Valid @RequestBody EspacioRequestDTO requestDTO) {
        return ResponseEntity.ok(espacioService.actualizar(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "ELIMINAR_ESPACIO", entidad = "Espacios")
    public ResponseEntity<?> eliminar(@PathVariable Integer id) {
        espacioService.eliminar(id);
        return ResponseEntity.ok(java.util.Map.of("mensaje", "Espacio eliminado correctamente."));
    }
}

