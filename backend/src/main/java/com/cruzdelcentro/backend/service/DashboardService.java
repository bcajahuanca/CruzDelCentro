package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.DashboardEstadoFlotaResponse;
import com.cruzdelcentro.backend.dto.DashboardProximoMantenimientoResponse;
import com.cruzdelcentro.backend.dto.DashboardResumenResponse;
import com.cruzdelcentro.backend.dto.DashboardSituacionResponse;
import com.cruzdelcentro.backend.dto.DashboardTendenciaMantenimientoResponse;
import com.cruzdelcentro.backend.dto.DashboardUnidadAtencionResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;

    public DashboardService(
            JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DashboardResumenResponse obtenerResumen() {

        Long totalUnidades = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM unidad
                        WHERE activo = true
                        """,
                Long.class);

        Long operativas = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM unidad
                        WHERE activo = true
                          AND estado_operativo = 'OPERATIVA'
                        """,
                Long.class);

        Long enMantenimiento = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM unidad
                        WHERE activo = true
                          AND estado_operativo = 'EN_MANTENIMIENTO'
                        """,
                Long.class);

        Long fueraServicio = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM unidad
                        WHERE activo = true
                          AND estado_operativo = 'FUERA_DE_SERVICIO'
                        """,
                Long.class);

        long total = totalUnidades == null
                ? 0
                : totalUnidades;

        long disponibles = operativas == null
                ? 0
                : operativas;

        BigDecimal porcentajeDisponibilidad;

        if (total == 0) {

            porcentajeDisponibilidad = BigDecimal.ZERO;

        } else {

            porcentajeDisponibilidad = BigDecimal.valueOf(disponibles)
                    .multiply(
                            BigDecimal.valueOf(100))
                    .divide(
                            BigDecimal.valueOf(total),
                            2,
                            RoundingMode.HALF_UP);
        }

        List<DashboardEstadoFlotaResponse> distribucionEstados = List.of(

                new DashboardEstadoFlotaResponse(
                        "OPERATIVA",
                        operativas == null
                                ? 0
                                : operativas),

                new DashboardEstadoFlotaResponse(
                        "EN_MANTENIMIENTO",
                        enMantenimiento == null
                                ? 0
                                : enMantenimiento),

                new DashboardEstadoFlotaResponse(
                        "FUERA_DE_SERVICIO",
                        fueraServicio == null
                                ? 0
                                : fueraServicio));

        return new DashboardResumenResponse(
                total,

                disponibles,

                enMantenimiento == null
                        ? 0
                        : enMantenimiento,

                fueraServicio == null
                        ? 0
                        : fueraServicio,

                porcentajeDisponibilidad,

                distribucionEstados);
    }

    public DashboardSituacionResponse obtenerSituacion() {

        Long incidenciasAbiertas = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM incidencia
                        WHERE estado NOT IN (
                            'RESUELTA',
                            'CERRADA',
                            'ANULADA'
                        )
                        """,
                Long.class);

        Long ordenesActivas = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM orden_trabajo
                        WHERE estado IN (
                            'ABIERTA',
                            'ASIGNADA',
                            'EN_EJECUCION',
                            'PENDIENTE_VALIDACION'
                        )
                        """,
                Long.class);

        Long pendientesValidacion = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM orden_trabajo
                        WHERE estado = 'PENDIENTE_VALIDACION'
                        """,
                Long.class);

        Long mantenimientosPendientes = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM programacion_mantenimiento
                        WHERE estado IN (
                            'PROGRAMADA',
                            'EN_EJECUCION'
                        )
                        """,
                Long.class);

        return new DashboardSituacionResponse(
                incidenciasAbiertas == null
                        ? 0
                        : incidenciasAbiertas,

                ordenesActivas == null
                        ? 0
                        : ordenesActivas,

                pendientesValidacion == null
                        ? 0
                        : pendientesValidacion,

                mantenimientosPendientes == null
                        ? 0
                        : mantenimientosPendientes);
    }

    public List<DashboardUnidadAtencionResponse> listarUnidadesAtencion() {

        return jdbcTemplate.query(
                """
                        SELECT DISTINCT ON (u.id)

                            u.id AS unidad_id,
                            u.codigo,
                            u.placa,
                            u.estado_operativo,

                            ot.id AS orden_id,
                            ot.codigo AS codigo_orden,

                            i.id AS incidencia_id,
                            i.codigo AS codigo_incidencia,

                            CASE

                                WHEN u.estado_operativo = 'FUERA_DE_SERVICIO'
                                    THEN 'Fuera de servicio'

                                WHEN ot.estado = 'PENDIENTE_VALIDACION'
                                    THEN 'OT pendiente de validación'

                                WHEN ot.estado = 'EN_EJECUCION'
                                    THEN 'Mantenimiento en ejecución'

                                WHEN ot.estado IN (
                                    'ABIERTA',
                                    'ASIGNADA'
                                )
                                    THEN 'Orden de trabajo activa'

                                WHEN i.id IS NOT NULL
                                    THEN 'Incidencia pendiente'

                                WHEN u.estado_operativo = 'EN_MANTENIMIENTO'
                                    THEN 'En mantenimiento'

                                ELSE 'Requiere atención'

                            END AS situacion

                        FROM unidad u

                        LEFT JOIN orden_trabajo ot
                            ON ot.unidad_id = u.id
                            AND ot.estado IN (
                                'ABIERTA',
                                'ASIGNADA',
                                'EN_EJECUCION',
                                'PENDIENTE_VALIDACION'
                            )

                        LEFT JOIN incidencia i
                            ON i.unidad_id = u.id
                            AND i.estado NOT IN (
                                'RESUELTA',
                                'CERRADA',
                                'ANULADA'
                            )

                        WHERE u.activo = true

                          AND (
                                u.estado_operativo IN (
                                    'EN_MANTENIMIENTO',
                                    'FUERA_DE_SERVICIO'
                                )

                                OR ot.id IS NOT NULL

                                OR i.id IS NOT NULL
                              )

                        ORDER BY
                            u.id,

                            CASE
                                WHEN u.estado_operativo = 'FUERA_DE_SERVICIO'
                                    THEN 1

                                WHEN ot.estado = 'PENDIENTE_VALIDACION'
                                    THEN 2

                                WHEN ot.estado = 'EN_EJECUCION'
                                    THEN 3

                                WHEN i.id IS NOT NULL
                                    THEN 4

                                ELSE 5
                            END,

                            ot.id DESC,

                            i.id DESC

                        LIMIT 10
                        """,

                (rs, rowNum) -> new DashboardUnidadAtencionResponse(
                        rs.getLong("unidad_id"),
                        rs.getString("codigo"),
                        rs.getString("placa"),
                        rs.getString("estado_operativo"),

                        rs.getObject("orden_id", Long.class),
                        rs.getString("codigo_orden"),

                        rs.getObject("incidencia_id", Long.class),
                        rs.getString("codigo_incidencia"),

                        rs.getString("situacion")));
    }

    public List<DashboardProximoMantenimientoResponse> listarProximosMantenimientos() {

        return jdbcTemplate.query(
                """
                        SELECT
                            v.id AS programacion_id,
                            v.unidad_id,

                            u.codigo,
                            u.placa,

                            v.tipo,
                            v.descripcion,
                            v.fecha_vencimiento,
                            v.kilometraje_objetivo,

                            v.inicio_programado,
                            v.fin_programado,

                            v.kilometraje_actual,

                            v.estado,
                            v.situacion

                        FROM vw_mantenimientos_pendientes v

                        JOIN unidad u
                            ON u.id = v.unidad_id

                        WHERE u.activo = true

                        ORDER BY
                            COALESCE(
                                v.inicio_programado,
                                v.fecha_vencimiento::timestamp
                            ) ASC,
                            v.id ASC

                        LIMIT 8
                        """,

                (rs, rowNum) -> new DashboardProximoMantenimientoResponse(

                        rs.getLong("programacion_id"),

                        rs.getLong("unidad_id"),

                        rs.getString("codigo"),
                        rs.getString("placa"),

                        rs.getString("tipo"),
                        rs.getString("descripcion"),

                        rs.getDate("fecha_vencimiento") == null
                                ? null
                                : rs.getDate("fecha_vencimiento")
                                        .toLocalDate(),

                        rs.getBigDecimal(
                                "kilometraje_objetivo"),

                        rs.getTimestamp("inicio_programado") == null
                                ? null
                                : rs.getTimestamp("inicio_programado")
                                        .toLocalDateTime(),

                        rs.getTimestamp("fin_programado") == null
                                ? null
                                : rs.getTimestamp("fin_programado")
                                        .toLocalDateTime(),

                        rs.getBigDecimal(
                                "kilometraje_actual"),

                        rs.getString("estado"),

                        rs.getString("situacion")));
    }

    public List<DashboardTendenciaMantenimientoResponse> listarTendenciaMantenimientos() {

        return jdbcTemplate.query(
                """
                        WITH meses AS (
                            SELECT
                                generate_series(
                                    date_trunc('month', utc_now()) - INTERVAL '5 months',
                                    date_trunc('month', utc_now()),
                                    INTERVAL '1 month'
                                ) AS mes
                        ),

                        datos AS (
                            SELECT
                                date_trunc(
                                    'month',
                                    fecha_cierre
                                ) AS mes,

                                COUNT(*) FILTER (
                                    WHERE tipo = 'PREVENTIVO'
                                ) AS preventivos,

                                COUNT(*) FILTER (
                                    WHERE tipo = 'CORRECTIVO'
                                ) AS correctivos

                            FROM orden_trabajo

                            WHERE estado = 'CERRADA'
                              AND fecha_cierre IS NOT NULL

                              AND fecha_cierre >=
                                  date_trunc(
                                      'month',
                                      utc_now()
                                  ) - INTERVAL '5 months'

                            GROUP BY
                                date_trunc(
                                    'month',
                                    fecha_cierre
                                )
                        )

                        SELECT
                            TO_CHAR(
                                m.mes,
                                'YYYY-MM'
                            ) AS mes,

                            COALESCE(
                                d.preventivos,
                                0
                            ) AS preventivos,

                            COALESCE(
                                d.correctivos,
                                0
                            ) AS correctivos

                        FROM meses m

                        LEFT JOIN datos d
                            ON d.mes = m.mes

                        ORDER BY m.mes
                        """,

                (rs, rowNum) -> new DashboardTendenciaMantenimientoResponse(
                        rs.getString("mes"),
                        rs.getLong("preventivos"),
                        rs.getLong("correctivos")));
    }
}