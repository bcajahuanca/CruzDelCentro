package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;

public record AjusteRepuestoRequest(
        Long repuestoId,
        Long almacenId,
        String tipo,
        BigDecimal cantidad,
        String motivo
) {
}