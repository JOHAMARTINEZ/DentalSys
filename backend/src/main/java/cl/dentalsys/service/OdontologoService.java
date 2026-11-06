package cl.dentalsys.service;

import cl.dentalsys.dto.OdontologoResponse;
import cl.dentalsys.repository.OdontologoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OdontologoService {

    private final OdontologoRepository odontologoRepository;

    public OdontologoService(OdontologoRepository odontologoRepository) {
        this.odontologoRepository = odontologoRepository;
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
                        odontologo.getEspecialidad()
                ))
                .toList();
    }
}