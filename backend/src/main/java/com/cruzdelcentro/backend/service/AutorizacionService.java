package com.cruzdelcentro.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AutorizacionService {

    private final JdbcTemplate jdbcTemplate;

    public AutorizacionService(
        JdbcTemplate jdbcTemplate
    ) {
        this.jdbcTemplate = jdbcTemplate;
    }


    public List<String> obtenerRoles(
        Long usuarioId
    ) {

        return jdbcTemplate.queryForList(
            """
            SELECT DISTINCT r.codigo
            FROM usuario_rol ur
            JOIN rol r
                ON r.id = ur.rol_id
            WHERE ur.usuario_id = ?
            ORDER BY r.codigo
            """,
            String.class,
            usuarioId
        );
    }


    public List<String> obtenerPermisos(
        Long usuarioId
    ) {

        return jdbcTemplate.queryForList(
            """
            SELECT DISTINCT p.codigo
            FROM usuario_rol ur

            JOIN rol r
                ON r.id = ur.rol_id

            JOIN rol_permiso rp
                ON rp.rol_id = r.id

            JOIN permiso p
                ON p.id = rp.permiso_id

            WHERE ur.usuario_id = ?

            ORDER BY p.codigo
            """,
            String.class,
            usuarioId
        );
    }
}