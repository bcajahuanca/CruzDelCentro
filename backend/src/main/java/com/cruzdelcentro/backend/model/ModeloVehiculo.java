package com.cruzdelcentro.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "modelo_vehiculo")
public class ModeloVehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "marca_id", nullable = false)
    private Marca marca;

    @Column(nullable = false)
    private String nombre;

    public ModeloVehiculo() {
    }

    public Long getId() {
        return id;
    }

    public Marca getMarca() {
        return marca;
    }

    public String getNombre() {
        return nombre;
    }
}