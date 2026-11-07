package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.UnidadResponse;
import com.cruzdelcentro.backend.model.Unidad;
import com.cruzdelcentro.backend.repository.UnidadRepository;
import com.cruzdelcentro.backend.dto.CrearUnidadRequest;
import com.cruzdelcentro.backend.dto.MarcaResponse;
import com.cruzdelcentro.backend.dto.ModeloVehiculoResponse;
import com.cruzdelcentro.backend.dto.UnidadDetalleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.cruzdelcentro.backend.dto.UnidadUpdateRequest;
import com.cruzdelcentro.backend.model.EstadoUnidad;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
// import com.cruzdelcentro.backend.model.EstadoUnidad;
import com.cruzdelcentro.backend.model.Usuario;
import com.cruzdelcentro.backend.repository.UsuarioRepository;

// import jakarta.persistence.EntityManager;
// import jakarta.persistence.PersistenceContext;
// import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UnidadService {

    private final UnidadRepository unidadRepository;
    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    public UnidadService(
            UnidadRepository unidadRepository,
            UsuarioRepository usuarioRepository,
            JdbcTemplate jdbcTemplate) {
        this.unidadRepository = unidadRepository;
        this.usuarioRepository = usuarioRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<UnidadResponse> listarUnidades() {

        return unidadRepository
                .findByActivoTrueOrderByCodigoAsc()
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
                unidad.getEstadoOperativo().name(),
                unidad.getKilometrajeActual());
    }

    public UnidadDetalleResponse obtenerPorId(Long id) {
        Unidad unidad = unidadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Unidad no encontrada")

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
                unidad.getObservaciones());
    }

    @Transactional
    public UnidadDetalleResponse actualizar(
            Long id,
            UnidadUpdateRequest request,
            String correoUsuario) {

        Usuario usuario = usuarioRepository
                .findByCorreoIgnoreCase(correoUsuario)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario no encontrado"));

        if (!usuario.isActivo()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Usuario inactivo");
        }

        Unidad unidad = unidadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Unidad no encontrada"));

        // Comprobar cambio de estado
        EstadoUnidad estadoAnterior = unidad.getEstadoOperativo();

        boolean cambioEstado = request.estado() != null &&
                request.estado() != estadoAnterior;

        String motivo = request.motivoCambio() == null
                ? ""
                : request.motivoCambio().trim();

        if (cambioEstado && motivo.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe ingresar el motivo del cambio de estado");
        }

        entityManager.createNativeQuery(
                "SELECT set_config('app.usuario_id', :usuarioId, true)")
                .setParameter("usuarioId", usuario.getId().toString())
                .getSingleResult();

        entityManager.createNativeQuery(
                "SELECT set_config('app.motivo', :motivo, true)")
                .setParameter("motivo", cambioEstado ? motivo : "")
                .getSingleResult();

        if (request.placa() != null &&
                !request.placa().isBlank()) {
            unidad.setPlaca(
                    request.placa().trim().toUpperCase());
        }

        if (request.tipoVehiculo() != null) {
            unidad.setTipoVehiculo(
                    request.tipoVehiculo().trim());
        }

        if (request.anioFabricacion() != null) {
            unidad.setAnioFabricacion(
                    request.anioFabricacion());
        }

        if (request.estado() != null) {
            unidad.setEstadoOperativo(request.estado());
        }

        if (request.activo() != null) {
            unidad.setActivo(request.activo());
        }

        if (request.observaciones() != null) {
            unidad.setObservaciones(
                    request.observaciones());
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
                guardada.getObservaciones());
    }

    public List<MarcaResponse> listarMarcas() {

        return jdbcTemplate.query(
                """
                        SELECT id, nombre
                        FROM marca
                        ORDER BY nombre
                        """,
                (rs, rowNum) -> new MarcaResponse(
                        rs.getLong("id"),
                        rs.getString("nombre")));
    }

    public List<ModeloVehiculoResponse> listarModelos(
            Long marcaId) {

        return jdbcTemplate.query(
                """
                        SELECT
                            id,
                            marca_id,
                            nombre
                        FROM modelo_vehiculo
                        WHERE marca_id = ?
                        ORDER BY nombre
                        """,
                (rs, rowNum) -> new ModeloVehiculoResponse(
                        rs.getLong("id"),
                        rs.getLong("marca_id"),
                        rs.getString("nombre")),
                marcaId);
    }

    @Transactional
    public UnidadDetalleResponse crearUnidad(
            CrearUnidadRequest request,
            String correoUsuario) {

        if (request.placa() == null ||
                request.placa().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La placa es obligatoria");
        }

        if (request.modeloId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El modelo es obligatorio");
        }

        if (request.codigo() == null ||
                request.codigo().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El código PAD es obligatorio");
        }

        Boolean modeloExiste = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM modelo_vehiculo
                            WHERE id = ?
                        )
                        """,
                Boolean.class,
                request.modeloId());

        if (!Boolean.TRUE.equals(modeloExiste)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El modelo seleccionado no existe");
        }

        Boolean placaExiste = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM unidad
                            WHERE LOWER(placa) = LOWER(?)
                        )
                        """,
                Boolean.class,
                request.placa().trim());

        if (Boolean.TRUE.equals(placaExiste)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La placa ya está registrada");
        }

        Long usuarioId = jdbcTemplate.queryForObject(
                """
                        SELECT id
                        FROM usuario
                        WHERE LOWER(correo) = LOWER(?)
                          AND activo = true
                        """,
                Long.class,
                correoUsuario);

        jdbcTemplate.queryForObject(
                """
                        SELECT set_config(
                            'app.usuario_id',
                            ?,
                            true
                        )
                        """,
                String.class,
                usuarioId.toString());

        String estado = request.estado() == null ||
                request.estado().isBlank()
                        ? "OPERATIVA"
                        : request.estado();

        String codigoIngresado = request.codigo()
                .trim()
                .toUpperCase();

        String numeroCodigo = codigoIngresado
                .replaceFirst("^PAD\\s*", "")
                .trim();

        if (!numeroCodigo.matches("\\d+")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El código PAD debe contener solo números");
        }

        String codigo = "PAD " + numeroCodigo;

        Boolean codigoExiste = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM unidad
                            WHERE LOWER(codigo) =
                                  LOWER(?)
                        )
                        """,
                Boolean.class,
                codigo);

        if (Boolean.TRUE.equals(codigoExiste)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El código PAD ya está registrado");
        }

        Boolean activo = request.activo() == null
                ? true
                : request.activo();

        Long unidadId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO unidad (
                            codigo,
                            placa,
                            modelo_id,
                            tipo_vehiculo,
                            anio_fabricacion,
                            estado_operativo,
                            activo,
                            observaciones
                        )
                        VALUES (
                            ?, ?, ?, ?, ?, ?, ?, ?
                        )
                        RETURNING id
                        """,
                Long.class,

                codigo,
                request.placa()
                        .trim()
                        .toUpperCase(),

                request.modeloId(),

                request.tipoVehiculo() == null ||
                        request.tipoVehiculo().isBlank()
                                ? "BUS"
                                : request.tipoVehiculo()
                                        .trim()
                                        .toUpperCase(),

                request.anioFabricacion(),

                estado,

                activo,

                request.observaciones() == null ||
                        request.observaciones().isBlank()
                                ? null
                                : request.observaciones().trim());

        return obtenerPorId(
                unidadId);
    }
}