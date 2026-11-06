package com.cruzdelcentro.backend.dto;

public record DashboardUnidadAtencionResponse(
        Long unidadId,
        String codigo,
        String placa,
        String estadoOperativo,

        Long ordenId,
        String codigoOrden,

        Long incidenciaId,
        String codigoIncidencia,

        String situacion
) {
}