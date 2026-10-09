package com.cruzdelcentro.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/protegido")
    public Map<String, String> protegido() {
        return Map.of(
                "mensaje", "Acceso autorizado"
        );
    }
}