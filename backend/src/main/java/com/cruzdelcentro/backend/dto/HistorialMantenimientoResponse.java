package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record HistorialMantenimientoResponse(
        Long ordenId,
        String codigo,
        Long unidadId,
        String unidad,
        String placa,
        String tipo,
        LocalDateTime fechaCierre,
        LocalDateTime inicioReal,
        LocalDateTime finReal,
        BigDecimal kilometrajeIntervencion,
        String diagnostico,
        String resultadoPruebas,
        Long responsableId,
        Long proveedorId,
        BigDecimal costoReal,
        BigDecimal costoEstimado
) {
}