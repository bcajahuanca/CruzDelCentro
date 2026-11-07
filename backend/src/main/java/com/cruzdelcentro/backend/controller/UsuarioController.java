package com.cruzdelcentro.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cruzdelcentro.backend.dto.ActualizarUsuarioRequest;
import com.cruzdelcentro.backend.dto.CambiarEstadoUsuarioRequest;
import com.cruzdelcentro.backend.dto.CrearUsuarioRequest;
import com.cruzdelcentro.backend.dto.RolUsuarioResponse;
import com.cruzdelcentro.backend.dto.UsuarioListadoResponse;
import com.cruzdelcentro.backend.service.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(
            UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping
    public List<UsuarioListadoResponse> listarUsuarios() {

        return usuarioService.listarUsuarios();
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping("/roles")
    public List<RolUsuarioResponse> listarRoles() {

        return usuarioService.listarRoles();
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioListadoResponse crearUsuario(
            @RequestBody CrearUsuarioRequest request,
            Authentication authentication) {

        return usuarioService.crearUsuario(
                request,
                authentication.getName());
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PutMapping("/{id}")
    public UsuarioListadoResponse actualizarUsuario(
            @PathVariable Long id,
            @RequestBody ActualizarUsuarioRequest request,
            Authentication authentication) {

        return usuarioService.actualizarUsuario(
                id,
                request,
                authentication.getName());
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PatchMapping("/{id}/estado")
    public UsuarioListadoResponse cambiarEstadoUsuario(
            @PathVariable Long id,
            @RequestBody CambiarEstadoUsuarioRequest request,
            Authentication authentication) {

        return usuarioService.cambiarEstadoUsuario(
                id,
                request,
                authentication.getName());
    }
}
