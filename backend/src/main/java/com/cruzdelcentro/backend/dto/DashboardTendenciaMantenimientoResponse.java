package com.cruzdelcentro.backend.dto;

public record DashboardTendenciaMantenimientoResponse(
        String mes,
        Long preventivos,
        Long correctivos
) {
}