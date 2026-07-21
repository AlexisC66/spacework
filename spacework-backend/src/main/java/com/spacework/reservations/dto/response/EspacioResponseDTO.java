package com.spacework.reservations.dto.response;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class EspacioResponseDTO {
    private Integer id;
    private String codigoEspacio;
    private String nombreEspacio;
    private Integer capacidad;
    private Integer capacidadEquipos;
    private String descripcion;
    private String estadoEspacio;
    private LocalTime horaApertura;
    private LocalTime horaCierre;
    private boolean estado;
    private String fotoUrl;
    private Double metrosCuadrados;
    private Double precioPersonaExtra;
    
    // Referencias
    private TipoEspacioDTO tipoEspacio;
    private UbicacionDTO ubicacion;
    private Set<CaracteristicaDTO> caracteristicas;
    private List<FotoEspacioDTO> fotos;
    
    // Precios
    private BigDecimal precio;
    private BigDecimal descuento;

    @Data
    public static class TipoEspacioDTO {
        private Integer id;
        private String nombreTipo;
    }

    @Data
    public static class UbicacionDTO {
        private Integer id;
        private String nombreUbicacion;
        private String direccion;
        private String ciudad;
        private String pais;
    }

    @Data
    public static class CaracteristicaDTO {
        private Integer id;
        private String nombreCaracteristica;
        private String icono;
    }

    @Data
    public static class FotoEspacioDTO {
        private Integer id;
        private String urlFoto;
        private boolean esPrincipal;
    }
}
