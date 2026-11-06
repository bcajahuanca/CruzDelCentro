package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;

public record HistorialResumenUnidadResponse(
        Long unidadId,
        String codigo,
        String placa,
        Long ordenesCerradas,
        BigDecimal costoReal,
        BigDecimal horasMantenimiento,
        BigDecimal horasFueraServicio,
        BigDecimal horasInmovilizado
) {
}