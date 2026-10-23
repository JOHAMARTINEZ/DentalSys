package cl.dentalsys.repository;

import cl.dentalsys.model.Odontologo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OdontologoRepository extends JpaRepository<Odontologo, Integer> {

    @Query("""
            SELECT o
            FROM Odontologo o
            JOIN FETCH o.usuario u
            WHERE u.estado = 1
            ORDER BY u.nombres ASC
            """)
    List<Odontologo> findOdontologosActivos();
}