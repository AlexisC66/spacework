package com.spacework.crm.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "TiposDocumento", schema = "Usuarios")
@Getter
@Setter
@NoArgsConstructor
public class TipoDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TipoDocumentoID")
    private Integer id;

    @Column(name = "NombreTipo", length = 50, nullable = false, unique = true)
    private String nombreTipo;

    @Column(name = "Abreviatura", length = 10, nullable = false, unique = true)
    private String abreviatura;

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;
}

