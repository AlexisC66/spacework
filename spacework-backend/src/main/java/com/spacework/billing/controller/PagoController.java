package com.spacework.billing.controller;

import com.spacework.billing.model.Pago;
import com.spacework.billing.service.PagoService;
import com.spacework.auditoria.aop.Auditable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;

    @Autowired
    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<Pago>> listarTodos(
            @org.springframework.data.web.PageableDefault(size = 50, sort = "id") org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(pagoService.obtenerTodos(pageable));
    }

    @PostMapping("/procesar")
    @PreAuthorize("isAuthenticated()")
    @Auditable(accion = "PROCESAR_PAGO", entidad = "Pagos")
    public ResponseEntity<?> procesarPago(@RequestBody Map<String, Object> body) {
        Object reservaIdObj = body.get("reservaId");
        Integer reservaId = reservaIdObj != null ? ((Number) reservaIdObj).intValue() : null;
        Object formaPagoIdObj = body.get("formaPagoId");
        Integer formaPagoId = formaPagoIdObj != null ? ((Number) formaPagoIdObj).intValue() : null;
        Object montoValObj = body.get("montoPago");
        Double montoVal = montoValObj != null ? ((Number) montoValObj).doubleValue() : null;
        String referencia = (String) body.get("referenciaTransaccion");

        if (reservaId == null || formaPagoId == null || montoVal == null) {
            throw new IllegalArgumentException("Faltan parámetros obligatorios de pago.");
        }

        BigDecimal montoPago = BigDecimal.valueOf(montoVal);
        Pago pago = pagoService.procesarPago(reservaId, formaPagoId, montoPago, referencia);
        return ResponseEntity.status(HttpStatus.CREATED).body(pago);
    }

    @PutMapping("/{id}/aprobar")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Auditable(accion = "APROBAR_PAGO", entidad = "Pagos")
    public ResponseEntity<?> aprobarPago(@PathVariable Integer id) {
        Pago pago = pagoService.aprobarPago(id);
        return ResponseEntity.ok(pago);
    }
}
