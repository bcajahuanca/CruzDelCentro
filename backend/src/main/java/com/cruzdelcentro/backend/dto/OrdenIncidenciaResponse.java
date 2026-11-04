package com.cruzdelcentro.backend.dto;

import java.time.LocalDateTime;

public record OrdenIncidenciaResponse(
    Long id,
    String codigo,
    Long unidadId,
    String unidadCodigo,
    String placa,
    String tipo,
    String descripcion,
    String prioridad,
    String estado,
    LocalDateTime fechaReporte
) {
}