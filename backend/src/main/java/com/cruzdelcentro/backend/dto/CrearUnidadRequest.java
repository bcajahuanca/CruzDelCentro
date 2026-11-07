package com.cruzdelcentro.backend.dto;

public record CrearUnidadRequest(
        String codigo,
        String placa,
        Long modeloId,
        String tipoVehiculo,
        Integer anioFabricacion,
        String estado,
        Boolean activo,
        String observaciones) {
}