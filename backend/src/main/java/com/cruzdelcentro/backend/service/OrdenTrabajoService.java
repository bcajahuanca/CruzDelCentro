package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.OrdenTrabajoCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenTrabajoResponse;
import com.cruzdelcentro.backend.dto.OrdenActividadCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenActividadResponse;
import com.cruzdelcentro.backend.dto.OrdenAvanceRequest;
import com.cruzdelcentro.backend.dto.OrdenIncidenciaResponse;
import com.cruzdelcentro.backend.dto.OrdenSeguimientoResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrdenTrabajoService {

    private final JdbcTemplate jdbcTemplate;

    public OrdenTrabajoService(
            JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public OrdenTrabajoResponse crearOrden(
            OrdenTrabajoCreateRequest request) {

        if (request.unidadId() == null) {
            throw new IllegalArgumentException(
                    "Debe seleccionar una unidad");
        }

        if (request.tipo() == null ||
                !List.of(
                        "PREVENTIVO",
                        "CORRECTIVO").contains(request.tipo())) {
            throw new IllegalArgumentException(
                    "Tipo de orden inválido");
        }

        if (request.responsableId() == null) {
            throw new IllegalArgumentException(
                    "Debe seleccionar un responsable");
        }

        /*
         * Validar unidad
         */

        Integer unidadExiste = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM unidad
                        WHERE id = ?
                        AND activo = true
                        """,
                Integer.class,
                request.unidadId());

        if (unidadExiste == null ||
                unidadExiste == 0) {
            throw new IllegalArgumentException(
                    "La unidad no existe o está inactiva");
        }

        /*
         * Validar responsable
         */

        Integer responsableExiste = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM usuario
                        WHERE id = ?
                        AND activo = true
                        """,
                Integer.class,
                request.responsableId());

        if (responsableExiste == null ||
                responsableExiste == 0) {
            throw new IllegalArgumentException(
                    "El responsable no existe o está inactivo");
        }

        /*
         * Si viene de mantenimiento programado,
         * debe pertenecer a la misma unidad
         * y tener el mismo tipo.
         */

        if (request.programacionId() != null) {

            Integer programacionValida = jdbcTemplate.queryForObject(
                    """
                            SELECT COUNT(*)
                            FROM programacion_mantenimiento
                            WHERE id = ?
                            AND unidad_id = ?
                            AND tipo = ?
                            AND estado <> 'CANCELADA'
                            """,

                    Integer.class,

                    request.programacionId(),
                    request.unidadId(),
                    request.tipo());

            if (programacionValida == null ||
                    programacionValida == 0) {
                throw new IllegalArgumentException(
                        "La programación no corresponde a la unidad y tipo seleccionados");
            }

            /*
             * La BD ya tiene UNIQUE sobre
             * programacion_vigente, pero damos
             * un mensaje más claro.
             */

            Integer ordenExistente = jdbcTemplate.queryForObject(
                    """
                            SELECT COUNT(*)
                            FROM orden_trabajo
                            WHERE programacion_id = ?
                            AND estado <> 'CANCELADA'
                            """,
                    Integer.class,
                    request.programacionId());

            if (ordenExistente != null &&
                    ordenExistente > 0) {
                throw new IllegalArgumentException(
                        "La programación ya tiene una orden de trabajo vigente");
            }
        }

        /*
         * Obtener siguiente ID para generar
         * código único OT-00001.
         */

        Long id = jdbcTemplate.queryForObject(
                """
                        SELECT nextval(
                            pg_get_serial_sequence(
                                'orden_trabajo',
                                'id'
                            )
                        )
                        """,
                Long.class);

        if (id == null) {
            throw new IllegalStateException(
                    "No se pudo generar el identificador de la orden");
        }

        String codigo = "OT-%05d".formatted(id);

        jdbcTemplate.update(
                """
                        INSERT INTO orden_trabajo (
                            id,
                            codigo,
                            unidad_id,
                            programacion_id,
                            tipo,
                            responsable_id,
                            proveedor_id,
                            estado,
                            fecha_estimada_fin
                        )
                        VALUES (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            'ASIGNADA',
                            ?
                        )
                        """,

                id,
                codigo,
                request.unidadId(),
                request.programacionId(),
                request.tipo(),
                request.responsableId(),
                request.proveedorId(),
                request.fechaEstimadaFin());

        return obtenerPorId(id);
    }

    public OrdenTrabajoResponse obtenerPorId(
            Long id) {

        List<OrdenTrabajoResponse> resultados = jdbcTemplate.query(
                """
                        SELECT
                            ot.id,
                            ot.codigo,

                            ot.unidad_id,
                            u.codigo AS unidad_codigo,
                            u.placa,

                            ot.programacion_id,

                            ot.tipo,
                            ot.diagnostico,

                            ot.responsable_id,

                            CONCAT(
                                usr.nombres,
                                ' ',
                                usr.apellidos
                            ) AS responsable,

                            ot.proveedor_id,

                            ot.estado,

                            ot.fecha_apertura,
                            ot.inicio_real,
                            ot.fin_real,
                            ot.fecha_estimada_fin,
                            ot.fecha_cierre

                        FROM orden_trabajo ot

                        JOIN unidad u
                            ON u.id = ot.unidad_id

                        JOIN usuario usr
                            ON usr.id = ot.responsable_id

                        WHERE ot.id = ?
                        """,

                (rs, rowNum) -> new OrdenTrabajoResponse(
                        rs.getLong("id"),
                        rs.getString("codigo"),

                        rs.getLong("unidad_id"),
                        rs.getString("unidad_codigo"),
                        rs.getString("placa"),

                        rs.getObject(
                                "programacion_id",
                                Long.class),

                        rs.getString("tipo"),
                        rs.getString("diagnostico"),

                        rs.getLong("responsable_id"),
                        rs.getString("responsable"),

                        rs.getObject(
                                "proveedor_id",
                                Long.class),

                        rs.getString("estado"),

                        rs.getTimestamp("fecha_apertura")
                                .toLocalDateTime(),

                        rs.getTimestamp("inicio_real") != null
                                ? rs.getTimestamp("inicio_real")
                                        .toLocalDateTime()
                                : null,

                        rs.getTimestamp("fin_real") != null
                                ? rs.getTimestamp("fin_real")
                                        .toLocalDateTime()
                                : null,

                        rs.getTimestamp("fecha_estimada_fin") != null
                                ? rs.getTimestamp("fecha_estimada_fin")
                                        .toLocalDateTime()
                                : null,

                        rs.getTimestamp("fecha_cierre") != null
                                ? rs.getTimestamp("fecha_cierre")
                                        .toLocalDateTime()
                                : null),

                id);

        if (resultados.isEmpty()) {
            throw new IllegalArgumentException(
                    "La orden de trabajo no existe");
        }

        return resultados.get(0);
    }

    public List<OrdenTrabajoResponse> listarOrdenes() {

        return jdbcTemplate.query(
                """
                        SELECT
                            ot.id,
                            ot.codigo,

                            ot.unidad_id,
                            u.codigo AS unidad_codigo,
                            u.placa,

                            ot.programacion_id,

                            ot.tipo,
                            ot.diagnostico,

                            ot.responsable_id,

                            CONCAT(
                                usr.nombres,
                                ' ',
                                usr.apellidos
                            ) AS responsable,

                            ot.proveedor_id,

                            ot.estado,

                            ot.fecha_apertura,
                            ot.inicio_real,
                            ot.fin_real,
                            ot.fecha_estimada_fin,
                            ot.fecha_cierre

                        FROM orden_trabajo ot

                        JOIN unidad u
                            ON u.id = ot.unidad_id

                        JOIN usuario usr
                            ON usr.id = ot.responsable_id

                        ORDER BY
                            ot.fecha_apertura DESC,
                            ot.id DESC
                        """,

                (rs, rowNum) -> new OrdenTrabajoResponse(
                        rs.getLong("id"),
                        rs.getString("codigo"),

                        rs.getLong("unidad_id"),
                        rs.getString("unidad_codigo"),
                        rs.getString("placa"),

                        rs.getObject(
                                "programacion_id",
                                Long.class),

                        rs.getString("tipo"),
                        rs.getString("diagnostico"),

                        rs.getLong("responsable_id"),
                        rs.getString("responsable"),

                        rs.getObject(
                                "proveedor_id",
                                Long.class),

                        rs.getString("estado"),

                        rs.getTimestamp("fecha_apertura")
                                .toLocalDateTime(),

                        rs.getTimestamp("inicio_real") != null
                                ? rs.getTimestamp("inicio_real")
                                        .toLocalDateTime()
                                : null,

                        rs.getTimestamp("fin_real") != null
                                ? rs.getTimestamp("fin_real")
                                        .toLocalDateTime()
                                : null,

                        rs.getTimestamp("fecha_estimada_fin") != null
                                ? rs.getTimestamp("fecha_estimada_fin")
                                        .toLocalDateTime()
                                : null,

                        rs.getTimestamp("fecha_cierre") != null
                                ? rs.getTimestamp("fecha_cierre")
                                        .toLocalDateTime()
                                : null));
    }

    @Transactional
    public void vincularIncidencia(
            Long ordenId,
            Long incidenciaId) {

        Integer ordenExiste = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM orden_trabajo
                        WHERE id = ?
                        """,
                Integer.class,
                ordenId);

        if (ordenExiste == null ||
                ordenExiste == 0) {
            throw new IllegalArgumentException(
                    "La orden de trabajo no existe");
        }

        Integer incidenciaExiste = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM incidencia
                        WHERE id = ?
                        """,
                Integer.class,
                incidenciaId);

        if (incidenciaExiste == null ||
                incidenciaExiste == 0) {
            throw new IllegalArgumentException(
                    "La incidencia no existe");
        }

        Long unidadOrden = jdbcTemplate.queryForObject(
                """
                        SELECT unidad_id
                        FROM orden_trabajo
                        WHERE id = ?
                        """,
                Long.class,
                ordenId);

        Long unidadIncidencia = jdbcTemplate.queryForObject(
                """
                        SELECT unidad_id
                        FROM incidencia
                        WHERE id = ?
                        """,
                Long.class,
                incidenciaId);

        if (unidadOrden == null ||
                unidadIncidencia == null ||
                !unidadOrden.equals(
                        unidadIncidencia)) {
            throw new IllegalArgumentException(
                    "La incidencia y la orden deben pertenecer a la misma unidad");
        }

        Integer vinculada = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM orden_incidencia
                        WHERE orden_id = ?
                        AND incidencia_id = ?
                        """,
                Integer.class,
                ordenId,
                incidenciaId);

        if (vinculada != null &&
                vinculada > 0) {
            return;
        }

        jdbcTemplate.update(
                """
                        INSERT INTO orden_incidencia (
                            orden_id,
                            incidencia_id,
                            unidad_id
                        )
                        VALUES (?, ?, ?)
                        """,
                ordenId,
                incidenciaId,
                unidadOrden);
    }

    public List<OrdenIncidenciaResponse> listarIncidencias(
            Long ordenId) {

        Integer ordenExiste = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM orden_trabajo
                        WHERE id = ?
                        """,
                Integer.class,
                ordenId);

        if (ordenExiste == null ||
                ordenExiste == 0) {
            throw new IllegalArgumentException(
                    "La orden de trabajo no existe");
        }

        return jdbcTemplate.query(
                """
                        SELECT
                            i.id,
                            i.codigo,
                            i.unidad_id,
                            u.codigo AS unidad_codigo,
                            u.placa,
                            ti.nombre AS tipo,
                            i.descripcion,
                            i.prioridad,
                            i.estado,
                            i.fecha_reporte

                        FROM orden_incidencia oi

                        JOIN incidencia i
                            ON i.id = oi.incidencia_id

                        JOIN unidad u
                            ON u.id = i.unidad_id

                        JOIN tipo_incidencia ti
                            ON ti.id = i.tipo_incidencia_id

                        WHERE oi.orden_id = ?

                        ORDER BY
                            i.fecha_reporte DESC,
                            i.id DESC
                        """,

                (rs, rowNum) -> new OrdenIncidenciaResponse(
                        rs.getLong("id"),
                        rs.getString("codigo"),

                        rs.getLong("unidad_id"),
                        rs.getString("unidad_codigo"),
                        rs.getString("placa"),

                        rs.getString("tipo"),
                        rs.getString("descripcion"),
                        rs.getString("prioridad"),
                        rs.getString("estado"),

                        rs.getTimestamp("fecha_reporte")
                                .toLocalDateTime()),

                ordenId);
    }

    @Transactional
    public OrdenTrabajoResponse actualizarDiagnostico(
            Long ordenId,
            String diagnostico) {

        if (diagnostico == null ||
                diagnostico.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "El diagnóstico es obligatorio");
        }

        Integer actualizados = jdbcTemplate.update(
                """
                        UPDATE orden_trabajo
                        SET diagnostico = ?
                        WHERE id = ?
                        AND estado NOT IN (
                            'CERRADA',
                            'CANCELADA'
                        )
                        """,
                diagnostico.trim(),
                ordenId);

        if (actualizados == 0) {
            throw new IllegalArgumentException(
                    "La orden no existe o ya no puede modificarse");
        }

        return obtenerPorId(ordenId);
    }

    public List<OrdenActividadResponse> listarActividades(
            Long ordenId) {

        return jdbcTemplate.query(
                """
                        SELECT
                            id,
                            orden_id,
                            descripcion,
                            orden_visual,
                            obligatoria,
                            completada,
                            realizada_por,
                            completada_en,
                            observaciones

                        FROM orden_actividad

                        WHERE orden_id = ?

                        ORDER BY orden_visual
                        """,

                (rs, rowNum) -> new OrdenActividadResponse(
                        rs.getLong("id"),
                        rs.getLong("orden_id"),
                        rs.getString("descripcion"),
                        rs.getInt("orden_visual"),
                        rs.getBoolean("obligatoria"),
                        rs.getBoolean("completada"),
                        rs.getObject(
                                "realizada_por",
                                Long.class),
                        rs.getTimestamp(
                                "completada_en") != null
                                        ? rs.getTimestamp(
                                                "completada_en").toLocalDateTime()
                                        : null,
                        rs.getString(
                                "observaciones")),

                ordenId);
    }

    @Transactional
    public void completarActividad(
            Long ordenId,
            Long actividadId,
            String correoUsuario,
            String observaciones) {

        Long usuarioId = jdbcTemplate.queryForObject(
                """
                        SELECT id
                        FROM usuario
                        WHERE correo = ?
                        AND activo = true
                        """,
                Long.class,
                correoUsuario);

        if (usuarioId == null) {
            throw new IllegalArgumentException(
                    "Usuario no válido");
        }

        Integer actualizados = jdbcTemplate.update(
                """
                        UPDATE orden_actividad
                        SET
                            completada = true,
                            realizada_por = ?,
                            completada_en = utc_now(),
                            observaciones = ?
                        WHERE id = ?
                        AND orden_id = ?
                        AND completada = false
                        """,
                usuarioId,
                observaciones,
                actividadId,
                ordenId);

        if (actualizados == 0) {
            throw new IllegalArgumentException(
                    "La actividad no existe o ya fue completada");
        }
    }

    @Transactional
    public OrdenActividadResponse crearActividad(
            Long ordenId,
            OrdenActividadCreateRequest request) {

        if (request.descripcion() == null ||
                request.descripcion().trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "La descripción de la actividad es obligatoria");
        }

        String estado = jdbcTemplate.queryForObject(
                """
                        SELECT estado
                        FROM orden_trabajo
                        WHERE id = ?
                        """,
                String.class,
                ordenId);

        if (estado == null) {
            throw new IllegalArgumentException(
                    "La orden de trabajo no existe");
        }

        if (estado.equals("CERRADA") ||
                estado.equals("CANCELADA")) {
            throw new IllegalArgumentException(
                    "No se pueden agregar actividades a una orden cerrada o cancelada");
        }

        Integer siguienteOrden = jdbcTemplate.queryForObject(
                """
                        SELECT COALESCE(
                            MAX(orden_visual),
                            0
                        ) + 1
                        FROM orden_actividad
                        WHERE orden_id = ?
                        """,
                Integer.class,
                ordenId);

        Long id = jdbcTemplate.queryForObject(
                """
                        INSERT INTO orden_actividad (
                            orden_id,
                            descripcion,
                            orden_visual,
                            obligatoria
                        )
                        VALUES (?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                ordenId,
                request.descripcion().trim(),
                siguienteOrden,
                request.obligatoria() != null
                        ? request.obligatoria()
                        : true);

        return obtenerActividadPorId(
                id);
    }

    private OrdenActividadResponse obtenerActividadPorId(
            Long actividadId) {

        return jdbcTemplate.queryForObject(
                """
                        SELECT
                            id,
                            orden_id,
                            descripcion,
                            orden_visual,
                            obligatoria,
                            completada,
                            realizada_por,
                            completada_en,
                            observaciones

                        FROM orden_actividad

                        WHERE id = ?
                        """,

                (rs, rowNum) -> new OrdenActividadResponse(
                        rs.getLong("id"),
                        rs.getLong("orden_id"),
                        rs.getString("descripcion"),
                        rs.getInt("orden_visual"),
                        rs.getBoolean("obligatoria"),
                        rs.getBoolean("completada"),

                        rs.getObject(
                                "realizada_por",
                                Long.class),

                        rs.getTimestamp(
                                "completada_en") != null
                                        ? rs.getTimestamp(
                                                "completada_en").toLocalDateTime()
                                        : null,

                        rs.getString(
                                "observaciones")),

                actividadId);
    }

    @Transactional
    public OrdenTrabajoResponse iniciarTrabajo(
            Long ordenId,
            String correoUsuario) {

        Long usuarioId = jdbcTemplate.queryForObject(
                """
                        SELECT id
                        FROM usuario
                        WHERE correo = ?
                        AND activo = true
                        """,
                Long.class,
                correoUsuario);

        if (usuarioId == null) {
            throw new IllegalArgumentException(
                    "Usuario autenticado no válido");
        }

        /*
         * Configura el usuario para PostgreSQL.
         *
         * true = LOCAL a la transacción actual.
         * Como el método tiene @Transactional,
         * los triggers de esta operación podrán leerlo
         * con app_usuario_id().
         */
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

        String estado = jdbcTemplate.queryForObject(
                """
                        SELECT estado
                        FROM orden_trabajo
                        WHERE id = ?
                        """,
                String.class,
                ordenId);

        if (estado == null) {
            throw new IllegalArgumentException(
                    "La orden de trabajo no existe");
        }

        if (estado.equals("CERRADA") ||
                estado.equals("CANCELADA")) {
            throw new IllegalArgumentException(
                    "La orden ya está finalizada");
        }

        if (estado.equals("EN_EJECUCION")) {
            return obtenerPorId(ordenId);
        }

        /*
         * Soporte para las órdenes antiguas
         * que todavía están ABIERTA.
         */
        if (estado.equals("ABIERTA")) {

            int asignada = jdbcTemplate.update(
                    """
                            UPDATE orden_trabajo
                            SET
                                estado = 'ASIGNADA',
                                motivo_estado =
                                    'Orden asignada para ejecución'
                            WHERE id = ?
                            AND estado = 'ABIERTA'
                            """,
                    ordenId);

            if (asignada == 0) {
                throw new IllegalStateException(
                        "La orden cambió de estado. Actualice la página.");
            }
        }

        int iniciada = jdbcTemplate.update(
                """
                        UPDATE orden_trabajo
                        SET
                            estado = 'EN_EJECUCION',
                            inicio_real =
                                COALESCE(
                                    inicio_real,
                                    utc_now()
                                ),
                            motivo_estado =
                                'Inicio de trabajo'
                        WHERE id = ?
                        AND estado = 'ASIGNADA'
                        """,
                ordenId);

        if (iniciada == 0) {
            throw new IllegalStateException(
                    "La orden no puede iniciarse desde su estado actual");
        }

        return obtenerPorId(ordenId);
    }

    @Transactional
    public void registrarAvance(
            Long ordenId,
            String correoUsuario,
            OrdenAvanceRequest request) {

        if (request.comentario() == null ||
                request.comentario().trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "El comentario del avance es obligatorio");
        }

        Long usuarioId = jdbcTemplate.queryForObject(
                """
                        SELECT id
                        FROM usuario
                        WHERE correo = ?
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

        String estado = jdbcTemplate.queryForObject(
                """
                        SELECT estado
                        FROM orden_trabajo
                        WHERE id = ?
                        """,
                String.class,
                ordenId);

        if (!"EN_EJECUCION".equals(estado)) {
            throw new IllegalArgumentException(
                    "Solo se pueden registrar avances cuando la orden está en ejecución");
        }

        jdbcTemplate.update(
                """
                        INSERT INTO orden_seguimiento (
                            orden_id,
                            usuario_id,
                            estado_anterior,
                            estado_nuevo,
                            comentario
                        )
                        VALUES (?, ?, ?, ?, ?)
                        """,
                ordenId,
                usuarioId,
                estado,
                estado,
                request.comentario().trim());
    }

    public List<OrdenSeguimientoResponse> listarSeguimiento(
            Long ordenId) {

        return jdbcTemplate.query(
                """
                        SELECT
                            os.id,
                            os.usuario_id,
                            u.nombres AS usuario_nombre,
                            os.fecha,
                            os.estado_anterior,
                            os.estado_nuevo,
                            os.comentario

                        FROM orden_seguimiento os

                        LEFT JOIN usuario u
                            ON u.id = os.usuario_id

                        WHERE os.orden_id = ?

                        ORDER BY os.fecha DESC, os.id DESC
                        """,

                (rs, rowNum) -> new OrdenSeguimientoResponse(
                        rs.getLong("id"),

                        rs.getObject(
                                "usuario_id",
                                Long.class),

                        rs.getString(
                                "usuario_nombre"),

                        rs.getTimestamp("fecha")
                                .toLocalDateTime(),

                        rs.getString(
                                "estado_anterior"),

                        rs.getString(
                                "estado_nuevo"),

                        rs.getString(
                                "comentario")),

                ordenId);
    }

    @Transactional
    public OrdenTrabajoResponse finalizarTrabajo(
            Long ordenId,
            String correoUsuario) {

        Long usuarioId = jdbcTemplate.queryForObject(
                """
                        SELECT id
                        FROM usuario
                        WHERE correo = ?
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

        String estado = jdbcTemplate.queryForObject(
                """
                        SELECT estado
                        FROM orden_trabajo
                        WHERE id = ?
                        """,
                String.class,
                ordenId);

        if (!"EN_EJECUCION".equals(estado)) {
            throw new IllegalArgumentException(
                    "La orden debe estar en ejecución para finalizarla");
        }

        int actualizados = jdbcTemplate.update(
                """
                        UPDATE orden_trabajo
                        SET
                            estado = 'PENDIENTE_VALIDACION',
                            fin_real = COALESCE(
                                fin_real,
                                utc_now()
                            ),
                            motivo_estado = 'Trabajo finalizado, pendiente de validación'
                        WHERE id = ?
                          AND estado = 'EN_EJECUCION'
                        """,
                ordenId);

        if (actualizados == 0) {
            throw new IllegalStateException(
                    "No se pudo finalizar la orden");
        }

        return obtenerPorId(
                ordenId);
    }
}