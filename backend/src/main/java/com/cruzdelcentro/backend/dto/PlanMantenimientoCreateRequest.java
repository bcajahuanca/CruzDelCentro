package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record PlanMantenimientoCreateRequest(
    String nombre,
    String descripcion,
    String criterio,
    Integer intervaloDias,
    BigDecimal intervaloKm,
    Integer anticipacionDias,
    BigDecimal anticipacionKm,
    List<ActividadPlanRequest> actividades
) {

    public record ActividadPlanRequest(
        String descripcion,
        Boolean obligatoria
    ) {
    }
}