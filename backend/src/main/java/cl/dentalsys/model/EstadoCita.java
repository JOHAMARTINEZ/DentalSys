package cl.dentalsys.model;

/**
 * Debe coincidir con el ENUM de la columna cita.estado en dentalsys_v2.
 */
public enum EstadoCita {

    RESERVADA,
    CONFIRMADA,
    COMPLETADA,
    CANCELADA,
    NO_ASISTIO
}