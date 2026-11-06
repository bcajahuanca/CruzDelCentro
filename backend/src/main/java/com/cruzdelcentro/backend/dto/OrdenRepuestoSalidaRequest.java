package com.cruzdelcentro.backend.dto;

public record OrdenRepuestoSalidaRequest(
    Long repuestoId,
    Long almacenId,
    java.math.BigDecimal cantidad,
    java.math.BigDecimal precioUnitario,
    String motivo
) {
}
