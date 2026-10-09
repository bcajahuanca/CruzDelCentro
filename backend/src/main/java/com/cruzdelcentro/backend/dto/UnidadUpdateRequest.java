package com.cruzdelcentro.backend.dto;

import com.cruzdelcentro.backend.model.EstadoUnidad;

public record UnidadUpdateRequest (
    String placa,
    String tipoVehiculo,
    Short anioFabricacion,
    EstadoUnidad estado,
    Boolean activo,
    String observaciones
){
}
