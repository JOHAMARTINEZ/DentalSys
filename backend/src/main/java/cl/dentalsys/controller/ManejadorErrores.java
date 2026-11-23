package cl.dentalsys.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Respuestas de error con el mismo formato para todo el backend:
 * { "timestamp", "status", "error", "message" }.
 * Así el frontend siempre recibe el mensaje en español que se quiere
 * mostrar (sin depender de la configuración server.error.*).
 */
@RestControllerAdvice
public class ManejadorErrores {

    private static final Logger log = LoggerFactory.getLogger(ManejadorErrores.class);

    /** Errores de negocio lanzados en los services (mensajes en español). */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> estado(ResponseStatusException ex) {
        return respuesta(ex.getStatusCode(), ex.getReason());
    }

    /** Validaciones @Valid de los DTO (ej: reserva pública). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validacion(MethodArgumentNotValidException ex) {
        return respuesta(HttpStatus.BAD_REQUEST, "Revisa los datos ingresados.");
    }

    /** JSON mal formado o con tipos incorrectos (ej: una fecha inválida). */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> lectura(HttpMessageNotReadableException ex) {
        return respuesta(HttpStatus.BAD_REQUEST, "Los datos enviados no tienen el formato esperado.");
    }

    /** Restricciones de la base de datos (únicos, llaves foráneas, CHECK). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> integridad(DataIntegrityViolationException ex) {
        log.warn("Restricción de la base de datos: {}", ex.getMostSpecificCause().getMessage());
        return respuesta(HttpStatus.CONFLICT,
                "La operación no cumple las reglas de la base de datos (datos repetidos o en uso).");
    }

    /** Login con credenciales incorrectas o usuario desactivado. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> autenticacion(AuthenticationException ex) {
        return respuesta(HttpStatus.UNAUTHORIZED, "Las credenciales ingresadas no son válidas.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> acceso(AccessDeniedException ex) {
        return respuesta(HttpStatus.FORBIDDEN, "No tienes permiso para realizar esta acción.");
    }

    /** Cualquier otro error: se registra completo en la consola del backend. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> general(Exception ex) {
        log.error("Error no controlado", ex);
        return respuesta(HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocurrió un error inesperado en el servidor. Intenta nuevamente.");
    }

    private static ResponseEntity<Map<String, Object>> respuesta(HttpStatusCode status, String mensaje) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("timestamp", LocalDateTime.now().toString());
        cuerpo.put("status", status.value());
        cuerpo.put("error", status instanceof HttpStatus h ? h.getReasonPhrase() : String.valueOf(status.value()));
        cuerpo.put("message", mensaje == null ? "" : mensaje);
        return ResponseEntity.status(status).body(cuerpo);
    }
}
