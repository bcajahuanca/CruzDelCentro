package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrdenTrabajoResponse(
        Long id,
        String codigo,
        Long unidadId,
        String unidadCodigo,
        String placa,
        Long programacionId,
        String tipo,
        String diagnostico,
        Long responsableId,
        String responsable,
        Long proveedorId,
        String estado,
        LocalDateTime fechaApertura,
        LocalDateTime inicioReal,
        LocalDateTime finReal,
        LocalDateTime fechaEstimadaFin,
        LocalDateTime fechaCierre,

        String resultadoPruebas,
        BigDecimal kilometrajeIntervencion,
        String observacionesCierre,
        String motivoEstado
) {
}