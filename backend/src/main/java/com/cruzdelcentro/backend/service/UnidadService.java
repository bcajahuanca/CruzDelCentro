package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.UnidadResponse;
import com.cruzdelcentro.backend.model.Unidad;
import com.cruzdelcentro.backend.repository.UnidadRepository;
import com.cruzdelcentro.backend.dto.UnidadDetalleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.cruzdelcentro.backend.dto.UnidadUpdateRequest;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UnidadService {

    private final UnidadRepository unidadRepository;

    public UnidadService(UnidadRepository unidadRepository) {
        this.unidadRepository = unidadRepository;
    }

    public List<UnidadResponse> listarUnidades() {

        return unidadRepository.findByActivoTrue()
                .stream()
                .map(this::convertir)
                .toList();
    }

    private UnidadResponse convertir(Unidad unidad) {

        return new UnidadResponse(
                unidad.getId(),
                unidad.getCodigo(),
                unidad.getPlaca(),
                unidad.getModelo().getMarca().getNombre(),
                unidad.getModelo().getNombre(),
                unidad.getTipoVehiculo(),
                unidad.getAnioFabricacion(),
                unidad.getEstadoOperativo().name()
        );
    }

    public UnidadDetalleResponse obtenerPorId(Long id) {
        Unidad unidad = unidadRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Unidad no encontrada"
                        )

                );

        return new UnidadDetalleResponse(
            unidad.getId(),
            unidad.getCodigo(),
            unidad.getPlaca(),
            unidad.getModelo().getMarca().getNombre(),
            unidad.getModelo().getNombre(),
            unidad.getTipoVehiculo(),
            unidad.getAnioFabricacion(),
            unidad.getEstadoOperativo().name(),
            unidad.isActivo(),
            unidad.getObservaciones()
        );
    }

    public UnidadDetalleResponse actualizar(
        Long id,
        UnidadUpdateRequest request
    ) {
        Unidad unidad = unidadRepository.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Unidad no encontrada"
                )
            );
        
        if (request.placa() != null && !request.placa().isBlank()) {
            unidad.setPlaca(request.placa().trim().toUpperCase());
        }

        if (request.tipoVehiculo() != null) {
            unidad.setTipoVehiculo(request.tipoVehiculo().trim());
        }

        if (request.anioFabricacion() != null) {
            unidad.setAnioFabricacion(request.anioFabricacion());
        }

        if (request.estado() != null) {
            unidad.setEstadoOperativo(request.estado());
        }

        if (request.activo() != null) {
            unidad.setActivo(request.activo());
        }

        if (request.observaciones() != null) {
            unidad.setObservaciones(request.observaciones());
        }

        Unidad guardada = unidadRepository.save(unidad);

        return new UnidadDetalleResponse(
                guardada.getId(),
                guardada.getCodigo(),
                guardada.getPlaca(),
                guardada.getModelo().getMarca().getNombre(),
                guardada.getModelo().getNombre(),
                guardada.getTipoVehiculo(),
                guardada.getAnioFabricacion(),
                guardada.getEstadoOperativo().name(),
                guardada.isActivo(),
                guardada.getObservaciones()
        );
    }
}