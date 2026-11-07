package com.cruzdelcentro.backend.dto;

public record CrearUsuarioRequest(
        String nombres,
        String apellidos,
        String telefono,
        Long rolId,
        String password
) {
}