package com.spacework.billing.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import com.spacework.reservations.model.Reserva;
import java.time.LocalDateTime;

@Entity
@Table(name = "Pagos", schema = "Reservas",
       indexes = {
           @Index(name = "idx_pago_reserva", columnList = "ReservaID"),
           @Index(name = "idx_pago_estado", columnList = "EstadoPago")
       })
@Getter
@Setter
@NoArgsConstructor
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PagoID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ReservaID", nullable = false)
    private Reserva reserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "FormaPagoID", nullable = false)
    private FormaPago formaPago;

    @Column(name = "MontoPago", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoPago;

    @Column(name = "FechaPago", nullable = false)
    private LocalDateTime fechaPago = LocalDateTime.now();

    @Column(name = "ReferenciaTransaccion", length = 100, nullable = false)
    private String referenciaTransaccion;

    @Column(name = "EstadoPago", length = 20, nullable = false)
    private String estadoPago = "PENDIENTE";

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;

    @Version
    @Column(name = "Version")
    private Long version;
}


