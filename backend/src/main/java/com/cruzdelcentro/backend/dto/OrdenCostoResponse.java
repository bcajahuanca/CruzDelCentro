package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;

public record OrdenCostoResponse(
    Long id,
    Long ordenId,
    String categoria,
    String naturaleza,
    String descripcion,
    BigDecimal cantidad,
    BigDecimal precioUnitario,
    BigDecimal subtotal,
    Boolean origenInventario
) {
}
