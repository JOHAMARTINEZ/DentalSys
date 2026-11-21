package cl.dentalsys.controller;

import cl.dentalsys.dto.BloqueoRequest;
import cl.dentalsys.dto.BloqueoResponse;
import cl.dentalsys.dto.HorarioRequest;
import cl.dentalsys.dto.HorarioResponse;
import cl.dentalsys.service.HorarioService;
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
 * Horarios de atención y bloqueos de agenda.
 * Ver: todo el personal (el odontólogo solo los suyos).
 * Crear / editar / eliminar: ADMIN y RECEPCIONISTA (ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/horarios")
public class HorarioController {

    private final HorarioService horarioService;

    public HorarioController(HorarioService horarioService) {
        this.horarioService = horarioService;
    }

    @GetMapping
    public ResponseEntity<List<HorarioResponse>> listar(
            @RequestParam(required = false) Integer idOdontologo,
            Authentication authentication) {
        return ResponseEntity.ok(
                horarioService.listarHorarios(idOdontologo, authentication.getName())
        );
    }

    @PostMapping
    public ResponseEntity<HorarioResponse> crear(@RequestBody HorarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(horarioService.crearHorario(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HorarioResponse> actualizar(
            @PathVariable Integer id,
            @RequestBody HorarioRequest request) {
        return ResponseEntity.ok(horarioService.actualizarHorario(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        horarioService.eliminarHorario(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bloqueos")
    public ResponseEntity<List<BloqueoResponse>> listarBloqueos(
            @RequestParam(required = false) Integer idOdontologo,
            Authentication authentication) {
        return ResponseEntity.ok(
                horarioService.listarBloqueos(idOdontologo, authentication.getName())
        );
    }

    @PostMapping("/bloqueos")
    public ResponseEntity<List<BloqueoResponse>> crearBloqueo(@RequestBody BloqueoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(horarioService.crearBloqueo(request));
    }

    @DeleteMapping("/bloqueos/{id}")
    public ResponseEntity<Void> anularBloqueo(@PathVariable Integer id) {
        horarioService.anularBloqueo(id);
        return ResponseEntity.noContent().build();
    }
}
