package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.PlanUnidadCreateRequest;
import com.cruzdelcentro.backend.dto.PlanUnidadResponse;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PlanUnidadService {

    private final JdbcTemplate jdbcTemplate;

    public PlanUnidadService(
        JdbcTemplate jdbcTemplate
    ) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private record PlanDatos(
        String nombre,
        String criterio,
        Integer intervaloDias,
        BigDecimal intervaloKm
    ) {
    }

    @Transactional
    public PlanUnidadResponse asignarPlan(
        PlanUnidadCreateRequest request
    ) {

        /*
         * VALIDACIONES
         */

        if (request.responsableId() == null) {
            throw new IllegalArgumentException(
                "Debe indicar un responsable"
            );
        }

        if (request.planId() == null) {
            throw new IllegalArgumentException(
                "Debe seleccionar un plan"
            );
        }

        if (request.unidadId() == null) {
            throw new IllegalArgumentException(
                "Debe seleccionar una unidad"
            );
        }

        if (request.fechaBase() == null) {
            throw new IllegalArgumentException(
                "Debe indicar la fecha base"
            );
        }

        if (request.kilometrajeBase() == null) {
            throw new IllegalArgumentException(
                "Debe indicar el kilometraje base"
            );
        }

        if (
            request.kilometrajeBase()
                .compareTo(BigDecimal.ZERO) < 0
        ) {
            throw new IllegalArgumentException(
                "El kilometraje base no puede ser negativo"
            );
        }


        /*
         * VERIFICAR PLAN
         */

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

        Integer existePlan =
            jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM plan_mantenimiento
                WHERE id = ?
                AND activo = true
                """,
                Integer.class,
                request.planId()
            );

        if (
            existePlan == null ||
            existePlan == 0
        ) {
            throw new IllegalArgumentException(
                "El plan seleccionado no existe o está inactivo"
            );
        }


        /*
         * VERIFICAR UNIDAD
         */

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
                "La unidad seleccionada no existe o está inactiva"
            );
        }


        /*
         * EVITAR ASIGNACIÓN ACTIVA DUPLICADA
         */

        Integer asignacionExistente =
            jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM plan_unidad
                WHERE unidad_id = ?
                AND plan_id = ?
                AND activo = true
                """,
                Integer.class,
                request.unidadId(),
                request.planId()
            );

        if (
            asignacionExistente != null &&
            asignacionExistente > 0
        ) {
            throw new IllegalArgumentException(
                "La unidad ya tiene este plan preventivo asignado"
            );
        }


        /*
         * INSERTAR
         */

        Long id;

        try {

            id = jdbcTemplate.queryForObject(
                """
                INSERT INTO plan_unidad (
                    plan_id,
                    unidad_id,
                    fecha_base,
                    kilometraje_base,
                    activo
                )
                VALUES (?, ?, ?, ?, true)
                RETURNING id
                """,
                Long.class,
                request.planId(),
                request.unidadId(),
                request.fechaBase(),
                request.kilometrajeBase()
            );

        } catch (DuplicateKeyException e) {

            throw new IllegalArgumentException(
                "La unidad ya tiene este plan preventivo asignado"
            );
        }


        if (id == null) {
            throw new IllegalStateException(
                "No se pudo asignar el plan"
            );
        }

        crearPrimeraProgramacion(
            id,
            request
        );

        return obtenerPorId(id);
    }

    private void crearPrimeraProgramacion(
        Long planUnidadId,
        PlanUnidadCreateRequest request
    ) {

        PlanDatos plan =
            jdbcTemplate.queryForObject(
                """
                SELECT
                    nombre,
                    criterio,
                    intervalo_dias,
                    intervalo_km
                FROM plan_mantenimiento
                WHERE id = ?
                AND activo = true
                """,

                (rs, rowNum) ->
                    new PlanDatos(
                        rs.getString("nombre"),
                        rs.getString("criterio"),
                        rs.getObject(
                            "intervalo_dias",
                            Integer.class
                        ),
                        rs.getBigDecimal(
                            "intervalo_km"
                        )
                    ),

                request.planId()
            );


        if (plan == null) {
            throw new IllegalStateException(
                "No se pudo obtener la información del plan"
            );
        }


        LocalDate fechaVencimiento = null;
        BigDecimal kilometrajeObjetivo = null;


        switch (plan.criterio()) {

            case "FECHA" -> {

                fechaVencimiento =
                    request.fechaBase()
                        .plusDays(
                            plan.intervaloDias()
                        );
            }


            case "KILOMETRAJE" -> {

                kilometrajeObjetivo =
                    request.kilometrajeBase()
                        .add(
                            plan.intervaloKm()
                        );
            }


            case "MIXTO" -> {

                fechaVencimiento =
                    request.fechaBase()
                        .plusDays(
                            plan.intervaloDias()
                        );

                kilometrajeObjetivo =
                    request.kilometrajeBase()
                        .add(
                            plan.intervaloKm()
                        );
            }


            default ->
                throw new IllegalArgumentException(
                    "Criterio de mantenimiento inválido"
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
                1
            )
            """,

            request.unidadId(),
            planUnidadId,
            "Mantenimiento preventivo - " +
                plan.nombre(),
            fechaVencimiento,
            kilometrajeObjetivo,
            request.responsableId()
        );
    }


    public PlanUnidadResponse obtenerPorId(
        Long id
    ) {

        return jdbcTemplate.queryForObject(
            """
            SELECT
                pu.id,
                pu.plan_id,
                pm.nombre AS plan_nombre,

                pu.unidad_id,
                u.codigo AS unidad_codigo,
                u.placa,

                pu.fecha_base,
                pu.kilometraje_base,
                pu.activo

            FROM plan_unidad pu

            JOIN plan_mantenimiento pm
                ON pm.id = pu.plan_id

            JOIN unidad u
                ON u.id = pu.unidad_id

            WHERE pu.id = ?
            """,

            (rs, rowNum) ->
                new PlanUnidadResponse(
                    rs.getLong("id"),
                    rs.getLong("plan_id"),
                    rs.getString("plan_nombre"),
                    rs.getLong("unidad_id"),
                    rs.getString("unidad_codigo"),
                    rs.getString("placa"),
                    rs.getDate("fecha_base")
                        .toLocalDate(),
                    rs.getBigDecimal(
                        "kilometraje_base"
                    ),
                    rs.getBoolean("activo")
                ),

            id
        );
    }


    public List<PlanUnidadResponse>
        listarAsignaciones() {

        return jdbcTemplate.query(
            """
            SELECT
                pu.id,
                pu.plan_id,
                pm.nombre AS plan_nombre,

                pu.unidad_id,
                u.codigo AS unidad_codigo,
                u.placa,

                pu.fecha_base,
                pu.kilometraje_base,
                pu.activo

            FROM plan_unidad pu

            JOIN plan_mantenimiento pm
                ON pm.id = pu.plan_id

            JOIN unidad u
                ON u.id = pu.unidad_id

            WHERE pu.activo = true

            ORDER BY
                u.codigo,
                pm.nombre
            """,

            (rs, rowNum) ->
                new PlanUnidadResponse(
                    rs.getLong("id"),
                    rs.getLong("plan_id"),
                    rs.getString("plan_nombre"),
                    rs.getLong("unidad_id"),
                    rs.getString("unidad_codigo"),
                    rs.getString("placa"),
                    rs.getDate("fecha_base")
                        .toLocalDate(),
                    rs.getBigDecimal(
                        "kilometraje_base"
                    ),
                    rs.getBoolean("activo")
                )
        );
    }
}