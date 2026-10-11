package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.UnidadResponse;
import com.cruzdelcentro.backend.model.Unidad;
import com.cruzdelcentro.backend.repository.UnidadRepository;
import com.cruzdelcentro.backend.dto.UnidadDetalleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.cruzdelcentro.backend.dto.UnidadUpdateRequest;
import com.cruzdelcentro.backend.model.EstadoUnidad;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;
import com.cruzdelcentro.backend.model.EstadoUnidad;
import com.cruzdelcentro.backend.model.Usuario;
import com.cruzdelcentro.backend.repository.UsuarioRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UnidadService {

    private final UnidadRepository unidadRepository;
    private final UsuarioRepository usuarioRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public UnidadService(
        UnidadRepository unidadRepository,
        UsuarioRepository usuarioRepository
    ) {
        this.unidadRepository = unidadRepository;
        this.usuarioRepository = usuarioRepository;
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

    @Transactional
    public UnidadDetalleResponse actualizar(
        Long id,
        UnidadUpdateRequest request,
        String correoUsuario
    ) {

        // Buscar usuario autenticado
        Usuario usuario = usuarioRepository
            .findByCorreoIgnoreCase(correoUsuario)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuario no encontrado"
                )
            );

        if (!usuario.isActivo()) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Usuario inactivo"
            );
        }

        // Buscar unidad
        Unidad unidad = unidadRepository.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Unidad no encontrada"
                )
            );

        // Comprobar cambio de estado
        EstadoUnidad estadoAnterior =
            unidad.getEstadoOperativo();

        boolean cambioEstado =
            request.estado() != null &&
            request.estado() != estadoAnterior;

        String motivo = request.motivoCambio() == null
            ? ""
            : request.motivoCambio().trim();

        // Validar motivo
        if (cambioEstado && motivo.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debe ingresar el motivo del cambio de estado"
            );
        }

        // Configurar usuario en PostgreSQL
        entityManager.createNativeQuery(
            "SELECT set_config('app.usuario_id', :usuarioId, true)"
        )
        .setParameter("usuarioId", usuario.getId().toString())
        .getSingleResult();

        // Configurar motivo en PostgreSQL
        entityManager.createNativeQuery(
            "SELECT set_config('app.motivo', :motivo, true)"
        )
        .setParameter("motivo", cambioEstado ? motivo : "")
        .getSingleResult();

        // Actualizar datos de la unidad
        if (request.placa() != null &&
            !request.placa().isBlank()) {
            unidad.setPlaca(
                request.placa().trim().toUpperCase()
            );
        }

        if (request.tipoVehiculo() != null) {
            unidad.setTipoVehiculo(
                request.tipoVehiculo().trim()
            );
        }

        if (request.anioFabricacion() != null) {
            unidad.setAnioFabricacion(
                request.anioFabricacion()
            );
        }

        if (request.estado() != null) {
            unidad.setEstadoOperativo(request.estado());
        }

        if (request.activo() != null) {
            unidad.setActivo(request.activo());
        }

        if (request.observaciones() != null) {
            unidad.setObservaciones(
                request.observaciones()
            );
        }

        // Guardar y ejecutar los triggers de PostgreSQL
        Unidad guardada = unidadRepository.saveAndFlush(unidad);

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


    private void configurarContextoHistorial(
        Long usuarioId,
        String motivo
    ) {
        entityManager.createNativeQuery(
            "SELECT set_config('app.usuario_id', :usuarioId, true)"
        )
        .setParameter("usuarioId", usuarioId.toString())
        .getSingleResult();

        entityManager.createNativeQuery(
            "SELECT set_config('app.motivo', :motivo, true)"
        )
        .setParameter("motivo", motivo)
        .getSingleResult();
    }
}