package com.spacework.reservations.controller;

import com.spacework.reservations.model.Caracteristica;
import com.spacework.reservations.service.CaracteristicaService;
import com.spacework.auditoria.aop.Auditable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/caracteristicas")
public class CaracteristicaController {

    private final CaracteristicaService caracteristicaService;

    @Autowired
    public CaracteristicaController(CaracteristicaService caracteristicaService) {
        this.caracteristicaService = caracteristicaService;
    }

    @GetMapping
    public List<Caracteristica> getAll() {
        return caracteristicaService.obtenerActivas();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "CREAR_CARACTERISTICA", entidad = "Caracteristicas")
    public Caracteristica create(@RequestBody Caracteristica caracteristica) {
        return caracteristicaService.crear(caracteristica);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "ACTUALIZAR_CARACTERISTICA", entidad = "Caracteristicas")
    public ResponseEntity<Caracteristica> update(@PathVariable Integer id, @RequestBody Caracteristica caracteristicaData) {
        return caracteristicaService.actualizar(id, caracteristicaData)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "ELIMINAR_CARACTERISTICA", entidad = "Caracteristicas")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        return caracteristicaService.eliminar(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
