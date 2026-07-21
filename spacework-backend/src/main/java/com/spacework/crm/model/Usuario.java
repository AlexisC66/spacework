package com.spacework.crm.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "Usuarios", schema = "Usuarios")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UsuarioID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TipoDocumentoID", nullable = false)
    private TipoDocumento tipoDocumento;

    @Column(name = "NumeroDocumento", length = 20, nullable = false, unique = true)
    private String numeroDocumento;

    @Column(name = "Nombre", length = 50, nullable = false)
    private String nombre;

    @Column(name = "Ap_Paterno", length = 50, nullable = false)
    private String apellidoPaterno;

    @Column(name = "Ap_Materno", length = 50, nullable = false)
    private String apellidoMaterno;

    @Column(name = "CorreoElectronico", length = 100, nullable = false, unique = true)
    private String correoElectronico;

    @Column(name = "Telefono", length = 20)
    private String telefono;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "Contrasena", length = 255, nullable = false)
    private String contrasena; // almacenará el hash de BCrypt

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RolID", nullable = false)
    private Rol rol;

    @Column(name = "FechaRegistro", nullable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @Column(name = "UltimoAcceso")
    private LocalDateTime ultimoAcceso;

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;

    @Column(name = "IntentosFallidos", nullable = false)
    private int intentosFallidos = 0;

    @Column(name = "Bloqueado", nullable = false)
    private boolean bloqueado = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EmpresaID", nullable = true)
    private Empresa empresa;
}
