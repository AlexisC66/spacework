package com.spacework.core.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Autowired
    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
                .contentTypeOptions(c -> {})
                .frameOptions(frame -> frame.sameOrigin())
                .xssProtection(xss -> xss
                    .headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
            )
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/espacios/**", "/api/espacios", "/api/ubicaciones", "/api/resenas/**", "/api/caracteristicas", "/api/servicios-adicionales").permitAll()
                .requestMatchers("/api/espacios/**", "/api/espacios").hasAnyRole("SUPERADMIN", "ADMIN")
                .requestMatchers("/api/reservas/**", "/api/reservas", "/api/pagos/**", "/api/pagos", "/api/reportes/**", "/api/reportes", "/api/usuarios/**", "/api/usuarios").authenticated()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasAnyRole("ADMIN", "SUPERADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        String allowedOrigin = System.getenv("CORS_ALLOWED_ORIGIN");
        if (allowedOrigin != null && allowedOrigin.contains(",")) {
            List<String> origins = Arrays.stream(allowedOrigin.split(","))
                .map(String::trim).collect(Collectors.toList());
            configuration.setAllowedOriginPatterns(origins);
            log.info("CORS orígenes permitidos (multi): {}", origins);
        } else {
            configuration.setAllowedOriginPatterns(Arrays.asList(allowedOrigin != null ? allowedOrigin : "http://localhost:*"));
            log.info("CORS orígenes permitidos: {}", allowedOrigin != null ? allowedOrigin : "http://localhost:*");
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        String strength = System.getenv("BCRYPT_STRENGTH");
        int bcryptStrength = strength != null ? Integer.parseInt(strength) : 12;
        return new BCryptPasswordEncoder(bcryptStrength);
    }
}
