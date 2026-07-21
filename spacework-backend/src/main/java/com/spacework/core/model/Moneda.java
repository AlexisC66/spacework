package com.spacework.core.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Monedas", schema = "dbo")
@Getter
@Setter
@NoArgsConstructor
public class Moneda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MonedaID")
    private Integer id;

    @Column(name = "Codigo", length = 3, nullable = false, unique = true)
    private String codigo;

    @Column(name = "Nombre", length = 50, nullable = false)
    private String nombre;

    @Column(name = "Simbolo", length = 5, nullable = false)
    private String simbolo;

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;
}
