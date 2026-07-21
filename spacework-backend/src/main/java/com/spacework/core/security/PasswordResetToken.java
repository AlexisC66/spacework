package com.spacework.core.security;

import com.spacework.crm.model.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Token de un solo uso para restablecer contraseñas.
 *
 * Cuando un usuario pide "olvidé mi contraseña", se genera un token UUID
 * y se guarda acá. El usuario recibe un correo con un enlace que contiene
 * este token.
 *
 * El token:
 *  - Es único (no pueden haber dos iguales)
 *  - Expira después de 1 hora
 *  - Solo puede usarse una vez
 *  - Está asociado a un usuario específico
 *
 * Hibernate crea la tabla automáticamente (ddl-auto=update).
 */
@Entity
@Table(name = "PasswordResetToken", schema = "Seguridad")
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetToken {

    /** El token expira después de 1 hora. Tiempo suficiente para cambiar la contraseña. */
    private static final int EXPIRATION_HOURS = 1;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdToken")
    private Long idToken;

    /** El token en sí. Es un UUID aleatorio, imposible de adivinar. */
    @Column(name = "Token", nullable = false, unique = true, length = 255)
    private String token;

    /** El usuario que pidió el restablecimiento */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "UsuarioID", nullable = false)
    private Usuario usuario;

    /** Cuándo expira el token. Se calcula automáticamente: creación + 1 hora. */
    @Column(name = "FechaExpiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    /** false = aún no se ha usado, true = ya se usó (no sirve más) */
    @Column(name = "Usado", nullable = false)
    private boolean usado = false;

    /** Cuándo se creó el token. Autorellenado. */
    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    public PasswordResetToken(String token, Usuario usuario) {
        this.token = token;
        this.usuario = usuario;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaExpiracion = this.fechaCreacion.plusHours(EXPIRATION_HOURS);
        this.usado = false;
    }

    /** ¿Ya expiró? true = ya pasó la hora, no sirve */
    public boolean isExpirado() {
        return LocalDateTime.now().isAfter(fechaExpiracion);
    }
}
