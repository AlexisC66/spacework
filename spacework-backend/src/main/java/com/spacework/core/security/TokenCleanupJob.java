package com.spacework.core.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class TokenCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupJob.class);

    private final PasswordResetTokenRepository tokenRepository;

    @Autowired
    public TokenCleanupJob(PasswordResetTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void limpiarTokensExpirados() {
        LocalDateTime cutoff = LocalDateTime.now();
        int eliminados = tokenRepository.deleteByExpiracionBefore(cutoff);
        if (eliminados > 0) {
            log.info("Tokens expirados eliminados: {}", eliminados);
        }
    }
}
