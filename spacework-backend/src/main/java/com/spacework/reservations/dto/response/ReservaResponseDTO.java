package com.spacework.reservations.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.spacework.crm.dto.response.UsuarioResponseDTO;
import lombok.Data;

@Data
public class ReservaResponseDTO {
    private Integer id;
    private String codigoReserva;
    private UsuarioResponseDTO usuario;
    private EspacioReservaDTO espacio;
    private LocalDateTime fechaReserva;
    private LocalDateTime fechaInicioReserva;
    private LocalDateTime fechaFinReserva;
    private EstadoReservaDTO estadoReserva;
    private BigDecimal montoTotal;
    private BigDecimal impuestos;
    private BigDecimal descuentoAplicado;
    private String observaciones;
    private String tipoComprobante;
    private String documentoIdentidad;
    private String razonSocial;
    private String direccion;
    private boolean estado;
    private List<ReservaServicioDTO> reservaServicios;

    @Data
    public static class EspacioReservaDTO {
        private Integer id;
        private String nombreEspacio;
        private String fotoUrl;
        private BigDecimal precio; // Campo transient llenado manualmente
        private BigDecimal descuento; // Campo transient llenado manualmente
        private TipoEspacioDTO tipoEspacio;
        private UbicacionDTO ubicacion;

        @Data
        public static class TipoEspacioDTO {
            private Integer id;
            private String nombreTipo;
        }

        @Data
        public static class UbicacionDTO {
            private Integer id;
            private String nombreUbicacion;
        }
    }

    @Data
    public static class EstadoReservaDTO {
        private Integer id;
        private String nombreEstado;
    }

    @Data
    public static class ReservaServicioDTO {
        private Integer id;
        private int cantidad;
        private BigDecimal subtotal;
        private ServicioAdicionalDTO servicioAdicional;
    }

    @Data
    public static class ServicioAdicionalDTO {
        private Integer id;
        private String nombre;
        private BigDecimal precioBase;
    }
}
