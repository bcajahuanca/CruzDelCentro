package com.cruzdelcentro.backend.dto;

public record RepuestoDisponibleResponse(
    Long repuestoId,
    String codigo,
    String nombre,
    String unidadMedida,
    Long almacenId,
    String almacenNombre,
    java.math.BigDecimal stock
) {
}
