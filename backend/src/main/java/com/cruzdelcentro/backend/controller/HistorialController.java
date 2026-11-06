package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.HistorialResumenUnidadResponse;
import com.cruzdelcentro.backend.service.HistorialService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PreAuthorize("hasAuthority('historial.leer')")
    @GetMapping("/estados")
    public Map<String, Object> listarEstados(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "") String busqueda,
            @RequestParam(defaultValue = "TODOS") String estado,
            @RequestParam(defaultValue = "TODAS") String unidadCodigo) {
        if (page < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La página no puede ser negativa");
        }

        if (!List.of(
                "TODOS",
                "OPERATIVA",
                "EN_MANTENIMIENTO",
                "FUERA_DE_SERVICIO").contains(estado)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Filtro de estado inválido");
        }

        return historialService.listarEstados(
                page,
                busqueda,
                estado,
                unidadCodigo);
    }

    @PreAuthorize("hasAuthority('historial.leer')")
    @GetMapping("/mantenimientos")
    public Map<String, Object> listarMantenimientos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "") String busqueda,
            @RequestParam(defaultValue = "TODOS") String tipo,
            @RequestParam(defaultValue = "TODAS") String unidadCodigo,
            @RequestParam(required = false) String fechaDesde,
            @RequestParam(required = false) String fechaHasta) {

        if (page < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La página no puede ser negativa");
        }

        if (!List.of(
                "TODOS",
                "PREVENTIVO",
                "CORRECTIVO").contains(tipo)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Filtro de tipo inválido");
        }

        return historialService.listarMantenimientos(
                page,
                busqueda,
                tipo,
                unidadCodigo,
                fechaDesde,
                fechaHasta);
    }

    @PreAuthorize("hasAuthority('historial.leer')")
    @GetMapping("/resumen-unidades")
    public List<HistorialResumenUnidadResponse> listarResumenUnidades(
            @RequestParam(required = false) String fechaDesde,

            @RequestParam(required = false) String fechaHasta,

            @RequestParam(defaultValue = "TODAS") String unidadCodigo) {

        if (fechaDesde != null &&
                fechaHasta != null &&
                !fechaDesde.isBlank() &&
                !fechaHasta.isBlank() &&
                fechaDesde.compareTo(fechaHasta) > 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha desde no puede ser posterior a la fecha hasta");
        }

        return historialService
                .listarResumenUnidades(
                        fechaDesde,
                        fechaHasta,
                        unidadCodigo);
    }
}