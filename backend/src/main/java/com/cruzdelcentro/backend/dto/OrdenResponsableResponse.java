package com.cruzdelcentro.backend.dto;

public record OrdenResponsableResponse(
        Long id,
        String nombres,
        String apellidos,
        String correo,
        String rol
) {
}