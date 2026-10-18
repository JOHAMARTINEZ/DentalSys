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
    public Optional<Paciente> actualizarPaciente(Integer id, Paciente datos) {

    if (datos.getNombres() == null || datos.getNombres().isBlank()) {
        throw new IllegalArgumentException(
                "El nombre del paciente es obligatorio."
        );
    }

    if (datos.getApellidos() == null || datos.getApellidos().isBlank()) {
        throw new IllegalArgumentException(
                "Los apellidos del paciente son obligatorios."
        );
    }

    if (datos.getTelefono() == null || datos.getTelefono().isBlank()) {
        throw new IllegalArgumentException(
                "El teléfono de contacto es obligatorio."
        );
    }

    if (datos.getFechaNacimiento() == null) {
        throw new IllegalArgumentException(
                "La fecha de nacimiento es obligatoria."
        );
    }

    if (datos.getFechaNacimiento().isAfter(java.time.LocalDate.now())) {
        throw new IllegalArgumentException(
                "La fecha de nacimiento no puede ser futura."
        );
    }

    if (datos.getCorreo() != null
            && !datos.getCorreo().isBlank()
            && !datos.getCorreo().contains("@")) {
        throw new IllegalArgumentException(
                "El correo electrónico no es válido."
        );
    }

    return pacienteRepository.findById(id)
            .map(paciente -> {

                paciente.setNombres(datos.getNombres().trim());
                paciente.setApellidos(datos.getApellidos().trim());
                paciente.setFechaNacimiento(datos.getFechaNacimiento());
                paciente.setTelefono(datos.getTelefono().trim());
                paciente.setCorreo(datos.getCorreo());
                paciente.setDireccion(datos.getDireccion());

                return pacienteRepository.save(paciente);
            });
}

    public Optional<Paciente> desactivarPaciente(Integer id) {

        return pacienteRepository.findById(id)
                .map(paciente -> {
                    paciente.setEstado(0);
                    return pacienteRepository.save(paciente);
                });
    }

     public Optional<Paciente> activarPaciente(Integer id) {

    return pacienteRepository.findById(id)
            .map(paciente -> {
                paciente.setEstado(1);
                return pacienteRepository.save(paciente);
            });
}

}