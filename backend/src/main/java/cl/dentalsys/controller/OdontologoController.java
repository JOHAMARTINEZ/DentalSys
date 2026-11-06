package cl.dentalsys.controller;

import cl.dentalsys.dto.OdontologoResponse;
import cl.dentalsys.service.OdontologoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/odontologos")
public class OdontologoController {

    private final OdontologoService odontologoService;

    public OdontologoController(OdontologoService odontologoService) {
        this.odontologoService = odontologoService;
    }

    @GetMapping
    public ResponseEntity<List<OdontologoResponse>> listarOdontologos() {
        return ResponseEntity.ok(
                odontologoService.listarOdontologos()
        );
    }
}