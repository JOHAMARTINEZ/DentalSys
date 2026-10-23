package cl.dentalsys.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReservaPublicaRequest(

        @NotBlank
        String rut,

        @NotBlank
        @Size(max = 100)
        String nombres,

        @NotBlank
        @Size(max = 100)
        String apellidos,

        @NotNull
        LocalDate fechaNacimiento,

        @Size(max = 20)
        String telefono,

        @Email
        @Size(max = 150)
        String correo,

        @NotNull
        Integer idOdontologo,

        @NotNull
        Integer idSucursal,

        @NotNull
        @Future
        LocalDateTime fechaHora,

        @Size(max = 255)
        String motivo
) {
}