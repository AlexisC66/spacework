package com.spacework.crm.controller;

import com.spacework.crm.model.Empresa;
import com.spacework.crm.service.EmpresaService;
import com.spacework.auditoria.aop.Auditable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/empresas")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class EmpresaController {

    private final EmpresaService empresaService;

    @Autowired
    public EmpresaController(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @GetMapping
    public ResponseEntity<List<Empresa>> listarEmpresas() {
        return ResponseEntity.ok(empresaService.obtenerTodasLasEmpresas());
    }

    @PostMapping
    @Auditable(accion = "CREAR_EMPRESA", entidad = "Empresas")
    public ResponseEntity<Empresa> crearEmpresa(@RequestBody Empresa empresa) {
        return ResponseEntity.ok(empresaService.crearEmpresa(empresa));
    }

    @PutMapping("/{id}")
    @Auditable(accion = "ACTUALIZAR_EMPRESA", entidad = "Empresas")
    public ResponseEntity<Empresa> actualizarEmpresa(@PathVariable Integer id, @RequestBody Empresa empresa) {
        return ResponseEntity.ok(empresaService.actualizarEmpresa(id, empresa));
    }

    @DeleteMapping("/{id}")
    @Auditable(accion = "ELIMINAR_EMPRESA", entidad = "Empresas")
    public ResponseEntity<Void> eliminarEmpresa(@PathVariable Integer id) {
        empresaService.eliminarEmpresa(id);
        return ResponseEntity.ok().build();
    }
}
