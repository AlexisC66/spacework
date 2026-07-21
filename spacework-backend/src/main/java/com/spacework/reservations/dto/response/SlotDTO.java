package com.spacework.reservations.dto.response;

import java.time.LocalDateTime;


import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class SlotDTO {
    private Integer reservaId;
    private String codigoReserva;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime inicio;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fin;
}
