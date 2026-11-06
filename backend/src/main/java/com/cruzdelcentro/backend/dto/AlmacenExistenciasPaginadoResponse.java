package com.cruzdelcentro.backend.dto;

import java.util.List;

public record AlmacenExistenciasPaginadoResponse(
        List<AlmacenExistenciaResponse> registros,

        int paginaActual,
        long totalRegistros,
        long totalPaginas,

        long totalRepuestos,
        long stockBajo,
        long sinStock,
        long movimientos30Dias
) {
}