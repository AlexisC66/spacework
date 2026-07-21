package com.spacework.crm.service;

import com.spacework.crm.model.Empresa;
import com.spacework.crm.repository.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmpresaService {

    private final EmpresaRepository empresaRepository;

    @Autowired
    public EmpresaService(EmpresaRepository empresaRepository) {
        this.empresaRepository = empresaRepository;
    }

    @Transactional(readOnly = true)
    public List<Empresa> obtenerTodasLasEmpresas() {
        return empresaRepository.findByEstadoTrue();
    }

    @Transactional
    public Empresa crearEmpresa(Empresa empresa) {
        if (empresaRepository.findByDocumentoFiscalAndEstadoTrue(empresa.getDocumentoFiscal()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una empresa activa con ese Documento Fiscal.");
        }
        return empresaRepository.save(empresa);
    }

    @Transactional
    public Empresa actualizarEmpresa(Integer id, Empresa datosActualizados) {
        Empresa empresa = empresaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empresa no encontrada."));
        
        empresa.setRazonSocial(datosActualizados.getRazonSocial());
        empresa.setDireccion(datosActualizados.getDireccion());
        empresa.setTelefono(datosActualizados.getTelefono());
        
        return empresaRepository.save(empresa);
    }

    @Transactional
    public void eliminarEmpresa(Integer id) {
        Empresa empresa = empresaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empresa no encontrada."));
        empresa.setEstado(false);
        empresaRepository.save(empresa);
    }
}
