package com.spacework.billing.model;

import com.spacework.reservations.model.Reserva;
import com.spacework.crm.model.Usuario;
import com.spacework.crm.model.Empresa;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Facturas", schema = "Reservas")
@Getter
@Setter
@NoArgsConstructor
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FacturaID")
    private Integer id;

    @Column(name = "NumeroFactura", length = 50, unique = true)
    private String numeroFactura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ReservaID")
    private Reserva reserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UsuarioID", nullable = false)
    private Usuario usuario; // A quién se le factura

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EmpresaID")
    private Empresa empresa; // Si factura a nombre de una empresa

    @Column(name = "FechaEmision", nullable = false)
    private LocalDateTime fechaEmision = LocalDateTime.now();

    @Column(name = "SubTotal", precision = 10, scale = 2, nullable = false)
    private BigDecimal subTotal;

    @Column(name = "TotalImpuestos", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalImpuestos;

    @Column(name = "TotalGeneral", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalGeneral;

    @Column(name = "EstadoFactura", length = 20, nullable = false)
    private String estadoFactura = "BORRADOR"; // BORRADOR, EMITIDA, PAGADA, ANULADA

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;

    @Version
    @Column(name = "Version")
    private Long version;
}
