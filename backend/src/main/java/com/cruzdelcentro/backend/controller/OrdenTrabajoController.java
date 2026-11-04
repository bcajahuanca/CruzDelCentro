package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.OrdenActividadCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenActividadResponse;
import com.cruzdelcentro.backend.dto.OrdenAvanceRequest;
import com.cruzdelcentro.backend.dto.OrdenIncidenciaResponse;
import com.cruzdelcentro.backend.dto.OrdenSeguimientoResponse;
import com.cruzdelcentro.backend.dto.OrdenTrabajoCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenTrabajoResponse;
import com.cruzdelcentro.backend.service.OrdenTrabajoService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

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

    @PreAuthorize("hasAuthority('orden.crear')")
    @PostMapping("/{ordenId}/incidencias/{incidenciaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void vincularIncidencia(
        @PathVariable Long ordenId,
        @PathVariable Long incidenciaId
    ) {

        ordenTrabajoService.vincularIncidencia(
            ordenId,
            incidenciaId
        );
    }

    @PreAuthorize("hasAuthority('orden.leer')")
    @GetMapping("/{ordenId}/incidencias")
    public List<OrdenIncidenciaResponse> listarIncidencias(
        @PathVariable Long ordenId
    ) {

        return ordenTrabajoService
            .listarIncidencias(ordenId);
    }

    @PreAuthorize("hasAuthority('orden.ejecutar')")
    @PutMapping("/{id}/diagnostico")
    public OrdenTrabajoResponse actualizarDiagnostico(
        @PathVariable Long id,
        @RequestBody String diagnostico
    ) {
        return ordenTrabajoService.actualizarDiagnostico(
            id,
            diagnostico
        );
    }

    @PreAuthorize("hasAuthority('orden.leer')")
    @GetMapping("/{id}/actividades")
    public List<OrdenActividadResponse> listarActividades(
        @PathVariable Long id
    ) {
        return ordenTrabajoService
            .listarActividades(id);
    }

    @PreAuthorize("hasAuthority('orden.ejecutar')")
    @PutMapping("/{ordenId}/actividades/{actividadId}/completar")
    public void completarActividad(
        @PathVariable Long ordenId,
        @PathVariable Long actividadId,
        @RequestParam(required = false)
        String observaciones,

        JwtAuthenticationToken authentication
    ) {

        String correo =
            authentication.getToken()
                .getSubject();

        ordenTrabajoService.completarActividad(
            ordenId,
            actividadId,
            correo,
            observaciones
        );
    }

    @PreAuthorize("hasAuthority('orden.ejecutar')")
    @PostMapping("/{ordenId}/actividades")
    @ResponseStatus(HttpStatus.CREATED)
    public OrdenActividadResponse crearActividad(
        @PathVariable Long ordenId,
        @RequestBody OrdenActividadCreateRequest request
    ) {
        return ordenTrabajoService.crearActividad(
            ordenId,
            request
        );
    }

    @PreAuthorize("hasAuthority('orden.ejecutar')")
    @PutMapping("/{id}/iniciar")
    public OrdenTrabajoResponse iniciarTrabajo(
        @PathVariable Long id,
        JwtAuthenticationToken authentication
    ) {

        String correo =
            authentication.getToken().getSubject();

        return ordenTrabajoService.iniciarTrabajo(
            id,
            correo
        );
    }

    @PreAuthorize("hasAuthority('orden.ejecutar')")
    @PostMapping("/{ordenId}/avances")
    @ResponseStatus(HttpStatus.CREATED)
    public void registrarAvance(
        @PathVariable Long ordenId,
        @RequestBody OrdenAvanceRequest request,
        JwtAuthenticationToken authentication
    ) {

        String correo =
            authentication.getToken().getSubject();

        ordenTrabajoService.registrarAvance(
            ordenId,
            correo,
            request
        );
    }
    @PreAuthorize("hasAuthority('orden.leer')")
    @GetMapping("/{ordenId}/seguimiento")
    public List<OrdenSeguimientoResponse> listarSeguimiento(
        @PathVariable Long ordenId
    ) {
        return ordenTrabajoService.listarSeguimiento(
            ordenId
        );
    }

    @PreAuthorize("hasAuthority('orden.ejecutar')")
    @PutMapping("/{id}/finalizar")
    public OrdenTrabajoResponse finalizarTrabajo(
        @PathVariable Long id,
        JwtAuthenticationToken authentication
    ) {

        String correo =
            authentication.getToken().getSubject();

        return ordenTrabajoService.finalizarTrabajo(
            id,
            correo
        );
    }
}