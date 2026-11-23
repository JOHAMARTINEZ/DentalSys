package cl.dentalsys.controller;

import cl.dentalsys.dto.AtencionRequest;
import cl.dentalsys.dto.AtencionResponse;
import cl.dentalsys.service.AtencionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
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
 * Atenciones clínicas. Solo ODONTOLOGO (ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/atenciones")
public class AtencionController {

    private final AtencionService atencionService;

    public AtencionController(AtencionService atencionService) {
        this.atencionService = atencionService;
    }

    @GetMapping
    public ResponseEntity<List<AtencionResponse>> listar(@RequestParam Integer idPaciente) {
        return ResponseEntity.ok(atencionService.listarPorPaciente(idPaciente));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtencionResponse> obtener(@PathVariable Integer id) {
        return ResponseEntity.ok(atencionService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<AtencionResponse> crear(
            @RequestBody AtencionRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(atencionService.crear(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AtencionResponse> actualizar(
            @PathVariable Integer id,
            @RequestBody AtencionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(atencionService.actualizar(id, request, authentication.getName()));
    }

    @PutMapping("/{id}/cerrar")
    public ResponseEntity<AtencionResponse> cerrar(
            @PathVariable Integer id,
            Authentication authentication) {
        return ResponseEntity.ok(atencionService.cerrar(id, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Integer id,
            Authentication authentication) {
        atencionService.eliminarBorrador(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
