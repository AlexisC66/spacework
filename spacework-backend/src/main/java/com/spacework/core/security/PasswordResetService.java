package com.spacework.core.security;

import com.spacework.crm.model.Usuario;
import com.spacework.crm.repository.UsuarioRepository;
import com.spacework.reservations.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Servicio para restablecer contraseñas olvidadas.
 *
 * El flujo es:
 *  1. El usuario pone su correo en "¿Olvidaste tu contraseña?"
 *  2. Le enviamos un correo con un enlace único (token UUID)
 *  3. El usuario hace clic en el enlace (desde el frontend React)
 *  4. El frontend valida el token y muestra el formulario de nueva contraseña
 *  5. El usuario envía la nueva contraseña
 *  6. Se guarda la nueva contraseña (encriptada) y se marca el token como usado
 *
 * El token expira después de 1 hora.
 * Siempre respondemos con el mismo mensaje genérico por seguridad,
 * para no revelar qué correos existen en la base de datos.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Autowired
    public PasswordResetService(UsuarioRepository usuarioRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * Paso 1: Alguien solicitó restablecer su contraseña.
     * Buscamos el usuario por correo, generamos un token, y enviamos el correo.
     *
     * Si el correo no existe, está inactivo o bloqueado, respondemos igual
     * para no dar pistas sobre qué correos están registrados.
     */
    @Transactional
    public String solicitarRestablecimiento(String email, String baseUrl) {
        Usuario usuario = usuarioRepository.findByCorreoElectronico(email).orElse(null);

        // Siempre decimos lo mismo, exista o no el correo
        if (usuario == null || !usuario.isEstado() || usuario.isBloqueado()) {
            log.info("Solicitud de reset para '{}': correo no encontrado, inactivo o bloqueado", email);
            return "Si el correo está registrado, recibirás un enlace de recuperación.";
        }

        // Limpiamos tokens anteriores de este usuario (por si acaso)
        tokenRepository.deleteByUsuario_Id(usuario.getId());

        // Generamos un token UUID y lo guardamos
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, usuario);
        tokenRepository.save(resetToken);

        // Construimos el enlace para el frontend React
        String link = baseUrl + "/reset-password/" + token;

        // Enviamos el correo con HTML bonito
        String html = plantillaRecuperacion(usuario.getNombre(), link);
        String textoPlano = "Para restablecer tu contraseña, haz clic en este enlace: " + link;

        emailService.enviarHtml(usuario.getCorreoElectronico(),
            "SpaceWork - Recuperación de contraseña", html, textoPlano);

        log.info("Token de reset generado para '{}'", email);
        return "Si el correo está registrado, recibirás un enlace de recuperación.";
    }

    /**
     * Paso 2 (frontend): Validar que el token sea válido.
     * El frontend React llama a este endpoint para verificar
     * si el token existe, no está usado ni expirado.
     */
    @Transactional(readOnly = true)
    public PasswordResetToken validarToken(String token) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("El enlace de recuperación no es válido."));

        if (resetToken.isUsado()) {
            throw new IllegalArgumentException("Este enlace ya ha sido utilizado.");
        }
        if (resetToken.isExpirado()) {
            throw new IllegalArgumentException("El enlace ha expirado. Solicita uno nuevo.");
        }
        return resetToken;
    }

    /**
     * Paso 3: El usuario envió su nueva contraseña.
     * Validamos el token, actualizamos la contraseña y desbloqueamos la cuenta.
     */
    @Transactional
    public void restablecerPassword(String token, String nuevaPassword) {
        PasswordResetToken resetToken = validarToken(token);

        Usuario usuario = resetToken.getUsuario();
        usuario.setContrasena(passwordEncoder.encode(nuevaPassword));
        // Al restablecer la contraseña, desbloqueamos la cuenta y reseteamos intentos
        usuario.setBloqueado(false);
        usuario.setIntentosFallidos(0);
        usuarioRepository.save(usuario);

        // Marcamos el token como usado
        resetToken.setUsado(true);
        tokenRepository.save(resetToken);

        log.info("Contraseña restablecida exitosamente para el usuario '{}'", usuario.getCorreoElectronico());
    }

    /**
     * Plantilla HTML para el correo de recuperación de contraseña.
     * Diseño responsivo, se ve bien en cualquier cliente de correo.
     */
    private String plantillaRecuperacion(String nombre, String link) {
        return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'></head>"
            + "<body style='margin:0;padding:0;background:#f1f5f9;font-family:\"Segoe UI\",Arial,sans-serif;'>"
            + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f1f5f9;padding:32px 0;'>"
            + "<tr><td align='center'>"
            + "<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>"
            + "<tr><td style='background:linear-gradient(135deg,#6366f1,#06b6d4);padding:36px 40px;"
            + "border-radius:12px 12px 0 0;text-align:center;'>"
            + "<p style='margin:0 0 6px;color:#c7d2fe;font-size:12px;letter-spacing:2px;"
            + "text-transform:uppercase;font-weight:600;'>SpaceWork</p>"
            + "<h1 style='margin:0 0 4px;color:#fff;font-size:26px;font-weight:700;'>Coworking & Espacios</h1>"
            + "<div style='display:inline-block;background:rgba(255,255,255,0.15);"
            + "border:2px solid rgba(255,255,255,0.4);border-radius:50px;padding:8px 22px;margin-top:16px;'>"
            + "<span style='color:#fff;font-size:15px;font-weight:600;'>Recuperacion de Contrasena</span>"
            + "</div></td></tr>"
            + "<tr><td style='background:#fff;padding:32px 40px;'>"
            + "<p style='margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;'>"
            + "Hola <span style='color:#6366f1;'>" + nombre + "</span>,</p>"
            + "<p style='margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;'>"
            + "Hemos recibido una solicitud para restablecer tu contraseña. "
            + "Haz clic en el siguiente boton para crear una nueva contraseña:</p>"
            + "<table width='100%' cellpadding='0' cellspacing='0'>"
            + "<tr><td align='center' style='padding:0 0 24px;'>"
            + "<a href='" + link + "' style='display:inline-block;background:#6366f1;color:#fff;"
            + "text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;'>"
            + "Restablecer Contrasena</a></td></tr></table>"
            + "<p style='margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.6;'>"
            + "Este enlace expirara en <strong>1 hora</strong>. Si no solicitaste este cambio, "
            + "ignora este mensaje.</p>"
            + "</td></tr>"
            + "<tr><td style='background:#0f172a;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;'>"
            + "<p style='margin:0 0 4px;color:#fff;font-size:15px;font-weight:700;'>SpaceWork</p>"
            + "<p style='margin:0;color:#475569;font-size:11px;'>"
            + "© 2026 SpaceWork — Todos los derechos reservados.</p>"
            + "</td></tr></table></td></tr></table></body></html>";
    }
}
