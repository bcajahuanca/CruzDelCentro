package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.service.HistorialService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/historial")
public class HistorialController {

    private final HistorialService historialService;

    public HistorialController(HistorialService historialService) {
        this.historialService = historialService;
    }

    @GetMapping("/estados")
    public Map<String, Object> listarEstados(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "") String busqueda,
        @RequestParam(defaultValue = "TODOS") String estado,
        @RequestParam(defaultValue = "TODAS") String unidadCodigo
    ) {
        if (page < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La página no puede ser negativa"
            );
        }

        if (!List.of(
            "TODOS",
            "OPERATIVA",
            "EN_MANTENIMIENTO",
            "FUERA_DE_SERVICIO"
        ).contains(estado)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Filtro de estado inválido"
            );
        }

        return historialService.listarEstados(
            page,
            busqueda,
            estado,
            unidadCodigo
        );
    }
}