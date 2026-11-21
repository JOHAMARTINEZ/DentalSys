package cl.dentalsys.controller;

import cl.dentalsys.dto.FichaRequest;
import cl.dentalsys.dto.FichaResponse;
import cl.dentalsys.service.FichaClinicaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Ficha clínica. Solo ODONTOLOGO (datos clínicos; ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/fichas")
public class FichaClinicaController {

    private final FichaClinicaService fichaClinicaService;

    public FichaClinicaController(FichaClinicaService fichaClinicaService) {
        this.fichaClinicaService = fichaClinicaService;
    }

    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<FichaResponse> obtener(@PathVariable Integer idPaciente) {
        return ResponseEntity.ok(fichaClinicaService.obtener(idPaciente));
    }

    @PutMapping("/paciente/{idPaciente}")
    public ResponseEntity<FichaResponse> guardar(
            @PathVariable Integer idPaciente,
            @RequestBody FichaRequest request) {
        return ResponseEntity.ok(fichaClinicaService.guardar(idPaciente, request));
    }
}
