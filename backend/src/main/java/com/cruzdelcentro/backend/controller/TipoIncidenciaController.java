package com.cruzdelcentro.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tipos-incidencia")
public class TipoIncidenciaController {

    private final JdbcTemplate jdbcTemplate;

    public TipoIncidenciaController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<Map<String, Object>> listarTipos() {

        return jdbcTemplate.queryForList("""
            SELECT
                id,
                nombre,
                descripcion
            FROM tipo_incidencia
            WHERE activo = true
            ORDER BY nombre
        """);
    }
}