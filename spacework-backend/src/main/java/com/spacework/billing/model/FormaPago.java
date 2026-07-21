package com.spacework.billing.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "FormasPago", schema = "Reservas")
@Getter
@Setter
@NoArgsConstructor
public class FormaPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FormaPagoID")
    private Integer id;

    @Column(name = "NombreForma", length = 50, nullable = false, unique = true)
    private String nombreForma;

    @Column(name = "Descripcion", length = 200)
    private String descripcion;

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;
}

