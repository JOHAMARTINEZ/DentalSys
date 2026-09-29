package cl.dentalsys.service;

import cl.dentalsys.model.Paciente;
import cl.dentalsys.repository.PacienteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PacienteService {

    private final PacienteRepository pacienteRepository;

    public PacienteService(PacienteRepository pacienteRepository) {
        this.pacienteRepository = pacienteRepository;
    }

    public List<Paciente> listarPacientes() {
        return pacienteRepository.findAll();
    }

    public Optional<Paciente> buscarPorId(Integer id) {
        return pacienteRepository.findById(id);
    }

    public Optional<Paciente> buscarPorRut(String rut) {
        return pacienteRepository.findByRut(rut);
    }

    public Paciente registrarPaciente(Paciente paciente) {

        if (pacienteRepository.existsByRut(paciente.getRut())) {
            throw new IllegalArgumentException(
                    "Ya existe un paciente registrado con el RUT: " + paciente.getRut()
            );
        }

        return pacienteRepository.save(paciente);
    }
}