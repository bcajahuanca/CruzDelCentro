package com.cruzdelcentro.backend.dto;

public record DashboardSituacionResponse(
        Long incidenciasAbiertas,
        Long ordenesActivas,
        Long pendientesValidacion,
        Long mantenimientosPendientes
) {
}