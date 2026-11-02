package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record PlanMantenimientoResponse(
    Long id,
    String nombre,
    String descripcion,
    String criterio,
    Integer intervaloDias,
    BigDecimal intervaloKm,
    Integer anticipacionDias,
    BigDecimal anticipacionKm,
    Boolean activo,
    List<ActividadResponse> actividades
) {

    public record ActividadResponse(
        Long id,
        String descripcion,
        Integer ordenVisual,
        Boolean obligatoria
    ) {
    }
}