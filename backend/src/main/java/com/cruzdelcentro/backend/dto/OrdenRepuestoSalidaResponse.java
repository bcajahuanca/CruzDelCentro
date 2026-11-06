package com.cruzdelcentro.backend.dto;

public record OrdenRepuestoSalidaResponse(
    Long movimientoId,
    Long costoId,
    Long repuestoId,
    String repuestoCodigo,
    String repuestoNombre,
    java.math.BigDecimal cantidad,
    java.math.BigDecimal precioUnitario,
    java.math.BigDecimal subtotal
) {
}
