package com.spacework.reservations.model;

import jakarta.persistence.*;
import com.spacework.crm.model.Usuario;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Resenas", schema = "Reservas",
       indexes = {
           @Index(name = "idx_resena_espacio", columnList = "EspacioID"),
           @Index(name = "idx_resena_reserva", columnList = "ReservaID"),
           @Index(name = "idx_resena_fecha", columnList = "FechaResena")
       })
@Getter
@Setter
@NoArgsConstructor
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ResenaID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ReservaID", nullable = false)
    private Reserva reserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UsuarioID", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EspacioID", nullable = false)
    private Espacio espacio;

    @Column(name = "Calificacion", nullable = false)
    private Integer calificacion; // 1 to 5

    @Lob
    @Column(name = "Comentario", columnDefinition = "NVARCHAR(MAX)")
    private String comentario;

    @Column(name = "FechaResena", nullable = false)
    private LocalDateTime fechaResena = LocalDateTime.now();

    @Column(name = "Estado", nullable = false)
    private boolean estado = true;

}
