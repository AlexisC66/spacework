package com.spacework.crm.repository;

import com.spacework.crm.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    @Query("SELECT u FROM Usuario u " +
           "LEFT JOIN FETCH u.rol " +
           "LEFT JOIN FETCH u.tipoDocumento " +
           "LEFT JOIN FETCH u.empresa " +
           "WHERE u.correoElectronico = :correo")
    Optional<Usuario> findByCorreoElectronico(@Param("correo") String correoElectronico);

    @Override
    @Query("SELECT DISTINCT u FROM Usuario u " +
           "LEFT JOIN FETCH u.rol " +
           "LEFT JOIN FETCH u.tipoDocumento " +
           "LEFT JOIN FETCH u.empresa")
    List<Usuario> findAll();

    boolean existsByCorreoElectronico(String correoElectronico);
    boolean existsByNumeroDocumento(String numeroDocumento);

    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.estado = true")
    long countByEstadoTrue();
}
