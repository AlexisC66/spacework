package com.spacework.billing.repository;

import com.spacework.billing.model.Factura;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Integer> {
    List<Factura> findByEstadoTrue();
    List<Factura> findByReservaIdAndEstadoTrue(Integer reservaId);

    @Query("SELECT f FROM Factura f WHERE f.numeroFactura LIKE CONCAT(:prefix, '%') ORDER BY f.numeroFactura DESC LIMIT 1")
    java.util.Optional<Factura> findTopByNumeroFacturaStartingWith(@Param("prefix") String prefix);
}
