package com.spacework.core.monitoring;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class BackupController {

    private static final Logger log = LoggerFactory.getLogger(BackupController.class);

    private final BackupService backupService;

    @Autowired
    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @GetMapping("/backup")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> ejecutarBackup() {
        log.info("Backup manual solicitado por administrador");
        try {
            String ruta = backupService.generarBackupJson();
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Backup generado exitosamente");
            response.put("ruta", ruta);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al generar backup manual: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Error al generar backup: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
