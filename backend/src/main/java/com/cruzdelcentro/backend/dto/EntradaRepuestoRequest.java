package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;

public record EntradaRepuestoRequest(
        Long repuestoId,
        Long almacenId,
        BigDecimal cantidad,
        BigDecimal precioUnitario,
        Long proveedorId,
        String motivo
) {
}