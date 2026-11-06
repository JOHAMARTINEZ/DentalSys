package cl.dentalsys.controller;

import cl.dentalsys.model.Sucursal;
import cl.dentalsys.service.SucursalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sucursales")
public class SucursalController {

    private final SucursalService sucursalService;

    public SucursalController(SucursalService sucursalService) {
        this.sucursalService = sucursalService;
    }

    @GetMapping
    public ResponseEntity<List<Sucursal>> listarSucursales() {
        return ResponseEntity.ok(
                sucursalService.listarSucursalesActivas()
        );
    }
}