package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.HistorialEstadoResponse;
import com.cruzdelcentro.backend.dto.HistorialMantenimientoResponse;

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
            String unidadCodigo) {

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
                unidadFiltro);

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
}