package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.HistorialEstadoResponse;
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
    String unidadCodigo
) {
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
            .replace("_", "\\_") +
        "%";

    String estadoFiltro =
        estado == null ? "TODOS" : estado;

    String unidadFiltro =
        unidadCodigo == null ? "TODAS" : unidadCodigo;

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

    List<HistorialEstadoResponse> registros =
        jdbcTemplate.query(
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
                rs.getObject("registrado_por", Long.class)
            ),
            texto,
            patron,
            patron,
            estadoFiltro,
            estadoFiltro,
            unidadFiltro,
            unidadFiltro,
            limite,
            offset
        );

    Long total = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) " + filtro,
        Long.class,
        texto,
        patron,
        patron,
        estadoFiltro,
        estadoFiltro,
        unidadFiltro,
        unidadFiltro
    );

    long cantidad = total == null ? 0 : total;
    long totalPaginas =
        (cantidad + limite - 1) / limite;

    Long totalGeneral = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM estado_unidad_historial",
        Long.class
    );

    Long totalMantenimiento = jdbcTemplate.queryForObject(
        """
        SELECT COUNT(*)
        FROM estado_unidad_historial
        WHERE estado = 'EN_MANTENIMIENTO'
        """,
        Long.class
    );

    Long totalFueraServicio = jdbcTemplate.queryForObject(
        """
        SELECT COUNT(*)
        FROM estado_unidad_historial
        WHERE estado = 'FUERA_DE_SERVICIO'
        """,
        Long.class
    );

    return Map.of(
        "registros", registros,
        "paginaActual", pagina,
        "totalRegistros", cantidad,
        "totalPaginas", totalPaginas,
        "totalGeneral", totalGeneral,
        "totalMantenimiento", totalMantenimiento,
        "totalFueraServicio", totalFueraServicio
    );
}
}