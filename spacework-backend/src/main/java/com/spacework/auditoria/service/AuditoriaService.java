package com.spacework.auditoria.service;

import com.spacework.auditoria.model.RegistroAuditoria;
import com.spacework.auditoria.repository.RegistroAuditoriaRepository;
import com.spacework.crm.model.Usuario;
import com.spacework.crm.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Optional;

@Service
public class AuditoriaService {

    private static final Logger logger = LoggerFactory.getLogger(AuditoriaService.class);

    private final RegistroAuditoriaRepository repository;
    private final UsuarioRepository usuarioRepository;

    @Autowired
    public AuditoriaService(RegistroAuditoriaRepository repository, UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    public void registrarAuditoria(String accion, String entidad, String detalles) {
        RegistroAuditoria registro = new RegistroAuditoria();
        registro.setAccion(accion);
        registro.setEntidad(entidad);
        registro.setDetalles(detalles);

        // Extraer usuario autenticado
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            try {
                String email = auth.getPrincipal().toString();
                Optional<Usuario> userOpt = usuarioRepository.findByCorreoElectronico(email);
                userOpt.ifPresent(usuario -> registro.setUsuarioId(usuario.getId()));
            } catch(Exception e) {
                logger.warn("No se pudo registrar el usuario en auditoría: {}", e.getMessage());
            }
        }

        // Extraer IP y User Agent
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                }
                registro.setIpOrigen(ip);
                registro.setUserAgent(request.getHeader("User-Agent"));
            }
        } catch (Exception e) {
            registro.setIpOrigen("Desconocida");
            registro.setUserAgent("Desconocido");
        }

        repository.save(registro);
    }
    
    @Transactional(readOnly = true)
    public List<RegistroAuditoria> obtenerTodos() {
        return repository.findAll();
    }
}
