package com.cruzdelcentro.backend.repository;

import com.cruzdelcentro.backend.model.Unidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UnidadRepository
        extends JpaRepository<Unidad, Long> {

    List<Unidad> findByActivoTrueOrderByCodigoAsc();
}