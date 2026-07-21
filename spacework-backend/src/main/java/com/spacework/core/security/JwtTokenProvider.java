package com.spacework.core.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long validityInMilliseconds;

    public JwtTokenProvider(@Value("${jwt.expiration:86400000}") long validityInMilliseconds) {
        this.validityInMilliseconds = validityInMilliseconds;
        String secretString = System.getenv("JWT_SECRET");
        if (secretString == null || secretString.trim().isEmpty()) {
            throw new IllegalStateException("FATAL: JWT_SECRET no está configurada. Usa run.ps1 o set JWT_SECRET=...");
        }
        if (secretString.length() < 32) {
            throw new IllegalStateException("FATAL: JWT_SECRET debe tener al menos 32 caracteres para HS256.");
        }
        this.key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String email, String role) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .claims()
                    .subject(email)
                    .add("role", role)
                    .issuedAt(now)
                    .expiration(validity)
                    .and()
                .signWith(key)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
