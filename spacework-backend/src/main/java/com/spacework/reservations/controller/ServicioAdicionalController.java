package com.spacework.reservations.controller;

import com.spacework.reservations.model.ServicioAdicional;
import com.spacework.reservations.service.ServicioAdicionalService;
import com.spacework.auditoria.aop.Auditable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/servicios-adicionales")
public class ServicioAdicionalController {

    private final ServicioAdicionalService servicioAdicionalService;

    @Autowired
    public ServicioAdicionalController(ServicioAdicionalService servicioAdicionalService) {
        this.servicioAdicionalService = servicioAdicionalService;
    }

    @GetMapping
    public List<ServicioAdicional> getAll() {
        return servicioAdicionalService.getAllServicios();
    }

    @GetMapping("/activos")
    public List<ServicioAdicional> getActivos() {
        return servicioAdicionalService.getActiveServicios();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServicioAdicional> getById(@PathVariable Integer id) {
        ServicioAdicional servicio = servicioAdicionalService.getServicioById(id);
        if (servicio != null) {
            return ResponseEntity.ok(servicio);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "CREAR_SERVICIO", entidad = "ServiciosAdicionales")
    public ServicioAdicional create(@RequestBody ServicioAdicional servicio) {
        return servicioAdicionalService.createServicio(servicio);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "ACTUALIZAR_SERVICIO", entidad = "ServiciosAdicionales")
    public ResponseEntity<ServicioAdicional> update(@PathVariable Integer id, @RequestBody ServicioAdicional servicio) {
        ServicioAdicional updated = servicioAdicionalService.updateServicio(id, servicio);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "ELIMINAR_SERVICIO", entidad = "ServiciosAdicionales")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        servicioAdicionalService.deleteServicio(id);
        return ResponseEntity.noContent().build();
    }
}
