package com.cruzdelcentro.backend.dto;

public record OrdenActividadCreateRequest(
    String descripcion,
    Boolean obligatoria
) {
}