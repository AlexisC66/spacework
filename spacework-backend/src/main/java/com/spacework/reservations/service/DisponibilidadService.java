package com.spacework.reservations.service;

import com.spacework.reservations.dto.response.DisponibilidadResponseDTO;
import com.spacework.reservations.dto.response.SlotDTO;
import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.model.Reserva;
import com.spacework.reservations.repository.EspacioRepository;
import com.spacework.reservations.repository.ReservaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DisponibilidadService {

    private final ReservaRepository reservaRepository;
    private final EspacioRepository espacioRepository;

    public DisponibilidadService(ReservaRepository reservaRepository, EspacioRepository espacioRepository) {
        this.reservaRepository = reservaRepository;
        this.espacioRepository = espacioRepository;
    }

    @Transactional(readOnly = true)
    public DisponibilidadResponseDTO obtenerDisponibilidad(Integer espacioId, LocalDateTime desde, LocalDateTime hasta) {
        Espacio espacio = espacioRepository.findById(espacioId)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado."));

        List<Reserva> ocupadas = reservaRepository.findReservasOcupadas(espacio, desde, hasta);

        List<SlotDTO> slots = ocupadas.stream().map(r -> {
            SlotDTO slot = new SlotDTO();
            slot.setReservaId(r.getId());
            slot.setCodigoReserva(r.getCodigoReserva());
            slot.setInicio(r.getFechaInicioReserva());
            slot.setFin(r.getFechaFinReserva());
            return slot;
        }).collect(Collectors.toList());

        DisponibilidadResponseDTO dto = new DisponibilidadResponseDTO();
        dto.setEspacioId(espacio.getId());
        dto.setNombreEspacio(espacio.getNombreEspacio());
        dto.setHoraApertura(espacio.getHoraApertura());
        dto.setHoraCierre(espacio.getHoraCierre());
        dto.setOcupaciones(slots);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<DisponibilidadResponseDTO> obtenerDisponibilidadGeneral(LocalDateTime desde, LocalDateTime hasta) {
        List<Espacio> espacios = espacioRepository.findByEstadoTrue();
        List<DisponibilidadResponseDTO> result = new ArrayList<>();
        for (Espacio e : espacios) {
            result.add(obtenerDisponibilidad(e.getId(), desde, hasta));
        }
        return result;
    }
}
