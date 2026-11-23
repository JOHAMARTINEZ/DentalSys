package cl.dentalsys.controller;

import cl.dentalsys.dto.DashboardResponse;
import cl.dentalsys.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Números de la página de Inicio de gestión
 * (ADMIN, RECEPCIONISTA y ODONTOLOGO; ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/resumen")
    public ResponseEntity<DashboardResponse> resumen(
            Authentication authentication) {
        return ResponseEntity.ok(
                dashboardService.resumen(authentication.getName())
        );
    }
}
