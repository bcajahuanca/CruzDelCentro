package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.IncidenciaResponse;

import com.cruzdelcentro.backend.dto.IncidenciaCreateRequest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class IncidenciaService {

    private final JdbcTemplate jdbcTemplate;

    public IncidenciaService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> listarIncidencias(
        int pagina,
        String busqueda,
        String estado,
        String prioridad
    ) {

        int limite = 20;
        int offset = pagina * limite;

        String texto = busqueda == null
            ? ""
            : busqueda.trim().toLowerCase();

        String patron = "%" +
            texto.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_") +
            "%";

        String estadoFiltro =
            estado == null ? "TODOS" : estado;

        String prioridadFiltro =
            prioridad == null ? "TODAS" : prioridad;

        String filtro = """
            FROM incidencia i

            JOIN unidad u
                ON u.id = i.unidad_id

            JOIN tipo_incidencia ti
                ON ti.id = i.tipo_incidencia_id

            JOIN usuario ur
                ON ur.id = i.reportado_por

            WHERE (
                ? = ''
                OR LOWER(i.codigo) LIKE ?
                OR LOWER(u.codigo) LIKE ?
                OR LOWER(COALESCE(u.placa, '')) LIKE ?
                OR LOWER(ti.nombre) LIKE ?
                OR LOWER(i.descripcion) LIKE ?
            )

            AND (
                ? = 'TODOS'
                OR i.estado = ?
            )

            AND (
                ? = 'TODAS'
                OR i.prioridad = ?
            )
            """;

        String sql = """
            SELECT
                i.id,
                i.codigo,
                i.unidad_id,
                u.codigo AS unidad_codigo,
                u.placa,
                i.tipo_incidencia_id,
                ti.nombre AS tipo,
                i.descripcion,
                i.prioridad,
                ur.nombres,
                ur.apellidos,
                i.fecha_reporte,
                i.estado
            """ + filtro + """

            ORDER BY
                i.fecha_reporte DESC,
                i.id DESC

            LIMIT ? OFFSET ?
            """;

        List<IncidenciaResponse> registros =
            jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new IncidenciaResponse(
                    rs.getLong("id"),
                    rs.getString("codigo"),
                    rs.getLong("unidad_id"),
                    rs.getString("unidad_codigo"),
                    rs.getString("placa"),
                    rs.getLong("tipo_incidencia_id"),
                    rs.getString("tipo"),
                    rs.getString("descripcion"),
                    rs.getString("prioridad"),
                    rs.getString("nombres")
                        + " "
                        + rs.getString("apellidos"),
                    rs.getTimestamp("fecha_reporte")
                        .toLocalDateTime(),
                    rs.getString("estado")
                ),

                texto,
                patron,
                patron,
                patron,
                patron,
                patron,

                estadoFiltro,
                estadoFiltro,

                prioridadFiltro,
                prioridadFiltro,

                limite,
                offset
            );

        Long total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) " + filtro,
            Long.class,

            texto,
            patron,
            patron,
            patron,
            patron,
            patron,

            estadoFiltro,
            estadoFiltro,

            prioridadFiltro,
            prioridadFiltro
        );

        long cantidad =
            total == null ? 0 : total;

        long totalPaginas =
            (cantidad + limite - 1) / limite;

        return Map.of(
            "registros", registros,
            "paginaActual", pagina,
            "totalRegistros", cantidad,
            "totalPaginas", totalPaginas
        );
    }

    @Transactional
    public IncidenciaResponse crearIncidencia(
        IncidenciaCreateRequest request,
        Long usuarioId
    ) {

        if (request.unidadId() == null) {
            throw new IllegalArgumentException(
                "Debe seleccionar una unidad"
            );
        }

        if (request.tipoIncidenciaId() == null) {
            throw new IllegalArgumentException(
                "Debe seleccionar un tipo de incidencia"
            );
        }

        if (
            request.descripcion() == null ||
            request.descripcion().isBlank()
        ) {
            throw new IllegalArgumentException(
                "La descripción es obligatoria"
            );
        }

        if (
            request.prioridad() == null ||
            !List.of(
                "BAJA",
                "MEDIA",
                "ALTA",
                "CRITICA"
            ).contains(request.prioridad())
        ) {
            throw new IllegalArgumentException(
                "Prioridad inválida"
            );
        }

        if (
            request.kilometrajeReporte() != null &&
            request.kilometrajeReporte()
                .compareTo(BigDecimal.ZERO) < 0
        ) {
            throw new IllegalArgumentException(
                "El kilometraje no puede ser negativo"
            );
        }

        Integer existeUnidad = jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM unidad
            WHERE id = ?
            AND activo = true
            """,
            Integer.class,
            request.unidadId()
        );

        if (
            existeUnidad == null ||
            existeUnidad == 0
        ) {
            throw new IllegalArgumentException(
                "La unidad seleccionada no existe o está inactiva"
            );
        }

        Integer existeTipo = jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM tipo_incidencia
            WHERE id = ?
            AND activo = true
            """,
            Integer.class,
            request.tipoIncidenciaId()
        );

        if (
            existeTipo == null ||
            existeTipo == 0
        ) {
            throw new IllegalArgumentException(
                "El tipo de incidencia no existe o está inactivo"
            );
        }

        Long nuevoId = jdbcTemplate.queryForObject(
            """
            SELECT nextval(
                pg_get_serial_sequence(
                    'incidencia',
                    'id'
                )
            )
            """,
            Long.class
        );

        if (nuevoId == null) {
            throw new IllegalStateException(
                "No se pudo generar el identificador de la incidencia"
            );
        }


        String codigo =
            String.format(
                "INC-%05d",
                nuevoId
            );

        jdbcTemplate.update(
            """
            INSERT INTO incidencia (
                id,
                codigo,
                unidad_id,
                tipo_incidencia_id,
                reportado_por,
                descripcion,
                prioridad,
                estado,
                ubicacion,
                kilometraje_reporte
            )
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                'REGISTRADA',
                ?,
                ?
            )
            """,

            nuevoId,
            codigo,
            request.unidadId(),
            request.tipoIncidenciaId(),
            usuarioId,
            request.descripcion().trim(),
            request.prioridad(),
            request.ubicacion() == null ||
                request.ubicacion().isBlank()
                    ? null
                    : request.ubicacion().trim(),
            request.kilometrajeReporte()
        );

        return jdbcTemplate.queryForObject(
            """
            SELECT
                i.id,
                i.codigo,
                i.unidad_id,
                u.codigo AS unidad_codigo,
                u.placa,
                i.tipo_incidencia_id,
                ti.nombre AS tipo,
                i.descripcion,
                i.prioridad,
                ur.nombres,
                ur.apellidos,
                i.fecha_reporte,
                i.estado

            FROM incidencia i

            JOIN unidad u
                ON u.id = i.unidad_id

            JOIN tipo_incidencia ti
                ON ti.id = i.tipo_incidencia_id

            JOIN usuario ur
                ON ur.id = i.reportado_por

            WHERE i.id = ?
            """,

            (rs, rowNum) ->
                new IncidenciaResponse(
                    rs.getLong("id"),
                    rs.getString("codigo"),
                    rs.getLong("unidad_id"),
                    rs.getString("unidad_codigo"),
                    rs.getString("placa"),
                    rs.getLong("tipo_incidencia_id"),
                    rs.getString("tipo"),
                    rs.getString("descripcion"),
                    rs.getString("prioridad"),
                    rs.getString("nombres")
                        + " "
                        + rs.getString("apellidos"),
                    rs.getTimestamp("fecha_reporte")
                        .toLocalDateTime(),
                    rs.getString("estado")
                ),

            nuevoId
        );
    }

    public Long obtenerUsuarioIdPorCorreo(String correo) {

        if (correo == null || correo.isBlank()) {
            throw new IllegalArgumentException(
                "No se pudo identificar al usuario autenticado"
            );
        }

        Long usuarioId = jdbcTemplate.queryForObject(
            """
            SELECT id
            FROM usuario
            WHERE LOWER(correo) = LOWER(?)
            AND activo = true
            """,
            Long.class,
            correo
        );

        if (usuarioId == null) {
            throw new IllegalArgumentException(
                "Usuario autenticado no encontrado"
            );
        }

        return usuarioId;
    }

    public IncidenciaResponse obtenerIncidenciaPorId(Long id) {

        return jdbcTemplate.queryForObject(
            """
            SELECT
                i.id,
                i.codigo,
                i.unidad_id,
                u.codigo AS unidad_codigo,
                u.placa,
                i.tipo_incidencia_id,
                ti.nombre AS tipo,
                i.descripcion,
                i.prioridad,
                ur.nombres,
                ur.apellidos,
                i.fecha_reporte,
                i.estado

            FROM incidencia i

            JOIN unidad u
                ON u.id = i.unidad_id

            JOIN tipo_incidencia ti
                ON ti.id = i.tipo_incidencia_id

            JOIN usuario ur
                ON ur.id = i.reportado_por

            WHERE i.id = ?
            """,

            (rs, rowNum) ->
                new IncidenciaResponse(
                    rs.getLong("id"),
                    rs.getString("codigo"),
                    rs.getLong("unidad_id"),
                    rs.getString("unidad_codigo"),
                    rs.getString("placa"),
                    rs.getLong("tipo_incidencia_id"),
                    rs.getString("tipo"),
                    rs.getString("descripcion"),
                    rs.getString("prioridad"),
                    rs.getString("nombres")
                        + " "
                        + rs.getString("apellidos"),
                    rs.getTimestamp("fecha_reporte")
                        .toLocalDateTime(),
                    rs.getString("estado")
                ),

            id
        );
    }
}