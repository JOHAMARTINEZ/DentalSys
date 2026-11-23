package cl.dentalsys.controller;

import cl.dentalsys.dto.PacienteRequest;
import cl.dentalsys.dto.PacienteResponse;
import cl.dentalsys.service.PacienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Pacientes. Ver: todo el personal. Registrar/editar/activar:
 * ADMIN y RECEPCIONISTA (ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    private final PacienteService pacienteService;

    public PacienteController(PacienteService pacienteService) {
        this.pacienteService = pacienteService;
    }

    @GetMapping
    public ResponseEntity<List<PacienteResponse>> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(pacienteService.listar(q, estado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PacienteResponse> obtener(@PathVariable Integer id) {
        return ResponseEntity.ok(pacienteService.obtener(id));
    }

    @GetMapping("/rut/{rut}")
    public ResponseEntity<PacienteResponse> buscarPorRut(@PathVariable String rut) {
        return ResponseEntity.ok(pacienteService.buscarPorRut(rut));
    }

    @PostMapping
    public ResponseEntity<PacienteResponse> registrar(@RequestBody PacienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pacienteService.registrar(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PacienteResponse> actualizar(
            @PathVariable Integer id,
            @RequestBody PacienteRequest request) {
        return ResponseEntity.ok(pacienteService.actualizar(id, request));
    }

    @PutMapping("/{id}/desactivar")
    public ResponseEntity<PacienteResponse> desactivar(@PathVariable Integer id) {
        return ResponseEntity.ok(pacienteService.cambiarEstado(id, false));
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<PacienteResponse> activar(@PathVariable Integer id) {
        return ResponseEntity.ok(pacienteService.cambiarEstado(id, true));
    }
}
