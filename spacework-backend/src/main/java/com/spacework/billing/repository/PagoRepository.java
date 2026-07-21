package com.spacework.billing.repository;

import com.spacework.billing.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Integer> {

    @Override
    @Query("SELECT DISTINCT p FROM Pago p " +
           "LEFT JOIN FETCH p.reserva r " +
           "LEFT JOIN FETCH r.usuario " +
           "LEFT JOIN FETCH r.espacio e " +
           "LEFT JOIN FETCH e.tipoEspacio " +
           "LEFT JOIN FETCH e.ubicacion " +
           "LEFT JOIN FETCH p.formaPago")
    List<Pago> findAll();

    @Query("SELECT p FROM Pago p LEFT JOIN FETCH p.reserva WHERE p.reserva.id = :reservaId")
    List<Pago> findByReservaId(Integer reservaId);
}
