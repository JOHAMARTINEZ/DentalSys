package cl.dentalsys.controller;

import cl.dentalsys.dto.AsistenteEstadoResponse;
import cl.dentalsys.dto.AsistenteRequest;
import cl.dentalsys.dto.AsistenteResponse;
import cl.dentalsys.service.AsistenteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Asistente de IA para el personal (ADMIN, RECEPCIONISTA, ODONTOLOGO; ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/asistente")
public class AsistenteController {

    private final AsistenteService asistenteService;

    public AsistenteController(AsistenteService asistenteService) {
        this.asistenteService = asistenteService;
    }

    /** Indica si el asistente está configurado (sin exponer la clave). */
    @GetMapping("/estado")
    public ResponseEntity<AsistenteEstadoResponse> estado() {
        return ResponseEntity.ok(asistenteService.estado());
    }

    @PostMapping("/preguntar")
    public ResponseEntity<AsistenteResponse> preguntar(
            @Valid @RequestBody AsistenteRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                asistenteService.responder(authentication.getName(), request)
        );
    }
}
