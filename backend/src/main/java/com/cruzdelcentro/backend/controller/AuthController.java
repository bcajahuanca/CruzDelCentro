package com.cruzdelcentro.backend.controller;

import com.cruzdelcentro.backend.model.Rol;
import com.cruzdelcentro.backend.model.Usuario;
import com.cruzdelcentro.backend.repository.UsuarioRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public AuthController(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
    }

    @RestController 
    @RequestMapping ("/api/test")
    public class TestController {

        @GetMapping
        public Map<String, String> test() {
            return Map.of(
                    "mensaje", "TODO OK",
                    "estado", "API funcionando"
            );
        }
        
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> datos) {

        String correo = datos.get("correo");
        String password = datos.get("password");

        if (correo == null || password == null ||
                correo.isBlank() || password.isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "mensaje",
                            "Correo y contraseña son obligatorios"
                    ));
        }

        Optional<Usuario> usuarioOptional =
                usuarioRepository.findByCorreoIgnoreCase(correo);

        if (usuarioOptional.isEmpty()) {
            return ResponseEntity.status(401)
                    .body(Map.of(
                            "mensaje",
                            "Credenciales incorrectas"
                    ));
        }

        Usuario usuario = usuarioOptional.get();

        if (!usuario.isActivo()) {
            return ResponseEntity.status(403)
                    .body(Map.of(
                            "mensaje",
                            "Usuario inactivo"
                    ));
        }

        if (!passwordEncoder.matches(
                password,
                usuario.getPasswordHash()
        )) {
            return ResponseEntity.status(401)
                    .body(Map.of(
                            "mensaje",
                            "Credenciales incorrectas"
                    ));
        }

        String rol = usuario.getRoles()
                .stream()
                .map(Rol::getCodigo)
                .findFirst()
                .orElse("SIN_ROL");

        Instant ahora = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("cruz-del-centro")
                .issuedAt(ahora)
                .expiresAt(
                        ahora.plusSeconds(jwtExpiration)
                )
                .subject(usuario.getCorreo())
                .claim(
                        "nombre",
                        usuario.getNombreCompleto()
                )
                .claim(
                        "rol",
                        rol
                )
                .build();

        JwsHeader jwsHeader = JwsHeader
                .with(MacAlgorithm.HS256)
                .build();

        String token = jwtEncoder
                .encode(
                        JwtEncoderParameters.from(
                                jwsHeader,
                                claims
                        )
                )
                .getTokenValue();

        return ResponseEntity.ok(
                Map.of(
                        "mensaje",
                        "Inicio de sesión correcto",

                        "usuario",
                        usuario.getNombreCompleto(),

                        "correo",
                        usuario.getCorreo(),

                        "rol",
                        rol,

                        "token",
                        token
                )
        );
    }
}