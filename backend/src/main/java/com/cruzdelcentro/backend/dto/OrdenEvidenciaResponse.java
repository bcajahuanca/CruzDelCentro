package com.cruzdelcentro.backend.dto;

public record OrdenEvidenciaResponse(
        Long id,
        Long ordenId,
        String nombreArchivo,
        String tipoContenido,
        Long tamanioBytes,
        String descripcion,
        Long subidoPor,
        String usuarioNombre,
        java.time.LocalDateTime creadoEn
) {
}
