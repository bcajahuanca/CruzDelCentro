package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.MantenimientoResponse;
import com.cruzdelcentro.backend.dto.MantenimientoCreateRequest;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class MantenimientoService {

    private final JdbcTemplate jdbcTemplate;

    public MantenimientoService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }


    public List<MantenimientoResponse> listarMantenimientos() {

        String sql = """
            SELECT
                pm.id,
                pm.unidad_id,
                u.codigo AS unidad_codigo,
                u.placa,

                pm.tipo,
                pm.descripcion,

                pm.fecha_vencimiento,
                pm.kilometraje_objetivo,

                (
                    SELECT lk.kilometraje
                    FROM lectura_kilometraje lk
                    WHERE lk.unidad_id = u.id
                    ORDER BY lk.fecha_lectura DESC
                    LIMIT 1
                ) AS kilometraje_actual,

                pm.responsable_id,

                CONCAT(
                    ur.nombres,
                    ' ',
                    ur.apellidos
                ) AS responsable,

                pm.estado,

                CASE

                    WHEN pm.estado = 'COMPLETADA'
                        THEN 'COMPLETADO'

                    WHEN pm.estado = 'CANCELADA'
                        THEN 'CANCELADO'

                    WHEN pm.estado = 'EN_EJECUCION'
                        THEN 'EN_EJECUCION'

                    WHEN (
                        pm.kilometraje_objetivo IS NOT NULL
                        AND (
                            SELECT lk.kilometraje
                            FROM lectura_kilometraje lk
                            WHERE lk.unidad_id = u.id
                            ORDER BY lk.fecha_lectura DESC
                            LIMIT 1
                        ) IS NULL
                    )
                        THEN 'SIN_LECTURA'

                    WHEN (
                        pm.fecha_vencimiento IS NOT NULL
                        AND pm.fecha_vencimiento < CURRENT_DATE
                    )
                    OR (
                        pm.kilometraje_objetivo IS NOT NULL
                        AND (
                            SELECT lk.kilometraje
                            FROM lectura_kilometraje lk
                            WHERE lk.unidad_id = u.id
                            ORDER BY lk.fecha_lectura DESC
                            LIMIT 1
                        ) >= pm.kilometraje_objetivo
                    )
                        THEN 'VENCIDO'

                    WHEN (
                        pm.fecha_vencimiento IS NOT NULL
                        AND pm.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
                    )
                    OR (
                        pm.kilometraje_objetivo IS NOT NULL
                        AND (
                            SELECT lk.kilometraje
                            FROM lectura_kilometraje lk
                            WHERE lk.unidad_id = u.id
                            ORDER BY lk.fecha_lectura DESC
                            LIMIT 1
                        ) >= pm.kilometraje_objetivo - 500
                    )
                        THEN 'PROXIMO'

                    ELSE 'PROGRAMADO'

                END AS situacion

            FROM programacion_mantenimiento pm

            JOIN unidad u
                ON u.id = pm.unidad_id

            JOIN usuario ur
                ON ur.id = pm.responsable_id

            WHERE pm.estado <> 'CANCELADA'

            ORDER BY
                CASE
                    WHEN pm.fecha_vencimiento IS NULL
                        THEN 1
                    ELSE 0
                END,
                pm.fecha_vencimiento ASC,
                pm.id DESC
            """;


        return jdbcTemplate.query(
            sql,
            (rs, rowNum) -> {

                BigDecimal kilometrajeActual =
                    rs.getBigDecimal(
                        "kilometraje_actual"
                    );

                BigDecimal kilometrajeObjetivo =
                    rs.getBigDecimal(
                        "kilometraje_objetivo"
                    );

                LocalDate fechaVencimiento = null;

                if (
                    rs.getDate(
                        "fecha_vencimiento"
                    ) != null
                ) {
                    fechaVencimiento =
                        rs.getDate(
                            "fecha_vencimiento"
                        ).toLocalDate();
                }

                return new MantenimientoResponse(
                    rs.getLong("id"),

                    rs.getLong(
                        "unidad_id"
                    ),

                    rs.getString(
                        "unidad_codigo"
                    ),

                    rs.getString(
                        "placa"
                    ),

                    rs.getString(
                        "tipo"
                    ),

                    rs.getString(
                        "descripcion"
                    ),

                    fechaVencimiento,

                    kilometrajeObjetivo,

                    kilometrajeActual,

                    rs.getLong(
                        "responsable_id"
                    ),

                    rs.getString(
                        "responsable"
                    ),

                    rs.getString(
                        "estado"
                    ),

                    rs.getString(
                        "situacion"
                    )
                );
            }
        );
    }

    @Transactional
    public MantenimientoResponse crearMantenimiento(
        MantenimientoCreateRequest request
    ) {

        // 1. Validar unidad

        if (request.unidadId() == null) {
            throw new IllegalArgumentException(
                "Debe seleccionar una unidad"
            );
        }


        // 2. Validar tipo

        if (
            request.tipo() == null ||
            !List.of(
                "PREVENTIVO",
                "CORRECTIVO"
            ).contains(request.tipo())
        ) {
            throw new IllegalArgumentException(
                "Tipo de mantenimiento inválido"
            );
        }


        // 3. Descripción

        if (
            request.descripcion() == null ||
            request.descripcion().isBlank()
        ) {
            throw new IllegalArgumentException(
                "La descripción es obligatoria"
            );
        }


        // 4. Responsable

        if (request.responsableId() == null) {
            throw new IllegalArgumentException(
                "Debe seleccionar un responsable"
            );
        }


        // 5. Debe existir al menos una condición
        // fecha o kilometraje

        if (
            request.fechaVencimiento() == null &&
            request.kilometrajeObjetivo() == null
        ) {
            throw new IllegalArgumentException(
                "Debe indicar una fecha de vencimiento o kilometraje objetivo"
            );
        }


        // 6. Kilometraje válido

        if (
            request.kilometrajeObjetivo() != null &&
            request.kilometrajeObjetivo()
                .compareTo(BigDecimal.ZERO) < 0
        ) {
            throw new IllegalArgumentException(
                "El kilometraje objetivo no puede ser negativo"
            );
        }


        // 7. Horario programado

        if (
            (request.inicioProgramado() == null &&
            request.finProgramado() != null)
            ||
            (request.inicioProgramado() != null &&
            request.finProgramado() == null)
        ) {
            throw new IllegalArgumentException(
                "Debe indicar inicio y fin programado"
            );
        }


        if (
            request.inicioProgramado() != null &&
            !request.finProgramado()
                .isAfter(request.inicioProgramado())
        ) {
            throw new IllegalArgumentException(
                "La fecha de finalización debe ser posterior al inicio"
            );
        }


        // 8. Verificar unidad activa

        Integer existeUnidad =
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
            existeUnidad == null ||
            existeUnidad == 0
        ) {
            throw new IllegalArgumentException(
                "La unidad no existe o está inactiva"
            );
        }


        // 9. Verificar responsable activo

        Integer existeResponsable =
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
            existeResponsable == null ||
            existeResponsable == 0
        ) {
            throw new IllegalArgumentException(
                "El responsable no existe o está inactivo"
            );
        }


        // 10. Si tiene plan_unidad,
        // necesariamente debe ser preventivo

        if (request.planUnidadId() != null) {

            if (!request.tipo().equals("PREVENTIVO")) {
                throw new IllegalArgumentException(
                    "Solo un mantenimiento preventivo puede estar asociado a un plan"
                );
            }

            if (
                request.ciclo() == null ||
                request.ciclo() <= 0
            ) {
                throw new IllegalArgumentException(
                    "Debe indicar un ciclo válido para el plan preventivo"
                );
            }


            Integer existePlanUnidad =
                jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM plan_unidad
                    WHERE id = ?
                    AND unidad_id = ?
                    """,
                    Integer.class,
                    request.planUnidadId(),
                    request.unidadId()
                );


            if (
                existePlanUnidad == null ||
                existePlanUnidad == 0
            ) {
                throw new IllegalArgumentException(
                    "El plan no está asignado a esta unidad"
                );
            }
        }


        // 11. Insertar programación

        Long id = jdbcTemplate.queryForObject(
            """
            INSERT INTO programacion_mantenimiento (
                unidad_id,
                plan_unidad_id,
                tipo,
                descripcion,
                fecha_vencimiento,
                kilometraje_objetivo,
                inicio_programado,
                fin_programado,
                responsable_id,
                estado,
                ciclo
            )
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                'PROGRAMADA',
                ?
            )
            RETURNING id
            """,

            Long.class,

            request.unidadId(),
            request.planUnidadId(),
            request.tipo(),
            request.descripcion().trim(),
            request.fechaVencimiento(),
            request.kilometrajeObjetivo(),
            request.inicioProgramado(),
            request.finProgramado(),
            request.responsableId(),
            request.ciclo()
        );


        if (id == null) {
            throw new IllegalStateException(
                "No se pudo crear el mantenimiento"
            );
        }


        // 12. Devolver el mantenimiento creado

        return obtenerMantenimientoPorId(id);
    }

    public MantenimientoResponse obtenerMantenimientoPorId(
        Long id
    ) {

        String sql = """
            SELECT
                pm.id,
                pm.unidad_id,

                u.codigo AS unidad_codigo,
                u.placa,

                pm.tipo,
                pm.descripcion,

                pm.fecha_vencimiento,
                pm.kilometraje_objetivo,

                (
                    SELECT lk.kilometraje
                    FROM lectura_kilometraje lk
                    WHERE lk.unidad_id = u.id
                    ORDER BY lk.fecha_lectura DESC
                    LIMIT 1
                ) AS kilometraje_actual,

                pm.responsable_id,

                CONCAT(
                    ur.nombres,
                    ' ',
                    ur.apellidos
                ) AS responsable,

                pm.estado

            FROM programacion_mantenimiento pm

            JOIN unidad u
                ON u.id = pm.unidad_id

            JOIN usuario ur
                ON ur.id = pm.responsable_id

            WHERE pm.id = ?
            """;


        return jdbcTemplate.queryForObject(
            sql,

            (rs, rowNum) -> {

                String estado =
                    rs.getString("estado");

                String situacion;

                if (estado.equals("COMPLETADA")) {

                    situacion = "COMPLETADO";

                } else if (estado.equals("CANCELADA")) {

                    situacion = "CANCELADO";

                } else if (estado.equals("EN_EJECUCION")) {

                    situacion = "EN_EJECUCION";

                } else {

                    situacion = "PROGRAMADO";
                }


                return new MantenimientoResponse(
                    rs.getLong("id"),

                    rs.getLong(
                        "unidad_id"
                    ),

                    rs.getString(
                        "unidad_codigo"
                    ),

                    rs.getString(
                        "placa"
                    ),

                    rs.getString(
                        "tipo"
                    ),

                    rs.getString(
                        "descripcion"
                    ),

                    rs.getDate(
                        "fecha_vencimiento"
                    ) != null
                        ? rs.getDate(
                            "fecha_vencimiento"
                        ).toLocalDate()
                        : null,

                    rs.getBigDecimal(
                        "kilometraje_objetivo"
                    ),

                    rs.getBigDecimal(
                        "kilometraje_actual"
                    ),

                    rs.getLong(
                        "responsable_id"
                    ),

                    rs.getString(
                        "responsable"
                    ),

                    estado,

                    situacion
                );
            },

            id
        );
    }
}