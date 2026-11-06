package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.dto.OrdenActividadCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenActividadResponse;
import com.cruzdelcentro.backend.dto.OrdenAvanceRequest;
import com.cruzdelcentro.backend.dto.OrdenCancelarRequest;
import com.cruzdelcentro.backend.dto.OrdenCerrarRequest;
import com.cruzdelcentro.backend.dto.OrdenCostoCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenCostoResponse;
import com.cruzdelcentro.backend.dto.OrdenEvidenciaResponse;
import com.cruzdelcentro.backend.dto.OrdenIncidenciaResponse;
import com.cruzdelcentro.backend.dto.OrdenKilometrajeRequest;
import com.cruzdelcentro.backend.dto.OrdenKilometrajeResponse;
import com.cruzdelcentro.backend.dto.OrdenRepuestoSalidaRequest;
import com.cruzdelcentro.backend.dto.OrdenRepuestoSalidaResponse;
import com.cruzdelcentro.backend.dto.OrdenResponsableResponse;
import com.cruzdelcentro.backend.dto.OrdenResultadoPruebasRequest;
import com.cruzdelcentro.backend.dto.OrdenResultadoPruebasResponse;
import com.cruzdelcentro.backend.dto.OrdenSeguimientoResponse;
import com.cruzdelcentro.backend.dto.OrdenTrabajoCreateRequest;
import com.cruzdelcentro.backend.dto.OrdenTrabajoResponse;
import com.cruzdelcentro.backend.dto.RepuestoDisponibleResponse;
import com.cruzdelcentro.backend.service.OrdenTrabajoService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes-trabajo")
public class OrdenTrabajoController {

        private final OrdenTrabajoService ordenTrabajoService;

        public OrdenTrabajoController(
                        OrdenTrabajoService ordenTrabajoService) {
                this.ordenTrabajoService = ordenTrabajoService;
        }

        @PreAuthorize("hasAuthority('orden.leer')")
        @GetMapping
        public List<OrdenTrabajoResponse> listar() {

                return ordenTrabajoService
                                .listarOrdenes();
        }

        @PreAuthorize("hasAuthority('orden.leer')")
        @GetMapping("/{id}")
        public OrdenTrabajoResponse obtener(
                        @PathVariable Long id) {

                return ordenTrabajoService
                                .obtenerPorId(id);
        }

        @PreAuthorize("hasAuthority('orden.crear')")
        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public OrdenTrabajoResponse crear(
                        @RequestBody OrdenTrabajoCreateRequest request) {

                return ordenTrabajoService
                                .crearOrden(request);
        }

        @PreAuthorize("hasAuthority('orden.crear')")
        @PostMapping("/{ordenId}/incidencias/{incidenciaId}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void vincularIncidencia(
                        @PathVariable Long ordenId,
                        @PathVariable Long incidenciaId) {

                ordenTrabajoService.vincularIncidencia(
                                ordenId,
                                incidenciaId);
        }

        @PreAuthorize("hasAuthority('orden.leer')")
        @GetMapping("/{ordenId}/incidencias")
        public List<OrdenIncidenciaResponse> listarIncidencias(
                        @PathVariable Long ordenId) {

                return ordenTrabajoService
                                .listarIncidencias(ordenId);
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PutMapping("/{id}/diagnostico")
        public OrdenTrabajoResponse actualizarDiagnostico(
                        @PathVariable Long id,
                        @RequestBody String diagnostico) {
                return ordenTrabajoService.actualizarDiagnostico(
                                id,
                                diagnostico);
        }

        @PreAuthorize("hasAuthority('orden.leer')")
        @GetMapping("/{id}/actividades")
        public List<OrdenActividadResponse> listarActividades(
                        @PathVariable Long id) {
                return ordenTrabajoService
                                .listarActividades(id);
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PutMapping("/{ordenId}/actividades/{actividadId}/completar")
        public void completarActividad(
                        @PathVariable Long ordenId,
                        @PathVariable Long actividadId,
                        @RequestParam(required = false) String observaciones,

                        JwtAuthenticationToken authentication) {

                String correo = authentication.getToken()
                                .getSubject();

                ordenTrabajoService.completarActividad(
                                ordenId,
                                actividadId,
                                correo,
                                observaciones);
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PostMapping("/{ordenId}/actividades")
        @ResponseStatus(HttpStatus.CREATED)
        public OrdenActividadResponse crearActividad(
                        @PathVariable Long ordenId,
                        @RequestBody OrdenActividadCreateRequest request) {
                return ordenTrabajoService.crearActividad(
                                ordenId,
                                request);
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PutMapping("/{id}/iniciar")
        public OrdenTrabajoResponse iniciarTrabajo(
                        @PathVariable Long id,
                        JwtAuthenticationToken authentication) {

                String correo = authentication.getToken().getSubject();

                return ordenTrabajoService.iniciarTrabajo(
                                id,
                                correo);
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PostMapping("/{ordenId}/avances")
        @ResponseStatus(HttpStatus.CREATED)
        public void registrarAvance(
                        @PathVariable Long ordenId,
                        @RequestBody OrdenAvanceRequest request,
                        JwtAuthenticationToken authentication) {

                String correo = authentication.getToken().getSubject();

                ordenTrabajoService.registrarAvance(
                                ordenId,
                                correo,
                                request);
        }

        @PreAuthorize("hasAuthority('orden.leer')")
        @GetMapping("/{ordenId}/seguimiento")
        public List<OrdenSeguimientoResponse> listarSeguimiento(
                        @PathVariable Long ordenId) {
                return ordenTrabajoService.listarSeguimiento(
                                ordenId);
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PutMapping("/{id}/finalizar")
        public OrdenTrabajoResponse finalizarTrabajo(
                        @PathVariable Long id,
                        JwtAuthenticationToken authentication) {

                String correo = authentication.getToken().getSubject();

                return ordenTrabajoService.finalizarTrabajo(
                                id,
                                correo);
        }

        @PreAuthorize("hasAuthority('orden.leer')")
        @GetMapping("/{ordenId}/costos")
        public List<OrdenCostoResponse> listarCostos(
                        @PathVariable Long ordenId) {
                return ordenTrabajoService.listarCostos(
                                ordenId);
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PostMapping("/{ordenId}/costos")
        @ResponseStatus(HttpStatus.CREATED)
        public OrdenCostoResponse crearCosto(
                        @PathVariable Long ordenId,
                        @RequestBody OrdenCostoCreateRequest request,
                        JwtAuthenticationToken authentication) {

                String correo = authentication.getToken().getSubject();

                return ordenTrabajoService.crearCosto(
                                ordenId,
                                correo,
                                request);
        }

        @PreAuthorize("hasAuthority('inventario.editar')")
        @PostMapping("/{ordenId}/repuestos/salida")
        @ResponseStatus(HttpStatus.CREATED)
        public OrdenRepuestoSalidaResponse registrarSalidaRepuesto(
                        @PathVariable Long ordenId,
                        @RequestBody OrdenRepuestoSalidaRequest request,
                        JwtAuthenticationToken authentication) {

                String correo = authentication.getToken().getSubject();

                return ordenTrabajoService.registrarSalidaRepuesto(
                                ordenId,
                                correo,
                                request);
        }

        @PreAuthorize("hasAuthority('orden.leer')")
        @GetMapping("/repuestos-disponibles")
        public List<RepuestoDisponibleResponse> listarRepuestosDisponibles() {
                return ordenTrabajoService.listarRepuestosDisponibles();
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PutMapping("/{id}/resultado-pruebas")
        public OrdenResultadoPruebasResponse actualizarResultadoPruebas(
                        @PathVariable Long id,
                        @RequestBody OrdenResultadoPruebasRequest request,
                        JwtAuthenticationToken authentication) {

                return ordenTrabajoService.actualizarResultadoPruebas(
                                id,
                                request,
                                authentication.getToken().getSubject());
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PostMapping(value = "/{ordenId}/evidencias", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @ResponseStatus(HttpStatus.CREATED)
        public OrdenEvidenciaResponse subirEvidencia(
                        @PathVariable Long ordenId,

                        @RequestPart("archivo") MultipartFile archivo,

                        @RequestPart(value = "descripcion", required = false) String descripcion,

                        JwtAuthenticationToken authentication) {

                return ordenTrabajoService.subirEvidencia(
                                ordenId,
                                archivo,
                                descripcion,
                                authentication
                                                .getToken()
                                                .getSubject());
        }

        @PreAuthorize("hasAuthority('orden.leer')")
        @GetMapping("/{ordenId}/evidencias")
        public List<OrdenEvidenciaResponse> listarEvidencias(
                        @PathVariable Long ordenId) {

                return ordenTrabajoService
                                .listarEvidencias(ordenId);
        }

        @PreAuthorize("hasAuthority('orden.leer')")
        @GetMapping("/{ordenId}/evidencias/{evidenciaId}/archivo")
        public ResponseEntity<byte[]> obtenerArchivoEvidencia(
                        @PathVariable Long ordenId,
                        @PathVariable Long evidenciaId) {

                return ordenTrabajoService.obtenerArchivoEvidencia(
                                ordenId,
                                evidenciaId);
        }

        @PreAuthorize("hasAuthority('orden.ejecutar')")
        @PutMapping("/{id}/kilometraje")
        public OrdenKilometrajeResponse actualizarKilometraje(
                        @PathVariable Long id,
                        @RequestBody OrdenKilometrajeRequest request,
                        JwtAuthenticationToken authentication) {

                return ordenTrabajoService.actualizarKilometraje(
                                id,
                                request,
                                authentication.getToken().getSubject());
        }

        @PreAuthorize("hasAuthority('orden.cerrar')")
        @PutMapping("/{id}/cerrar")
        public OrdenTrabajoResponse cerrarOrden(
                        @PathVariable Long id,
                        @RequestBody(required = false) OrdenCerrarRequest request,
                        JwtAuthenticationToken authentication) {

                return ordenTrabajoService.cerrarOrden(
                                id,
                                request,
                                authentication.getToken().getSubject());
        }

        @PreAuthorize("hasAuthority('orden.cerrar')")
        @PutMapping("/{id}/cancelar")
        public OrdenTrabajoResponse cancelarOrden(
                        @PathVariable Long id,
                        @RequestBody OrdenCancelarRequest request,
                        JwtAuthenticationToken authentication) {

                return ordenTrabajoService.cancelarOrden(
                                id,
                                request,
                                authentication.getToken().getSubject());
        }

        @PreAuthorize("hasAuthority('orden.crear')")
        @GetMapping("/responsables-disponibles")
        public List<OrdenResponsableResponse> listarResponsablesDisponibles() {
                return ordenTrabajoService.listarResponsablesDisponibles();
        }
}