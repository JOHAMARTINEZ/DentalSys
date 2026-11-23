package cl.dentalsys.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Pregunta al asistente de IA.
 * historial: mensajes anteriores de la misma conversación (opcional),
 * para que el asistente entienda preguntas de seguimiento.
 * rol de cada mensaje: "usuario" o "asistente".
 */
public record AsistenteRequest(

        @NotBlank(message = "Escribe una pregunta")
        @Size(max = 1000, message = "La pregunta no puede superar los 1000 caracteres")
        String mensaje,

        @Size(max = 40, message = "La conversación es demasiado larga. Inicia una nueva.")
        List<@Valid Mensaje> historial
) {

    public record Mensaje(

            @NotBlank
            String rol,

            @NotBlank
            @Size(max = 6000)
            String texto
    ) {
    }
}
