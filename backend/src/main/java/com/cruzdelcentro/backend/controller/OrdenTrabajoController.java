package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.OrdenTrabajoCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenTrabajoResponse;
import com.cruzdelcentro.backend.service.OrdenTrabajoService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes-trabajo")
public class OrdenTrabajoController {

    private final OrdenTrabajoService
        ordenTrabajoService;

    public OrdenTrabajoController(
        OrdenTrabajoService ordenTrabajoService
    ) {
        this.ordenTrabajoService =
            ordenTrabajoService;
    }

    @PreAuthorize (
        "hasAuthority('orden.leer')"
    )
    @GetMapping
    public List<OrdenTrabajoResponse> listar() {

        return ordenTrabajoService
            .listarOrdenes();
    }

    @PreAuthorize("hasAuthority('orden.leer')")
    @GetMapping("/{id}")
    public OrdenTrabajoResponse obtener(
        @PathVariable Long id
    ) {

        return ordenTrabajoService
            .obtenerPorId(id);
    }

    @PreAuthorize(
        "hasAuthority('orden.crear')"
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrdenTrabajoResponse crear(
        @RequestBody
        OrdenTrabajoCreateRequest request
    ) {

        return ordenTrabajoService
            .crearOrden(request);
    }
}