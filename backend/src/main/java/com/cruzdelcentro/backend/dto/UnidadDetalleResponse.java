package com.cruzdelcentro.backend.dto;

public record UnidadDetalleResponse(
        Long id,
        String codigo,
        String placa,
        String marca,
        String modelo,
        String tipoVehiculo,
        Short anioFabricacion,
        String estado,
        boolean activo,
        String observaciones
) {
}