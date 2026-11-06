package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.AjusteRepuestoRequest;
import com.cruzdelcentro.backend.dto.AlmacenExistenciaResponse;
import com.cruzdelcentro.backend.dto.AlmacenExistenciasPaginadoResponse;
import com.cruzdelcentro.backend.dto.EntradaRepuestoRequest;
import com.cruzdelcentro.backend.dto.MovimientoRepuestoResponse;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

    public Map<String, Object> listarMovimientos(
            int pagina,
            Long repuestoId,
            Long almacenId,
            String tipo,
            String fechaDesde,
            String fechaHasta) {

        int limite = 20;
        int offset = pagina * limite;

        String tipoFiltro = tipo == null
                ? "TODOS"
                : tipo;

        String desde = fechaDesde == null || fechaDesde.isBlank()
                ? null
                : fechaDesde;

        String hasta = fechaHasta == null || fechaHasta.isBlank()
                ? null
                : fechaHasta;

        String filtro = """
                FROM movimiento_repuesto m

                JOIN repuesto r
                    ON r.id = m.repuesto_id

                JOIN almacen a
                    ON a.id = m.almacen_id

                LEFT JOIN orden_trabajo ot
                    ON ot.id = m.orden_id

                LEFT JOIN proveedor p
                    ON p.id = m.proveedor_id

                JOIN usuario u
                    ON u.id = m.registrado_por

                WHERE
                    (
                        CAST(? AS bigint) IS NULL
                        OR m.repuesto_id = CAST(? AS bigint)
                    )

                    AND (
                        CAST(? AS bigint) IS NULL
                        OR m.almacen_id = CAST(? AS bigint)
                    )

                    AND (
                        ? = 'TODOS'
                        OR m.tipo = ?
                    )

                    AND (
                        CAST(? AS date) IS NULL
                        OR m.fecha >= CAST(? AS date)
                    )

                    AND (
                        CAST(? AS date) IS NULL
                        OR m.fecha < CAST(? AS date) + INTERVAL '1 day'
                    )
                """;

        String sql = """
                SELECT
                    m.id,
                    m.fecha,

                    r.id AS repuesto_id,
                    r.codigo AS codigo_repuesto,
                    r.nombre AS nombre_repuesto,

                    a.id AS almacen_id,
                    a.nombre AS almacen,

                    m.tipo,
                    m.cantidad,
                    m.precio_unitario,

                    ot.id AS orden_id,
                    ot.codigo AS codigo_orden,

                    p.id AS proveedor_id,
                    p.razon_social AS proveedor,

                    u.id AS registrado_por,
                    CONCAT(u.nombres, ' ', u.apellidos) AS usuario,

                    m.motivo
                """ + filtro + """
                ORDER BY m.fecha DESC, m.id DESC
                LIMIT ? OFFSET ?
                """;

        List<MovimientoRepuestoResponse> registros = jdbcTemplate.query(
                sql,

                (rs, rowNum) -> new MovimientoRepuestoResponse(
                        rs.getLong("id"),

                        rs.getTimestamp("fecha")
                                .toLocalDateTime(),

                        rs.getLong("repuesto_id"),
                        rs.getString("codigo_repuesto"),
                        rs.getString("nombre_repuesto"),

                        rs.getLong("almacen_id"),
                        rs.getString("almacen"),

                        rs.getString("tipo"),
                        rs.getBigDecimal("cantidad"),
                        rs.getBigDecimal("precio_unitario"),

                        rs.getObject("orden_id", Long.class),
                        rs.getString("codigo_orden"),

                        rs.getObject("proveedor_id", Long.class),
                        rs.getString("proveedor"),

                        rs.getLong("registrado_por"),
                        rs.getString("usuario"),

                        rs.getString("motivo")),

                repuestoId,
                repuestoId,

                almacenId,
                almacenId,

                tipoFiltro,
                tipoFiltro,

                desde,
                desde,

                hasta,
                hasta,

                limite,
                offset);

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) " + filtro,
                Long.class,

                repuestoId,
                repuestoId,

                almacenId,
                almacenId,

                tipoFiltro,
                tipoFiltro,

                desde,
                desde,

                hasta,
                hasta);

        long cantidad = total == null ? 0 : total;

        long totalPaginas = (cantidad + limite - 1) / limite;

        return Map.of(
                "registros", registros,
                "paginaActual", pagina,
                "totalRegistros", cantidad,
                "totalPaginas", totalPaginas);
    }

    @Transactional
    public void registrarEntrada(
            EntradaRepuestoRequest request,
            String correoUsuario) {

        if (request.repuestoId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El repuesto es obligatorio");
        }

        if (request.almacenId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El almacén es obligatorio");
        }

        if (request.cantidad() == null ||
                request.cantidad().signum() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La cantidad debe ser mayor a cero");
        }

        if (request.precioUnitario() == null ||
                request.precioUnitario().signum() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El precio unitario no puede ser negativo");
        }

        if (request.motivo() == null ||
                request.motivo().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El motivo es obligatorio");
        }

        Long usuarioId = jdbcTemplate.query(
                """
                        SELECT id
                        FROM usuario
                        WHERE correo = ?
                          AND activo = true
                        """,
                rs -> {
                    if (!rs.next()) {
                        return null;
                    }

                    return rs.getLong("id");
                },
                correoUsuario);

        if (usuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuario no encontrado o inactivo");
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

        Integer repuestoExiste = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM repuesto
                        WHERE id = ?
                          AND activo = true
                        """,
                Integer.class,
                request.repuestoId());

        if (repuestoExiste == null ||
                repuestoExiste == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "El repuesto no existe o está inactivo");
        }

        Integer almacenExiste = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM almacen
                        WHERE id = ?
                          AND activo = true
                        """,
                Integer.class,
                request.almacenId());

        if (almacenExiste == null ||
                almacenExiste == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "El almacén no existe o está inactivo");
        }

        if (request.proveedorId() != null) {

            Integer proveedorExiste = jdbcTemplate.queryForObject(
                    """
                            SELECT COUNT(*)
                            FROM proveedor
                            WHERE id = ?
                            """,
                    Integer.class,
                    request.proveedorId());

            if (proveedorExiste == null ||
                    proveedorExiste == 0) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "El proveedor no existe");
            }
        }

        jdbcTemplate.update(
                """
                        INSERT INTO existencia (
                            repuesto_id,
                            almacen_id,
                            cantidad
                        )
                        VALUES (?, ?, ?)

                        ON CONFLICT (
                            repuesto_id,
                            almacen_id
                        )
                        DO UPDATE SET
                            cantidad =
                                existencia.cantidad
                                + EXCLUDED.cantidad
                        """,
                request.repuestoId(),
                request.almacenId(),
                request.cantidad());

        jdbcTemplate.update(
                """
                        INSERT INTO movimiento_repuesto (
                            clave_operacion,
                            repuesto_id,
                            almacen_id,
                            tipo,
                            cantidad,
                            precio_unitario,
                            proveedor_id,
                            fecha,
                            registrado_por,
                            motivo
                        )
                        VALUES (
                            ?,
                            ?,
                            ?,
                            'ENTRADA',
                            ?,
                            ?,
                            ?,
                            utc_now(),
                            ?,
                            ?
                        )
                        """,

                UUID.randomUUID().toString(),

                request.repuestoId(),
                request.almacenId(),

                request.cantidad(),
                request.precioUnitario(),

                request.proveedorId(),

                usuarioId,

                request.motivo().trim());
    }

    @Transactional
    public void registrarAjuste(
            AjusteRepuestoRequest request,
            String correoUsuario) {

        if (request.repuestoId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El repuesto es obligatorio");
        }

        if (request.almacenId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El almacén es obligatorio");
        }

        if (request.tipo() == null ||
                !List.of(
                        "AJUSTE_POSITIVO",
                        "AJUSTE_NEGATIVO").contains(request.tipo())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tipo de ajuste inválido");
        }

        if (request.cantidad() == null ||
                request.cantidad().signum() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La cantidad debe ser mayor a cero");
        }

        if (request.motivo() == null ||
                request.motivo().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El motivo es obligatorio");
        }

        Long usuarioId = jdbcTemplate.query(
                """
                        SELECT id
                        FROM usuario
                        WHERE correo = ?
                          AND activo = true
                        """,
                rs -> {

                    if (!rs.next()) {
                        return null;
                    }

                    return rs.getLong("id");
                },
                correoUsuario);

        if (usuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuario no encontrado o inactivo");
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

        Integer repuestoExiste = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM repuesto
                        WHERE id = ?
                          AND activo = true
                        """,
                Integer.class,
                request.repuestoId());

        if (repuestoExiste == null ||
                repuestoExiste == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "El repuesto no existe o está inactivo");
        }

        Integer almacenExiste = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM almacen
                        WHERE id = ?
                          AND activo = true
                        """,
                Integer.class,
                request.almacenId());

        if (almacenExiste == null ||
                almacenExiste == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "El almacén no existe o está inactivo");
        }

        BigDecimal stockActual = jdbcTemplate.query(
                """
                        SELECT cantidad
                        FROM existencia
                        WHERE repuesto_id = ?
                          AND almacen_id = ?
                        FOR UPDATE
                        """,
                rs -> {

                    if (!rs.next()) {
                        return BigDecimal.ZERO;
                    }

                    return rs.getBigDecimal("cantidad");
                },
                request.repuestoId(),
                request.almacenId());

        if (request.tipo().equals("AJUSTE_NEGATIVO") &&
                stockActual.compareTo(request.cantidad()) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Stock insuficiente para realizar el ajuste negativo");
        }

        if (request.tipo().equals("AJUSTE_POSITIVO")) {

            jdbcTemplate.update(
                    """
                            INSERT INTO existencia (
                                repuesto_id,
                                almacen_id,
                                cantidad
                            )
                            VALUES (?, ?, ?)

                            ON CONFLICT (
                                repuesto_id,
                                almacen_id
                            )
                            DO UPDATE SET
                                cantidad =
                                    existencia.cantidad
                                    + EXCLUDED.cantidad
                            """,
                    request.repuestoId(),
                    request.almacenId(),
                    request.cantidad());

        } else {

            jdbcTemplate.update(
                    """
                            UPDATE existencia
                            SET cantidad =
                                cantidad - ?
                            WHERE repuesto_id = ?
                              AND almacen_id = ?
                            """,
                    request.cantidad(),
                    request.repuestoId(),
                    request.almacenId());
        }

        jdbcTemplate.update(
                """
                        INSERT INTO movimiento_repuesto (
                            clave_operacion,
                            repuesto_id,
                            almacen_id,
                            tipo,
                            cantidad,
                            precio_unitario,
                            fecha,
                            registrado_por,
                            motivo
                        )
                        VALUES (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            0,
                            utc_now(),
                            ?,
                            ?
                        )
                        """,

                UUID.randomUUID().toString(),

                request.repuestoId(),
                request.almacenId(),

                request.tipo(),
                request.cantidad(),

                usuarioId,

                request.motivo().trim());
    }
}