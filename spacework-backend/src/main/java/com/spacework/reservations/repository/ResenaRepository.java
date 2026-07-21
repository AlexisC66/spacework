package com.spacework.reservations.repository;

import com.spacework.reservations.model.Resena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResenaRepository extends JpaRepository<Resena, Integer> {

    @Query("SELECT DISTINCT r FROM Resena r " +
           "LEFT JOIN FETCH r.usuario " +
           "LEFT JOIN FETCH r.espacio " +
           "WHERE r.espacio.id = :espacioId AND r.estado = true " +
           "ORDER BY r.fechaResena DESC")
    List<Resena> findByEspacioIdAndEstadoTrueOrderByFechaResenaDesc(@Param("espacioId") Integer espacioId);

    @Query("SELECT r FROM Resena r LEFT JOIN FETCH r.reserva WHERE r.reserva.id = :reservaId")
    List<Resena> findByReservaId(@Param("reservaId") Integer reservaId);

    List<Resena> findByUsuarioIdOrderByFechaResenaDesc(Integer usuarioId);

    @Query("SELECT DISTINCT r FROM Resena r " +
           "LEFT JOIN FETCH r.usuario " +
           "LEFT JOIN FETCH r.espacio " +
           "ORDER BY r.fechaResena DESC")
    List<Resena> findAllByOrderByFechaResenaDesc();

    @Query("SELECT AVG(r.calificacion) FROM Resena r WHERE r.espacio.id = :espacioId AND r.estado = true")
    Double obtenerPromedioPorEspacio(@Param("espacioId") Integer espacioId);

    @Query("SELECT COUNT(r) FROM Resena r WHERE r.reserva.id = :reservaId")
    long countByReservaId(@Param("reservaId") Integer reservaId);
}
