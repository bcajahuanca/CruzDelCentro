package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record DashboardProximoMantenimientoResponse(
        Long programacionId,
        Long unidadId,
        String codigo,
        String placa,

        String tipo,
        String descripcion,

        LocalDate fechaVencimiento,
        BigDecimal kilometrajeObjetivo,

        LocalDateTime inicioProgramado,
        LocalDateTime finProgramado,

        BigDecimal kilometrajeActual,
        String estado,
        String situacion
) {
}