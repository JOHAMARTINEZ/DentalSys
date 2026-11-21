package cl.dentalsys.controller;

import cl.dentalsys.dto.ReservaCitaPacienteRequest;
import cl.dentalsys.dto.ReservaPublicaRequest;
import cl.dentalsys.model.Cita;
import cl.dentalsys.service.CitaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @GetMapping
    public ResponseEntity<List<Cita>> listarCitas() {
        return ResponseEntity.ok(citaService.listarCitas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cita> buscarPorId(
            @PathVariable Integer id) {
        return citaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/rango")
    public ResponseEntity<List<Cita>> buscarPorRangoFecha(
            @RequestParam LocalDateTime inicio,
            @RequestParam LocalDateTime fin) {
        return ResponseEntity.ok(
                citaService.buscarPorRangoFecha(inicio, fin)
        );
    }

    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<Cita>> buscarPorPaciente(
            @PathVariable Integer idPaciente) {
        return ResponseEntity.ok(
                citaService.buscarPorPaciente(idPaciente)
        );
    }

    @GetMapping("/odontologo/{idUsuario}")
    public ResponseEntity<List<Cita>> buscarPorOdontologo(
            @PathVariable Integer idUsuario) {
        return ResponseEntity.ok(
                citaService.buscarPorOdontologo(idUsuario)
        );
    }

    @GetMapping("/sucursal/{idSucursal}")
    public ResponseEntity<List<Cita>> buscarPorSucursal(
            @PathVariable Integer idSucursal) {
        return ResponseEntity.ok(
                citaService.buscarPorSucursal(idSucursal)
        );
    }

    @GetMapping("/mis-citas")
    public ResponseEntity<List<Cita>> misCitas(
            Authentication authentication) {
        return ResponseEntity.ok(
                citaService.buscarMisCitas(authentication.getName())
        );
    }

    @PostMapping("/reservar")
    public ResponseEntity<Cita> reservarComoPaciente(
            Authentication authentication,
            @RequestBody ReservaCitaPacienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(citaService.reservarComoPaciente(
                        authentication.getName(),
                        request
                ));
    }

    @PostMapping
    public ResponseEntity<Cita> crearCita(
            @RequestBody Cita cita) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(citaService.guardar(cita));
    }

    // @Valid activa las validaciones definidas en ReservaPublicaRequest
    // (RUT y nombres obligatorios, correo válido, fecha futura, etc.)
    @PostMapping("/reserva-publica")
    public ResponseEntity<Cita> reservarPublicamente(
            @Valid @RequestBody ReservaPublicaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(citaService.reservarPublicamente(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Cita> eliminarCita(
            @PathVariable Integer id) {
        return citaService.eliminar(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}