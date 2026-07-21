package com.spacework.reservations.model;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Espacios", schema = "Espacios",
       indexes = {
           @Index(name = "idx_espacio_tipo", columnList = "TipoEspacioID"),
           @Index(name = "idx_espacio_ubicacion", columnList = "UbicacionID"),
           @Index(name = "idx_espacio_estado", columnList = "Estado")
       })
@Getter
@Setter
@NoArgsConstructor
public class Espacio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "EspacioID")
    private Integer id;

    @Column(name = "CodigoEspacio", length = 20, nullable = false, unique = true)
    private String codigoEspacio;

    @Column(name = "NombreEspacio", length = 100, nullable = false)
    private String nombreEspacio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TipoEspacioID", nullable = false)
    private TipoEspacio tipoEspacio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UbicacionID", nullable = false)
    private Ubicacion ubicacion;

    @Column(name = "Capacidad", nullable = false)
    private Integer capacidad;

    @Column(name = "CapacidadEquipos")
    private Integer capacidadEquipos;

    @Lob
    @Column(name = "Descripcion", columnDefinition = "NVARCHAR(MAX)")
    private String descripcion;

    @Column(name = "EstadoEspacio", length = 20, nullable = false)
    private String estadoEspacio = "DISPONIBLE";

    @Column(name = "HoraApertura", nullable = false)
    private LocalTime horaApertura;

    @Column(name = "HoraCierre", nullable = false)
    private LocalTime horaCierre;

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;

    @Column(name = "FotoUrl", length = 500)
    private String fotoUrl;

    @Column(name = "MetrosCuadrados")
    private Double metrosCuadrados;

    @Column(name = "PrecioPersonaExtra")
    private Double precioPersonaExtra = 0.0;


    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "Espacios_Caracteristicas",
        schema = "Espacios",
        joinColumns = @JoinColumn(name = "EspacioID"),
        inverseJoinColumns = @JoinColumn(name = "CaracteristicaID")
    )
    private Set<Caracteristica> caracteristicas = new HashSet<>();

    @OneToMany(mappedBy = "espacio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<FotoEspacio> fotos = new ArrayList<>();

    @Transient
    private java.math.BigDecimal precio;

    @Transient
    private java.math.BigDecimal descuento;

}

