package cl.dentalsys.service;

import cl.dentalsys.dto.OdontologoResponse;
import cl.dentalsys.model.OdontologoSucursal;
import cl.dentalsys.repository.OdontologoRepository;
import cl.dentalsys.repository.OdontologoSucursalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OdontologoService {

    private final OdontologoRepository odontologoRepository;
    private final OdontologoSucursalRepository odontologoSucursalRepository;

    public OdontologoService(
            OdontologoRepository odontologoRepository,
            OdontologoSucursalRepository odontologoSucursalRepository) {
        this.odontologoRepository = odontologoRepository;
        this.odontologoSucursalRepository = odontologoSucursalRepository;
    }

    @Transactional(readOnly = true)
    public List<OdontologoResponse> listarOdontologos() {
        return odontologoRepository
                .findOdontologosActivos()
                .stream()
                .map(odontologo -> new OdontologoResponse(
                        odontologo.getIdUsuario(),
                        odontologo.getUsuario().getNombres(),
                        odontologo.getUsuario().getApellidos(),
                        odontologo.getEspecialidad(),
                        odontologoSucursalRepository
                                .findByIdUsuario(odontologo.getIdUsuario())
                                .stream()
                                .map(OdontologoSucursal::getIdSucursal)
                                .toList()
                ))
                .toList();
    }
}
