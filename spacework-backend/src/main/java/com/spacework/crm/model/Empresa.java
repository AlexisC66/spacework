package com.spacework.crm.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "Empresas", schema = "Usuarios")
@Getter
@Setter
@NoArgsConstructor
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "EmpresaID")
    private Integer id;

    @Column(name = "DocumentoFiscal", length = 20, nullable = false, unique = true)
    private String documentoFiscal; // Ej: RUC

    @Column(name = "RazonSocial", length = 150, nullable = false)
    private String razonSocial;

    @Column(name = "Direccion", length = 250)
    private String direccion;

    @Column(name = "Telefono", length = 20)
    private String telefono;

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;

    @Column(name = "EmailContacto", length = 100)
    private String emailContacto;

    @Column(name = "NombreContactoPrincipal", length = 100)
    private String nombreContactoPrincipal;

    @Column(name = "SectorIndustria", length = 50)
    private String sectorIndustria;

    @Column(name = "PorcentajeDescuento", precision = 5, scale = 2)
    private BigDecimal porcentajeDescuento = BigDecimal.ZERO;
}
