package cl.dentalsys.controller;

import cl.dentalsys.model.Paciente;
import cl.dentalsys.service.PacienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    private final PacienteService pacienteService;

    public PacienteController(PacienteService pacienteService) {
        this.pacienteService = pacienteService;
    }

    @GetMapping
    public ResponseEntity<List<Paciente>> listarPacientes() {
        return ResponseEntity.ok(pacienteService.listarPacientes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Paciente> buscarPorId(@PathVariable Integer id) {
        return pacienteService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    @GetMapping("/rut/{rut}")
    public ResponseEntity<Paciente> buscarPorRut(
        @PathVariable String rut) {

        return pacienteService.buscarPorRut(rut)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
    @PostMapping
    public ResponseEntity<?> registrarPaciente(@RequestBody Paciente paciente) {

        try {
            Paciente pacienteRegistrado =
                    pacienteService.registrarPaciente(paciente);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(pacienteRegistrado);

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarPaciente(
        @PathVariable Integer id,
        @RequestBody Paciente datos) {

        try {
            return pacienteService.actualizarPaciente(id, datos)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                .badRequest()
                .body(e.getMessage());
        }
    }
        @PutMapping("/{id}/desactivar")
    public ResponseEntity<Paciente> desactivarPaciente(
            @PathVariable Integer id) {

        return pacienteService.desactivarPaciente(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
 
        @PutMapping("/{id}/activar")
public ResponseEntity<Paciente> activarPaciente(
        @PathVariable Integer id) {

    return pacienteService.activarPaciente(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
}









}