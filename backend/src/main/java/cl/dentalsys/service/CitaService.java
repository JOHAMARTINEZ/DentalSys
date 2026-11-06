package cl.dentalsys.service;
import cl.dentalsys.model.EstadoCita;

import cl.dentalsys.model.Cita;
import cl.dentalsys.model.Odontologo;
import cl.dentalsys.model.Paciente;
import cl.dentalsys.model.Sucursal;
import cl.dentalsys.repository.OdontologoRepository;
import cl.dentalsys.repository.OdontologoSucursalRepository;
import cl.dentalsys.repository.PacienteRepository;
import cl.dentalsys.repository.SucursalRepository;
import cl.dentalsys.dto.ReservaPublicaRequest;
import cl.dentalsys.util.RutValidator;
import cl.dentalsys.repository.CitaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class CitaService {

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final OdontologoRepository odontologoRepository;
    private final SucursalRepository sucursalRepository;
    private final OdontologoSucursalRepository odontologoSucursalRepository;

   public CitaService(
        CitaRepository citaRepository,
        PacienteRepository pacienteRepository,
        OdontologoRepository odontologoRepository,
        SucursalRepository sucursalRepository,
        OdontologoSucursalRepository odontologoSucursalRepository
) {
    this.citaRepository = citaRepository;
    this.pacienteRepository = pacienteRepository;
    this.odontologoRepository = odontologoRepository;
    this.sucursalRepository = sucursalRepository;
    this.odontologoSucursalRepository = odontologoSucursalRepository;
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

    if (cita.getFechaHora() == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La fecha y hora de la cita son obligatorias"
        );
    }

    if (!cita.getFechaHora().isAfter(LocalDateTime.now())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La fecha de la cita debe ser futura"
        );
    }

    LocalDateTime fechaHora = cita.getFechaHora();

    if (fechaHora.getMinute() != 0
            && fechaHora.getMinute() != 30) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Las citas deben comenzar en horas completas o medias horas"
        );
    }

    if (fechaHora.getSecond() != 0
            || fechaHora.getNano() != 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El horario de la cita no es válido"
        );
    }

    if (cita.getOdontologo() == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El odontólogo es obligatorio"
        );
    }

    List<EstadoCita> estadosActivos = List.of(
            EstadoCita.RESERVADA,
            EstadoCita.CONFIRMADA
    );

    boolean horarioOcupado =
            citaRepository.existsByOdontologoIdUsuarioAndFechaHoraAndEstadoIn(
                    cita.getOdontologo().getIdUsuario(),
                    fechaHora,
                    estadosActivos
            );

    if (horarioOcupado) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "El odontólogo ya tiene una cita en ese horario"
        );
    }

    if (cita.getEstado() == null) {
        cita.setEstado(EstadoCita.RESERVADA);
    }

    return citaRepository.save(cita);
}

    public Optional<Cita> eliminar(Integer id) {
        return citaRepository.findById(id)
                .map(cita -> {
                    citaRepository.delete(cita);
                    return cita;
                });
    }

    public Cita reservarPublicamente(ReservaPublicaRequest request) {

    if (!RutValidator.esValido(request.rut())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El RUT ingresado no es válido"
        );
    }

    String rut = RutValidator.normalizar(request.rut());

    Paciente paciente = pacienteRepository.findByRut(rut)
            .orElseGet(() -> {

                Paciente nuevoPaciente = new Paciente();

                nuevoPaciente.setRut(rut);
                nuevoPaciente.setNombres(request.nombres().trim());
                nuevoPaciente.setApellidos(request.apellidos().trim());
                nuevoPaciente.setFechaNacimiento(request.fechaNacimiento());
                nuevoPaciente.setTelefono(
                        request.telefono() == null
                                ? null
                                : request.telefono().trim()
                );
                nuevoPaciente.setCorreo(
                        request.correo() == null
                                ? null
                                : request.correo().trim().toLowerCase()
                );
                nuevoPaciente.setEstado(1);

                return pacienteRepository.save(nuevoPaciente);
            });

    if (paciente.getEstado() == null || paciente.getEstado() != 1) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "El paciente se encuentra desactivado"
        );
    }

    Odontologo odontologo = odontologoRepository
            .findById(request.idOdontologo())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "El odontólogo seleccionado no existe"
            ));

    if (odontologo.getUsuario() == null
            || odontologo.getUsuario().getEstado() == null
            || odontologo.getUsuario().getEstado() != 1) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El odontólogo seleccionado no está disponible"
        );
    }

    Sucursal sucursal = sucursalRepository
            .findById(request.idSucursal())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "La sucursal seleccionada no existe"
            ));

    if (!Boolean.TRUE.equals(sucursal.getEstado())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La sucursal seleccionada no está disponible"
        );
    }

    boolean atiendeEnSucursal =
            odontologoSucursalRepository
                    .existsByIdUsuarioAndIdSucursal(
                            request.idOdontologo(),
                            request.idSucursal()
                    );

    if (!atiendeEnSucursal) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El odontólogo seleccionado no atiende en esa sucursal"
        );
    }

    LocalDateTime fechaHora = request.fechaHora();

    if (!fechaHora.isAfter(LocalDateTime.now())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La fecha de la cita debe ser futura"
        );
    }

    if (fechaHora.getMinute() != 0
            && fechaHora.getMinute() != 30) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Las citas deben comenzar en horas completas o medias horas"
        );
    }

    if (fechaHora.getSecond() != 0
            || fechaHora.getNano() != 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El horario de la cita no es válido"
        );
    }

    List<EstadoCita> estadosActivos = List.of(
            EstadoCita.RESERVADA,
            EstadoCita.CONFIRMADA
    );

    boolean horarioOcupado =
            citaRepository.existsByOdontologoIdUsuarioAndFechaHoraAndEstadoIn(
                    request.idOdontologo(),
                    fechaHora,
                    estadosActivos
            );

    if (horarioOcupado) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "El odontólogo ya tiene una cita en ese horario"
        );
    }

    Cita cita = new Cita();

    cita.setPaciente(paciente);
    cita.setOdontologo(odontologo);
    cita.setSucursal(sucursal);
    cita.setFechaHora(fechaHora);
    cita.setMotivo(
            request.motivo() == null
                    ? null
                    : request.motivo().trim()
    );
    cita.setEstado(EstadoCita.RESERVADA);

    return citaRepository.save(cita);
}



}