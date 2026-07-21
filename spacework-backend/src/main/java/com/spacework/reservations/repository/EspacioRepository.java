package com.spacework.reservations.repository;

import com.spacework.reservations.model.Espacio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EspacioRepository extends JpaRepository<Espacio, Integer> {

    @Query("SELECT DISTINCT e FROM Espacio e " +
           "LEFT JOIN FETCH e.tipoEspacio " +
           "LEFT JOIN FETCH e.ubicacion " +
           "WHERE e.estado = true")
    List<Espacio> findByEstadoTrue();

    @Query("SELECT DISTINCT e FROM Espacio e " +
           "LEFT JOIN FETCH e.tipoEspacio " +
           "LEFT JOIN FETCH e.ubicacion " +
           "WHERE e.tipoEspacio.id = :tipoEspacioId AND e.estado = true")
    List<Espacio> findByTipoEspacioIdAndEstadoTrue(@Param("tipoEspacioId") Integer tipoEspacioId);

    @Query("SELECT e, p.monto, p.descuento FROM Espacio e LEFT JOIN Precio p ON p.espacio = e AND p.estado = true WHERE e.id = :id")
    List<Object[]> findByIdWithPrecioRaw(@Param("id") Integer id);

    default Optional<Espacio> findByIdWithPrecio(Integer id) {
        List<Object[]> result = findByIdWithPrecioRaw(id);
        if (result.isEmpty()) return Optional.empty();
        Object[] row = result.get(0);
        Espacio e = (Espacio) row[0];
        if (row[1] != null) e.setPrecio((java.math.BigDecimal) row[1]);
        if (row[2] != null) e.setDescuento((java.math.BigDecimal) row[2]);
        return Optional.of(e);
    }

    @Query("SELECT MAX(e.codigoEspacio) FROM Espacio e WHERE e.codigoEspacio LIKE :prefix%")
    String findMaxCodigoByPrefix(@Param("prefix") String prefix);
}
