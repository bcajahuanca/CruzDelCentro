package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.AlmacenExistenciasPaginadoResponse;
import com.cruzdelcentro.backend.service.AlmacenService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/almacen")
public class AlmacenController {

    private final AlmacenService almacenService;

    public AlmacenController(
            AlmacenService almacenService
    ) {
        this.almacenService = almacenService;
    }


    @PreAuthorize(
        "hasAnyAuthority('inventario.editar', 'historial.leer')"
    )
    @GetMapping("/existencias")
    public AlmacenExistenciasPaginadoResponse listarExistencias(

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "")
            String busqueda,

            @RequestParam(required = false)
            Long almacenId,

            @RequestParam(defaultValue = "TODOS")
            String estadoStock
    ) {

        if (page < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La página no puede ser negativa"
            );
        }


        if (!List.of(
                "TODOS",
                "NORMAL",
                "BAJO",
                "SIN_STOCK"
        ).contains(estadoStock)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Estado de stock inválido"
            );
        }


        return almacenService.listarExistencias(
                page,
                busqueda,
                almacenId,
                estadoStock
        );
    }
}