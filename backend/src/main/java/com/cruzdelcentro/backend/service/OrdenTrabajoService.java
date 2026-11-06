package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.OrdenTrabajoCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenTrabajoResponse;
import com.cruzdelcentro.backend.dto.RepuestoDisponibleResponse;
import com.cruzdelcentro.backend.dto.OrdenActividadCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenActividadResponse;
import com.cruzdelcentro.backend.dto.OrdenAvanceRequest;
import com.cruzdelcentro.backend.dto.OrdenCancelarRequest;
import com.cruzdelcentro.backend.dto.OrdenCerrarRequest;
import com.cruzdelcentro.backend.dto.OrdenCostoCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenCostoResponse;
import com.cruzdelcentro.backend.dto.OrdenEvidenciaResponse;
import com.cruzdelcentro.backend.dto.OrdenIncidenciaResponse;
import com.cruzdelcentro.backend.dto.OrdenKilometrajeRequest;
import com.cruzdelcentro.backend.dto.OrdenKilometrajeResponse;
import com.cruzdelcentro.backend.dto.OrdenRepuestoSalidaRequest;
import com.cruzdelcentro.backend.dto.OrdenRepuestoSalidaResponse;
import com.cruzdelcentro.backend.dto.OrdenResponsableResponse;
import com.cruzdelcentro.backend.dto.OrdenResultadoPruebasRequest;
import com.cruzdelcentro.backend.dto.OrdenResultadoPruebasResponse;
import com.cruzdelcentro.backend.dto.OrdenSeguimientoResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
                                                    ot.fecha_cierre,
                                                    ot.diagnostico,
                                                    ot.resultado_pruebas,
                                                    ot.kilometraje_intervencion,
                                                    ot.observaciones_cierre,
                                                    ot.motivo_estado

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
                                                                : null,

                                                rs.getString("resultado_pruebas"),
                                                rs.getBigDecimal("kilometraje_intervencion"),
                                                rs.getString("observaciones_cierre"),
                                                rs.getString("motivo_estado")),
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
                                                    ot.fecha_cierre,
                                                    ot.resultado_pruebas,
                                                    ot.kilometraje_intervencion,
                                                    ot.observaciones_cierre,
                                                    ot.motivo_estado

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
                                                                : null,
                                                rs.getString("resultado_pruebas"),
                                                rs.getBigDecimal("kilometraje_intervencion"),
                                                rs.getString("observaciones_cierre"),
                                                rs.getString("motivo_estado")));
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
                                                                                                "completada_en")
                                                                                                .toLocalDateTime()
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
                                                                                                "completada_en")
                                                                                                .toLocalDateTime()
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

                sincronizarInicioOrden(
                                ordenId,
                                usuarioId);

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

        public List<OrdenCostoResponse> listarCostos(
                        Long ordenId) {

                return jdbcTemplate.query(
                                """
                                                SELECT
                                                    id,
                                                    orden_id,
                                                    categoria,
                                                    naturaleza,
                                                    descripcion,
                                                    cantidad,
                                                    precio_unitario,
                                                    subtotal,
                                                    origen_inventario

                                                FROM orden_costo

                                                WHERE orden_id = ?

                                                ORDER BY
                                                    naturaleza,
                                                    id
                                                """,

                                (rs, rowNum) -> new OrdenCostoResponse(
                                                rs.getLong("id"),
                                                rs.getLong("orden_id"),
                                                rs.getString("categoria"),
                                                rs.getString("naturaleza"),
                                                rs.getString("descripcion"),
                                                rs.getBigDecimal("cantidad"),
                                                rs.getBigDecimal("precio_unitario"),
                                                rs.getBigDecimal("subtotal"),
                                                rs.getBoolean("origen_inventario")),

                                ordenId);
        }

        @Transactional
        public OrdenCostoResponse crearCosto(
                        Long ordenId,
                        String correoUsuario,
                        OrdenCostoCreateRequest request) {

                if (request.descripcion() == null ||
                                request.descripcion().trim().isEmpty()) {
                        throw new IllegalArgumentException(
                                        "La descripción es obligatoria");
                }

                if (request.cantidad() == null ||
                                request.cantidad().signum() <= 0) {
                        throw new IllegalArgumentException(
                                        "La cantidad debe ser mayor a cero");
                }

                if (request.precioUnitario() == null ||
                                request.precioUnitario().signum() < 0) {
                        throw new IllegalArgumentException(
                                        "El precio unitario no puede ser negativo");
                }

                String categoria = request.categoria() == null
                                ? ""
                                : request.categoria()
                                                .trim()
                                                .toUpperCase();

                if (!categoria.equals("REPUESTO") &&
                                !categoria.equals("MANO_OBRA") &&
                                !categoria.equals("SERVICIO") &&
                                !categoria.equals("OTRO")) {
                        throw new IllegalArgumentException(
                                        "Categoría de costo no válida");
                }

                String naturaleza = request.naturaleza() == null
                                ? ""
                                : request.naturaleza()
                                                .trim()
                                                .toUpperCase();

                if (!naturaleza.equals("ESTIMADO") &&
                                !naturaleza.equals("REAL")) {
                        throw new IllegalArgumentException(
                                        "La naturaleza debe ser ESTIMADO o REAL");
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

                if ("CERRADA".equals(estado) ||
                                "CANCELADA".equals(estado)) {
                        throw new IllegalArgumentException(
                                        "No se pueden registrar costos en una orden finalizada");
                }

                Long costoId = jdbcTemplate.queryForObject(
                                """
                                                INSERT INTO orden_costo (
                                                    orden_id,
                                                    categoria,
                                                    naturaleza,
                                                    descripcion,
                                                    cantidad,
                                                    precio_unitario,
                                                    origen_inventario
                                                )
                                                VALUES (?, ?, ?, ?, ?, ?, false)
                                                RETURNING id
                                                """,
                                Long.class,

                                ordenId,
                                categoria,
                                naturaleza,
                                request.descripcion().trim(),
                                request.cantidad(),
                                request.precioUnitario());

                return obtenerCostoPorId(
                                costoId);
        }

        private OrdenCostoResponse obtenerCostoPorId(
                        Long costoId) {

                return jdbcTemplate.queryForObject(
                                """
                                                SELECT
                                                    id,
                                                    orden_id,
                                                    categoria,
                                                    naturaleza,
                                                    descripcion,
                                                    cantidad,
                                                    precio_unitario,
                                                    subtotal,
                                                    origen_inventario

                                                FROM orden_costo

                                                WHERE id = ?
                                                """,

                                (rs, rowNum) -> new OrdenCostoResponse(
                                                rs.getLong("id"),
                                                rs.getLong("orden_id"),
                                                rs.getString("categoria"),
                                                rs.getString("naturaleza"),
                                                rs.getString("descripcion"),
                                                rs.getBigDecimal("cantidad"),
                                                rs.getBigDecimal("precio_unitario"),
                                                rs.getBigDecimal("subtotal"),
                                                rs.getBoolean("origen_inventario")),

                                costoId);
        }

        @Transactional
        public OrdenRepuestoSalidaResponse registrarSalidaRepuesto(
                        Long ordenId,
                        String correoUsuario,
                        OrdenRepuestoSalidaRequest request) {

                if (request.cantidad() == null ||
                                request.cantidad().signum() <= 0) {
                        throw new IllegalArgumentException(
                                        "La cantidad debe ser mayor a cero");
                }

                if (request.precioUnitario() == null ||
                                request.precioUnitario().signum() < 0) {
                        throw new IllegalArgumentException(
                                        "El precio unitario no puede ser negativo");
                }

                if (request.motivo() == null ||
                                request.motivo().trim().isEmpty()) {
                        throw new IllegalArgumentException(
                                        "El motivo es obligatorio");
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

                String estadoOrden = jdbcTemplate.queryForObject(
                                """
                                                SELECT estado
                                                FROM orden_trabajo
                                                WHERE id = ?
                                                FOR UPDATE
                                                """,
                                String.class,
                                ordenId);

                if ("CERRADA".equals(estadoOrden) ||
                                "CANCELADA".equals(estadoOrden)) {
                        throw new IllegalArgumentException(
                                        "No se pueden retirar repuestos para una orden finalizada");
                }

                Map<String, Object> repuesto = jdbcTemplate.queryForMap(
                                """
                                                SELECT
                                                    r.codigo,
                                                    r.nombre,
                                                    e.cantidad AS stock
                                                FROM existencia e
                                                JOIN repuesto r
                                                    ON r.id = e.repuesto_id
                                                JOIN almacen a
                                                    ON a.id = e.almacen_id
                                                WHERE e.repuesto_id = ?
                                                  AND e.almacen_id = ?
                                                  AND r.activo = true
                                                  AND a.activo = true
                                                FOR UPDATE OF e
                                                """,
                                request.repuestoId(),
                                request.almacenId());

                BigDecimal stock = (BigDecimal) repuesto.get("stock");

                if (stock.compareTo(
                                request.cantidad()) < 0) {
                        throw new IllegalArgumentException(
                                        "Stock insuficiente. Disponible: " + stock);
                }

                String nombreRepuesto = (String) repuesto.get("nombre");

                String codigoRepuesto = (String) repuesto.get("codigo");

                Long costoId = jdbcTemplate.queryForObject(
                                """
                                                INSERT INTO orden_costo (
                                                    orden_id,
                                                    categoria,
                                                    naturaleza,
                                                    descripcion,
                                                    cantidad,
                                                    precio_unitario,
                                                    origen_inventario
                                                )
                                                VALUES (
                                                    ?,
                                                    'REPUESTO',
                                                    'REAL',
                                                    ?,
                                                    ?,
                                                    ?,
                                                    true
                                                )
                                                RETURNING id
                                                """,
                                Long.class,
                                ordenId,
                                nombreRepuesto,
                                request.cantidad(),
                                request.precioUnitario());

                Long movimientoId = jdbcTemplate.queryForObject(
                                """
                                                INSERT INTO movimiento_repuesto (
                                                    clave_operacion,
                                                    repuesto_id,
                                                    almacen_id,
                                                    tipo,
                                                    cantidad,
                                                    precio_unitario,
                                                    orden_id,
                                                    orden_costo_id,
                                                    registrado_por,
                                                    motivo
                                                )
                                                VALUES (
                                                    ?,
                                                    ?,
                                                    ?,
                                                    'SALIDA',
                                                    ?,
                                                    ?,
                                                    ?,
                                                    ?,
                                                    ?,
                                                    ?
                                                )
                                                RETURNING id
                                                """,
                                Long.class,

                                UUID.randomUUID().toString(),

                                request.repuestoId(),
                                request.almacenId(),
                                request.cantidad(),
                                request.precioUnitario(),

                                ordenId,
                                costoId,
                                usuarioId,

                                request.motivo().trim());

                jdbcTemplate.update(
                                """
                                                UPDATE existencia
                                                SET cantidad = cantidad - ?
                                                WHERE repuesto_id = ?
                                                  AND almacen_id = ?
                                                """,
                                request.cantidad(),
                                request.repuestoId(),
                                request.almacenId());

                BigDecimal subtotal = request.cantidad()
                                .multiply(
                                                request.precioUnitario())
                                .setScale(
                                                2,
                                                RoundingMode.HALF_UP);

                return new OrdenRepuestoSalidaResponse(
                                movimientoId,
                                costoId,
                                request.repuestoId(),
                                codigoRepuesto,
                                nombreRepuesto,
                                request.cantidad(),
                                request.precioUnitario(),
                                subtotal);
        }

        public List<RepuestoDisponibleResponse> listarRepuestosDisponibles() {

                return jdbcTemplate.query(
                                """
                                                SELECT
                                                    r.id AS repuesto_id,
                                                    r.codigo,
                                                    r.nombre,
                                                    r.unidad_medida,
                                                    a.id AS almacen_id,
                                                    a.nombre AS almacen_nombre,
                                                    e.cantidad AS stock

                                                FROM existencia e

                                                JOIN repuesto r
                                                    ON r.id = e.repuesto_id

                                                JOIN almacen a
                                                    ON a.id = e.almacen_id

                                                WHERE r.activo = true
                                                  AND a.activo = true
                                                  AND e.cantidad > 0

                                                ORDER BY r.nombre
                                                """,

                                (rs, rowNum) -> new RepuestoDisponibleResponse(
                                                rs.getLong("repuesto_id"),
                                                rs.getString("codigo"),
                                                rs.getString("nombre"),
                                                rs.getString("unidad_medida"),
                                                rs.getLong("almacen_id"),
                                                rs.getString("almacen_nombre"),
                                                rs.getBigDecimal("stock")));
        }

        @Transactional
        public OrdenResultadoPruebasResponse actualizarResultadoPruebas(
                        Long ordenId,
                        OrdenResultadoPruebasRequest request,
                        String correo) {

                if (request.resultadoPruebas() == null ||
                                request.resultadoPruebas().isBlank()) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Debe ingresar el resultado de las pruebas");
                }

                Long usuarioId = jdbcTemplate.queryForObject(
                                """
                                                SELECT id
                                                FROM usuario
                                                WHERE correo = ?
                                                  AND activo = true
                                                """,
                                Long.class,
                                correo);

                if (usuarioId == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Usuario no válido");
                }

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
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Orden de trabajo no encontrada");
                }

                if (!"EN_EJECUCION".equals(estado) &&
                                !"PENDIENTE_VALIDACION".equals(estado)) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Estado actual de la OT: " + estado);
                }

                int actualizadas = jdbcTemplate.update(
                                """
                                                UPDATE orden_trabajo
                                                SET resultado_pruebas = ?
                                                WHERE id = ?
                                                """,
                                request.resultadoPruebas().trim(),
                                ordenId);

                if (actualizadas == 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Orden de trabajo no encontrada");
                }

                return new OrdenResultadoPruebasResponse(
                                ordenId,
                                request.resultadoPruebas().trim());
        }

        @Transactional
        public OrdenEvidenciaResponse subirEvidencia(
                        Long ordenId,
                        MultipartFile archivo,
                        String descripcion,
                        String correo) {

                if (archivo == null ||
                                archivo.isEmpty()) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Debe seleccionar un archivo");
                }

                if (archivo.getSize() > 5 * 1024 * 1024) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "El archivo no puede superar los 5 MB");
                }

                String tipoContenido = archivo.getContentType();

                if (tipoContenido == null ||
                                !List.of(
                                                "image/jpeg",
                                                "image/png",
                                                "application/pdf").contains(tipoContenido)) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Solo se permiten archivos JPG, PNG o PDF");
                }

                Long usuarioId = jdbcTemplate.queryForObject(
                                """
                                                SELECT id
                                                FROM usuario
                                                WHERE correo = ?
                                                  AND activo = true
                                                """,
                                Long.class,
                                correo);

                if (usuarioId == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Usuario no válido");
                }

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

                if (!"EN_EJECUCION".equals(estado) &&
                                !"PENDIENTE_VALIDACION".equals(estado)) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "No se pueden agregar evidencias en el estado actual");
                }

                byte[] contenido;

                try {

                        contenido = archivo.getBytes();

                } catch (IOException e) {

                        throw new ResponseStatusException(
                                        HttpStatus.INTERNAL_SERVER_ERROR,
                                        "No se pudo procesar el archivo");
                }

                Long evidenciaId = jdbcTemplate.queryForObject(
                                """
                                                INSERT INTO orden_evidencia (
                                                    orden_id,
                                                    nombre_archivo,
                                                    tipo_contenido,
                                                    tamanio_bytes,
                                                    descripcion,
                                                    contenido,
                                                    subido_por
                                                )
                                                VALUES (?, ?, ?, ?, ?, ?, ?)
                                                RETURNING id
                                                """,
                                Long.class,

                                ordenId,

                                archivo.getOriginalFilename(),

                                tipoContenido,

                                archivo.getSize(),

                                descripcion,

                                contenido,

                                usuarioId);

                return jdbcTemplate.queryForObject(
                                """
                                                SELECT
                                                    oe.id,
                                                    oe.orden_id,
                                                    oe.nombre_archivo,
                                                    oe.tipo_contenido,
                                                    oe.tamanio_bytes,
                                                    oe.descripcion,
                                                    oe.subido_por,
                                                    u.nombres AS usuario_nombre,
                                                    oe.creado_en
                                                FROM orden_evidencia oe
                                                JOIN usuario u
                                                    ON u.id = oe.subido_por
                                                WHERE oe.id = ?
                                                """,

                                (rs, rowNum) -> new OrdenEvidenciaResponse(
                                                rs.getLong("id"),
                                                rs.getLong("orden_id"),
                                                rs.getString("nombre_archivo"),
                                                rs.getString("tipo_contenido"),
                                                rs.getLong("tamanio_bytes"),
                                                rs.getString("descripcion"),
                                                rs.getLong("subido_por"),
                                                rs.getString("usuario_nombre"),
                                                rs.getTimestamp("creado_en")
                                                                .toLocalDateTime()),

                                evidenciaId);
        }

        public List<OrdenEvidenciaResponse> listarEvidencias(
                        Long ordenId) {

                return jdbcTemplate.query(
                                """
                                                SELECT
                                                    oe.id,
                                                    oe.orden_id,
                                                    oe.nombre_archivo,
                                                    oe.tipo_contenido,
                                                    oe.tamanio_bytes,
                                                    oe.descripcion,
                                                    oe.subido_por,
                                                    u.nombres AS usuario_nombre,
                                                    oe.creado_en
                                                FROM orden_evidencia oe
                                                JOIN usuario u
                                                    ON u.id = oe.subido_por
                                                WHERE oe.orden_id = ?
                                                ORDER BY oe.creado_en DESC
                                                """,

                                (rs, rowNum) -> new OrdenEvidenciaResponse(
                                                rs.getLong("id"),
                                                rs.getLong("orden_id"),
                                                rs.getString("nombre_archivo"),
                                                rs.getString("tipo_contenido"),
                                                rs.getLong("tamanio_bytes"),
                                                rs.getString("descripcion"),
                                                rs.getLong("subido_por"),
                                                rs.getString("usuario_nombre"),
                                                rs.getTimestamp("creado_en")
                                                                .toLocalDateTime()),

                                ordenId);
        }

        public ResponseEntity<byte[]> obtenerArchivoEvidencia(
                        Long ordenId,
                        Long evidenciaId) {

                return jdbcTemplate.queryForObject(
                                """
                                                SELECT
                                                    nombre_archivo,
                                                    tipo_contenido,
                                                    contenido
                                                FROM orden_evidencia
                                                WHERE id = ?
                                                  AND orden_id = ?
                                                """,
                                (rs, rowNum) -> {

                                        String nombreArchivo = rs.getString("nombre_archivo");

                                        String tipoContenido = rs.getString("tipo_contenido");

                                        byte[] contenido = rs.getBytes("contenido");

                                        MediaType mediaType = MediaType.parseMediaType(
                                                        tipoContenido);

                                        return ResponseEntity
                                                        .ok()
                                                        .contentType(mediaType)
                                                        .header(
                                                                        HttpHeaders.CONTENT_DISPOSITION,
                                                                        "inline; filename=\"" +
                                                                                        nombreArchivo +
                                                                                        "\"")
                                                        .body(contenido);
                                },
                                evidenciaId,
                                ordenId);
        }

        @Transactional
        public OrdenKilometrajeResponse actualizarKilometraje(
                        Long ordenId,
                        OrdenKilometrajeRequest request,
                        String correo) {

                if (request.kilometraje() == null ||
                                request.kilometraje().signum() < 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Debe ingresar un kilometraje válido");
                }

                Long usuarioId = jdbcTemplate.queryForObject(
                                """
                                                SELECT id
                                                FROM usuario
                                                WHERE correo = ?
                                                  AND activo = true
                                                """,
                                Long.class,
                                correo);

                if (usuarioId == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Usuario no válido");
                }

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

                if (!"EN_EJECUCION".equals(estado) &&
                                !"PENDIENTE_VALIDACION".equals(estado)) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "El kilometraje solo puede registrarse durante o después de la ejecución");
                }

                int actualizadas = jdbcTemplate.update(
                                """
                                                UPDATE orden_trabajo
                                                SET kilometraje_intervencion = ?
                                                WHERE id = ?
                                                """,
                                request.kilometraje(),
                                ordenId);

                if (actualizadas == 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Orden de trabajo no encontrada");
                }

                return new OrdenKilometrajeResponse(
                                ordenId,
                                request.kilometraje());
        }

        @Transactional
        public OrdenTrabajoResponse cerrarOrden(
                        Long ordenId,
                        OrdenCerrarRequest request,
                        String correo) {

                Long usuarioId = jdbcTemplate.queryForObject(
                                """
                                                SELECT id
                                                FROM usuario
                                                WHERE correo = ?
                                                  AND activo = true
                                                """,
                                Long.class,
                                correo);

                if (usuarioId == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Usuario no válido");
                }

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

                Map<String, Object> orden = jdbcTemplate.queryForMap(
                                """
                                                SELECT
                                                    codigo,
                                                    unidad_id,
                                                    estado,
                                                    inicio_real,
                                                    fin_real,
                                                    kilometraje_intervencion,
                                                    resultado_pruebas
                                                FROM orden_trabajo
                                                WHERE id = ?
                                                FOR UPDATE
                                                """,
                                ordenId);

                String codigoOrden = (String) orden.get("codigo");

                Long unidadId = ((Number) orden.get("unidad_id"))
                                .longValue();

                String estado = (String) orden.get("estado");

                if (!"PENDIENTE_VALIDACION".equals(estado)) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "La orden debe estar pendiente de validación para poder cerrarse");
                }

                if (orden.get("inicio_real") == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "La orden no tiene fecha de inicio real");
                }

                if (orden.get("fin_real") == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "La orden no tiene fecha de fin real");
                }

                if (orden.get("kilometraje_intervencion") == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Debe registrar el kilometraje de intervención");
                }

                String resultadoPruebas = (String) orden.get("resultado_pruebas");

                if (resultadoPruebas == null ||
                                resultadoPruebas.isBlank()) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Debe registrar el resultado de las pruebas");
                }

                Integer pendientes = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM orden_actividad
                                                WHERE orden_id = ?
                                                  AND obligatoria = true
                                                  AND completada = false
                                                """,
                                Integer.class,
                                ordenId);

                if (pendientes != null &&
                                pendientes > 0) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Existen actividades obligatorias pendientes");
                }

                Integer totalActividades = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM orden_actividad
                                                WHERE orden_id = ?
                                                """,
                                Integer.class,
                                ordenId);

                if (totalActividades == null ||
                                totalActividades == 0) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "La orden debe tener al menos una actividad");
                }

                String observaciones = request != null &&
                                request.observaciones() != null
                                                ? request.observaciones().trim()
                                                : null;

                /*
                 * 1. CERRAR LA OT
                 */
                jdbcTemplate.update(
                                """
                                                UPDATE orden_trabajo
                                                SET
                                                    estado = 'CERRADA',
                                                    validado_por = ?,
                                                    fecha_cierre = utc_now(),
                                                    observaciones_cierre = ?,
                                                    motivo_estado = 'Orden validada y cerrada'
                                                WHERE id = ?
                                                """,
                                usuarioId,
                                observaciones,
                                ordenId);

                /*
                 * 2. SINCRONIZAR PROGRAMACIÓN
                 * E INCIDENCIAS
                 */
                sincronizarCierreOrden(
                                ordenId,
                                usuarioId);

                /*
                 * 3. RECALCULAR ESTADO DE LA UNIDAD
                 */
                recalcularEstadoUnidad(
                                unidadId,
                                ordenId,
                                codigoOrden);

                return obtenerPorId(ordenId);
        }

        @Transactional
        public OrdenTrabajoResponse cancelarOrden(
                        Long ordenId,
                        OrdenCancelarRequest request,
                        String correo) {

                if (request == null ||
                                request.motivo() == null ||
                                request.motivo().isBlank()) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Debe indicar el motivo de cancelación");
                }

                Long usuarioId = jdbcTemplate.queryForObject(
                                """
                                                SELECT id
                                                FROM usuario
                                                WHERE correo = ?
                                                  AND activo = true
                                                """,
                                Long.class,
                                correo);

                if (usuarioId == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Usuario no válido");
                }

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

                Map<String, Object> orden = jdbcTemplate.queryForMap(
                                """
                                                SELECT
                                                    unidad_id,
                                                    codigo,
                                                    estado
                                                FROM orden_trabajo
                                                WHERE id = ?
                                                FOR UPDATE
                                                """,
                                ordenId);

                Long unidadId = ((Number) orden.get("unidad_id"))
                                .longValue();

                String codigoOrden = (String) orden.get("codigo");

                String estado = (String) orden.get("estado");

                if ("CERRADA".equals(estado) ||
                                "CANCELADA".equals(estado)) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "La orden ya se encuentra finalizada");
                }

                jdbcTemplate.update(
                                """
                                                UPDATE orden_trabajo
                                                SET
                                                    estado = 'CANCELADA',
                                                    motivo_estado = ?
                                                WHERE id = ?
                                                """,
                                request.motivo().trim(),
                                ordenId);

                recalcularEstadoUnidad(
                                unidadId,
                                ordenId,
                                codigoOrden);

                return obtenerPorId(ordenId);
        }

        private void sincronizarInicioOrden(
                        Long ordenId,
                        Long usuarioId) {

                Map<String, Object> orden = jdbcTemplate.queryForMap(
                                """
                                                SELECT
                                                    unidad_id,
                                                    programacion_id,
                                                    responsable_id,
                                                    codigo
                                                FROM orden_trabajo
                                                WHERE id = ?
                                                """,
                                ordenId);

                Long unidadId = ((Number) orden.get("unidad_id"))
                                .longValue();

                Long responsableId = ((Number) orden.get("responsable_id"))
                                .longValue();

                String codigoOrden = (String) orden.get("codigo");

                /* PROGRAMACIÓN */

                Object programacion = orden.get("programacion_id");

                if (programacion != null) {

                        Long programacionId = ((Number) programacion)
                                        .longValue();

                        jdbcTemplate.update(
                                        """
                                                        UPDATE programacion_mantenimiento
                                                        SET
                                                            estado = 'EN_EJECUCION',
                                                            motivo_cambio = ?
                                                        WHERE id = ?
                                                          AND estado = 'PROGRAMADA'
                                                        """,
                                        "Iniciada mediante " + codigoOrden,
                                        programacionId);
                }

                /* INCIDENCIAS */

                List<Map<String, Object>> incidencias = jdbcTemplate.queryForList(
                                """
                                                SELECT
                                                    i.id,
                                                    i.estado
                                                FROM orden_incidencia oi
                                                JOIN incidencia i
                                                    ON i.id = oi.incidencia_id
                                                WHERE oi.orden_id = ?
                                                """,
                                ordenId);

                for (Map<String, Object> incidencia : incidencias) {

                        Long incidenciaId = ((Number) incidencia.get("id"))
                                        .longValue();

                        String estado = (String) incidencia.get("estado");

                        /*
                         * Debemos respetar:
                         *
                         * REGISTRADA
                         * → EN_EVALUACION
                         * → ASIGNADA
                         * → EN_ATENCION
                         */

                        if ("REGISTRADA".equals(estado)) {

                                jdbcTemplate.update(
                                                """
                                                                UPDATE incidencia
                                                                SET
                                                                    estado = 'EN_EVALUACION',
                                                                    motivo_estado = ?
                                                                WHERE id = ?
                                                                """,
                                                "Evaluada mediante " + codigoOrden,
                                                incidenciaId);

                                estado = "EN_EVALUACION";
                        }

                        if ("EN_EVALUACION".equals(estado)) {

                                jdbcTemplate.update(
                                                """
                                                                UPDATE incidencia
                                                                SET
                                                                    estado = 'ASIGNADA',
                                                                    asignado_a = ?,
                                                                    motivo_estado = ?
                                                                WHERE id = ?
                                                                """,
                                                responsableId,
                                                "Asignada mediante " + codigoOrden,
                                                incidenciaId);

                                estado = "ASIGNADA";
                        }

                        if ("ASIGNADA".equals(estado)) {

                                jdbcTemplate.update(
                                                """
                                                                UPDATE incidencia
                                                                SET
                                                                    estado = 'EN_ATENCION',
                                                                    motivo_estado = ?
                                                                WHERE id = ?
                                                                """,
                                                "Atención iniciada mediante " +
                                                                codigoOrden,
                                                incidenciaId);
                        }
                }

                /* UNIDAD */

                jdbcTemplate.queryForObject(
                                """
                                                SELECT set_config(
                                                    'app.motivo',
                                                    ?,
                                                    true
                                                )
                                                """,
                                String.class,
                                "Unidad en mantenimiento por " +
                                                codigoOrden);

                jdbcTemplate.update(
                                """
                                                UPDATE unidad
                                                SET estado_operativo = 'EN_MANTENIMIENTO'
                                                WHERE id = ?
                                                  AND estado_operativo <> 'EN_MANTENIMIENTO'
                                                """,
                                unidadId);
        }

        private void sincronizarCierreOrden(
                        Long ordenId,
                        Long usuarioId) {

                Map<String, Object> orden = jdbcTemplate.queryForMap(
                                """
                                                SELECT
                                                    unidad_id,
                                                    programacion_id,
                                                    responsable_id,
                                                    codigo
                                                FROM orden_trabajo
                                                WHERE id = ?
                                                """,
                                ordenId);

                Long unidadId = ((Number) orden.get("unidad_id"))
                                .longValue();

                Long responsableId = ((Number) orden.get("responsable_id"))
                                .longValue();

                String codigoOrden = (String) orden.get("codigo");

                /*
                 * 1. PROGRAMACIÓN
                 */

                Object programacion = orden.get("programacion_id");

                if (programacion != null) {

                        Long programacionId = ((Number) programacion)
                                        .longValue();

                        jdbcTemplate.update(
                                        """
                                                        UPDATE programacion_mantenimiento
                                                        SET
                                                            estado = 'COMPLETADA',
                                                            motivo_cambio = ?
                                                        WHERE id = ?
                                                          AND estado IN (
                                                              'PROGRAMADA',
                                                              'EN_EJECUCION'
                                                          )
                                                        """,
                                        "Completada mediante " +
                                                        codigoOrden,
                                        programacionId);
                }

                /*
                 * 2. INCIDENCIAS
                 */

                List<Map<String, Object>> incidencias = jdbcTemplate.queryForList(
                                """
                                                SELECT
                                                    i.id,
                                                    i.estado
                                                FROM orden_incidencia oi
                                                JOIN incidencia i
                                                    ON i.id = oi.incidencia_id
                                                WHERE oi.orden_id = ?
                                                """,
                                ordenId);

                for (Map<String, Object> incidencia : incidencias) {

                        Long incidenciaId = ((Number) incidencia.get("id"))
                                        .longValue();

                        String estado = (String) incidencia.get("estado");

                        /*
                         * Esto también corrige OTs antiguas
                         * que tengan incidencias atrasadas.
                         */

                        if ("REGISTRADA".equals(estado)) {

                                jdbcTemplate.update(
                                                """
                                                                UPDATE incidencia
                                                                SET
                                                                    estado = 'EN_EVALUACION',
                                                                    motivo_estado = ?
                                                                WHERE id = ?
                                                                """,
                                                "Evaluada mediante " +
                                                                codigoOrden,
                                                incidenciaId);

                                estado = "EN_EVALUACION";
                        }

                        if ("EN_EVALUACION".equals(estado)) {

                                jdbcTemplate.update(
                                                """
                                                                UPDATE incidencia
                                                                SET
                                                                    estado = 'ASIGNADA',
                                                                    asignado_a = ?,
                                                                    motivo_estado = ?
                                                                WHERE id = ?
                                                                """,
                                                responsableId,
                                                "Asignada mediante " +
                                                                codigoOrden,
                                                incidenciaId);

                                estado = "ASIGNADA";
                        }

                        if ("ASIGNADA".equals(estado)) {

                                jdbcTemplate.update(
                                                """
                                                                UPDATE incidencia
                                                                SET
                                                                    estado = 'EN_ATENCION',
                                                                    motivo_estado = ?
                                                                WHERE id = ?
                                                                """,
                                                "Atendida mediante " +
                                                                codigoOrden,
                                                incidenciaId);

                                estado = "EN_ATENCION";
                        }

                        if ("EN_ATENCION".equals(estado)) {

                                jdbcTemplate.update(
                                                """
                                                                UPDATE incidencia
                                                                SET
                                                                    estado = 'RESUELTA',
                                                                    motivo_estado = ?
                                                                WHERE id = ?
                                                                """,
                                                "Resuelta mediante cierre de " +
                                                                codigoOrden,
                                                incidenciaId);
                        }
                }

                /*
                 * 3. VERIFICAR OTRAS OT ACTIVAS
                 */

                Integer ordenesPendientes = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM orden_trabajo
                                                WHERE unidad_id = ?
                                                  AND id <> ?
                                                  AND estado IN (
                                                      'ABIERTA',
                                                      'ASIGNADA',
                                                      'EN_EJECUCION',
                                                      'PENDIENTE_VALIDACION'
                                                  )
                                                """,
                                Integer.class,
                                unidadId,
                                ordenId);

                /*
                 * 4. VERIFICAR INCIDENCIAS PENDIENTES
                 */

                Integer incidenciasPendientes = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM incidencia
                                                WHERE unidad_id = ?
                                                  AND estado NOT IN (
                                                      'RESUELTA',
                                                      'CERRADA',
                                                      'ANULADA'
                                                  )
                                                """,
                                Integer.class,
                                unidadId);

                /*
                 * 5. DECIDIR ESTADO DE LA UNIDAD
                 */

                boolean tienePendientes = (ordenesPendientes != null &&
                                ordenesPendientes > 0)
                                ||
                                (incidenciasPendientes != null &&
                                                incidenciasPendientes > 0);

                String nuevoEstado = tienePendientes
                                ? "EN_MANTENIMIENTO"
                                : "OPERATIVA";

                String motivoUnidad;

                if (tienePendientes) {

                        motivoUnidad = "La unidad mantiene trabajos pendientes tras cierre de "
                                        + codigoOrden;

                } else {

                        motivoUnidad = "Unidad liberada tras cierre de "
                                        + codigoOrden
                                        + " sin trabajos pendientes";
                }

                /*
                 * app.motivo() será usado por
                 * fn_unidad_cambio_estado()
                 */

                jdbcTemplate.queryForObject(
                                """
                                                SELECT set_config(
                                                    'app.motivo',
                                                    ?,
                                                    true
                                                )
                                                """,
                                String.class,
                                motivoUnidad);

                jdbcTemplate.update(
                                """
                                                UPDATE unidad
                                                SET estado_operativo = ?
                                                WHERE id = ?
                                                  AND estado_operativo <> ?
                                                """,
                                nuevoEstado,
                                unidadId,
                                nuevoEstado);
        }

        private void recalcularEstadoUnidad(
                        Long unidadId,
                        Long ordenId,
                        String codigoOrden) {

                Integer ordenesPendientes = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM orden_trabajo
                                                WHERE unidad_id = ?
                                                  AND id <> ?
                                                  AND estado IN (
                                                      'ABIERTA',
                                                      'ASIGNADA',
                                                      'EN_EJECUCION',
                                                      'PENDIENTE_VALIDACION'
                                                  )
                                                """,
                                Integer.class,
                                unidadId,
                                ordenId);

                Integer incidenciasPendientes = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM incidencia
                                                WHERE unidad_id = ?
                                                  AND estado NOT IN (
                                                      'RESUELTA',
                                                      'CERRADA',
                                                      'ANULADA'
                                                  )
                                                """,
                                Integer.class,
                                unidadId);

                boolean tienePendientes = (ordenesPendientes != null && ordenesPendientes > 0)
                                ||
                                (incidenciasPendientes != null && incidenciasPendientes > 0);

                String nuevoEstado = tienePendientes
                                ? "EN_MANTENIMIENTO"
                                : "OPERATIVA";

                String motivo = tienePendientes
                                ? "La unidad mantiene trabajos pendientes tras " + codigoOrden
                                : "Unidad liberada sin trabajos pendientes tras " + codigoOrden;

                jdbcTemplate.queryForObject(
                                """
                                                SELECT set_config(
                                                    'app.motivo',
                                                    ?,
                                                    true
                                                )
                                                """,
                                String.class,
                                motivo);

                jdbcTemplate.update(
                                """
                                                UPDATE unidad
                                                SET estado_operativo = ?
                                                WHERE id = ?
                                                  AND estado_operativo <> ?
                                                """,
                                nuevoEstado,
                                unidadId,
                                nuevoEstado);
        }

        public List<OrdenResponsableResponse> listarResponsablesDisponibles() {

                return jdbcTemplate.query(
                                """
                                                SELECT DISTINCT
                                                    u.id,
                                                    u.nombres,
                                                    u.apellidos,
                                                    u.correo,
                                                    r.nombre AS rol
                                                FROM usuario u
                                                JOIN usuario_rol ur
                                                    ON ur.usuario_id = u.id
                                                JOIN rol r
                                                    ON r.id = ur.rol_id
                                                WHERE u.activo = true
                                                  AND r.codigo IN (
                                                      'TECNICO',
                                                      'JEFE_MANTENIMIENTO'
                                                  )
                                                ORDER BY u.nombres, u.apellidos
                                                """,
                                (rs, rowNum) -> new OrdenResponsableResponse(
                                                rs.getLong("id"),
                                                rs.getString("nombres"),
                                                rs.getString("apellidos"),
                                                rs.getString("correo"),
                                                rs.getString("rol")));
        }
}