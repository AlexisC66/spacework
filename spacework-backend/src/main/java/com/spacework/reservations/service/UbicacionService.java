package com.spacework.reservations.service;

import com.spacework.reservations.model.Ubicacion;
import com.spacework.reservations.repository.UbicacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UbicacionService {

    private final UbicacionRepository ubicacionRepository;

    @Autowired
    public UbicacionService(UbicacionRepository ubicacionRepository) {
        this.ubicacionRepository = ubicacionRepository;
    }

    @Transactional(readOnly = true)
    public List<Ubicacion> obtenerActivas() {
        return ubicacionRepository.findByEstadoTrue();
    }

    @Transactional
    public Ubicacion crear(Ubicacion ubicacion) {
        ubicacion.setEstado(true);
        return ubicacionRepository.save(ubicacion);
    }

    @Transactional
    public Optional<Ubicacion> actualizar(Integer id, Ubicacion data) {
        return ubicacionRepository.findById(id).map(ubicacion -> {
            ubicacion.setNombreUbicacion(data.getNombreUbicacion());
            ubicacion.setDireccion(data.getDireccion());
            ubicacion.setCiudad(data.getCiudad());
            ubicacion.setPais(data.getPais());
            ubicacion.setLatitud(data.getLatitud());
            ubicacion.setLongitud(data.getLongitud());
            ubicacion.setUrlGoogleMaps(data.getUrlGoogleMaps());
            ubicacion.setEstado(data.isEstado());
            return ubicacionRepository.save(ubicacion);
        });
    }

    @Transactional
    public boolean eliminar(Integer id) {
        return ubicacionRepository.findById(id).map(ubicacion -> {
            ubicacion.setEstado(false);
            ubicacionRepository.save(ubicacion);
            return true;
        }).orElse(false);
    }
}
