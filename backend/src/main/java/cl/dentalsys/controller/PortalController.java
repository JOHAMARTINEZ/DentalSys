package cl.dentalsys.controller;

import cl.dentalsys.dto.AtencionResponse;
import cl.dentalsys.dto.CambioClaveRequest;
import cl.dentalsys.dto.NotificacionesRequest;
import cl.dentalsys.dto.PendientePagoResponse;
import cl.dentalsys.dto.PerfilRequest;
import cl.dentalsys.dto.PerfilResponse;
import cl.dentalsys.dto.PortalResumenResponse;
import cl.dentalsys.service.PortalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Portal del paciente. Solo PACIENTE (ver SecurityConfig).
 * Citas, presupuestos y pagos del paciente están en sus controladores
 * (/api/citas/mis-citas, /api/presupuestos/mis-presupuestos, /api/pagos/mis-pagos).
 */
@RestController
@RequestMapping("/api/portal")
public class PortalController {

    private final PortalService portalService;

    public PortalController(PortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/resumen")
    public ResponseEntity<PortalResumenResponse> resumen(Authentication authentication) {
        return ResponseEntity.ok(portalService.resumen(authentication.getName()));
    }

    @GetMapping("/atenciones")
    public ResponseEntity<List<AtencionResponse>> atenciones(Authentication authentication) {
        return ResponseEntity.ok(portalService.atencionesCerradas(authentication.getName()));
    }

    @GetMapping("/pendientes")
    public ResponseEntity<List<PendientePagoResponse>> pendientes(Authentication authentication) {
        return ResponseEntity.ok(portalService.pendientes(authentication.getName()));
    }

    @GetMapping("/perfil")
    public ResponseEntity<PerfilResponse> perfil(Authentication authentication) {
        return ResponseEntity.ok(portalService.perfil(authentication.getName()));
    }

    @PutMapping("/perfil")
    public ResponseEntity<PerfilResponse> actualizarPerfil(
            @RequestBody PerfilRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(portalService.actualizarPerfil(authentication.getName(), request));
    }

    @PutMapping("/clave")
    public ResponseEntity<Void> cambiarClave(
            @RequestBody CambioClaveRequest request,
            Authentication authentication) {
        portalService.cambiarClave(
                authentication.getName(),
                request == null ? null : request.actual(),
                request == null ? null : request.nueva()
        );
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/notificaciones")
    public ResponseEntity<PerfilResponse> notificaciones(
            @RequestBody NotificacionesRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(portalService.guardarNotificaciones(authentication.getName(), request));
    }
}
