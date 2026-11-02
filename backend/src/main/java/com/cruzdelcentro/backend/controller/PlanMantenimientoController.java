package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.PlanMantenimientoCreateRequest;
import com.cruzdelcentro.backend.dto.PlanMantenimientoResponse;
import com.cruzdelcentro.backend.service.PlanMantenimientoService;
import com.cruzdelcentro.backend.service.PlanUnidadService;
import com.cruzdelcentro.backend.dto.PlanUnidadCreateRequest;
import com.cruzdelcentro.backend.dto.PlanUnidadResponse;
// import com.cruzdelcentro.backend.service.PlanUnidadService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planes-mantenimiento")
public class PlanMantenimientoController {

    private final PlanMantenimientoService
        planMantenimientoService;

    private final PlanUnidadService planUnidadService;


    public PlanMantenimientoController(
        PlanMantenimientoService planMantenimientoService,
        PlanUnidadService planUnidadService
    ) {
        this.planMantenimientoService =
            planMantenimientoService;

        this.planUnidadService =
            planUnidadService;
    }

    @PreAuthorize("hasAuthority('mantenimiento.leer')")
    @GetMapping
    public List<PlanMantenimientoResponse>
        listar() {

        return planMantenimientoService
            .listarPlanes();
    }

    @PreAuthorize("hasAuthority('mantenimiento.planificar')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanMantenimientoResponse crear(
        @RequestBody
        PlanMantenimientoCreateRequest request
    ) {

        return planMantenimientoService
            .crearPlan(request);
    }

    @PreAuthorize("hasAuthority('mantenimiento.planificar')")
    @GetMapping("/asignaciones")
    public List<PlanUnidadResponse>
        listarAsignaciones() {

        return planUnidadService
            .listarAsignaciones();
    }

    @PreAuthorize("hasAuthority('mantenimiento.planificar')")
    @PostMapping("/asignaciones")
    @ResponseStatus(HttpStatus.CREATED)
    public PlanUnidadResponse asignarPlan(
        @RequestBody PlanUnidadCreateRequest request
    ) {

        return planUnidadService
            .asignarPlan(request);
    }
}