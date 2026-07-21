package com.spacework.core.security;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUsuario_Id(Integer usuarioId);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.fechaExpiracion < :fecha")
    int deleteByExpiracionBefore(@Param("fecha") LocalDateTime fecha);
}
