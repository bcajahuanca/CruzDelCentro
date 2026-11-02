package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

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
    Long responsableId,
    String responsable,
    String estado,
    String situacion
) {
}