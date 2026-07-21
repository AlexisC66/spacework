package com.spacework.billing.service;

import com.spacework.billing.model.DetalleFactura;
import com.spacework.billing.model.Factura;
import com.spacework.billing.repository.DetalleFacturaRepository;
import com.spacework.billing.repository.FacturaRepository;
import com.spacework.core.model.Impuesto;
import com.spacework.core.repository.ImpuestoRepository;
import com.spacework.reservations.model.Reserva;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final DetalleFacturaRepository detalleFacturaRepository;
    private final ImpuestoRepository impuestoRepository;

    @Autowired
    public FacturaService(FacturaRepository facturaRepository, 
                          DetalleFacturaRepository detalleFacturaRepository,
                          ImpuestoRepository impuestoRepository) {
        this.facturaRepository = facturaRepository;
        this.detalleFacturaRepository = detalleFacturaRepository;
        this.impuestoRepository = impuestoRepository;
    }

    @Transactional
    public Factura generarFacturaDeReserva(Reserva reserva) {
        // Verificar si ya existe factura BASE para evitar duplicados
        if (!facturaRepository.findByReservaIdAndEstadoTrue(reserva.getId()).isEmpty()) {
            return facturaRepository.findByReservaIdAndEstadoTrue(reserva.getId()).get(0);
        }

        return crearFactura(reserva, reserva.getMontoTotal(),
                "Alquiler de Espacio: " + reserva.getEspacio().getNombreEspacio());
    }

    @Transactional
    public Factura generarFacturaAdicional(Reserva reserva, BigDecimal monto, String descripcionItem) {
        return crearFactura(reserva, monto, descripcionItem);
    }

    /**
     * Método privado que centraliza la lógica común de creación de facturas.
     * Evita la duplicación de ~70% del código entre generarFacturaDeReserva y generarFacturaAdicional.
     */
    private Factura crearFactura(Reserva reserva, BigDecimal monto, String descripcionItem) {
        Impuesto igv = impuestoRepository.findByNombreAndEstadoTrue("IGV")
                .orElseThrow(() -> new IllegalStateException("Impuesto IGV no configurado"));

        BigDecimal porcentajeImpuesto = igv.getPorcentaje().divide(new BigDecimal("100"));
        BigDecimal factorDivision = BigDecimal.ONE.add(porcentajeImpuesto);

        BigDecimal totalGeneral = monto;
        BigDecimal subTotal = totalGeneral.divide(factorDivision, 2, RoundingMode.HALF_UP);
        BigDecimal totalImpuestos = totalGeneral.subtract(subTotal);

        boolean esFactura = reserva.getUsuario().getEmpresa() != null;
        String nuevoNumero = generarSiguienteNumero(esFactura);

        Factura factura = new Factura();
        factura.setNumeroFactura(nuevoNumero);
        factura.setReserva(reserva);
        factura.setUsuario(reserva.getUsuario());
        factura.setEmpresa(esFactura ? reserva.getUsuario().getEmpresa() : null);
        factura.setFechaEmision(LocalDateTime.now());
        factura.setSubTotal(subTotal);
        factura.setTotalImpuestos(totalImpuestos);
        factura.setTotalGeneral(totalGeneral);
        factura.setEstadoFactura("EMITIDA");

        Factura guardada = facturaRepository.save(factura);

        DetalleFactura detalle = new DetalleFactura();
        detalle.setFactura(guardada);
        detalle.setDescripcionItem(descripcionItem);
        detalle.setCantidad(1);
        detalle.setPrecioUnitario(subTotal);
        detalle.setSubTotalItem(subTotal);

        detalleFacturaRepository.save(detalle);

        return guardada;
    }

    private String generarSiguienteNumero(boolean esFactura) {
        String serie = esFactura ? "F001" : "B001";
        java.util.Optional<Factura> ultima = facturaRepository.findTopByNumeroFacturaStartingWith(serie + "-");

        int siguienteCorrelativo = 1;
        if (ultima.isPresent() && ultima.get().getNumeroFactura() != null) {
            String[] partes = ultima.get().getNumeroFactura().split("-");
            if (partes.length == 2) {
                try {
                    siguienteCorrelativo = Integer.parseInt(partes[1]) + 1;
                } catch (NumberFormatException e) {
                    siguienteCorrelativo = 1;
                }
            }
        }
        return serie + "-" + String.format("%08d", siguienteCorrelativo);
    }

    @Transactional(readOnly = true)
    public List<Factura> obtenerTodasLasFacturas() {
        return facturaRepository.findByEstadoTrue();
    }
}
