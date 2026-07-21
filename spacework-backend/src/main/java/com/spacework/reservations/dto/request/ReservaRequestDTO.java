package com.spacework.reservations.dto.request;

import java.util.Map;
import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class ReservaRequestDTO {
    @NotNull(message = "El usuarioId es obligatorio")
    private Integer usuarioId;
    
    @NotNull(message = "El espacioId es obligatorio")
    private Integer espacioId;
    
    @NotBlank(message = "La fechaInicio es obligatoria")
    private String fechaInicio;
    
    @NotBlank(message = "La fechaFin es obligatoria")
    private String fechaFin;
    
    @NotNull(message = "El montoTotal es obligatorio")
    @Positive(message = "El montoTotal debe ser positivo")
    private Double montoTotal;
    
    private Double descuentoAplicado;
    
    private String observaciones;

    @Min(value = 1, message = "Debe haber al menos 1 asistente")
    @Max(value = 999, message = "El número de asistentes no puede exceder 999")
    private Integer asistentes = 1;

    @NotBlank(message = "El tipoComprobante es obligatorio")
    @Size(max = 20, message = "El tipoComprobante no debe exceder 20 caracteres")
    private String tipoComprobante;
    
    @Size(max = 20, message = "El documentoIdentidad no debe exceder 20 caracteres")
    private String documentoIdentidad;
    
    @Size(max = 150, message = "La razonSocial no debe exceder 150 caracteres")
    private String razonSocial;
    
    @Size(max = 200, message = "La direccion no debe exceder 200 caracteres")
    private String direccion;
    
    @NotNull(message = "Los serviciosAdicionales son obligatorios")
    private Map<String, Integer> serviciosAdicionales;

}
