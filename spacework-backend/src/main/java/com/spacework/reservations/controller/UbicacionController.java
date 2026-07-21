package com.spacework.reservations.controller;

import com.spacework.reservations.model.Ubicacion;
import com.spacework.reservations.service.UbicacionService;
import com.spacework.auditoria.aop.Auditable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/ubicaciones")
public class UbicacionController {

    private final UbicacionService ubicacionService;

    @Autowired
    public UbicacionController(UbicacionService ubicacionService) {
        this.ubicacionService = ubicacionService;
    }

    @GetMapping
    public List<Ubicacion> getAll() {
        return ubicacionService.obtenerActivas();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "CREAR_UBICACION", entidad = "Ubicaciones")
    public Ubicacion create(@RequestBody Ubicacion ubicacion) {
        return ubicacionService.crear(ubicacion);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "ACTUALIZAR_UBICACION", entidad = "Ubicaciones")
    public ResponseEntity<Ubicacion> update(@PathVariable Integer id, @RequestBody Ubicacion ubicacionData) {
        return ubicacionService.actualizar(id, ubicacionData)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "ELIMINAR_UBICACION", entidad = "Ubicaciones")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        return ubicacionService.eliminar(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
