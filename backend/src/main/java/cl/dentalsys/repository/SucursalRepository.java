package cl.dentalsys.repository;

import cl.dentalsys.model.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SucursalRepository extends JpaRepository<Sucursal, Integer> {

    List<Sucursal> findByEstadoTrueOrderByNombreAsc();
}