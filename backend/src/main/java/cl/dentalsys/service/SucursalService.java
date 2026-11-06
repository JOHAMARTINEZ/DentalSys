package cl.dentalsys.service;

import cl.dentalsys.model.Sucursal;
import cl.dentalsys.repository.SucursalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SucursalService {

    private final SucursalRepository sucursalRepository;

    public SucursalService(SucursalRepository sucursalRepository) {
        this.sucursalRepository = sucursalRepository;
    }

    @Transactional(readOnly = true)
    public List<Sucursal> listarSucursalesActivas() {
        return sucursalRepository.findByEstadoTrueOrderByNombreAsc();
    }
}