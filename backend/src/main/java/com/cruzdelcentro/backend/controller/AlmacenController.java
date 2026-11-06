package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.AjusteRepuestoRequest;
import com.cruzdelcentro.backend.dto.AlmacenExistenciasPaginadoResponse;
import com.cruzdelcentro.backend.dto.EntradaRepuestoRequest;
import com.cruzdelcentro.backend.service.AlmacenService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/almacen")
public class AlmacenController {

    private final AlmacenService almacenService;

    public AlmacenController(
            AlmacenService almacenService) {
        this.almacenService = almacenService;
    }

    @PreAuthorize("hasAnyAuthority('inventario.editar', 'historial.leer')")
    @GetMapping("/existencias")
    public AlmacenExistenciasPaginadoResponse listarExistencias(

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "") String busqueda,

            @RequestParam(required = false) Long almacenId,

            @RequestParam(defaultValue = "TODOS") String estadoStock) {

        if (page < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La página no puede ser negativa");
        }

        if (!List.of(
                "TODOS",
                "NORMAL",
                "BAJO",
                "SIN_STOCK").contains(estadoStock)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Estado de stock inválido");
        }

        return almacenService.listarExistencias(
                page,
                busqueda,
                almacenId,
                estadoStock);
    }

    @PreAuthorize("hasAnyAuthority('inventario.editar', 'historial.leer')")
    @GetMapping("/movimientos")
    public Map<String, Object> listarMovimientos(

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(required = false) Long repuestoId,

            @RequestParam(required = false) Long almacenId,

            @RequestParam(defaultValue = "TODOS") String tipo,

            @RequestParam(required = false) String fechaDesde,

            @RequestParam(required = false) String fechaHasta) {

        if (page < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La página no puede ser negativa");
        }

        if (!List.of(
                "TODOS",
                "ENTRADA",
                "SALIDA",
                "DEVOLUCION",
                "AJUSTE_POSITIVO",
                "AJUSTE_NEGATIVO").contains(tipo)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tipo de movimiento inválido");
        }

        if (fechaDesde != null &&
                fechaHasta != null &&
                !fechaDesde.isBlank() &&
                !fechaHasta.isBlank() &&
                fechaDesde.compareTo(fechaHasta) > 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha desde no puede ser posterior a la fecha hasta");
        }

        return almacenService.listarMovimientos(
                page,
                repuestoId,
                almacenId,
                tipo,
                fechaDesde,
                fechaHasta);
    }

    @PreAuthorize("hasAuthority('inventario.editar')")
    @PostMapping("/movimientos/entrada")
    @ResponseStatus(HttpStatus.CREATED)
    public void registrarEntrada(
            @RequestBody EntradaRepuestoRequest request,
            Authentication authentication) {

        almacenService.registrarEntrada(
                request,
                authentication.getName());
    }

    @PreAuthorize("hasAuthority('inventario.editar')")
    @PostMapping("/movimientos/ajuste")
    @ResponseStatus(HttpStatus.CREATED)
    public void registrarAjuste(
            @RequestBody AjusteRepuestoRequest request,
            Authentication authentication) {

        almacenService.registrarAjuste(
                request,
                authentication.getName());
    }
}