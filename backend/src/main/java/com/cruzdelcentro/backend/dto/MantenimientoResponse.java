package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MantenimientoResponse(
    Long id,
    Long unidadId,
    String unidadCodigo,
    String placa,
    String tipo,
    String descripcion,
    LocalDate fechaVencimiento,
    BigDecimal kilometrajeObjetivo,
    BigDecimal kilometrajeActual,
    LocalDateTime inicioProgramado,
    LocalDateTime finProgramado,
    Long responsableId,
    String responsable,
    String estado,
    String situacion
) {
}