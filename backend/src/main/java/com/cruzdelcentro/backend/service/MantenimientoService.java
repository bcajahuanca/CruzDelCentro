package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.MantenimientoResponse;
import com.cruzdelcentro.backend.dto.MantenimientoCancelarRequest;
import com.cruzdelcentro.backend.dto.MantenimientoCreateRequest;
import com.cruzdelcentro.backend.dto.MantenimientoReprogramarRequest;

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

        return jdbcTemplate.query(
            """
            SELECT
                pm.id,
                pm.unidad_id,
                u.codigo AS unidad_codigo,
                u.placa,

                pm.tipo,
                pm.descripcion,
                pm.fecha_vencimiento,
                pm.kilometraje_objetivo,
                pm.inicio_programado,
                pm.fin_programado,

                ultima.kilometraje AS kilometraje_actual,

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


                    /* VENCIDO POR FECHA O KILOMETRAJE */

                    WHEN (
                        pm.fecha_vencimiento IS NOT NULL
                        AND pm.fecha_vencimiento < CURRENT_DATE
                    )
                    OR (
                        pm.kilometraje_objetivo IS NOT NULL
                        AND ultima.kilometraje IS NOT NULL
                        AND ultima.kilometraje >=
                            pm.kilometraje_objetivo
                    )
                        THEN 'VENCIDO'


                    /* PRÓXIMO */

                    WHEN (
                        pm.fecha_vencimiento IS NOT NULL
                        AND pm.fecha_vencimiento >= CURRENT_DATE
                        AND pm.fecha_vencimiento <=
                            CURRENT_DATE
                            + COALESCE(
                                plan.anticipacion_dias,
                                7
                            )
                    )
                    OR (
                        pm.kilometraje_objetivo IS NOT NULL
                        AND ultima.kilometraje IS NOT NULL
                        AND ultima.kilometraje >=
                            pm.kilometraje_objetivo
                            - COALESCE(
                                plan.anticipacion_km,
                                500
                            )
                    )
                        THEN 'PROXIMO'


                    /* REQUIERE KM PERO NO EXISTE LECTURA */

                    WHEN (
                        pm.kilometraje_objetivo IS NOT NULL
                        AND ultima.kilometraje IS NULL
                    )
                        THEN 'SIN_LECTURA'


                    ELSE 'PROGRAMADO'

                END AS situacion


            FROM programacion_mantenimiento pm

            JOIN unidad u
                ON u.id = pm.unidad_id

            JOIN usuario ur
                ON ur.id = pm.responsable_id


            /* ASIGNACIÓN DEL PLAN */

            LEFT JOIN plan_unidad pu
                ON pu.id = pm.plan_unidad_id


            /* PLAN PREVENTIVO */

            LEFT JOIN plan_mantenimiento plan
                ON plan.id = pu.plan_id


            /* ÚLTIMA LECTURA REAL DE LA UNIDAD */

            LEFT JOIN LATERAL (

                SELECT
                    lk.kilometraje

                FROM lectura_kilometraje lk

                WHERE lk.unidad_id =
                    pm.unidad_id

                ORDER BY
                    lk.fecha_lectura DESC

                LIMIT 1

            ) ultima ON true


            ORDER BY
                pm.fecha_vencimiento ASC NULLS LAST,
                pm.kilometraje_objetivo ASC NULLS LAST,
                pm.id DESC
            """,

            (rs, rowNum) ->
                new MantenimientoResponse(
                    rs.getLong("id"),
                    rs.getLong("unidad_id"),
                    rs.getString("unidad_codigo"),
                    rs.getString("placa"),
                    rs.getString("tipo"),
                    rs.getString("descripcion"),

                    rs.getDate("fecha_vencimiento") != null
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

                    rs.getTimestamp("inicio_programado") != null
                        ? rs.getTimestamp("inicio_programado")
                            .toLocalDateTime()
                        : null,

                    rs.getTimestamp("fin_programado") != null
                        ? rs.getTimestamp("fin_programado")
                            .toLocalDateTime()
                        : null,

                    rs.getLong(
                        "responsable_id"
                    ),

                    rs.getString(
                        "responsable"
                    ),

                    rs.getString("estado"),
                    rs.getString("situacion")
                )
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

        List<MantenimientoResponse> resultados =
            jdbcTemplate.query(
                """
                SELECT
                    pm.id,
                    pm.unidad_id,
                    u.codigo AS unidad_codigo,
                    u.placa,

                    pm.tipo,
                    pm.descripcion,
                    pm.fecha_vencimiento,
                    pm.kilometraje_objetivo,
                    pm.inicio_programado,
                    pm.fin_programado,

                    ultima.kilometraje
                        AS kilometraje_actual,

                    pm.responsable_id,

                    CONCAT(
                        ur.nombres,
                        ' ',
                        ur.apellidos
                    ) AS responsable,

                    pm.estado,

                    CASE

                        WHEN pm.estado =
                            'COMPLETADA'
                            THEN 'COMPLETADO'

                        WHEN pm.estado =
                            'CANCELADA'
                            THEN 'CANCELADO'

                        WHEN pm.estado =
                            'EN_EJECUCION'
                            THEN 'EN_EJECUCION'


                        WHEN (
                            pm.fecha_vencimiento
                                IS NOT NULL
                            AND
                            pm.fecha_vencimiento
                                < CURRENT_DATE
                        )
                        OR (
                            pm.kilometraje_objetivo
                                IS NOT NULL
                            AND ultima.kilometraje
                                IS NOT NULL
                            AND ultima.kilometraje >=
                                pm.kilometraje_objetivo
                        )
                            THEN 'VENCIDO'


                        WHEN (
                            pm.fecha_vencimiento
                                IS NOT NULL
                            AND
                            pm.fecha_vencimiento
                                >= CURRENT_DATE
                            AND
                            pm.fecha_vencimiento <=
                                CURRENT_DATE
                                + COALESCE(
                                    plan.anticipacion_dias,
                                    7
                                )
                        )
                        OR (
                            pm.kilometraje_objetivo
                                IS NOT NULL
                            AND ultima.kilometraje
                                IS NOT NULL
                            AND ultima.kilometraje >=
                                pm.kilometraje_objetivo
                                - COALESCE(
                                    plan.anticipacion_km,
                                    500
                                )
                        )
                            THEN 'PROXIMO'


                        WHEN (
                            pm.kilometraje_objetivo
                                IS NOT NULL
                            AND ultima.kilometraje
                                IS NULL
                        )
                            THEN 'SIN_LECTURA'


                        ELSE 'PROGRAMADO'

                    END AS situacion


                FROM programacion_mantenimiento pm

                JOIN unidad u
                    ON u.id = pm.unidad_id

                JOIN usuario ur
                    ON ur.id =
                        pm.responsable_id

                LEFT JOIN plan_unidad pu
                    ON pu.id =
                        pm.plan_unidad_id

                LEFT JOIN plan_mantenimiento plan
                    ON plan.id =
                        pu.plan_id

                LEFT JOIN LATERAL (

                    SELECT
                        lk.kilometraje

                    FROM lectura_kilometraje lk

                    WHERE lk.unidad_id =
                        pm.unidad_id

                    ORDER BY
                        lk.fecha_lectura DESC

                    LIMIT 1

                ) ultima ON true


                WHERE pm.id = ?
                """,

                (rs, rowNum) ->
                    new MantenimientoResponse(
                        rs.getLong("id"),

                        rs.getLong(
                            "unidad_id"
                        ),

                        rs.getString(
                            "unidad_codigo"
                        ),

                        rs.getString("placa"),

                        rs.getString("tipo"),

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

                        rs.getTimestamp("inicio_programado") != null
                            ? rs.getTimestamp("inicio_programado")
                                .toLocalDateTime()
                            : null,

                        rs.getTimestamp("fin_programado") != null
                            ? rs.getTimestamp("fin_programado")
                                .toLocalDateTime()
                            : null,

                        rs.getLong(
                            "responsable_id"
                        ),

                        rs.getString(
                            "responsable"
                        ),

                        rs.getString("estado"),

                        rs.getString(
                            "situacion"
                        )
                    ),

                id
            );


        if (resultados.isEmpty()) {
            throw new IllegalArgumentException(
                "El mantenimiento no existe"
            );
        }


        return resultados.get(0);
    }

    @Transactional
    public MantenimientoResponse reprogramarMantenimiento(
        Long id,
        MantenimientoReprogramarRequest request
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                "Los datos de reprogramación son obligatorios"
            );
        }

        if (
            request.fechaVencimiento() == null &&
            request.kilometrajeObjetivo() == null
        ) {
            throw new IllegalArgumentException(
                "Debe indicar una fecha de vencimiento o kilometraje objetivo"
            );
        }

        if (
            request.kilometrajeObjetivo() != null &&
            request.kilometrajeObjetivo()
                .compareTo(BigDecimal.ZERO) < 0
        ) {
            throw new IllegalArgumentException(
                "El kilometraje objetivo no puede ser negativo"
            );
        }

        if (
            request.motivo() == null ||
            request.motivo().isBlank()
        ) {
            throw new IllegalArgumentException(
                "Debe indicar el motivo de la reprogramación"
            );
        }


        String estado =
            jdbcTemplate.queryForObject(
                """
                SELECT estado
                FROM programacion_mantenimiento
                WHERE id = ?
                """,
                String.class,
                id
            );


        if (estado == null) {
            throw new IllegalArgumentException(
                "El mantenimiento no existe"
            );
        }


        if (
            estado.equals("COMPLETADA") ||
            estado.equals("CANCELADA")
        ) {
            throw new IllegalArgumentException(
                "No se puede reprogramar un mantenimiento completado o cancelado"
            );
        }


        int filas =
            jdbcTemplate.update(
                """
                UPDATE programacion_mantenimiento
                SET
                    fecha_vencimiento = ?,
                    kilometraje_objetivo = ?,
                    motivo_cambio = ?,
                    actualizado_en = utc_now()
                WHERE id = ?
                """,

                request.fechaVencimiento(),
                request.kilometrajeObjetivo(),
                request.motivo().trim(),
                id
            );


        if (filas == 0) {
            throw new IllegalArgumentException(
                "No se pudo reprogramar el mantenimiento"
            );
        }


        return obtenerMantenimientoPorId(id);
    }

    @Transactional
    public MantenimientoResponse cancelarMantenimiento(
        Long id,
        MantenimientoCancelarRequest request
    ) {

        if (
            request == null ||
            request.motivo() == null ||
            request.motivo().isBlank()
        ) {
            throw new IllegalArgumentException(
                "Debe indicar el motivo de cancelación"
            );
        }


        String estado =
            jdbcTemplate.queryForObject(
                """
                SELECT estado
                FROM programacion_mantenimiento
                WHERE id = ?
                """,
                String.class,
                id
            );


        if (estado == null) {
            throw new IllegalArgumentException(
                "El mantenimiento no existe"
            );
        }


        if (estado.equals("CANCELADA")) {
            throw new IllegalArgumentException(
                "El mantenimiento ya está cancelado"
            );
        }


        if (estado.equals("COMPLETADA")) {
            throw new IllegalArgumentException(
                "No se puede cancelar un mantenimiento completado"
            );
        }


        int filas =
            jdbcTemplate.update(
                """
                UPDATE programacion_mantenimiento
                SET
                    estado = 'CANCELADA',
                    motivo_cambio = ?,
                    actualizado_en = utc_now()
                WHERE id = ?
                """,

                request.motivo().trim(),
                id
            );


        if (filas == 0) {
            throw new IllegalArgumentException(
                "No se pudo cancelar el mantenimiento"
            );
        }


        return obtenerMantenimientoPorId(id);
    }

    @Transactional
    public MantenimientoResponse iniciarMantenimiento(
        Long id
    ) {

        String estado =
            jdbcTemplate.queryForObject(
                """
                SELECT estado
                FROM programacion_mantenimiento
                WHERE id = ?
                """,
                String.class,
                id
            );

        if (estado == null) {
            throw new IllegalArgumentException(
                "El mantenimiento no existe"
            );
        }

        if (estado.equals("CANCELADA")) {
            throw new IllegalArgumentException(
                "No se puede iniciar un mantenimiento cancelado"
            );
        }

        if (estado.equals("COMPLETADA")) {
            throw new IllegalArgumentException(
                "El mantenimiento ya está completado"
            );
        }

        if (estado.equals("EN_EJECUCION")) {
            throw new IllegalArgumentException(
                "El mantenimiento ya está en ejecución"
            );
        }

        jdbcTemplate.update(
            """
            UPDATE programacion_mantenimiento
            SET
                estado = 'EN_EJECUCION',
                actualizado_en = utc_now()
            WHERE id = ?
            """,
            id
        );

        return obtenerMantenimientoPorId(id);
    }

    @Transactional
    public MantenimientoResponse completarMantenimiento(
        Long id
    ) {

        String estado =
            jdbcTemplate.queryForObject(
                """
                SELECT estado
                FROM programacion_mantenimiento
                WHERE id = ?
                """,
                String.class,
                id
            );

        if (estado == null) {
            throw new IllegalArgumentException(
                "El mantenimiento no existe"
            );
        }

        if (estado.equals("CANCELADA")) {
            throw new IllegalArgumentException(
                "No se puede completar un mantenimiento cancelado"
            );
        }

        if (estado.equals("COMPLETADA")) {
            throw new IllegalArgumentException(
                "El mantenimiento ya está completado"
            );
        }

        if (!estado.equals("EN_EJECUCION")) {
            throw new IllegalArgumentException(
                "El mantenimiento debe estar en ejecución antes de completarse"
            );
        }

        jdbcTemplate.update(
            """
            UPDATE programacion_mantenimiento
            SET
                estado = 'COMPLETADA',
                actualizado_en = utc_now()
            WHERE id = ?
            """,
            id
        );

        generarSiguienteCicloSiCorresponde(id);

        return obtenerMantenimientoPorId(id);
    }

    private void generarSiguienteCicloSiCorresponde(
        Long mantenimientoId
    ) {

        SiguienteCicloDatos datos =
            jdbcTemplate.queryForObject(
                """
                SELECT
                    pm.id,
                    pm.unidad_id,
                    pm.plan_unidad_id,
                    pm.tipo,
                    pm.descripcion,
                    pm.fecha_vencimiento,
                    pm.kilometraje_objetivo,
                    pm.responsable_id,
                    pm.ciclo,

                    plan.criterio,
                    plan.intervalo_dias,
                    plan.intervalo_km

                FROM programacion_mantenimiento pm

                LEFT JOIN plan_unidad pu
                    ON pu.id = pm.plan_unidad_id

                LEFT JOIN plan_mantenimiento plan
                    ON plan.id = pu.plan_id

                WHERE pm.id = ?
                """,

                (rs, rowNum) ->
                    new SiguienteCicloDatos(
                        rs.getLong("unidad_id"),

                        rs.getObject(
                            "plan_unidad_id",
                            Long.class
                        ),

                        rs.getString("tipo"),

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

                        rs.getLong(
                            "responsable_id"
                        ),

                        rs.getObject(
                            "ciclo",
                            Integer.class
                        ),

                        rs.getString(
                            "criterio"
                        ),

                        rs.getObject(
                            "intervalo_dias",
                            Integer.class
                        ),

                        rs.getBigDecimal(
                            "intervalo_km"
                        )
                    ),

                mantenimientoId
            );


        if (datos == null) {
            return;
        }


        /*
        * Solo los preventivos asociados
        * a un plan generan otro ciclo.
        */

        if (
            !"PREVENTIVO".equals(datos.tipo()) ||
            datos.planUnidadId() == null ||
            datos.ciclo() == null
        ) {
            return;
        }


        int siguienteCiclo =
            datos.ciclo() + 1;


        /*
        * Evitar duplicados.
        */

        Integer existe =
            jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM programacion_mantenimiento
                WHERE plan_unidad_id = ?
                AND ciclo = ?
                """,

                Integer.class,

                datos.planUnidadId(),
                siguienteCiclo
            );


        if (
            existe != null &&
            existe > 0
        ) {
            return;
        }


        LocalDate nuevaFecha = null;

        BigDecimal nuevoKilometraje =
            null;


        switch (datos.criterio()) {

            case "FECHA" -> {

                if (
                    datos.fechaVencimiento() ==
                        null ||
                    datos.intervaloDias() ==
                        null
                ) {
                    throw new IllegalStateException(
                        "No se puede calcular el siguiente ciclo por fecha"
                    );
                }

                nuevaFecha =
                    datos.fechaVencimiento()
                        .plusDays(
                            datos.intervaloDias()
                        );
            }


            case "KILOMETRAJE" -> {

                if (
                    datos.kilometrajeObjetivo() ==
                        null ||
                    datos.intervaloKm() ==
                        null
                ) {
                    throw new IllegalStateException(
                        "No se puede calcular el siguiente ciclo por kilometraje"
                    );
                }

                nuevoKilometraje =
                    datos.kilometrajeObjetivo()
                        .add(
                            datos.intervaloKm()
                        );
            }


            case "MIXTO" -> {

                if (
                    datos.fechaVencimiento() ==
                        null ||
                    datos.kilometrajeObjetivo() ==
                        null ||
                    datos.intervaloDias() ==
                        null ||
                    datos.intervaloKm() ==
                        null
                ) {
                    throw new IllegalStateException(
                        "No se puede calcular el siguiente ciclo mixto"
                    );
                }

                nuevaFecha =
                    datos.fechaVencimiento()
                        .plusDays(
                            datos.intervaloDias()
                        );

                nuevoKilometraje =
                    datos.kilometrajeObjetivo()
                        .add(
                            datos.intervaloKm()
                        );
            }


            default ->
                throw new IllegalStateException(
                    "El criterio del plan no es válido"
                );
        }


        jdbcTemplate.update(
            """
            INSERT INTO programacion_mantenimiento (
                unidad_id,
                plan_unidad_id,
                tipo,
                descripcion,
                fecha_vencimiento,
                kilometraje_objetivo,
                responsable_id,
                estado,
                ciclo
            )
            VALUES (
                ?,
                ?,
                'PREVENTIVO',
                ?,
                ?,
                ?,
                ?,
                'PROGRAMADA',
                ?
            )
            """,

            datos.unidadId(),
            datos.planUnidadId(),
            datos.descripcion(),
            nuevaFecha,
            nuevoKilometraje,
            datos.responsableId(),
            siguienteCiclo
        );
    }

    private record SiguienteCicloDatos(
        Long unidadId,
        Long planUnidadId,
        String tipo,
        String descripcion,
        LocalDate fechaVencimiento,
        BigDecimal kilometrajeObjetivo,
        Long responsableId,
        Integer ciclo,
        String criterio,
        Integer intervaloDias,
        BigDecimal intervaloKm
    ) {
    }
}