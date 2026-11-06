package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.HistorialEstadoResponse;
import com.cruzdelcentro.backend.dto.HistorialMantenimientoResponse;
import com.cruzdelcentro.backend.dto.HistorialResumenUnidadResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;

import java.util.List;

@Service
public class HistorialService {

    private final JdbcTemplate jdbcTemplate;

    public HistorialService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> listarEstados(
            int pagina,
            String busqueda,
            String estado,
            String unidadCodigo) {
        int limite = 20;
        int offset = pagina * limite;

        String filtro = """
                FROM estado_unidad_historial h
                JOIN unidad u ON u.id = h.unidad_id
                WHERE (
                    ? = ''
                    OR LOWER(u.codigo) LIKE ?
                    OR LOWER(COALESCE(u.placa, '')) LIKE ?
                )
                AND (? = 'TODOS' OR h.estado = ?)
                AND (? = 'TODAS' OR u.codigo = ?)
                """;

        String texto = busqueda == null
                ? ""
                : busqueda.trim().toLowerCase();

        String patron = "%" +
                texto.replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_")
                +
                "%";

        String estadoFiltro = estado == null ? "TODOS" : estado;

        String unidadFiltro = unidadCodigo == null ? "TODAS" : unidadCodigo;

        String sql = """
                SELECT
                    h.id,
                    h.unidad_id,
                    u.codigo,
                    u.placa,
                    h.estado,
                    h.inicio,
                    h.fin,
                    h.motivo,
                    h.registrado_por
                """ + filtro + """
                ORDER BY h.inicio DESC, h.id DESC
                LIMIT ? OFFSET ?
                """;

        List<HistorialEstadoResponse> registros = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new HistorialEstadoResponse(
                        rs.getLong("id"),
                        rs.getLong("unidad_id"),
                        rs.getString("codigo"),
                        rs.getString("placa"),
                        rs.getString("estado"),
                        rs.getTimestamp("inicio").toLocalDateTime(),
                        rs.getTimestamp("fin") == null
                                ? null
                                : rs.getTimestamp("fin").toLocalDateTime(),
                        rs.getString("motivo"),
                        rs.getObject("registrado_por", Long.class)),
                texto,
                patron,
                patron,
                estadoFiltro,
                estadoFiltro,
                unidadFiltro,
                unidadFiltro,
                limite,
                offset);

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) " + filtro,
                Long.class,
                texto,
                patron,
                patron,
                estadoFiltro,
                estadoFiltro,
                unidadFiltro,
                unidadFiltro);

        long cantidad = total == null ? 0 : total;
        long totalPaginas = (cantidad + limite - 1) / limite;

        Long totalGeneral = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM estado_unidad_historial",
                Long.class);

        Long totalMantenimiento = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM estado_unidad_historial
                        WHERE estado = 'EN_MANTENIMIENTO'
                        """,
                Long.class);

        Long totalFueraServicio = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM estado_unidad_historial
                        WHERE estado = 'FUERA_DE_SERVICIO'
                        """,
                Long.class);

        return Map.of(
                "registros", registros,
                "paginaActual", pagina,
                "totalRegistros", cantidad,
                "totalPaginas", totalPaginas,
                "totalGeneral", totalGeneral,
                "totalMantenimiento", totalMantenimiento,
                "totalFueraServicio", totalFueraServicio);
    }

    public Map<String, Object> listarMantenimientos(
            int pagina,
            String busqueda,
            String tipo,
            String unidadCodigo,
            String fechaDesde,
            String fechaHasta) {

        int limite = 20;
        int offset = pagina * limite;

        String filtro = """
                FROM vw_historial_mantenimiento h
                WHERE (
                    ? = ''
                    OR LOWER(h.codigo) LIKE ?
                    OR LOWER(h.unidad) LIKE ?
                    OR LOWER(COALESCE(h.placa, '')) LIKE ?
                )
                AND (? = 'TODOS' OR h.tipo = ?)
                AND (? = 'TODAS' OR h.unidad = ?)
                AND (
                    CAST(? AS date) IS NULL
                    OR h.fecha_cierre::date >= CAST(? AS date)
                )
                AND (
                    CAST(? AS date) IS NULL
                    OR h.fecha_cierre::date <= CAST(? AS date)
                )
                """;

        String texto = busqueda == null
                ? ""
                : busqueda.trim().toLowerCase();

        String patron = "%"
                + texto
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_")
                + "%";

        String tipoFiltro = tipo == null
                ? "TODOS"
                : tipo;

        String unidadFiltro = unidadCodigo == null
                ? "TODAS"
                : unidadCodigo;

        String desde = fechaDesde == null ||
                fechaDesde.isBlank()
                        ? null
                        : fechaDesde;

        String hasta = fechaHasta == null ||
                fechaHasta.isBlank()
                        ? null
                        : fechaHasta;

        String sql = """
                SELECT
                    h.orden_id,
                    h.codigo,
                    h.unidad_id,
                    h.unidad,
                    h.placa,
                    h.tipo,
                    h.fecha_cierre,
                    h.inicio_real,
                    h.fin_real,
                    h.kilometraje_intervencion,
                    h.diagnostico,
                    h.resultado_pruebas,
                    h.responsable_id,
                    h.proveedor_id,
                    h.costo_real,
                    h.costo_estimado
                """ + filtro + """
                ORDER BY h.fecha_cierre DESC, h.orden_id DESC
                LIMIT ? OFFSET ?
                """;

        List<HistorialMantenimientoResponse> registros = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new HistorialMantenimientoResponse(
                        rs.getLong("orden_id"),
                        rs.getString("codigo"),
                        rs.getLong("unidad_id"),
                        rs.getString("unidad"),
                        rs.getString("placa"),
                        rs.getString("tipo"),

                        rs.getTimestamp("fecha_cierre") == null
                                ? null
                                : rs.getTimestamp("fecha_cierre")
                                        .toLocalDateTime(),

                        rs.getTimestamp("inicio_real") == null
                                ? null
                                : rs.getTimestamp("inicio_real")
                                        .toLocalDateTime(),

                        rs.getTimestamp("fin_real") == null
                                ? null
                                : rs.getTimestamp("fin_real")
                                        .toLocalDateTime(),

                        rs.getBigDecimal(
                                "kilometraje_intervencion"),

                        rs.getString("diagnostico"),

                        rs.getString(
                                "resultado_pruebas"),

                        rs.getObject(
                                "responsable_id",
                                Long.class),

                        rs.getObject(
                                "proveedor_id",
                                Long.class),

                        rs.getBigDecimal(
                                "costo_real"),

                        rs.getBigDecimal(
                                "costo_estimado")),

                texto,
                patron,
                patron,
                patron,
                tipoFiltro,
                tipoFiltro,
                unidadFiltro,
                unidadFiltro,
                desde,
                desde,
                hasta,
                hasta,
                limite,
                offset);

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) " + filtro,
                Long.class,
                texto,
                patron,
                patron,
                patron,
                tipoFiltro,
                tipoFiltro,
                unidadFiltro,
                unidadFiltro,
                desde,
                desde,
                hasta,
                hasta);

        long cantidad = total == null
                ? 0
                : total;

        long totalPaginas = (cantidad + limite - 1)
                / limite;

        return Map.of(
                "registros", registros,
                "paginaActual", pagina,
                "totalRegistros", cantidad,
                "totalPaginas", totalPaginas);
    }

    public List<HistorialResumenUnidadResponse> listarResumenUnidades(
            String fechaDesde,
            String fechaHasta,
            String unidadCodigo) {

        String desde = fechaDesde == null ||
                fechaDesde.isBlank()
                        ? null
                        : fechaDesde;

        String hasta = fechaHasta == null ||
                fechaHasta.isBlank()
                        ? null
                        : fechaHasta;

        String unidadFiltro = unidadCodigo == null
                ? "TODAS"
                : unidadCodigo;

        return jdbcTemplate.query(
                """
                        WITH costos AS (
                            SELECT
                                ot.unidad_id,
                                COUNT(DISTINCT ot.id) AS ordenes_cerradas,
                                COALESCE(
                                    SUM(
                                        CASE
                                            WHEN oc.naturaleza = 'REAL'
                                            THEN oc.subtotal
                                            ELSE 0
                                        END
                                    ),
                                    0
                                ) AS costo_real
                            FROM orden_trabajo ot

                            LEFT JOIN orden_costo oc
                                ON oc.orden_id = ot.id

                            WHERE ot.estado = 'CERRADA'

                              AND (
                                  CAST(? AS date) IS NULL
                                  OR ot.fecha_cierre >= CAST(? AS date)
                              )

                              AND (
                                  CAST(? AS date) IS NULL
                                  OR ot.fecha_cierre <
                                     CAST(? AS date) + INTERVAL '1 day'
                              )

                            GROUP BY ot.unidad_id
                        ),

                        tiempos AS (
                            SELECT
                                h.unidad_id,

                                COALESCE(
                                    SUM(
                                        CASE
                                            WHEN h.estado = 'EN_MANTENIMIENTO'
                                            THEN EXTRACT(
                                                EPOCH FROM (
                                                    LEAST(
                                                        COALESCE(
                                                            h.fin,
                                                            utc_now()
                                                        ),
                                                        CASE
                                                            WHEN CAST(? AS date) IS NULL
                                                            THEN COALESCE(
                                                                h.fin,
                                                                utc_now()
                                                            )
                                                            ELSE CAST(? AS date)
                                                                 + INTERVAL '1 day'
                                                        END
                                                    )
                                                    -
                                                    GREATEST(
                                                        h.inicio,
                                                        CASE
                                                            WHEN CAST(? AS date) IS NULL
                                                            THEN h.inicio
                                                            ELSE CAST(? AS date)
                                                        END
                                                    )
                                                )
                                            ) / 3600
                                            ELSE 0
                                        END
                                    ),
                                    0
                                ) AS horas_mantenimiento,

                                COALESCE(
                                    SUM(
                                        CASE
                                            WHEN h.estado = 'FUERA_DE_SERVICIO'
                                            THEN EXTRACT(
                                                EPOCH FROM (
                                                    LEAST(
                                                        COALESCE(
                                                            h.fin,
                                                            utc_now()
                                                        ),
                                                        CASE
                                                            WHEN CAST(? AS date) IS NULL
                                                            THEN COALESCE(
                                                                h.fin,
                                                                utc_now()
                                                            )
                                                            ELSE CAST(? AS date)
                                                                 + INTERVAL '1 day'
                                                        END
                                                    )
                                                    -
                                                    GREATEST(
                                                        h.inicio,
                                                        CASE
                                                            WHEN CAST(? AS date) IS NULL
                                                            THEN h.inicio
                                                            ELSE CAST(? AS date)
                                                        END
                                                    )
                                                )
                                            ) / 3600
                                            ELSE 0
                                        END
                                    ),
                                    0
                                ) AS horas_fuera_servicio

                            FROM estado_unidad_historial h

                            WHERE
                                (
                                    CAST(? AS date) IS NULL
                                    OR COALESCE(h.fin, utc_now())
                                       >= CAST(? AS date)
                                )

                                AND (
                                    CAST(? AS date) IS NULL
                                    OR h.inicio <
                                       CAST(? AS date)
                                       + INTERVAL '1 day'
                                )

                            GROUP BY h.unidad_id
                        )

                        SELECT
                            u.id AS unidad_id,
                            u.codigo,
                            u.placa,

                            COALESCE(
                                c.ordenes_cerradas,
                                0
                            ) AS ordenes_cerradas,

                            COALESCE(
                                c.costo_real,
                                0
                            ) AS costo_real,

                            ROUND(
                                COALESCE(
                                    t.horas_mantenimiento,
                                    0
                                )::numeric,
                                2
                            ) AS horas_mantenimiento,

                            ROUND(
                                COALESCE(
                                    t.horas_fuera_servicio,
                                    0
                                )::numeric,
                                2
                            ) AS horas_fuera_servicio,

                            ROUND(
                                (
                                    COALESCE(
                                        t.horas_mantenimiento,
                                        0
                                    )
                                    +
                                    COALESCE(
                                        t.horas_fuera_servicio,
                                        0
                                    )
                                )::numeric,
                                2
                            ) AS horas_inmovilizado

                        FROM unidad u

                        LEFT JOIN costos c
                            ON c.unidad_id = u.id

                        LEFT JOIN tiempos t
                            ON t.unidad_id = u.id

                        WHERE
                            (? = 'TODAS' OR u.codigo = ?)

                        ORDER BY
                            u.codigo
                        """,

                (rs, rowNum) -> new HistorialResumenUnidadResponse(
                        rs.getLong("unidad_id"),
                        rs.getString("codigo"),
                        rs.getString("placa"),
                        rs.getLong("ordenes_cerradas"),
                        rs.getBigDecimal("costo_real"),
                        rs.getBigDecimal("horas_mantenimiento"),
                        rs.getBigDecimal("horas_fuera_servicio"),
                        rs.getBigDecimal("horas_inmovilizado")),

                // costos
                desde,
                desde,
                hasta,
                hasta,

                // mantenimiento
                hasta,
                hasta,
                desde,
                desde,

                // fuera de servicio
                hasta,
                hasta,
                desde,
                desde,

                // intersección historial
                desde,
                desde,
                hasta,
                hasta,

                // unidad
                unidadFiltro,
                unidadFiltro);
    }
}