package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.UnidadDetalleResponse;
import com.cruzdelcentro.backend.dto.UnidadResponse;
import com.cruzdelcentro.backend.service.UnidadService;
import com.cruzdelcentro.backend.dto.UnidadUpdateRequest;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/unidades")
public class UnidadController {

    private final UnidadService unidadService;

    public UnidadController(UnidadService unidadService) {
        this.unidadService = unidadService;
    }

    @GetMapping
    public List<UnidadResponse> listar() {
        return unidadService.listarUnidades();
    }

    @GetMapping("/{id}")
    public UnidadDetalleResponse obtenerPorId(@PathVariable Long id) {
        return unidadService.obtenerPorId(id);
    }
    
    @PutMapping("/{id}")
    public UnidadDetalleResponse actualizar(
        @PathVariable Long id, 
        @RequestBody UnidadUpdateRequest resquest
    ) {
        return unidadService.actualizar(id, resquest);
    }
}