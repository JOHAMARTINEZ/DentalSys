package cl.dentalsys.controller;

import cl.dentalsys.dto.TratamientoRequest;
import cl.dentalsys.dto.TratamientoResponse;
import cl.dentalsys.service.TratamientoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
 * Catálogo de tratamientos. Ver: todo el personal.
 * Crear / editar / activar: ADMIN y ODONTOLOGO (ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/tratamientos")
public class TratamientoController {

    private final TratamientoService tratamientoService;

    public TratamientoController(TratamientoService tratamientoService) {
        this.tratamientoService = tratamientoService;
    }

    @GetMapping
    public ResponseEntity<List<TratamientoResponse>> listar(
            @RequestParam(defaultValue = "false") boolean todos) {
        return ResponseEntity.ok(tratamientoService.listar(todos));
    }

    @PostMapping
    public ResponseEntity<TratamientoResponse> crear(@RequestBody TratamientoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tratamientoService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TratamientoResponse> actualizar(
            @PathVariable Integer id,
            @RequestBody TratamientoRequest request) {
        return ResponseEntity.ok(tratamientoService.actualizar(id, request));
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<TratamientoResponse> activar(@PathVariable Integer id) {
        return ResponseEntity.ok(tratamientoService.cambiarEstado(id, true));
    }

    @PutMapping("/{id}/desactivar")
    public ResponseEntity<TratamientoResponse> desactivar(@PathVariable Integer id) {
        return ResponseEntity.ok(tratamientoService.cambiarEstado(id, false));
    }
}
