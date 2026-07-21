package com.spacework.reservations.service;

import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.model.Precio;
import com.spacework.reservations.model.Caracteristica;
import com.spacework.reservations.model.FotoEspacio;
import com.spacework.reservations.repository.EspacioRepository;
import com.spacework.reservations.repository.TipoEspacioRepository;
import com.spacework.reservations.repository.UbicacionRepository;
import com.spacework.reservations.repository.CaracteristicaRepository;
import com.spacework.reservations.repository.PrecioRepository;
import com.spacework.reservations.dto.request.EspacioRequestDTO;
import com.spacework.reservations.dto.response.EspacioResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.modelmapper.ModelMapper;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EspacioService {

    private static final Logger logger = LoggerFactory.getLogger(EspacioService.class);

    private final EspacioRepository espacioRepository;
    private final TipoEspacioRepository tipoEspacioRepository;
    private final UbicacionRepository ubicacionRepository;
    private final CaracteristicaRepository caracteristicaRepository;
    private final PrecioRepository precioRepository;
    private final ModelMapper modelMapper;

    @Autowired
    public EspacioService(EspacioRepository espacioRepository,
                          TipoEspacioRepository tipoEspacioRepository,
                          UbicacionRepository ubicacionRepository,
                          CaracteristicaRepository caracteristicaRepository,
                          PrecioRepository precioRepository,
                          ModelMapper modelMapper) {
        this.espacioRepository = espacioRepository;
        this.tipoEspacioRepository = tipoEspacioRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.caracteristicaRepository = caracteristicaRepository;
        this.precioRepository = precioRepository;
        this.modelMapper = modelMapper;
    }

    @Transactional(readOnly = true)
    public List<EspacioResponseDTO> listar() {
        List<Espacio> espacios = espacioRepository.findByEstadoTrue();
        enriquecerConPrecios(espacios);
        return espacios.stream()
                .map(e -> modelMapper.map(e, EspacioResponseDTO.class))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EspacioResponseDTO> filtrar(Integer tipoEspacioId) {
        List<Espacio> espacios = espacioRepository.findByTipoEspacioIdAndEstadoTrue(tipoEspacioId);
        enriquecerConPrecios(espacios);
        return espacios.stream()
                .map(e -> modelMapper.map(e, EspacioResponseDTO.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public EspacioResponseDTO crear(EspacioRequestDTO requestDTO) {
        Espacio espacio = modelMapper.map(requestDTO, Espacio.class);

        // Autogeneración inteligente del Código de Espacio
        String codigo = generarCodigoEspacio(espacio);
        espacio.setCodigoEspacio(codigo);

        // Valores por defecto
        if (espacio.getHoraApertura() == null) {
            espacio.setHoraApertura(LocalTime.of(8, 0));
        }
        if (espacio.getHoraCierre() == null) {
            espacio.setHoraCierre(LocalTime.of(20, 0));
        }
        espacio.setEstado(true);
        if (espacio.getCapacidadEquipos() == null) {
            espacio.setCapacidadEquipos(espacio.getCapacidad());
        }
        if (espacio.getPrecioPersonaExtra() == null) {
            espacio.setPrecioPersonaExtra(0.0);
        }

        // Resolver características desde BD
        if (espacio.getCaracteristicas() != null && !espacio.getCaracteristicas().isEmpty()) {
            Set<Caracteristica> dbCarac = new HashSet<>();
            for (Caracteristica c : espacio.getCaracteristicas()) {
                caracteristicaRepository.findById(c.getId()).ifPresent(dbCarac::add);
            }
            espacio.setCaracteristicas(dbCarac);
        }

        // Gestionar fotos
        if (espacio.getFotos() != null && !espacio.getFotos().isEmpty()) {
            gestionarFotos(espacio);
        }

        // Guardar el espacio
        Espacio nuevo = espacioRepository.save(espacio);

        // Guardar precio asociado
        if (espacio.getPrecio() != null) {
            guardarPrecio(nuevo, espacio.getPrecio(), espacio.getDescuento());
            nuevo.setPrecio(espacio.getPrecio());
            nuevo.setDescuento(espacio.getDescuento());
        }

        return modelMapper.map(nuevo, EspacioResponseDTO.class);
    }

    @Transactional
    public EspacioResponseDTO actualizar(Integer id, EspacioRequestDTO requestDTO) {
        Espacio espacioData = modelMapper.map(requestDTO, Espacio.class);
        Espacio espacio = espacioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado."));

        // Actualizar campos simples
        espacio.setCodigoEspacio(espacioData.getCodigoEspacio());
        espacio.setNombreEspacio(espacioData.getNombreEspacio());
        espacio.setCapacidad(espacioData.getCapacidad());
        espacio.setDescripcion(espacioData.getDescripcion());
        espacio.setEstadoEspacio(espacioData.getEstadoEspacio());
        espacio.setFotoUrl(espacioData.getFotoUrl());
        espacio.setMetrosCuadrados(espacioData.getMetrosCuadrados());
        espacio.setCapacidadEquipos(espacioData.getCapacidadEquipos());
        espacio.setPrecioPersonaExtra(espacioData.getPrecioPersonaExtra());

        if (espacioData.getHoraApertura() != null) espacio.setHoraApertura(espacioData.getHoraApertura());
        if (espacioData.getHoraCierre() != null) espacio.setHoraCierre(espacioData.getHoraCierre());

        // Actualizar relaciones
        if (espacioData.getTipoEspacio() != null) {
            tipoEspacioRepository.findById(espacioData.getTipoEspacio().getId())
                    .ifPresent(espacio::setTipoEspacio);
        }
        if (espacioData.getUbicacion() != null) {
            ubicacionRepository.findById(espacioData.getUbicacion().getId())
                    .ifPresent(espacio::setUbicacion);
        }

        // Actualizar características
        if (espacioData.getCaracteristicas() != null) {
            Set<Caracteristica> dbCarac = new HashSet<>();
            for (Caracteristica c : espacioData.getCaracteristicas()) {
                caracteristicaRepository.findById(c.getId()).ifPresent(dbCarac::add);
            }
            espacio.setCaracteristicas(dbCarac);
        }

        // Actualizar fotos: reemplazar lista actual
        if (espacioData.getFotos() != null) {
            actualizarFotos(espacio, espacioData);
        }

        Espacio actualizado = espacioRepository.save(espacio);

        // Actualizar o crear precio
        if (espacioData.getPrecio() != null) {
            actualizarPrecio(actualizado, espacioData.getPrecio(), espacioData.getDescuento());
            actualizado.setPrecio(espacioData.getPrecio());
            actualizado.setDescuento(espacioData.getDescuento());
        }

        return modelMapper.map(actualizado, EspacioResponseDTO.class);
    }

    @Transactional
    public void eliminar(Integer id) {
        Espacio espacio = espacioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado."));
        espacio.setEstado(false);
        espacioRepository.save(espacio);
    }

    // ========== Métodos privados auxiliares ==========

    /**
     * Enriquece una lista de espacios con sus precios activos usando una sola consulta batch.
     * Elimina el problema N+1.
     */
    private void enriquecerConPrecios(List<Espacio> espacios) {
        List<Integer> ids = espacios.stream()
                .map(Espacio::getId)
                .collect(Collectors.toList());

        if (ids.isEmpty()) return;

        Map<Integer, Precio> precioMap = precioRepository.findByEspacioIdInAndEstadoTrue(ids)
                .stream()
                .collect(Collectors.toMap(p -> p.getEspacio().getId(), p -> p, (p1, p2) -> p1));

        for (Espacio e : espacios) {
            Precio p = precioMap.get(e.getId());
            if (p != null) {
                e.setPrecio(p.getMonto());
                e.setDescuento(p.getDescuento());
            }
        }
    }

    /**
     * Genera un código de espacio con formato {TIPO}-{SEDE}-{NNN}
     */
    private String generarCodigoEspacio(Espacio espacio) {
        String prefijoTipo = generarPrefijoTipo(
                espacio.getTipoEspacio() != null && espacio.getTipoEspacio().getId() != null
                        ? tipoEspacioRepository.findById(espacio.getTipoEspacio().getId())
                            .map(t -> t.getNombreTipo()).orElse("") : "");

        String prefijoSede = generarPrefijoSede(
                espacio.getUbicacion() != null && espacio.getUbicacion().getId() != null
                        ? ubicacionRepository.findById(espacio.getUbicacion().getId())
                            .map(u -> u.getNombreUbicacion()).orElse("") : "");

        String prefijoBase = prefijoTipo + "-" + prefijoSede;

        // Buscar el correlativo máximo con una sola query en lugar de cargar todo
        String maxCodigo = espacioRepository.findMaxCodigoByPrefix(prefijoBase + "-");
        int maxCorrelativo = 0;
        if (maxCodigo != null) {
            try {
                String[] parts = maxCodigo.split("-");
                maxCorrelativo = Integer.parseInt(parts[parts.length - 1]);
            } catch (Exception ignored) {}
        }

        return String.format("%s-%03d", prefijoBase, maxCorrelativo + 1);
    }

    private void gestionarFotos(Espacio espacio) {
        boolean hasPrincipal = false;
        for (FotoEspacio f : espacio.getFotos()) {
            f.setEspacio(espacio);
            if (f.isEsPrincipal()) {
                hasPrincipal = true;
                espacio.setFotoUrl(f.getUrlFoto());
            }
        }
        if (!hasPrincipal && !espacio.getFotos().isEmpty()) {
            espacio.getFotos().get(0).setEsPrincipal(true);
            espacio.setFotoUrl(espacio.getFotos().get(0).getUrlFoto());
        }
    }

    private void actualizarFotos(Espacio espacio, Espacio espacioData) {
        espacio.getFotos().clear();
        boolean hasPrincipal = false;
        for (FotoEspacio f : espacioData.getFotos()) {
            f.setId(null);
            f.setEspacio(espacio);
            espacio.getFotos().add(f);
            if (f.isEsPrincipal()) {
                hasPrincipal = true;
                espacio.setFotoUrl(f.getUrlFoto());
            }
        }
        if (!hasPrincipal && !espacio.getFotos().isEmpty()) {
            espacio.getFotos().get(0).setEsPrincipal(true);
            espacio.setFotoUrl(espacio.getFotos().get(0).getUrlFoto());
        } else if (espacio.getFotos().isEmpty()) {
            espacio.setFotoUrl(null);
        }
    }

    private void guardarPrecio(Espacio espacio, BigDecimal monto, BigDecimal descuento) {
        Precio precioEntity = new Precio();
        precioEntity.setEspacio(espacio);
        precioEntity.setMonto(monto);
        if (descuento != null) {
            precioEntity.setDescuento(descuento);
        }
        precioEntity.setTipoTarifa("DIA");
        precioEntity.setMoneda("PEN");
        precioEntity.setEstado(true);
        precioRepository.save(precioEntity);
    }

    private void actualizarPrecio(Espacio espacio, BigDecimal monto, BigDecimal descuento) {
        Precio precioEntity = precioRepository.findFirstByEspacioIdAndEstadoTrue(espacio.getId())
                .orElse(null);
        if (precioEntity != null) {
            precioEntity.setMonto(monto);
            precioEntity.setDescuento(descuento != null ? descuento : BigDecimal.ZERO);
        } else {
            precioEntity = new Precio();
            precioEntity.setEspacio(espacio);
            precioEntity.setMonto(monto);
            if (descuento != null) {
                precioEntity.setDescuento(descuento);
            }
            precioEntity.setTipoTarifa("DIA");
            precioEntity.setMoneda("PEN");
            precioEntity.setEstado(true);
        }
        precioRepository.save(precioEntity);
    }

    // ========== Helper para generar prefijos de código ==========

    private String generarPrefijoTipo(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) return "XX";
        String n = nombre.toUpperCase().trim();
        if (n.contains("COWORKING")) return "CW";
        if (n.contains("OFICINA")) return "OF";
        if (n.contains("SALA DE REUNIONES") || n.contains("SALA")) return "SR";

        String[] parts = n.split("\\s+");
        if (parts.length == 1) {
            return parts[0].length() >= 3 ? parts[0].substring(0, 3) : parts[0];
        } else {
            StringBuilder sb = new StringBuilder();
            for (String p : parts) {
                if (!p.equals("DE") && !p.equals("LA") && !p.equals("EL")) {
                    sb.append(p.charAt(0));
                }
            }
            return sb.length() > 3 ? sb.substring(0, 3) : sb.toString();
        }
    }

    private String generarPrefijoSede(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) return "XXX";
        String n = nombre.toUpperCase().trim().replace("SEDE", "").trim();

        if (n.contains("SAN ISIDRO")) return "ISI";
        if (n.contains("MIRAFLORES")) return "MIR";

        String[] parts = n.split("\\s+");
        if (parts.length == 1) {
            return parts[0].length() >= 3 ? parts[0].substring(0, 3) : parts[0];
        } else {
            return parts[0].length() >= 3 ? parts[0].substring(0, 3) : parts[0];
        }
    }
}
