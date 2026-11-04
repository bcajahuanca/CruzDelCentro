package com.cruzdelcentro.backend.dto;

import java.time.LocalDateTime;

public record OrdenSeguimientoResponse(
    Long id,
    Long usuarioId,
    String usuarioNombre,
    LocalDateTime fecha,
    String estadoAnterior,
    String estadoNuevo,
    String comentario
) {
}