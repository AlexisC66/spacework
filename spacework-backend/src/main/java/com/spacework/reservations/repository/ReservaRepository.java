package com.spacework.reservations.repository;

import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.model.Reserva;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Integer> {

    @EntityGraph(attributePaths = {"usuario", "espacio", "estadoReserva"})
    Page<Reserva> findByUsuarioId(Integer usuarioId, Pageable pageable);

    @EntityGraph(attributePaths = {"usuario", "espacio", "estadoReserva"})
    Page<Reserva> findAll(Pageable pageable);

    // Versiones sin paginación (para uso interno, exports, reportes)
    @Query("SELECT DISTINCT r FROM Reserva r " +
           "LEFT JOIN FETCH r.usuario " +
           "LEFT JOIN FETCH r.espacio e " +
           "LEFT JOIN FETCH e.tipoEspacio " +
           "LEFT JOIN FETCH e.ubicacion " +
           "LEFT JOIN FETCH r.estadoReserva " +
           "WHERE r.usuario.id = :usuarioId")
    List<Reserva> findByUsuarioId(@Param("usuarioId") Integer usuarioId);

    @Override
    @Query("SELECT DISTINCT r FROM Reserva r " +
           "LEFT JOIN FETCH r.usuario " +
           "LEFT JOIN FETCH r.espacio e " +
           "LEFT JOIN FETCH e.tipoEspacio " +
           "LEFT JOIN FETCH e.ubicacion " +
           "LEFT JOIN FETCH r.estadoReserva")
    List<Reserva> findAll();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reserva r LEFT JOIN FETCH r.estadoReserva WHERE r.espacio = :espacio " +
           "AND r.fechaInicioReserva < :fechaFin " +
           "AND r.fechaFinReserva > :fechaInicio " +
           "AND r.estadoReserva.nombreEstado != 'CANCELADA'")
    List<Reserva> findOverlappingReservations(
            @Param("espacio") Espacio espacio,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin
    );

    default List<Reserva> findReservasOcupadas(
            Espacio espacio,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin) {
        return findOverlappingReservations(espacio, fechaInicio, fechaFin);
    }

    @Query("SELECT r FROM Reserva r LEFT JOIN FETCH r.estadoReserva " +
           "WHERE r.estadoReserva.nombreEstado = :nombreEstado AND r.fechaReserva < :fecha")
    List<Reserva> findByEstadoReservaNombreEstadoAndFechaReservaBefore(@Param("nombreEstado") String nombreEstado,
                                                                         @Param("fecha") LocalDateTime fecha);

    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.estado = true")
    long countByEstadoTrue();
}
