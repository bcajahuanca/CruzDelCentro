package com.cruzdelcentro.backend.config;

import com.cruzdelcentro.backend.model.Rol;
import com.cruzdelcentro.backend.model.Usuario;
import com.cruzdelcentro.backend.repository.RolRepository;
import com.cruzdelcentro.backend.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initUsuarios(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder
    ) {

        return args -> {

            if (usuarioRepository
                    .findByCorreoIgnoreCase("admin@cruzdelcentro.com")
                    .isEmpty()) {

                Rol rolAdmin = rolRepository
                        .findByCodigo("ADMINISTRADOR")
                        .orElseThrow(() ->
                                new RuntimeException("No existe el rol ADMINISTRADOR")
                        );

                Usuario admin = new Usuario();

                admin.setNombres("Administrador");
                admin.setApellidos("Sistema");
                admin.setCorreo("admin@cruzdelcentro.com");
                admin.setPasswordHash(
                        passwordEncoder.encode("123456")
                );
                admin.setActivo(true);

                admin.getRoles().add(rolAdmin);

                usuarioRepository.save(admin);

                System.out.println("Usuario administrador creado");
            }
        };
    }
}