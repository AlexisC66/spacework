package com.spacework.billing.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "DetallesFactura", schema = "Reservas")
@Getter
@Setter
@NoArgsConstructor
public class DetalleFactura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DetalleID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "FacturaID", nullable = false)
    private Factura factura;

    @Column(name = "DescripcionItem", length = 250, nullable = false)
    private String descripcionItem;

    @Column(name = "Cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "PrecioUnitario", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioUnitario;

    @Column(name = "SubTotalItem", precision = 10, scale = 2, nullable = false)
    private BigDecimal subTotalItem;

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;
}
