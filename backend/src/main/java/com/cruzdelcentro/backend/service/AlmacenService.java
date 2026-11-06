package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.AlmacenExistenciaResponse;
import com.cruzdelcentro.backend.dto.AlmacenExistenciasPaginadoResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlmacenService {

    private final JdbcTemplate jdbcTemplate;

    public AlmacenService(
            JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AlmacenExistenciasPaginadoResponse listarExistencias(
            int pagina,
            String busqueda,
            Long almacenId,
            String estadoStock) {

        int limite = 20;
        int offset = pagina * limite;

        String texto = busqueda == null
                ? ""
                : busqueda.trim().toLowerCase();

        String patron = "%"
                + texto
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_")
                + "%";

        String estadoFiltro = estadoStock == null
                ? "TODOS"
                : estadoStock;

        String base = """
                            FROM repuesto r

                            CROSS JOIN almacen a

                            LEFT JOIN existencia e
                                ON e.repuesto_id = r.id
                                AND e.almacen_id = a.id

                            WHERE r.activo = true
                              AND a.activo = true

                              AND (
                                    ? = ''
                                    OR LOWER(r.codigo) LIKE ?
                                    OR LOWER(r.nombre) LIKE ?
                                  )

                              AND (
                                    CAST(? AS bigint) IS NULL
                                    OR a.id = CAST(? AS bigint)
                                )

                              AND (
                                    ? = 'TODOS'

                                    OR (
                                        ? = 'SIN_STOCK'
                                        AND COALESCE(e.cantidad, 0) = 0
                                    )

                                    OR (
                                        ? = 'BAJO'
                                        AND COALESCE(e.cantidad, 0) > 0
                                        AND COALESCE(e.cantidad, 0)
                                            <= r.stock_minimo
                                    )

                                    OR (
                                        ? = 'NORMAL'
                                        AND COALESCE(e.cantidad, 0)
                                            > r.stock_minimo
                                    )
                                  )
                            """;

        String sql = """
                SELECT
                    r.id AS repuesto_id,
                    r.codigo,
                    r.nombre,
                    r.unidad_medida,
                    r.stock_minimo,

                    a.id AS almacen_id,
                    a.nombre AS almacen,
                    a.ubicacion,

                    COALESCE(
                        e.cantidad,
                        0
                    ) AS cantidad,

                    CASE
                        WHEN COALESCE(e.cantidad, 0) = 0
                            THEN 'SIN_STOCK'

                        WHEN COALESCE(e.cantidad, 0)
                             <= r.stock_minimo
                            THEN 'BAJO'

                        ELSE 'NORMAL'
                    END AS estado_stock

                """ + base + """

                ORDER BY
                    CASE
                        WHEN COALESCE(e.cantidad, 0) = 0
                            THEN 1

                        WHEN COALESCE(e.cantidad, 0)
                             <= r.stock_minimo
                            THEN 2

                        ELSE 3
                    END,
                    r.codigo,
                    a.nombre

                LIMIT ?
                OFFSET ?
                """;

        List<AlmacenExistenciaResponse> registros = jdbcTemplate.query(
                sql,

                (rs, rowNum) -> new AlmacenExistenciaResponse(
                        rs.getLong("repuesto_id"),
                        rs.getString("codigo"),
                        rs.getString("nombre"),
                        rs.getString("unidad_medida"),
                        rs.getBigDecimal("stock_minimo"),

                        rs.getLong("almacen_id"),
                        rs.getString("almacen"),
                        rs.getString("ubicacion"),

                        rs.getBigDecimal("cantidad"),
                        rs.getString("estado_stock")),

                texto,
                patron,
                patron,

                almacenId,
                almacenId,

                estadoFiltro,
                estadoFiltro,
                estadoFiltro,
                estadoFiltro,

                limite,
                offset);

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) " + base,
                Long.class,

                texto,
                patron,
                patron,

                almacenId,
                almacenId,

                estadoFiltro,
                estadoFiltro,
                estadoFiltro,
                estadoFiltro);

        /*
         * KPIs globales.
         */

        Long totalRepuestos = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM repuesto
                        WHERE activo = true
                        """,
                Long.class);

        Long stockBajo = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM repuesto r

                        CROSS JOIN almacen a

                        LEFT JOIN existencia e
                            ON e.repuesto_id = r.id
                            AND e.almacen_id = a.id

                        WHERE r.activo = true
                          AND a.activo = true

                          AND COALESCE(e.cantidad, 0) > 0

                          AND COALESCE(e.cantidad, 0)
                              <= r.stock_minimo
                        """,
                Long.class);

        Long sinStock = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM repuesto r

                        CROSS JOIN almacen a

                        LEFT JOIN existencia e
                            ON e.repuesto_id = r.id
                            AND e.almacen_id = a.id

                        WHERE r.activo = true
                          AND a.activo = true

                          AND COALESCE(e.cantidad, 0) = 0
                        """,
                Long.class);

        Long movimientos30Dias = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM movimiento_repuesto
                        WHERE fecha >= utc_now()
                                      - INTERVAL '30 days'
                        """,
                Long.class);

        long cantidad = total == null
                ? 0
                : total;

        long totalPaginas = (cantidad + limite - 1)
                / limite;

        return new AlmacenExistenciasPaginadoResponse(
                registros,

                pagina,
                cantidad,
                totalPaginas,

                totalRepuestos == null
                        ? 0
                        : totalRepuestos,

                stockBajo == null
                        ? 0
                        : stockBajo,

                sinStock == null
                        ? 0
                        : sinStock,

                movimientos30Dias == null
                        ? 0
                        : movimientos30Dias);
    }
}