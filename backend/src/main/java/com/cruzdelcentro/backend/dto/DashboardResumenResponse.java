package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResumenResponse(
        Long totalUnidades,
        Long operativas,
        Long enMantenimiento,
        Long fueraServicio,
        BigDecimal porcentajeDisponibilidad,
        List<DashboardEstadoFlotaResponse> distribucionEstados
) {
}