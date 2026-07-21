package com.spacework.reservations.controller;

import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.model.Reserva;
import com.spacework.crm.model.Usuario;
import com.spacework.reservations.repository.EspacioRepository;
import com.spacework.reservations.repository.PrecioRepository;
import com.spacework.reservations.repository.ReservaRepository;
import com.spacework.crm.repository.UsuarioRepository;
import com.spacework.reservations.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.modelmapper.ModelMapper;
import com.spacework.reservations.dto.request.ReservaRequestDTO;
import com.spacework.reservations.dto.response.ReservaResponseDTO;
import java.util.stream.Collectors;
import jakarta.validation.Valid;


@RestController
@RequestMapping("/api/reservas")

public class ReservaController {

    private final ReservaService reservaService;
    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EspacioRepository espacioRepository;
    private final PrecioRepository precioRepository;
    private final ModelMapper modelMapper;

    @Autowired
    public ReservaController(ReservaService reservaService, 
                             ReservaRepository reservaRepository,
                             UsuarioRepository usuarioRepository, 
                             EspacioRepository espacioRepository,
                             PrecioRepository precioRepository, ModelMapper modelMapper) {
        this.reservaService = reservaService;
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.espacioRepository = espacioRepository;
        this.precioRepository = precioRepository;
        this.modelMapper = modelMapper;
    }

    // Endpoint para el admin (lista todas las reservas sin filtro)
    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Page<ReservaResponseDTO>> listarTodas(
            @org.springframework.data.web.PageableDefault(size = 100, sort = "fechaReserva") Pageable pageable) {
        Page<Reserva> reservasPage = reservaRepository.findAll(pageable);
        List<Reserva> reservas = reservasPage.getContent();
        enriquecerConPrecio(reservas);
        List<ReservaResponseDTO> dtos = reservas.stream()
            .map(r -> modelMapper.map(r, ReservaResponseDTO.class))
            .collect(Collectors.toList());
        Page<ReservaResponseDTO> page = new PageImpl<>(dtos, pageable, reservasPage.getTotalElements());
        return ResponseEntity.ok(page);
    }

    // Endpoint usado por "Mis Reservas" en el Frontend
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<Page<ReservaResponseDTO>> listarPorUsuario(
            @PathVariable Integer usuarioId,
            org.springframework.security.core.Authentication authentication,
            @org.springframework.data.web.PageableDefault(size = 50, sort = "fechaReserva") Pageable pageable) {
        // Verificar que el usuario autenticado sea el dueño o un admin
        Usuario usuarioAutenticado = (Usuario) authentication.getPrincipal();
        boolean isAdmin = usuarioAutenticado.getRol() != null && 
            (usuarioAutenticado.getRol().getNombreRol().equals("ADMIN") || 
             usuarioAutenticado.getRol().getNombreRol().equals("SUPERADMIN"));
        if (!isAdmin && !usuarioAutenticado.getId().equals(usuarioId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Page<Reserva> reservasPage = reservaRepository.findByUsuarioId(usuarioId, pageable);
        List<Reserva> reservas = reservasPage.getContent();
        enriquecerConPrecio(reservas);
        List<ReservaResponseDTO> dtos = reservas.stream()
            .map(r -> modelMapper.map(r, ReservaResponseDTO.class))
            .collect(Collectors.toList());
        Page<ReservaResponseDTO> page = new PageImpl<>(dtos, pageable, reservasPage.getTotalElements());
        return ResponseEntity.ok(page);
    }

    @PostMapping("/crear")
    public ResponseEntity<ReservaResponseDTO> crearReserva(@Valid @RequestBody ReservaRequestDTO body) {
        Integer usuarioId = body.getUsuarioId();
        Integer espacioId = body.getEspacioId();
        String inicioStr = body.getFechaInicio();
        String finStr = body.getFechaFin();
        Double montoDouble = body.getMontoTotal();
        Double descuentoDouble = body.getDescuentoAplicado() != null ? body.getDescuentoAplicado() : 0.0;
        String observaciones = body.getObservaciones();
        Integer asistentes = body.getAsistentes() != null ? body.getAsistentes() : 1;
        String tipoComprobante = body.getTipoComprobante();
        String documentoIdentidad = body.getDocumentoIdentidad();
        String razonSocial = body.getRazonSocial();
        String direccion = body.getDireccion();
        
        Map<Integer, Integer> serviciosAdicionales = new HashMap<>();
        if (body.getServiciosAdicionales() != null) {
            for (Map.Entry<String, Integer> entry : body.getServiciosAdicionales().entrySet()) {
                serviciosAdicionales.put(Integer.valueOf(entry.getKey()), entry.getValue());
            }
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        Espacio espacio = espacioRepository.findByIdWithPrecio(espacioId)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado."));

        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        LocalDateTime inicio = LocalDateTime.parse(inicioStr, formatter);
        LocalDateTime fin = LocalDateTime.parse(finStr, formatter);

        if (montoDouble == null) {
            throw new IllegalArgumentException("El monto total es requerido.");
        }
        BigDecimal montoTotal = BigDecimal.valueOf(montoDouble);
        BigDecimal descuentoAplicado = BigDecimal.valueOf(descuentoDouble);

        Reserva reserva = reservaService.crearReserva(usuario, espacio, inicio, fin, montoTotal, descuentoAplicado, observaciones, asistentes, serviciosAdicionales, tipoComprobante, documentoIdentidad, razonSocial, direccion);
        return ResponseEntity.status(HttpStatus.CREATED).body(modelMapper.map(reserva, ReservaResponseDTO.class));
    }

    @PostMapping("/{id}/agregar-servicio")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<com.spacework.reservations.model.ReservaServicio>> agregarServicioExtra(
            @PathVariable Integer id, @RequestBody List<Map<String, Object>> body,
            org.springframework.security.core.Authentication authentication) {
        Usuario usuarioSolicitante = (Usuario) authentication.getPrincipal();
        List<com.spacework.reservations.model.ReservaServicio> rsList = reservaService.agregarServiciosExtra(id, body, usuarioSolicitante);
        return ResponseEntity.ok(rsList);
    }

    @PutMapping("/{id}/cancelar")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> cancelarReserva(@PathVariable Integer id,
                                                                org.springframework.security.core.Authentication authentication) {
        Usuario usuarioSolicitante = (Usuario) authentication.getPrincipal();
        reservaService.cancelarReserva(id, usuarioSolicitante);
        return ResponseEntity.ok(Map.of("mensaje", "Reserva cancelada exitosamente."));
    }

 
    private void enriquecerConPrecio(List<Reserva> reservas) {
        List<Integer> espacioIds = reservas.stream()
                .filter(r -> r.getEspacio() != null)
                .map(r -> r.getEspacio().getId())
                .distinct()
                .collect(Collectors.toList());

        if (espacioIds.isEmpty()) return;

        List<com.spacework.reservations.model.Precio> precios = precioRepository.findByEspacioIdInAndEstadoTrue(espacioIds);
        Map<Integer, com.spacework.reservations.model.Precio> precioMap = precios.stream()
                .collect(Collectors.toMap(p -> p.getEspacio().getId(), p -> p, (p1, p2) -> p1));

        for (Reserva r : reservas) {
            if (r.getEspacio() != null) {
                com.spacework.reservations.model.Precio p = precioMap.get(r.getEspacio().getId());
                if (p != null) {
                    r.getEspacio().setPrecio(p.getMonto());
                    r.getEspacio().setDescuento(p.getDescuento());
                }
            }
        }
    }
}
