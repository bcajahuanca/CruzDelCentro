package com.cruzdelcentro.backend.dto;

import java.time.LocalDateTime;

public record OrdenTrabajoCreateRequest(
    Long unidadId,
    Long programacionId,
    String tipo,
    Long responsableId,
    Long proveedorId,
    LocalDateTime fechaEstimadaFin
) {
}