package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.CrearUnidadRequest;
import com.cruzdelcentro.backend.dto.MarcaResponse;
import com.cruzdelcentro.backend.dto.ModeloVehiculoResponse;
import com.cruzdelcentro.backend.dto.UnidadDetalleResponse;
import com.cruzdelcentro.backend.dto.UnidadResponse;
import com.cruzdelcentro.backend.service.UnidadService;
import com.cruzdelcentro.backend.dto.UnidadUpdateRequest;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unidades")
public class UnidadController {

    private final UnidadService unidadService;

    public UnidadController(UnidadService unidadService) {
        this.unidadService = unidadService;
    }

    @PreAuthorize("hasAuthority('unidad.leer')")
    @GetMapping
    public List<UnidadResponse> listar() {
        return unidadService.listarUnidades();
    }

    @PreAuthorize("hasAuthority('unidad.leer')")
    @GetMapping("/{id}")
    public UnidadDetalleResponse obtenerPorId(@PathVariable Long id) {
        return unidadService.obtenerPorId(id);
    }

    @PreAuthorize("hasAuthority('unidad.editar')")
    @PutMapping("/{id}")
    public UnidadDetalleResponse actualizar(
            @PathVariable Long id,
            @RequestBody UnidadUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return unidadService.actualizar(
                id,
                request,
                jwt.getSubject());
    }

    @GetMapping("/modelos")
    public List<ModeloVehiculoResponse> listarModelos(
            @RequestParam Long marcaId) {
        return unidadService.listarModelos(marcaId);
    }

    @GetMapping("/marcas")
    public List<MarcaResponse> listarMarcas() {
        return unidadService.listarMarcas();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('unidad.editar')")
    @ResponseStatus(HttpStatus.CREATED)
    public UnidadDetalleResponse crearUnidad(
            @RequestBody CrearUnidadRequest request,
            Authentication authentication) {

        return unidadService.crearUnidad(
                request,
                authentication.getName());
    }
}