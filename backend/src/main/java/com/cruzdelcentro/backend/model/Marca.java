package com.cruzdelcentro.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "marca")
public class Marca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    public Marca() {
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }
}