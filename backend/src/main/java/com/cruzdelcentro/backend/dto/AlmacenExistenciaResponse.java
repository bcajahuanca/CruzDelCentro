package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;

public record AlmacenExistenciaResponse(
        Long repuestoId,
        String codigo,
        String nombre,
        String unidadMedida,
        BigDecimal stockMinimo,

        Long almacenId,
        String almacen,
        String ubicacion,

        BigDecimal cantidad,
        String estadoStock
) {
}