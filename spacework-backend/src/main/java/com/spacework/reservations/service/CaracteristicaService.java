package com.spacework.reservations.service;

import com.spacework.reservations.model.Caracteristica;
import com.spacework.reservations.repository.CaracteristicaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CaracteristicaService {

    private final CaracteristicaRepository caracteristicaRepository;

    @Autowired
    public CaracteristicaService(CaracteristicaRepository caracteristicaRepository) {
        this.caracteristicaRepository = caracteristicaRepository;
    }

    @Transactional(readOnly = true)
    public List<Caracteristica> obtenerActivas() {
        return caracteristicaRepository.findByEstadoTrue();
    }

    @Transactional
    public Caracteristica crear(Caracteristica caracteristica) {
        caracteristica.setEstado(true);
        return caracteristicaRepository.save(caracteristica);
    }

    @Transactional
    public Optional<Caracteristica> actualizar(Integer id, Caracteristica data) {
        return caracteristicaRepository.findById(id).map(caracteristica -> {
            caracteristica.setNombreCaracteristica(data.getNombreCaracteristica());
            caracteristica.setDescripcion(data.getDescripcion());
            caracteristica.setTipo(data.getTipo());
            caracteristica.setEstado(data.isEstado());
            return caracteristicaRepository.save(caracteristica);
        });
    }

    @Transactional
    public boolean eliminar(Integer id) {
        return caracteristicaRepository.findById(id).map(caracteristica -> {
            caracteristica.setEstado(false);
            caracteristicaRepository.save(caracteristica);
            return true;
        }).orElse(false);
    }
}
