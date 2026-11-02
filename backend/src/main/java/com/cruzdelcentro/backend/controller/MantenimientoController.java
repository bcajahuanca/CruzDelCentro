package com.cruzdelcentro.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cruzdelcentro.backend.dto.MantenimientoCancelarRequest;
import com.cruzdelcentro.backend.dto.MantenimientoCreateRequest;
import com.cruzdelcentro.backend.dto.MantenimientoReprogramarRequest;
import com.cruzdelcentro.backend.dto.MantenimientoResponse;
import com.cruzdelcentro.backend.service.MantenimientoService;

@RestController 
@RequestMapping("/api/mantenimientos")
public class MantenimientoController {

    private final MantenimientoService mantenimientoService;

    public MantenimientoController(MantenimientoService mantenimientoService) {
        this.mantenimientoService = mantenimientoService;
    }

    @PreAuthorize("hasAuthority('mantenimiento.leer')")
    @GetMapping
    public List<MantenimientoResponse> listar() {
        return mantenimientoService.listarMantenimientos();
    }

    @PreAuthorize("hasAuthority('mantenimiento.planificar')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MantenimientoResponse crear(
        @RequestBody MantenimientoCreateRequest request
    ) {

        return mantenimientoService
            .crearMantenimiento(request);
    }

    @PreAuthorize("hasAuthority('mantenimiento.leer')")
    @GetMapping("/{id}")
    public MantenimientoResponse obtenerPorId(
        @PathVariable Long id
    ) {
        return mantenimientoService
            .obtenerMantenimientoPorId(id);
    }

    @PreAuthorize("hasAuthority('mantenimiento.planificar')")
    @PutMapping("/{id}/reprogramar")
    public MantenimientoResponse reprogramar(
        @PathVariable Long id,
        @RequestBody MantenimientoReprogramarRequest request
    ) {

        return mantenimientoService
            .reprogramarMantenimiento(
                id,
                request
            );
    }

    @PreAuthorize("hasAuthority('mantenimiento.planificar')")
    @PutMapping("/{id}/cancelar")
    public MantenimientoResponse cancelar(
        @PathVariable Long id,
        @RequestBody MantenimientoCancelarRequest request
    ) {

        return mantenimientoService
            .cancelarMantenimiento(
                id,
                request
            );
    }
    
    @PreAuthorize("hasAuthority('mantenimiento.planificar')")
    @PutMapping("/{id}/iniciar")
    public MantenimientoResponse iniciar(
        @PathVariable Long id
    ) {
        return mantenimientoService
            .iniciarMantenimiento(id);
    }

    @PreAuthorize("hasAuthority('mantenimiento.planificar')")
    @PutMapping("/{id}/completar")
    public MantenimientoResponse completar(
        @PathVariable Long id
    ) {
        return mantenimientoService
            .completarMantenimiento(id);
    }
}
