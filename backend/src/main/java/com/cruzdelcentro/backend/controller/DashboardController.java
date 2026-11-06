package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.DashboardProximoMantenimientoResponse;
import com.cruzdelcentro.backend.dto.DashboardResumenResponse;
import com.cruzdelcentro.backend.dto.DashboardSituacionResponse;
import com.cruzdelcentro.backend.dto.DashboardTendenciaMantenimientoResponse;
import com.cruzdelcentro.backend.dto.DashboardUnidadAtencionResponse;
import com.cruzdelcentro.backend.service.DashboardService;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(
            DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @PreAuthorize("hasAnyAuthority('historial.leer', 'orden.leer')")
    @GetMapping("/resumen")
    public DashboardResumenResponse obtenerResumen() {

        return dashboardService.obtenerResumen();
    }

    @PreAuthorize("hasAnyAuthority('historial.leer', 'orden.leer')")
    @GetMapping("/situacion")
    public DashboardSituacionResponse obtenerSituacion() {

        return dashboardService.obtenerSituacion();
    }

    @PreAuthorize("hasAnyAuthority('historial.leer', 'orden.leer')")
    @GetMapping("/unidades-atencion")
    public List<DashboardUnidadAtencionResponse> listarUnidadesAtencion() {

        return dashboardService
                .listarUnidadesAtencion();
    }

    @PreAuthorize("hasAnyAuthority('historial.leer', 'orden.leer')")
    @GetMapping("/proximos-mantenimientos")
    public List<DashboardProximoMantenimientoResponse> listarProximosMantenimientos() {

        return dashboardService
                .listarProximosMantenimientos();
    }

    @PreAuthorize("hasAnyAuthority('historial.leer', 'orden.leer')")
    @GetMapping("/tendencia-mantenimientos")
    public List<DashboardTendenciaMantenimientoResponse> listarTendenciaMantenimientos() {

        return dashboardService
                .listarTendenciaMantenimientos();
    }
}