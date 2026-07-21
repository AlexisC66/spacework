package com.spacework.core.monitoring;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.spacework.billing.model.Factura;
import com.spacework.billing.model.Pago;
import com.spacework.billing.repository.FacturaRepository;
import com.spacework.billing.repository.PagoRepository;
import com.spacework.crm.model.Usuario;
import com.spacework.crm.repository.UsuarioRepository;
import com.spacework.reservations.model.Reserva;
import com.spacework.reservations.repository.ReservaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class BackupService {

    private static final Logger log = LoggerFactory.getLogger(BackupService.class);

    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final FacturaRepository facturaRepository;
    private final PagoRepository pagoRepository;
    private final ObjectMapper objectMapper;

    @Value("${backup.directory:./backups}")
    private String backupDir;

    @Autowired
    public BackupService(ReservaRepository reservaRepository,
                         UsuarioRepository usuarioRepository,
                         FacturaRepository facturaRepository,
                         PagoRepository pagoRepository) {
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.facturaRepository = facturaRepository;
        this.pagoRepository = pagoRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    }

    @Transactional(readOnly = true)
    public String generarBackupJson() {
        try {
            Path dir = Paths.get(backupDir);
            Files.createDirectories(dir);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmmss"));
            String filename = "spacework-backup-" + timestamp + ".json";
            Path filePath = dir.resolve(filename);

            Map<String, Object> backup = new LinkedHashMap<>();
            backup.put("fechaBackup", LocalDateTime.now().toString());
            backup.put("version", "1.0");
            backup.put("reservas", reservaRepository.findAll());
            backup.put("usuarios", usuarioRepository.findAll());
            backup.put("facturas", facturaRepository.findByEstadoTrue());
            backup.put("pagos", pagoRepository.findAll());

            objectMapper.writerWithDefaultPrettyPrinter().writeValue(filePath.toFile(), backup);

            long size = Files.size(filePath);
            log.info("Backup generado: {} ({} bytes)", filename, size);

            eliminarBackupsAntiguos(dir);

            return filePath.toAbsolutePath().toString();
        } catch (IOException e) {
            log.error("Error al generar backup: {}", e.getMessage());
            throw new RuntimeException("Error al generar backup: " + e.getMessage());
        }
    }

    private void eliminarBackupsAntiguos(Path dir) throws IOException {
        File[] backups = dir.toFile().listFiles((d, name) -> name.startsWith("spacework-backup-") && name.endsWith(".json"));
        if (backups == null) return;

        LocalDateTime limite = LocalDateTime.now().minusDays(30);
        for (File f : backups) {
            if (f.lastModified() < java.sql.Timestamp.valueOf(limite).getTime()) {
                if (f.delete()) {
                    log.info("Backup antiguo eliminado: {}", f.getName());
                }
            }
        }
    }
}
