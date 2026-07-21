package com.spacework.reservations.dto.response;

import java.time.LocalTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class DisponibilidadResponseDTO {
    private Integer espacioId;
    private String nombreEspacio;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime horaApertura;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime horaCierre;

    private List<SlotDTO> ocupaciones;
}
