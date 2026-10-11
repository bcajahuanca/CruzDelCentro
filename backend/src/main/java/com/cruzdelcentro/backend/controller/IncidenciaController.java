package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.service.IncidenciaService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.cruzdelcentro.backend.dto.IncidenciaCreateRequest;
import com.cruzdelcentro.backend.dto.IncidenciaResponse;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidencias")
public class IncidenciaController {

    private final IncidenciaService incidenciaService;

    public IncidenciaController(
        IncidenciaService incidenciaService
    ) {
        this.incidenciaService = incidenciaService;
    }

    @GetMapping
    public Map<String, Object> listarIncidencias(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "") String busqueda,
        @RequestParam(defaultValue = "TODOS") String estado,
        @RequestParam(defaultValue = "TODAS") String prioridad
    ) {

        if (page < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La página no puede ser negativa"
            );
        }

        if (!List.of(
            "TODOS",
            "REGISTRADA",
            "EN_EVALUACION",
            "ASIGNADA",
            "EN_ATENCION",
            "RESUELTA",
            "CERRADA",
            "ANULADA"
        ).contains(estado)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Estado de incidencia inválido"
            );
        }

        if (!List.of(
            "TODAS",
            "BAJA",
            "MEDIA",
            "ALTA",
            "CRITICA"
        ).contains(prioridad)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Prioridad inválida"
            );
        }

        return incidenciaService.listarIncidencias(
            page,
            busqueda,
            estado,
            prioridad
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IncidenciaResponse crearIncidencia(
        @RequestBody IncidenciaCreateRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {

        String correo = jwt.getSubject();

        Long usuarioId =
            incidenciaService.obtenerUsuarioIdPorCorreo(correo);

        return incidenciaService.crearIncidencia(
            request,
            usuarioId
        );
    }

    @GetMapping("/{id}")
    public IncidenciaResponse obtenerIncidencia(
        @PathVariable Long id
    ) {
        return incidenciaService.obtenerIncidenciaPorId(id);
    }
}