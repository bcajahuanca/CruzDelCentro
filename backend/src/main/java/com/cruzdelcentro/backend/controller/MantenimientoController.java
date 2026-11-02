package com.cruzdelcentro.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cruzdelcentro.backend.dto.MantenimientoCreateRequest;
import com.cruzdelcentro.backend.dto.MantenimientoResponse;
import com.cruzdelcentro.backend.service.MantenimientoService;

@RestController 
@RequestMapping("/api/mantenimientos")
public class MantenimientoController {

    private final MantenimientoService mantenimientoService;

    public MantenimientoController(MantenimientoService mantenimientoService) {
        this.mantenimientoService = mantenimientoService;
    }

    @GetMapping
    public List<MantenimientoResponse> listar() {
        return mantenimientoService.listarMantenimientos();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MantenimientoResponse crear(
        @RequestBody MantenimientoCreateRequest request
    ) {

        return mantenimientoService
            .crearMantenimiento(request);
    }

    @GetMapping("/{id}")
    public MantenimientoResponse obtenerPorId(
        @PathVariable Long id
    ) {
        return mantenimientoService
            .obtenerMantenimientoPorId(id);
    }
}
