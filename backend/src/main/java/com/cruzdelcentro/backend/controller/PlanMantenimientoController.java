package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.PlanMantenimientoCreateRequest;
import com.cruzdelcentro.backend.dto.PlanMantenimientoResponse;
import com.cruzdelcentro.backend.service.PlanMantenimientoService;
import com.cruzdelcentro.backend.service.PlanUnidadService;
import com.cruzdelcentro.backend.dto.PlanUnidadCreateRequest;
import com.cruzdelcentro.backend.dto.PlanUnidadResponse;
import com.cruzdelcentro.backend.service.PlanUnidadService;

import org.springframework.http.HttpStatus;
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


    @GetMapping
    public List<PlanMantenimientoResponse>
        listar() {

        return planMantenimientoService
            .listarPlanes();
    }


    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanMantenimientoResponse crear(
        @RequestBody
        PlanMantenimientoCreateRequest request
    ) {

        return planMantenimientoService
            .crearPlan(request);
    }

    @GetMapping("/asignaciones")
    public List<PlanUnidadResponse>
        listarAsignaciones() {

        return planUnidadService
            .listarAsignaciones();
    }

    @PostMapping("/asignaciones")
    @ResponseStatus(HttpStatus.CREATED)
    public PlanUnidadResponse asignarPlan(
        @RequestBody PlanUnidadCreateRequest request
    ) {

        return planUnidadService
            .asignarPlan(request);
    }
}