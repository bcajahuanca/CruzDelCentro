package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MovimientoRepuestoResponse(
        Long id,
        LocalDateTime fecha,

        Long repuestoId,
        String codigoRepuesto,
        String nombreRepuesto,

        Long almacenId,
        String almacen,

        String tipo,
        BigDecimal cantidad,
        BigDecimal precioUnitario,

        Long ordenId,
        String codigoOrden,

        Long proveedorId,
        String proveedor,

        Long registradoPor,
        String usuario,

        String motivo
) {
}