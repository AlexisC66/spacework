package com.spacework.reservations.controller;

import com.spacework.reservations.model.Resena;
import com.spacework.reservations.model.Reserva;
import com.spacework.reservations.repository.ResenaRepository;
import com.spacework.reservations.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resenas")
public class ResenaController {

    @Autowired
    private ResenaRepository resenaRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    public static class ResenaDTO {
        public Integer reservaId;
        public Integer calificacion;
        public String comentario;
    }

    public static class ResenaResponseDTO {
        public Integer id;
        public Integer calificacion;
        public String comentario;
        public String fecha;
        public String usuarioNombre;
        public String espacioNombre;
        
        public ResenaResponseDTO(Resena r) {
            this.id = r.getId();
            this.calificacion = r.getCalificacion();
            this.comentario = r.getComentario();
            this.fecha = r.getFechaResena() != null ? r.getFechaResena().toString() : "";
            this.usuarioNombre = r.getUsuario().getNombre() + " " + r.getUsuario().getApellidoPaterno();
            this.espacioNombre = r.getEspacio().getNombreEspacio();
        }
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> crearResena(@RequestBody ResenaDTO dto, org.springframework.security.core.Authentication authentication) {
        if (dto.calificacion == null || dto.calificacion < 1 || dto.calificacion > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "La calificación debe estar entre 1 y 5."));
        }

        Reserva reserva = reservaRepository.findById(dto.reservaId).orElse(null);
        if (reserva == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Reserva no encontrada."));
        }

        com.spacework.crm.model.Usuario usuarioAutenticado = (com.spacework.crm.model.Usuario) authentication.getPrincipal();
        if (!reserva.getUsuario().getId().equals(usuarioAutenticado.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "No puedes reseñar una reserva que no te pertenece."));
        }

        // Verificar si la reserva ya tiene reseña
        long count = resenaRepository.countByReservaId(reserva.getId());
        if (count > 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ya existe una reseña para esta reserva."));
        }

        // Crear Reseña
        Resena resena = new Resena();
        resena.setReserva(reserva);
        resena.setUsuario(reserva.getUsuario());
        resena.setEspacio(reserva.getEspacio());
        resena.setCalificacion(dto.calificacion);
        resena.setComentario(dto.comentario);

        resenaRepository.save(resena);

        return ResponseEntity.ok(Map.of("mensaje", "Reseña guardada exitosamente."));
    }

    @GetMapping("/espacio/{espacioId}")
    public ResponseEntity<?> obtenerPromedioEspacio(@PathVariable Integer espacioId) {
        Double promedio = resenaRepository.obtenerPromedioPorEspacio(espacioId);
        List<Resena> lista = resenaRepository.findByEspacioIdAndEstadoTrueOrderByFechaResenaDesc(espacioId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("promedio", promedio != null ? Math.round(promedio * 10.0) / 10.0 : 0.0);
        response.put("total", lista.size());
        response.put("resenas", lista.stream().map(ResenaResponseDTO::new).collect(Collectors.toList()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reserva/{reservaId}")
    public ResponseEntity<?> chequearResenaReserva(@PathVariable Integer reservaId) {
        List<Resena> resenas = resenaRepository.findByReservaId(reservaId);
        if (resenas.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasResena", false));
        }
        return ResponseEntity.ok(Map.of("hasResena", true, "resena", new ResenaResponseDTO(resenas.get(0))));
    }

    @GetMapping("/admin/dashboard")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<?> obtenerResenasAdmin() {
        List<Resena> todas = resenaRepository.findAllByOrderByFechaResenaDesc();
        return ResponseEntity.ok(todas.stream().map(ResenaResponseDTO::new).collect(Collectors.toList()));
    }
}
