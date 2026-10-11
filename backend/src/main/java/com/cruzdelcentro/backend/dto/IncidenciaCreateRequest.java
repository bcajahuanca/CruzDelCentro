package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;

public record IncidenciaCreateRequest(
    Long unidadId,
    Long tipoIncidenciaId,
    String descripcion,
    String prioridad,
    String ubicacion,
    BigDecimal kilometrajeReporte
) {
}