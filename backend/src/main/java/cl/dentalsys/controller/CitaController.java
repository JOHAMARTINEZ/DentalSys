package cl.dentalsys.controller;

import cl.dentalsys.dto.CambioEstadoCitaRequest;
import cl.dentalsys.dto.CitaRequest;
import cl.dentalsys.dto.CitaResponse;
import cl.dentalsys.dto.DisponibilidadResponse;
import cl.dentalsys.dto.HistorialCitaResponse;
import cl.dentalsys.dto.ReprogramarCitaRequest;
import cl.dentalsys.dto.ReservaCitaPacienteRequest;
import cl.dentalsys.dto.ReservaPublicaRequest;
import cl.dentalsys.service.CitaService;
import jakarta.validation.Valid;
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
import java.util.Map;

/**
 * Citas. Permisos (ver SecurityConfig):
 * - Público: disponibilidad y reserva-publica.
 * - PACIENTE: mis-citas, reservar y cancelar sus citas.
 * - Personal (ADMIN, RECEPCIONISTA, ODONTOLOGO): el resto.
 */
@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    /* ===== Gestión ===== */

    @GetMapping
    public ResponseEntity<List<CitaResponse>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer idOdontologo,
            @RequestParam(required = false) Integer idSucursal,
            @RequestParam(required = false) Integer idPaciente,
            @RequestParam(required = false) String estado,
            Authentication authentication) {

        return ResponseEntity.ok(citaService.listar(
                desde, hasta, idOdontologo, idSucursal, idPaciente, estado,
                authentication.getName()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CitaResponse> obtener(
            @PathVariable Integer id,
            Authentication authentication) {
        return ResponseEntity.ok(citaService.obtener(id, authentication.getName()));
    }

    @GetMapping("/{id}/historial")
    public ResponseEntity<List<HistorialCitaResponse>> historial(
            @PathVariable Integer id,
            Authentication authentication) {
        return ResponseEntity.ok(citaService.historial(id, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<CitaResponse> crear(
            @RequestBody CitaRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(citaService.crearDesdeGestion(request, authentication.getName()));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<CitaResponse> cambiarEstado(
            @PathVariable Integer id,
            @RequestBody CambioEstadoCitaRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                citaService.cambiarEstado(id, request, authentication.getName())
        );
    }

    @PutMapping("/{id}/reprogramar")
    public ResponseEntity<CitaResponse> reprogramar(
            @PathVariable Integer id,
            @RequestBody ReprogramarCitaRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                citaService.reprogramar(id, request, authentication.getName())
        );
    }

    /* ===== Público ===== */

    @GetMapping("/disponibilidad")
    public ResponseEntity<DisponibilidadResponse> disponibilidad(
            @RequestParam Integer idOdontologo,
            @RequestParam Integer idSucursal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Integer idMotivo) {

        return ResponseEntity.ok(
                citaService.disponibilidad(idOdontologo, idSucursal, fecha, idMotivo)
        );
    }

    // @Valid activa las validaciones de ReservaPublicaRequest
    @PostMapping("/reserva-publica")
    public ResponseEntity<CitaResponse> reservarPublicamente(
            @Valid @RequestBody ReservaPublicaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(citaService.reservarPublicamente(request));
    }

    /* ===== Portal del paciente ===== */

    @GetMapping("/mis-citas")
    public ResponseEntity<List<CitaResponse>> misCitas(Authentication authentication) {
        return ResponseEntity.ok(citaService.misCitas(authentication.getName()));
    }

    @PostMapping("/reservar")
    public ResponseEntity<CitaResponse> reservarComoPaciente(
            Authentication authentication,
            @RequestBody ReservaCitaPacienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(citaService.reservarComoPaciente(authentication.getName(), request));
    }

    @PutMapping("/mis-citas/{id}/cancelar")
    public ResponseEntity<CitaResponse> cancelarMiCita(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> cuerpo,
            Authentication authentication) {

        String observacion = cuerpo == null ? null : cuerpo.get("observacion");

        return ResponseEntity.ok(
                citaService.cancelarComoPaciente(id, authentication.getName(), observacion)
        );
    }
}
