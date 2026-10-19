package cl.dentalsys.service;

import cl.dentalsys.model.Cita;
import cl.dentalsys.repository.CitaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CitaService {

    private final CitaRepository citaRepository;

    public CitaService(CitaRepository citaRepository) {
        this.citaRepository = citaRepository;
    }

    public List<Cita> listarCitas() {
        return citaRepository.findAll();
    }

    public Optional<Cita> buscarPorId(Integer id) {
        return citaRepository.findById(id);
    }

    public List<Cita> buscarPorRangoFecha(
            LocalDateTime inicio,
            LocalDateTime fin) {
        return citaRepository.findByFechaHoraBetween(inicio, fin);
    }

    public List<Cita> buscarPorPaciente(Integer idPaciente) {
        return citaRepository.findByPacienteIdPaciente(idPaciente);
    }

    public List<Cita> buscarPorOdontologo(Integer idUsuario) {
        return citaRepository.findByOdontologoIdUsuario(idUsuario);
    }

    public List<Cita> buscarPorSucursal(Integer idSucursal) {
        return citaRepository.findBySucursalIdSucursal(idSucursal);
    }

    public Cita guardar(Cita cita) {
        return citaRepository.save(cita);
    }

    public Optional<Cita> eliminar(Integer id) {
        return citaRepository.findById(id)
                .map(cita -> {
                    citaRepository.delete(cita);
                    return cita;
                });
    }
}