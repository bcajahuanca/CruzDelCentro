package com.cruzdelcentro.backend.dto;

import java.time.LocalDateTime;

public record OrdenActividadResponse(
    Long id,
    Long ordenId,
    String descripcion,
    Integer ordenVisual,
    Boolean obligatoria,
    Boolean completada,
    Long realizadaPor,
    LocalDateTime completadaEn,
    String observaciones
) {
}