package com.spacework.core.security;

import com.spacework.crm.model.Usuario;
import com.spacework.crm.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UsuarioRepository usuarioRepository;

    @Autowired
    public JwtFilter(JwtTokenProvider jwtTokenProvider, UsuarioRepository usuarioRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                email = jwtTokenProvider.getEmailFromToken(token);
            }
        }
        
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                    if (jwtTokenProvider.validateToken(token)) {
                        email = jwtTokenProvider.getEmailFromToken(token);
                    }
                    break;
                }
            }
        }

        // Si hay token pero es inválido/expirado, retornar 401
        if (token != null && email == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token inválido o expirado");
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreoElectronico(email);
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                if (usuario.isEstado()) {
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + usuario.getRol().getNombreRol());
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            usuario, null, Collections.singletonList(authority));
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
