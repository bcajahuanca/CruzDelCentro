package com.cruzdelcentro.backend.dto;

public record OrdenCostoCreateRequest(
    String categoria,
    String naturaleza,
    String descripcion,
    java.math.BigDecimal cantidad,
    java.math.BigDecimal precioUnitario
) {
}
