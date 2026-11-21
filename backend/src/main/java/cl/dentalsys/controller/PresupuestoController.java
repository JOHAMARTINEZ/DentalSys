package cl.dentalsys.controller;

import cl.dentalsys.dto.CambioEstadoPresupuestoRequest;
import cl.dentalsys.dto.PresupuestoRequest;
import cl.dentalsys.dto.PresupuestoResponse;
import cl.dentalsys.service.PresupuestoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
 * Presupuestos. Gestión: personal (crear/editar solo odontólogo).
 * Portal: /mis-presupuestos (PACIENTE). Ver SecurityConfig.
 */
@RestController
@RequestMapping("/api/presupuestos")
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    public PresupuestoController(PresupuestoService presupuestoService) {
        this.presupuestoService = presupuestoService;
    }

    @GetMapping
    public ResponseEntity<List<PresupuestoResponse>> listar(
            @RequestParam(required = false) Integer idPaciente,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(presupuestoService.listar(idPaciente, estado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PresupuestoResponse> obtener(@PathVariable Integer id) {
        return ResponseEntity.ok(presupuestoService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<PresupuestoResponse> crear(
            @RequestBody PresupuestoRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(presupuestoService.crear(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PresupuestoResponse> actualizar(
            @PathVariable Integer id,
            @RequestBody PresupuestoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(presupuestoService.actualizar(id, request, authentication.getName()));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<PresupuestoResponse> cambiarEstado(
            @PathVariable Integer id,
            @RequestBody CambioEstadoPresupuestoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(presupuestoService.cambiarEstado(
                id, request == null ? null : request.estado(), authentication.getName()));
    }

    /* ===== Portal del paciente ===== */

    @GetMapping("/mis-presupuestos")
    public ResponseEntity<List<PresupuestoResponse>> misPresupuestos(Authentication authentication) {
        return ResponseEntity.ok(presupuestoService.misPresupuestos(authentication.getName()));
    }

    @PutMapping("/mis-presupuestos/{id}/responder")
    public ResponseEntity<PresupuestoResponse> responder(
            @PathVariable Integer id,
            @RequestBody CambioEstadoPresupuestoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(presupuestoService.responderComoPaciente(
                id, request == null ? null : request.estado(), authentication.getName()));
    }
}
