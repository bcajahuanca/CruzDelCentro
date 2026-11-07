package com.cruzdelcentro.backend.dto;

public record UsuarioListadoResponse(
        Long id,
        String nombres,
        String apellidos,
        String correo,
        String telefono,
        Boolean activo,
        Long rolId,
        String rolCodigo,
        String rolNombre
) {
}