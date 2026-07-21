package com.spacework.reservations.model;

import com.spacework.crm.model.Empresa;
import jakarta.persistence.*;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ServiciosAdicionales", schema = "Reservas")
@Getter
@Setter
@NoArgsConstructor
public class ServicioAdicional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ServicioID")
    private Integer id;

    @Column(name = "Nombre", length = 150, nullable = false)
    private String nombre;

    @Column(name = "Descripcion", length = 500)
    private String descripcion;

    @Column(name = "PrecioBase", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioBase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ProveedorEmpresaID")
    private Empresa proveedor;

    @Column(name = "TipoServicio", length = 20)
    private String tipoServicio = "INTERNO"; // INTERNO o TERCERO

    @Column(name = "StockTotal")
    private Integer stockTotal;

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;

    @Column(name = "ImagenUrl", length = 500)
    private String imagenUrl;

    @Lob
    @Column(name = "CaracteristicasDetalle", columnDefinition = "NVARCHAR(MAX)")
    private String caracteristicasDetalle;

    @Lob
    @Column(name = "AdvertenciasDevolucion", columnDefinition = "NVARCHAR(MAX)")
    private String advertenciasDevolucion;

}
