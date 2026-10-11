package com.cruzdelcentro.backend.dto;

import java.time.LocalDateTime;

public record HistorialEstadoResponse(
    Long id,
    Long unidadId,
    String codigo,
    String placa,
    String estado,
    LocalDateTime inicio,
    LocalDateTime fin,
    String motivo,
    Long registradoPor
) {}