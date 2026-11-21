package cl.dentalsys.controller;

import cl.dentalsys.model.MotivoCita;
import cl.dentalsys.repository.MotivoCitaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Lista de tipos de atención (motivos) para el formulario de reserva.
 * Es pública: también la usa el paciente sin sesión.
 */
@RestController
@RequestMapping("/api/motivos-cita")
public class MotivoCitaController {

    private final MotivoCitaRepository motivoCitaRepository;

    public MotivoCitaController(MotivoCitaRepository motivoCitaRepository) {
        this.motivoCitaRepository = motivoCitaRepository;
    }

    @GetMapping
    public ResponseEntity<List<MotivoCita>> listarMotivosActivos() {
        return ResponseEntity.ok(
                motivoCitaRepository.findByEstadoTrueOrderByNombreAsc()
        );
    }
}