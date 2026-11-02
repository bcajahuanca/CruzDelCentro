package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MantenimientoCreateRequest(
    Long unidadId,
    String tipo,
    String descripcion,
    LocalDate fechaVencimiento,
    BigDecimal kilometrajeObjetivo,
    LocalDateTime inicioProgramado,
    LocalDateTime finProgramado,
    Long responsableId,
    Long planUnidadId,
    Integer ciclo
) {
}