package com.cruzdelcentro.backend.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "unidad")
public class Unidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false, unique = true)
    private String placa;

    @ManyToOne
    @JoinColumn(name = "modelo_id", nullable = false)
    private ModeloVehiculo modelo;

    @Column(name = "tipo_vehiculo", nullable = false)
    private String tipoVehiculo;

    @Column(name = "anio_fabricacion")
    private Short anioFabricacion;

    @Column(name = "numero_motor")
    private String numeroMotor;

    @Column(name = "numero_chasis")
    private String numeroChasis;

    @Column(name = "fecha_adquisicion")
    private LocalDate fechaAdquisicion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_operativo", nullable = false)
    private EstadoUnidad estadoOperativo;

    @Column(nullable = false)
    private boolean activo;

    private String observaciones;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn;

    @Version
    private Long version;

    public Unidad() {
    }

    public Long getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getPlaca() {
        return placa;
    }

    public ModeloVehiculo getModelo() {
        return modelo;
    }

    public String getTipoVehiculo() {
        return tipoVehiculo;
    }

    public Short getAnioFabricacion() {
        return anioFabricacion;
    }

    public String getNumeroMotor() {
        return numeroMotor;
    }

    public String getNumeroChasis() {
        return numeroChasis;
    }

    public LocalDate getFechaAdquisicion() {
        return fechaAdquisicion;
    }

    public EstadoUnidad getEstadoOperativo() {
        return estadoOperativo;
    }

    public boolean isActivo() {
        return activo;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }

    public void setTipoVehiculo(String tipoVehiculo) {
        this.tipoVehiculo = tipoVehiculo;
    }

    public void setAnioFabricacion(Short anioFabricacion) {
        this.anioFabricacion = anioFabricacion;
    }

    public void setEstadoOperativo(EstadoUnidad estadoOperativo) {
        this.estadoOperativo = estadoOperativo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}