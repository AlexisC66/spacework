package com.spacework.core.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "Impuestos", schema = "dbo")
@Getter
@Setter
@NoArgsConstructor
public class Impuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ImpuestoID")
    private Integer id;

    @Column(name = "Nombre", length = 50, nullable = false)
    private String nombre;

    @Column(name = "Porcentaje", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcentaje;

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;
}
