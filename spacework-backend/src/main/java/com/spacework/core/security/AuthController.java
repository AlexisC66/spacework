package com.spacework.core.security;

import com.spacework.crm.model.Usuario;
import com.spacework.crm.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.modelmapper.ModelMapper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.spacework.crm.dto.request.UsuarioLoginRequestDTO;
import com.spacework.crm.dto.request.UsuarioRegistroRequestDTO;
import com.spacework.crm.dto.response.UsuarioResponseDTO;
import com.spacework.auditoria.aop.Auditable;
import org.springframework.beans.factory.annotation.Value;


@RestController
@RequestMapping("/api/auth")

public class AuthController {

    private final UsuarioService usuarioService;
    private final LoginAttemptService loginAttemptService;
    private final JwtTokenProvider jwtTokenProvider;
    private final ModelMapper modelMapper;
    private final PasswordResetService passwordResetService;

    /** URL del frontend para construir enlaces de recuperación (ej: http://localhost:5173) */
    @Value("${CORS_ALLOWED_ORIGIN:http://localhost:5173}")
    private String frontendUrl;

    @Autowired
    public AuthController(UsuarioService usuarioService, LoginAttemptService loginAttemptService,
                          JwtTokenProvider jwtTokenProvider, ModelMapper modelMapper,
                          PasswordResetService passwordResetService) {
        this.usuarioService = usuarioService;
        this.loginAttemptService = loginAttemptService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.modelMapper = modelMapper;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/registro")
    @Auditable(accion = "REGISTRO_USUARIO", entidad = "Usuarios")
    public ResponseEntity<UsuarioResponseDTO> registrar(@Valid @RequestBody UsuarioRegistroRequestDTO requestDTO,
                                                         @RequestParam(defaultValue = "DNI") String tipoDoc) {
        Usuario usuario = modelMapper.map(requestDTO, Usuario.class);
        Usuario nuevoUsuario = usuarioService.registrarUsuario(usuario, "CLIENTE", tipoDoc);
        return ResponseEntity.status(HttpStatus.CREATED).body(modelMapper.map(nuevoUsuario, UsuarioResponseDTO.class));
    }

    @PostMapping("/login")
    @Auditable(accion = "LOGIN_USUARIO", entidad = "Usuarios")
    public ResponseEntity<?> login(@Valid @RequestBody UsuarioLoginRequestDTO requestDTO, HttpServletResponse httpResponse) {
        String correo = requestDTO.getCorreoElectronico();
        String contrasena = requestDTO.getContrasena();

        if (correo == null || contrasena == null) {
            return ResponseEntity.badRequest().body("Faltan credenciales.");
        }

        // guava Cache Rate Limiting / Security block check
        if (loginAttemptService.isBlocked(correo)) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Credenciales inválidas o cuenta bloqueada.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        try {
            Optional<Usuario> usuarioOpt = usuarioService.login(correo, contrasena);
            if (usuarioOpt.isPresent()) {
                loginAttemptService.loginSucceeded(correo);
                usuarioService.resetearIntentos(correo);
                Usuario usuario = usuarioOpt.get();
                String token = jwtTokenProvider.generateToken(usuario.getCorreoElectronico(), usuario.getRol().getNombreRol());
                
                Cookie cookie = new Cookie("jwt", token);
                cookie.setHttpOnly(true);
                // cookie.setSecure(true);  // Deshabilitado para desarrollo local (HTTP)
                cookie.setAttribute("SameSite", "Lax");
                cookie.setPath("/");
                cookie.setMaxAge(10 * 60 * 60); // 10 horas
                httpResponse.addCookie(cookie);
                
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("usuario", modelMapper.map(usuario, UsuarioResponseDTO.class));
                return ResponseEntity.ok(response);
            } else {
                loginAttemptService.loginFailed(correo);
                usuarioService.incrementarIntentosFallidos(correo);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Credenciales inválidas.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Credenciales inválidas.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse httpResponse) {
        Cookie cookie = new Cookie("jwt", null);
        cookie.setHttpOnly(true);
        // cookie.setSecure(true);  // Deshabilitado para desarrollo local (HTTP)
        cookie.setAttribute("SameSite", "Lax");
        cookie.setPath("/");
        cookie.setMaxAge(0); // Expira inmediatamente
        httpResponse.addCookie(cookie);
        
        Map<String, String> response = new HashMap<>();
        response.put("mensaje", "Sesión cerrada correctamente.");
        return ResponseEntity.ok(response);
    }

    // ════════════════════════════════════════════════════════════════
    //  RECUPERACIÓN DE CONTRASEÑA
    // ════════════════════════════════════════════════════════════════

    /**
     * Paso 1: El usuario solicita restablecer su contraseña.
     * POST /api/auth/forgot-password
     * Body: { "email": "usuario@correo.com" }
     *
     * Siempre responde lo mismo por seguridad, así no se puede
     * averiguar qué correos están registrados.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El correo es requerido."));
        }

        // La URL base es la del frontend React (no la del backend)
        String baseUrl = frontendUrl;

        String mensaje = passwordResetService.solicitarRestablecimiento(email, baseUrl);

        return ResponseEntity.ok(Map.of("mensaje", mensaje));
    }

    /**
     * Paso 2: Validar que el token sea válido (el frontend lo llama
     * cuando el usuario hace clic en el enlace del correo).
     * GET /api/auth/validate-reset-token/{token}
     */
    @GetMapping("/validate-reset-token/{token}")
    public ResponseEntity<?> validateResetToken(@PathVariable String token) {
        try {
            passwordResetService.validarToken(token);
            return ResponseEntity.ok(Map.of("valido", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Paso 3: El usuario envía su nueva contraseña.
     * POST /api/auth/reset-password
     * Body: { "token": "uuid-del-token", "password": "NuevaPass123!" }
     */
    @PostMapping("/reset-password")
    @Auditable(accion = "RESET_PASSWORD", entidad = "Usuarios")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String password = body.get("password");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El token es requerido."));
        }
        if (password == null || password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener al menos 8 caracteres."));
        }

        try {
            passwordResetService.restablecerPassword(token, password);
            return ResponseEntity.ok(Map.of("mensaje", "Contraseña restablecida exitosamente. Ya puedes iniciar sesión."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
