package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.PlanMantenimientoCreateRequest;
import com.cruzdelcentro.backend.dto.PlanMantenimientoResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class PlanMantenimientoService {

    private final JdbcTemplate jdbcTemplate;

    public PlanMantenimientoService(
        JdbcTemplate jdbcTemplate
    ) {
        this.jdbcTemplate = jdbcTemplate;
    }


    @Transactional
    public PlanMantenimientoResponse crearPlan(
        PlanMantenimientoCreateRequest request
    ) {

        /*
         * 1. Validaciones generales
         */

        if (
            request.nombre() == null ||
            request.nombre().isBlank()
        ) {
            throw new IllegalArgumentException(
                "El nombre del plan es obligatorio"
            );
        }


        if (
            request.criterio() == null ||
            !List.of(
                "FECHA",
                "KILOMETRAJE",
                "MIXTO"
            ).contains(request.criterio())
        ) {
            throw new IllegalArgumentException(
                "Criterio de mantenimiento inválido"
            );
        }


        /*
         * 2. Validar según criterio
         */

        switch (request.criterio()) {

            case "FECHA" -> {

                if (
                    request.intervaloDias() == null ||
                    request.intervaloDias() <= 0
                ) {
                    throw new IllegalArgumentException(
                        "Debe indicar un intervalo de días válido"
                    );
                }
            }

            case "KILOMETRAJE" -> {

                if (
                    request.intervaloKm() == null ||
                    request.intervaloKm()
                        .compareTo(BigDecimal.ZERO) <= 0
                ) {
                    throw new IllegalArgumentException(
                        "Debe indicar un intervalo de kilometraje válido"
                    );
                }
            }

            case "MIXTO" -> {

                if (
                    request.intervaloDias() == null ||
                    request.intervaloDias() <= 0
                ) {
                    throw new IllegalArgumentException(
                        "Debe indicar un intervalo de días válido"
                    );
                }

                if (
                    request.intervaloKm() == null ||
                    request.intervaloKm()
                        .compareTo(BigDecimal.ZERO) <= 0
                ) {
                    throw new IllegalArgumentException(
                        "Debe indicar un intervalo de kilometraje válido"
                    );
                }
            }
        }


        /*
         * 3. Anticipaciones
         */

        int anticipacionDias =
            request.anticipacionDias() != null
                ? request.anticipacionDias()
                : 7;

        BigDecimal anticipacionKm =
            request.anticipacionKm() != null
                ? request.anticipacionKm()
                : BigDecimal.valueOf(500);


        if (anticipacionDias < 0) {
            throw new IllegalArgumentException(
                "La anticipación en días no puede ser negativa"
            );
        }

        if (
            anticipacionKm.compareTo(
                BigDecimal.ZERO
            ) < 0
        ) {
            throw new IllegalArgumentException(
                "La anticipación en kilómetros no puede ser negativa"
            );
        }


        /*
         * 4. Insertar plan
         */

        Long planId =
            jdbcTemplate.queryForObject(
                """
                INSERT INTO plan_mantenimiento (
                    nombre,
                    descripcion,
                    criterio,
                    intervalo_dias,
                    intervalo_km,
                    anticipacion_dias,
                    anticipacion_km,
                    activo
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    true
                )
                RETURNING id
                """,

                Long.class,

                request.nombre().trim(),

                request.descripcion() == null ||
                request.descripcion().isBlank()
                    ? null
                    : request.descripcion().trim(),

                request.criterio(),

                request.criterio().equals("KILOMETRAJE")
                    ? null
                    : request.intervaloDias(),

                request.criterio().equals("FECHA")
                    ? null
                    : request.intervaloKm(),

                anticipacionDias,

                anticipacionKm
            );


        if (planId == null) {
            throw new IllegalStateException(
                "No se pudo crear el plan de mantenimiento"
            );
        }


        /*
         * 5. Guardar actividades
         */

        if (
            request.actividades() != null &&
            !request.actividades().isEmpty()
        ) {

            int orden = 1;

            for (
                PlanMantenimientoCreateRequest
                    .ActividadPlanRequest actividad
                : request.actividades()
            ) {

                if (
                    actividad.descripcion() == null ||
                    actividad.descripcion().isBlank()
                ) {
                    continue;
                }

                jdbcTemplate.update(
                    """
                    INSERT INTO plan_actividad (
                        plan_id,
                        descripcion,
                        orden_visual,
                        obligatoria
                    )
                    VALUES (?, ?, ?, ?)
                    """,

                    planId,
                    actividad.descripcion().trim(),
                    orden,
                    actividad.obligatoria() == null
                        ? true
                        : actividad.obligatoria()
                );

                orden++;
            }
        }


        return obtenerPlanPorId(planId);
    }


    public PlanMantenimientoResponse obtenerPlanPorId(
        Long id
    ) {

        PlanMantenimientoResponse plan =
            jdbcTemplate.queryForObject(
                """
                SELECT
                    id,
                    nombre,
                    descripcion,
                    criterio,
                    intervalo_dias,
                    intervalo_km,
                    anticipacion_dias,
                    anticipacion_km,
                    activo
                FROM plan_mantenimiento
                WHERE id = ?
                """,

                (rs, rowNum) ->
                    new PlanMantenimientoResponse(
                        rs.getLong("id"),
                        rs.getString("nombre"),
                        rs.getString("descripcion"),
                        rs.getString("criterio"),

                        rs.getObject(
                            "intervalo_dias",
                            Integer.class
                        ),

                        rs.getBigDecimal(
                            "intervalo_km"
                        ),

                        rs.getInt(
                            "anticipacion_dias"
                        ),

                        rs.getBigDecimal(
                            "anticipacion_km"
                        ),

                        rs.getBoolean(
                            "activo"
                        ),

                        new ArrayList<>()
                    ),

                id
            );


        List<PlanMantenimientoResponse.ActividadResponse>
            actividades =
            jdbcTemplate.query(
                """
                SELECT
                    id,
                    descripcion,
                    orden_visual,
                    obligatoria
                FROM plan_actividad
                WHERE plan_id = ?
                ORDER BY orden_visual
                """,

                (rs, rowNum) ->
                    new PlanMantenimientoResponse
                        .ActividadResponse(
                            rs.getLong("id"),
                            rs.getString(
                                "descripcion"
                            ),
                            rs.getInt(
                                "orden_visual"
                            ),
                            rs.getBoolean(
                                "obligatoria"
                            )
                        ),

                id
            );


        return new PlanMantenimientoResponse(
            plan.id(),
            plan.nombre(),
            plan.descripcion(),
            plan.criterio(),
            plan.intervaloDias(),
            plan.intervaloKm(),
            plan.anticipacionDias(),
            plan.anticipacionKm(),
            plan.activo(),
            actividades
        );
    }


    public List<PlanMantenimientoResponse> listarPlanes() {

        List<Long> ids =
            jdbcTemplate.query(
                """
                SELECT id
                FROM plan_mantenimiento
                WHERE activo = true
                ORDER BY nombre
                """,

                (rs, rowNum) ->
                    rs.getLong("id")
            );


        return ids.stream()
            .map(this::obtenerPlanPorId)
            .toList();
    }
}