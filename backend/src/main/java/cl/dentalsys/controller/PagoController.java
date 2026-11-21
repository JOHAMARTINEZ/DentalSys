package cl.dentalsys.controller;

import cl.dentalsys.dto.AnulacionPagoRequest;
import cl.dentalsys.dto.PagoRequest;
import cl.dentalsys.dto.PagoResponse;
import cl.dentalsys.dto.PendientePagoResponse;
import cl.dentalsys.service.PagoService;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;

/**
 * Pagos y comprobantes. Gestión: ADMIN y RECEPCIONISTA.
 * Portal: /mis-pagos (PACIENTE). Ver SecurityConfig.
 */
@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @GetMapping
    public ResponseEntity<List<PagoResponse>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer idPaciente,
            @RequestParam(required = false) Integer idPresupuesto,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(pagoService.listar(desde, hasta, idPaciente, idPresupuesto, estado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PagoResponse> obtener(@PathVariable Integer id) {
        return ResponseEntity.ok(pagoService.obtener(id));
    }

    @GetMapping("/pendientes")
    public ResponseEntity<List<PendientePagoResponse>> pendientes(@RequestParam Integer idPaciente) {
        return ResponseEntity.ok(pagoService.pendientes(idPaciente));
    }

    @PostMapping
    public ResponseEntity<PagoResponse> registrar(
            @RequestBody PagoRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pagoService.registrar(request, authentication.getName()));
    }

    @PutMapping("/{id}/anular")
    public ResponseEntity<PagoResponse> anular(
            @PathVariable Integer id,
            @RequestBody AnulacionPagoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(pagoService.anular(
                id, request == null ? null : request.motivo(), authentication.getName()));
    }

    /* ===== Portal del paciente ===== */

    @GetMapping("/mis-pagos")
    public ResponseEntity<List<PagoResponse>> misPagos(Authentication authentication) {
        return ResponseEntity.ok(pagoService.misPagos(authentication.getName()));
    }

    @PostMapping("/mis-pagos/demo")
    public ResponseEntity<PagoResponse> pagarDemo(
            @RequestBody PagoRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pagoService.pagarDemo(request, authentication.getName()));
    }
}
