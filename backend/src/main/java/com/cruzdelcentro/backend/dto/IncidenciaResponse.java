package com.cruzdelcentro.backend.dto;

import java.time.LocalDateTime;

public record IncidenciaResponse(
    Long id,
    String codigo,
    Long unidadId,
    String unidadCodigo,
    String placa,
    Long tipoIncidenciaId,
    String tipo,
    String descripcion,
    String prioridad,
    String reportadoPor,
    LocalDateTime fechaReporte,
    String estado
) {
}