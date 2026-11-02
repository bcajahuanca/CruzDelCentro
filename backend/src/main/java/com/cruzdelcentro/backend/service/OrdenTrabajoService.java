package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.OrdenTrabajoCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenTrabajoResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrdenTrabajoService {

    private final JdbcTemplate jdbcTemplate;

    public OrdenTrabajoService(
        JdbcTemplate jdbcTemplate
    ) {
        this.jdbcTemplate = jdbcTemplate;
    }


    @Transactional
    public OrdenTrabajoResponse crearOrden(
        OrdenTrabajoCreateRequest request
    ) {

        if (request.unidadId() == null) {
            throw new IllegalArgumentException(
                "Debe seleccionar una unidad"
            );
        }

        if (
            request.tipo() == null ||
            !List.of(
                "PREVENTIVO",
                "CORRECTIVO"
            ).contains(request.tipo())
        ) {
            throw new IllegalArgumentException(
                "Tipo de orden inválido"
            );
        }

        if (request.responsableId() == null) {
            throw new IllegalArgumentException(
                "Debe seleccionar un responsable"
            );
        }


        /*
         * Validar unidad
         */

        Integer unidadExiste =
            jdbcTemplate.queryForObject(
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
            unidadExiste == null ||
            unidadExiste == 0
        ) {
            throw new IllegalArgumentException(
                "La unidad no existe o está inactiva"
            );
        }


        /*
         * Validar responsable
         */

        Integer responsableExiste =
            jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM usuario
                WHERE id = ?
                AND activo = true
                """,
                Integer.class,
                request.responsableId()
            );

        if (
            responsableExiste == null ||
            responsableExiste == 0
        ) {
            throw new IllegalArgumentException(
                "El responsable no existe o está inactivo"
            );
        }


        /*
         * Si viene de mantenimiento programado,
         * debe pertenecer a la misma unidad
         * y tener el mismo tipo.
         */

        if (request.programacionId() != null) {

            Integer programacionValida =
                jdbcTemplate.queryForObject(
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
                    request.tipo()
                );

            if (
                programacionValida == null ||
                programacionValida == 0
            ) {
                throw new IllegalArgumentException(
                    "La programación no corresponde a la unidad y tipo seleccionados"
                );
            }


            /*
             * La BD ya tiene UNIQUE sobre
             * programacion_vigente, pero damos
             * un mensaje más claro.
             */

            Integer ordenExistente =
                jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM orden_trabajo
                    WHERE programacion_id = ?
                    AND estado <> 'CANCELADA'
                    """,
                    Integer.class,
                    request.programacionId()
                );

            if (
                ordenExistente != null &&
                ordenExistente > 0
            ) {
                throw new IllegalArgumentException(
                    "La programación ya tiene una orden de trabajo vigente"
                );
            }
        }


        /*
         * Obtener siguiente ID para generar
         * código único OT-00001.
         */

        Long id =
            jdbcTemplate.queryForObject(
                """
                SELECT nextval(
                    pg_get_serial_sequence(
                        'orden_trabajo',
                        'id'
                    )
                )
                """,
                Long.class
            );


        if (id == null) {
            throw new IllegalStateException(
                "No se pudo generar el identificador de la orden"
            );
        }


        String codigo =
            "OT-%05d".formatted(id);


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
                'ABIERTA',
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
            request.fechaEstimadaFin()
        );


        return obtenerPorId(id);
    }


    public OrdenTrabajoResponse obtenerPorId(
        Long id
    ) {

        List<OrdenTrabajoResponse> resultados =
            jdbcTemplate.query(
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

                (rs, rowNum) ->
                    new OrdenTrabajoResponse(
                        rs.getLong("id"),
                        rs.getString("codigo"),

                        rs.getLong("unidad_id"),
                        rs.getString("unidad_codigo"),
                        rs.getString("placa"),

                        rs.getObject(
                            "programacion_id",
                            Long.class
                        ),

                        rs.getString("tipo"),
                        rs.getString("diagnostico"),

                        rs.getLong("responsable_id"),
                        rs.getString("responsable"),

                        rs.getObject(
                            "proveedor_id",
                            Long.class
                        ),

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
                            : null
                    ),

                id
            );


        if (resultados.isEmpty()) {
            throw new IllegalArgumentException(
                "La orden de trabajo no existe"
            );
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

            (rs, rowNum) ->
                new OrdenTrabajoResponse(
                    rs.getLong("id"),
                    rs.getString("codigo"),

                    rs.getLong("unidad_id"),
                    rs.getString("unidad_codigo"),
                    rs.getString("placa"),

                    rs.getObject(
                        "programacion_id",
                        Long.class
                    ),

                    rs.getString("tipo"),
                    rs.getString("diagnostico"),

                    rs.getLong("responsable_id"),
                    rs.getString("responsable"),

                    rs.getObject(
                        "proveedor_id",
                        Long.class
                    ),

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
                        : null
                )
        );
    }
}