package com.cruzdelcentro.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@EnableMethodSecurity 
@EnableWebSecurity 
@Configuration
public class SecurityConfig {

        /*
         * CADENA 1
         * Login y endpoint de prueba públicos.
         */
        @Bean
        @Order(1)
        public SecurityFilterChain publicSecurityFilterChain(
                        HttpSecurity http) throws Exception {

                http
                                .securityMatcher(
                                                "/api/auth/**",
                                                "/api/test")

                                .csrf(csrf -> csrf.disable())

                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                .sessionManagement(session -> session.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))

                                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

                return http.build();
        }

        /*
         * CADENA 2
         * Todo lo demás requiere JWT.
         */
        @Bean
        @Order(2)
        public SecurityFilterChain apiSecurityFilterChain(
                        HttpSecurity http) throws Exception {

                http
                                .csrf(csrf -> csrf.disable())

                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                .sessionManagement(session -> session.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))

                                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())

                                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {

                CorsConfiguration configuration = new CorsConfiguration();

                configuration.setAllowedOrigins(
                                List.of(
                                                "http://localhost:5173",
                                                "https://cruzdelcentro.up.railway.app"));

                configuration.setAllowedMethods(
                                List.of(
                                                "GET",
                                                "POST",
                                                "PUT",
                                                "PATCH",
                                                "DELETE",
                                                "OPTIONS"));

                configuration.setAllowedHeaders(
                                List.of("*"));

                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration(
                                "/**",
                                configuration);

                return source;
        }

        @Bean
        public JwtAuthenticationConverter jwtAuthenticationConverter() {

                JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

                converter.setJwtGrantedAuthoritiesConverter(
                        jwt -> {

                                List<GrantedAuthority> authorities = new ArrayList<>();

                                /*
                                        * PERMISOS
                                        */

                                List<String> permisos = jwt.getClaimAsStringList(
                                                "permisos");

                                if (permisos != null) {

                                        permisos.forEach(
                                                        permiso -> authorities.add(
                                                                        new SimpleGrantedAuthority(
                                                                                        permiso)));
                                }

                                /*
                                        * ROLES
                                        *
                                        * Spring espera ROLE_
                                        * para hasRole(...)
                                        */

                                List<String> roles = jwt.getClaimAsStringList(
                                                "roles");

                                if (roles != null) {

                                        roles.forEach(
                                                        rol -> authorities.add(
                                                                        new SimpleGrantedAuthority(
                                                                                        "ROLE_" + rol)));
                                }

                                return authorities;
                        });

                return converter;
        }
}