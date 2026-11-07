package com.cruzdelcentro.backend.dto;

public record ActualizarUsuarioRequest(
        String nombres,
        String apellidos,
        String telefono,
        Long rolId,
        String nuevaPassword
) {
}