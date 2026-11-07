package com.cruzdelcentro.backend.service;

import com.cruzdelcentro.backend.dto.ActualizarUsuarioRequest;
import com.cruzdelcentro.backend.dto.CambiarEstadoUsuarioRequest;
import com.cruzdelcentro.backend.dto.CrearUsuarioRequest;
import com.cruzdelcentro.backend.dto.RolUsuarioResponse;
import com.cruzdelcentro.backend.dto.UsuarioListadoResponse;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UsuarioService {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioListadoResponse> listarUsuarios() {

        return jdbcTemplate.query(
                """
                        SELECT
                            u.id,
                            u.nombres,
                            u.apellidos,
                            u.correo,
                            u.telefono,
                            u.activo,

                            r.id AS rol_id,
                            r.codigo AS rol_codigo,
                            r.nombre AS rol_nombre

                        FROM usuario u

                        LEFT JOIN usuario_rol ur
                            ON ur.usuario_id = u.id

                        LEFT JOIN rol r
                            ON r.id = ur.rol_id

                        ORDER BY
                            u.activo DESC,
                            u.apellidos,
                            u.nombres
                        """,

                (rs, rowNum) -> new UsuarioListadoResponse(
                        rs.getLong("id"),
                        rs.getString("nombres"),
                        rs.getString("apellidos"),
                        rs.getString("correo"),
                        rs.getString("telefono"),
                        rs.getBoolean("activo"),
                        rs.getObject("rol_id", Long.class),
                        rs.getString("rol_codigo"),
                        rs.getString("rol_nombre")));
    }

    public List<RolUsuarioResponse> listarRoles() {

        return jdbcTemplate.query(
                """
                        SELECT
                            id,
                            codigo,
                            nombre
                        FROM rol
                        ORDER BY nombre
                        """,

                (rs, rowNum) -> new RolUsuarioResponse(
                        rs.getLong("id"),
                        rs.getString("codigo"),
                        rs.getString("nombre")));
    }

    private String generarCorreo(
            String nombres,
            String apellidos,
            Long usuarioIdExcluir) {

        String primerNombre = nombres.trim()
                .split("\\s+")[0];

        String primerApellido = apellidos.trim()
                .split("\\s+")[0];

        String inicial = normalizar(primerNombre)
                .substring(0, 1);

        String apellido = normalizar(primerApellido);

        String base = inicial + apellido;

        String correo = base + "@ccentro";

        int numero = 2;

        while (correoExiste(
                correo,
                usuarioIdExcluir)) {

            correo = base +
                    numero +
                    "@ccentro";

            numero++;
        }

        return correo;
    }

    private String normalizar(
            String texto) {

        String normalizado = java.text.Normalizer.normalize(
                texto,
                java.text.Normalizer.Form.NFD);

        return normalizado
                .replaceAll(
                        "\\p{M}",
                        "")
                .replaceAll(
                        "[^a-zA-Z0-9]",
                        "")
                .toLowerCase();
    }

    @Transactional
    public UsuarioListadoResponse crearUsuario(
            CrearUsuarioRequest request,
            String correoAdministrador) {

        if (request.nombres() == null ||
                request.nombres().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los nombres son obligatorios");
        }

        if (request.apellidos() == null ||
                request.apellidos().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los apellidos son obligatorios");
        }

        if (request.password() == null ||
                request.password().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La contraseña es obligatoria");
        }

        if (request.rolId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El rol es obligatorio");
        }

        // Usuario administrador que realiza la operación

        Long administradorId = jdbcTemplate.queryForObject(
                """
                        SELECT id
                        FROM usuario
                        WHERE LOWER(correo) =
                              LOWER(?)
                          AND activo = true
                        """,
                Long.class,
                correoAdministrador);

        // Auditoría

        jdbcTemplate.queryForObject(
                """
                        SELECT set_config(
                            'app.usuario_id',
                            ?,
                            true
                        )
                        """,
                String.class,
                administradorId.toString());

        // Validar rol

        Boolean rolExiste = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM rol
                            WHERE id = ?
                        )
                        """,
                Boolean.class,
                request.rolId());

        if (!Boolean.TRUE.equals(rolExiste)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El rol seleccionado no existe");
        }

        String correo = generarCorreo(
                request.nombres(),
                request.apellidos(),
                null);

        String passwordHash = passwordEncoder.encode(
                request.password());

        Long usuarioId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO usuario (
                            nombres,
                            apellidos,
                            correo,
                            password_hash,
                            telefono,
                            activo
                        )
                        VALUES (?, ?, ?, ?, ?, true)
                        RETURNING id
                        """,
                Long.class,

                request.nombres().trim(),
                request.apellidos().trim(),
                correo,
                passwordHash,

                request.telefono() == null ||
                        request.telefono().isBlank()
                                ? null
                                : request.telefono().trim());

        jdbcTemplate.update(
                """
                        INSERT INTO usuario_rol (
                            usuario_id,
                            rol_id
                        )
                        VALUES (?, ?)
                        """,
                usuarioId,
                request.rolId());

        return obtenerUsuarioPorId(
                usuarioId);
    }

    private UsuarioListadoResponse obtenerUsuarioPorId(
            Long usuarioId) {

        return jdbcTemplate.queryForObject(
                """
                        SELECT
                            u.id,
                            u.nombres,
                            u.apellidos,
                            u.correo,
                            u.telefono,
                            u.activo,

                            r.id AS rol_id,
                            r.codigo AS rol_codigo,
                            r.nombre AS rol_nombre

                        FROM usuario u

                        LEFT JOIN usuario_rol ur
                            ON ur.usuario_id = u.id

                        LEFT JOIN rol r
                            ON r.id = ur.rol_id

                        WHERE u.id = ?
                        """,

                (rs, rowNum) -> new UsuarioListadoResponse(
                        rs.getLong("id"),
                        rs.getString("nombres"),
                        rs.getString("apellidos"),
                        rs.getString("correo"),
                        rs.getString("telefono"),
                        rs.getBoolean("activo"),
                        rs.getObject(
                                "rol_id",
                                Long.class),
                        rs.getString(
                                "rol_codigo"),
                        rs.getString(
                                "rol_nombre")),

                usuarioId);
    }

    @Transactional
    public UsuarioListadoResponse actualizarUsuario(
            Long usuarioId,
            ActualizarUsuarioRequest request,
            String correoAdministrador) {

        if (request.nombres() == null ||
                request.nombres().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los nombres son obligatorios");
        }

        if (request.apellidos() == null ||
                request.apellidos().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los apellidos son obligatorios");
        }

        if (request.rolId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El rol es obligatorio");
        }

        Long administradorId = jdbcTemplate.queryForObject(
                """
                        SELECT id
                        FROM usuario
                        WHERE LOWER(correo) = LOWER(?)
                          AND activo = true
                        """,
                Long.class,
                correoAdministrador);

        jdbcTemplate.queryForObject(
                """
                        SELECT set_config(
                            'app.usuario_id',
                            ?,
                            true
                        )
                        """,
                String.class,
                administradorId.toString());

        Boolean usuarioExiste = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM usuario
                            WHERE id = ?
                        )
                        """,
                Boolean.class,
                usuarioId);

        if (!Boolean.TRUE.equals(usuarioExiste)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Usuario no encontrado");
        }

        Boolean rolExiste = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM rol
                            WHERE id = ?
                        )
                        """,
                Boolean.class,
                request.rolId());

        if (!Boolean.TRUE.equals(rolExiste)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El rol seleccionado no existe");
        }

        String correoGenerado = generarCorreo(
                request.nombres(),
                request.apellidos(),
                usuarioId);

        boolean cambiarPassword = request.nuevaPassword() != null &&
                !request.nuevaPassword().isBlank();

        if (cambiarPassword) {

            String passwordHash = passwordEncoder.encode(
                    request.nuevaPassword());

            jdbcTemplate.update(
                    """
                            UPDATE usuario
                            SET
                                nombres = ?,
                                apellidos = ?,
                                correo = ?,
                                telefono = ?,
                                password_hash = ?
                            WHERE id = ?
                            """,

                    request.nombres().trim(),
                    request.apellidos().trim(),
                    correoGenerado,

                    request.telefono() == null ||
                            request.telefono().isBlank()
                                    ? null
                                    : request.telefono().trim(),

                    passwordHash,
                    usuarioId);

        } else {

            jdbcTemplate.update(
                    """
                            UPDATE usuario
                            SET
                                nombres = ?,
                                apellidos = ?,
                                correo = ?,
                                telefono = ?
                            WHERE id = ?
                            """,

                    request.nombres().trim(),
                    request.apellidos().trim(),
                    correoGenerado,

                    request.telefono() == null ||
                            request.telefono().isBlank()
                                    ? null
                                    : request.telefono().trim(),

                    usuarioId);
        }

        jdbcTemplate.update(
                """
                        DELETE FROM usuario_rol
                        WHERE usuario_id = ?
                        """,
                usuarioId);

        jdbcTemplate.update(
                """
                        INSERT INTO usuario_rol (
                            usuario_id,
                            rol_id
                        )
                        VALUES (?, ?)
                        """,
                usuarioId,
                request.rolId());

        return obtenerUsuarioPorId(usuarioId);
    }

    private boolean correoExiste(
            String correo,
            Long usuarioIdExcluir) {

        if (usuarioIdExcluir == null) {

            return Boolean.TRUE.equals(
                    jdbcTemplate.queryForObject(
                            """
                                    SELECT EXISTS(
                                        SELECT 1
                                        FROM usuario
                                        WHERE LOWER(correo) =
                                              LOWER(?)
                                    )
                                    """,
                            Boolean.class,
                            correo));
        }

        return Boolean.TRUE.equals(
                jdbcTemplate.queryForObject(
                        """
                                SELECT EXISTS(
                                    SELECT 1
                                    FROM usuario
                                    WHERE LOWER(correo) =
                                          LOWER(?)
                                      AND id <> ?
                                )
                                """,
                        Boolean.class,
                        correo,
                        usuarioIdExcluir));
    }

    @Transactional
    public UsuarioListadoResponse cambiarEstadoUsuario(
            Long usuarioId,
            CambiarEstadoUsuarioRequest request,
            String correoAdministrador) {

        if (request.activo() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El estado es obligatorio");
        }

        Long administradorId = jdbcTemplate.queryForObject(
                """
                        SELECT id
                        FROM usuario
                        WHERE LOWER(correo) = LOWER(?)
                          AND activo = true
                        """,
                Long.class,
                correoAdministrador);

        jdbcTemplate.queryForObject(
                """
                        SELECT set_config(
                            'app.usuario_id',
                            ?,
                            true
                        )
                        """,
                String.class,
                administradorId.toString());

        Boolean usuarioExiste = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM usuario
                            WHERE id = ?
                        )
                        """,
                Boolean.class,
                usuarioId);

        if (!Boolean.TRUE.equals(usuarioExiste)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Usuario no encontrado");
        }

        if (administradorId.equals(usuarioId) &&
                !request.activo()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No puedes desactivar tu propio usuario");
        }

        jdbcTemplate.update(
                """
                        UPDATE usuario
                        SET activo = ?
                        WHERE id = ?
                        """,
                request.activo(),
                usuarioId);

        return obtenerUsuarioPorId(usuarioId);
    }
}
