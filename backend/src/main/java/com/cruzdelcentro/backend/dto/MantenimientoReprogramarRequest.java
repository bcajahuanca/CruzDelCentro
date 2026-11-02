package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MantenimientoReprogramarRequest(
    LocalDate fechaVencimiento,
    BigDecimal kilometrajeObjetivo,
    String motivo
) {
}