package com.spacework.crm.controller;

import com.spacework.crm.model.Usuario;
import com.spacework.crm.service.UsuarioService;
import com.spacework.crm.dto.request.UsuarioActualizacionDTO;
import com.spacework.crm.dto.response.UsuarioResponseDTO;
import com.spacework.auditoria.aop.Auditable;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final ModelMapper modelMapper;

    @Autowired
    public UsuarioController(UsuarioService usuarioService, ModelMapper modelMapper) {
        this.usuarioService = usuarioService;
        this.modelMapper = modelMapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<UsuarioResponseDTO>> obtenerTodos() {
        List<UsuarioResponseDTO> dtos = usuarioService.obtenerTodos().stream()
            .map(u -> modelMapper.map(u, UsuarioResponseDTO.class))
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{id}")
    @Auditable(accion = "ACTUALIZAR_PERFIL", entidad = "Usuarios")
    public ResponseEntity<?> actualizarPerfil(@PathVariable Integer id,
                                               @Valid @RequestBody UsuarioActualizacionDTO datosActualizacion,
                                               org.springframework.security.core.Authentication authentication) {
        Usuario usuarioAutenticado = (Usuario) authentication.getPrincipal();
        boolean isAdmin = usuarioAutenticado.getRol() != null && 
            (usuarioAutenticado.getRol().getNombreRol().equals("ADMIN") || usuarioAutenticado.getRol().getNombreRol().equals("SUPERADMIN"));
        if (!isAdmin && !usuarioAutenticado.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Usuario usuario = usuarioService.actualizarPerfil(id, datosActualizacion);
        return ResponseEntity.ok(modelMapper.map(usuario, UsuarioResponseDTO.class));
    }

    @PostMapping("/{id}/cambiar-contrasena")
    @Auditable(accion = "CAMBIAR_CONTRASENA", entidad = "Usuarios")
    public ResponseEntity<Map<String, String>> cambiarContrasena(@PathVariable Integer id,
                                                                  @RequestBody Map<String, String> request,
                                                                  org.springframework.security.core.Authentication authentication) {
        Usuario usuarioAutenticado = (Usuario) authentication.getPrincipal();
        boolean isAdmin = usuarioAutenticado.getRol() != null && 
            (usuarioAutenticado.getRol().getNombreRol().equals("ADMIN") || usuarioAutenticado.getRol().getNombreRol().equals("SUPERADMIN"));
        if (!isAdmin && !usuarioAutenticado.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No puedes cambiar la contraseña de otro usuario."));
        }
        String contrasenaActual = request.get("contrasenaActual");
        String nuevaContrasena = request.get("nuevaContrasena");
        usuarioService.cambiarContrasena(id, contrasenaActual, nuevaContrasena);
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada correctamente"));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "ADMIN_ACTUALIZAR_USUARIO", entidad = "Usuarios")
    public ResponseEntity<UsuarioResponseDTO> actualizarPorAdmin(@PathVariable Integer id,
                                                                  @RequestParam(required = false) String nombreRol,
                                                                  @RequestBody Usuario datosAdmin) {
        Usuario usuario = usuarioService.actualizarPorAdmin(id, datosAdmin, nombreRol);
        return ResponseEntity.ok(modelMapper.map(usuario, UsuarioResponseDTO.class));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "DESACTIVAR_USUARIO", entidad = "Usuarios")
    public ResponseEntity<Map<String, String>> eliminarUsuario(@PathVariable Integer id) {
        usuarioService.cambiarEstado(id, false);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario desactivado correctamente"));
    }

    @PutMapping("/admin/{id}/desbloquear")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "DESBLOQUEAR_USUARIO", entidad = "Usuarios")
    public ResponseEntity<Map<String, String>> desbloquearCuenta(@PathVariable Integer id) {
        usuarioService.desbloquearCuenta(id);
        return ResponseEntity.ok(Map.of("mensaje", "Cuenta desbloqueada correctamente"));
    }
}
