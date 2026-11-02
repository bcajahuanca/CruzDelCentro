package com.cruzdelcentro.backend.dto;

import java.math.BigDecimal;

public record UnidadResponse(
    Long id,
    String codigo,
    String placa,
    String marca,
    String modelo,
    String tipoVehiculo,
    Short anioFabricacion,
    String estado,
    BigDecimal kilometrajeActual
) {
}