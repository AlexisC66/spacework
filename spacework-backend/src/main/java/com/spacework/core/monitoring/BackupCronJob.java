package com.spacework.core.monitoring;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BackupCronJob {

    private static final Logger log = LoggerFactory.getLogger(BackupCronJob.class);

    private final BackupService backupService;

    @Autowired
    public BackupCronJob(BackupService backupService) {
        this.backupService = backupService;
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void ejecutarBackupDiario() {
        log.info("Iniciando backup automático diario...");
        try {
            String ruta = backupService.generarBackupJson();
            log.info("Backup automático completado: {}", ruta);
        } catch (Exception e) {
            log.error("Error en backup automático: {}", e.getMessage());
        }
    }
}
