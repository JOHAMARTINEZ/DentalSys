package cl.dentalsys.controller;

import cl.dentalsys.dto.RegistroRequest;
import cl.dentalsys.service.PortalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Registro público de cuentas de paciente.
 */
@RestController
@RequestMapping("/api/auth")
public class RegistroController {

    private final PortalService portalService;

    public RegistroController(PortalService portalService) {
        this.portalService = portalService;
    }

    @PostMapping("/registro")
    public ResponseEntity<Map<String, String>> registrar(@RequestBody RegistroRequest request) {
        portalService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Cuenta creada correctamente."));
    }
}
