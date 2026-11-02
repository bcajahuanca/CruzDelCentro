package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PlanUnidadCreateRequest(
    Long planId,
    Long unidadId,
    LocalDate fechaBase,
    BigDecimal kilometrajeBase,
    Long responsableId
) {
}