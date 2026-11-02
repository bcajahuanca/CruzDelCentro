package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PlanUnidadResponse(
    Long id,
    Long planId,
    String planNombre,
    Long unidadId,
    String unidadCodigo,
    String placa,
    LocalDate fechaBase,
    BigDecimal kilometrajeBase,
    Boolean activo
) {
}