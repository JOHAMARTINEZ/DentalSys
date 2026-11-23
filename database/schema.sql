-- ============================================================
-- DentalSys - Script oficial de la base de datos (v2)
-- Archivo: database/schema.sql
-- Diseno del modelo v2: Johanna Martinez Sanhueza
--
-- Este script reemplaza al modelo inicial de la Fase 1 (base
-- "dentalsys", 14 tablas). La version anterior queda en el
-- historial de Git.
--
-- Contenido: base dentalsys_v2 con 25 tablas, 1 vista
-- (vw_saldo_presupuesto) y los 4 roles del sistema.
-- No incluye datos de pacientes, usuarios ni catalogos.
--
-- Ejecucion manual (MySQL 8.0.16 o superior):
--   mysql -u root -p < database/schema.sql
-- Con Docker se ejecuta automaticamente al crear el contenedor
-- (ver docker-compose.yml).
-- ============================================================

-- ============================================================
-- DentalSys - Schema V3-MVP para evaluacion
-- Base independiente: dentalsys_v2
-- MySQL 8.0.16+
--
-- IMPORTANTE:
-- * Crear una base de pruebas; no modifica dentalsys.
-- * Conserva los nombres de las tablas originales.
-- * No incluye tabla PERSONA.
-- * Doble rol: rol + usuario_rol. usuario.rol queda temporalmente
--   como campo legado hasta adaptar Spring Security/JWT.
-- * Las piezas dentales son opcionales en atenciones y presupuestos.
-- * Cada presupuesto tiene sus propios abonos y saldo calculado.
-- * Los comprobantes se conservan; para corregir un pago se anula
--   con trazabilidad y se registra el movimiento correcto.
-- ============================================================

CREATE DATABASE IF NOT EXISTS dentalsys_v2
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dentalsys_v2;

-- 1. USUARIOS Y ROLES
CREATE TABLE usuario (
    id_usuario INT NOT NULL AUTO_INCREMENT,
    rut VARCHAR(12) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN','RECEPCIONISTA','ODONTOLOGO','PACIENTE') NOT NULL
      COMMENT 'Rol principal legado; usar usuario_rol para multirol',
    estado TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uk_usuario_rut (rut),
    UNIQUE KEY uk_usuario_correo (correo),
    UNIQUE KEY uk_usuario_username (username)
) ENGINE=InnoDB;

CREATE TABLE rol (
    id_rol INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(30) NOT NULL,
    descripcion VARCHAR(150) NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_rol),
    UNIQUE KEY uk_rol_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE usuario_rol (
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_rol),
    KEY idx_usuario_rol_rol (id_rol),
    CONSTRAINT fk_usuario_rol_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_usuario_rol_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
) ENGINE=InnoDB;

INSERT INTO rol (nombre, descripcion) VALUES
('ADMIN','Administracion del sistema'),
('RECEPCIONISTA','Gestion administrativa y agenda'),
('ODONTOLOGO','Profesional odontologico'),
('PACIENTE','Acceso al portal del paciente');

-- 2. SUCURSALES Y ODONTOLOGOS
CREATE TABLE sucursal (
    id_sucursal INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    telefono VARCHAR(20) NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_sucursal),
    UNIQUE KEY uk_sucursal_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE odontologo (
    id_usuario INT NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    numero_registro_salud VARCHAR(50) NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uk_odontologo_registro (numero_registro_salud),
    CONSTRAINT fk_odontologo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE odontologo_sucursal (
    id_usuario INT NOT NULL,
    id_sucursal INT NOT NULL,
    PRIMARY KEY (id_usuario, id_sucursal),
    KEY idx_odontologo_sucursal_sucursal (id_sucursal),
    CONSTRAINT fk_odontologo_sucursal_odontologo
      FOREIGN KEY (id_usuario) REFERENCES odontologo(id_usuario),
    CONSTRAINT fk_odontologo_sucursal_sucursal
      FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal)
) ENGINE=InnoDB;

-- 3. PACIENTES, FICHA CLINICA Y PREFERENCIAS DE CONTACTO
CREATE TABLE paciente (
    id_paciente INT NOT NULL AUTO_INCREMENT,
    rut VARCHAR(12) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    telefono VARCHAR(20) NULL,
    correo VARCHAR(150) NULL,
    direccion VARCHAR(200) NULL,
    apoderado_nombre VARCHAR(150) NULL,
    apoderado_rut VARCHAR(12) NULL,
    apoderado_telefono VARCHAR(20) NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    id_usuario INT NULL,
    PRIMARY KEY (id_paciente),
    UNIQUE KEY uk_paciente_rut (rut),
    UNIQUE KEY uk_paciente_usuario (id_usuario),
    CONSTRAINT fk_paciente_usuario FOREIGN KEY (id_usuario)
      REFERENCES usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE ficha_clinica (
    id_ficha INT NOT NULL AUTO_INCREMENT,
    fecha_apertura DATE NOT NULL,
    antecedentes_medicos TEXT NULL,
    alergias TEXT NULL,
    observaciones TEXT NULL,
    id_paciente INT NOT NULL,
    PRIMARY KEY (id_ficha),
    UNIQUE KEY uk_ficha_paciente (id_paciente),
    CONSTRAINT fk_ficha_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
) ENGINE=InnoDB;

CREATE TABLE preferencia_notificacion (
    id_paciente INT NOT NULL,
    email_habilitado TINYINT(1) NOT NULL DEFAULT 0,
    whatsapp_habilitado TINYINT(1) NOT NULL DEFAULT 0,
    canal_preferido ENUM('EMAIL','WHATSAPP') NULL,
    fecha_consentimiento_email DATETIME NULL,
    fecha_consentimiento_whatsapp DATETIME NULL,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_paciente),
    CONSTRAINT fk_preferencia_notificacion_paciente
      FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    CONSTRAINT chk_pref_canal CHECK (
      canal_preferido IS NULL
      OR (canal_preferido = 'EMAIL' AND email_habilitado = 1)
      OR (canal_preferido = 'WHATSAPP' AND whatsapp_habilitado = 1)
    ),
    CONSTRAINT chk_pref_consent_email CHECK (
      email_habilitado = 0 OR fecha_consentimiento_email IS NOT NULL
    ),
    CONSTRAINT chk_pref_consent_wsp CHECK (
      whatsapp_habilitado = 0 OR fecha_consentimiento_whatsapp IS NOT NULL
    )
) ENGINE=InnoDB;

-- 4. AGENDA
CREATE TABLE motivo_cita (
    id_motivo INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200) NULL,
    duracion_minutos INT NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_motivo),
    UNIQUE KEY uk_motivo_cita_nombre (nombre),
    CONSTRAINT chk_motivo_duracion CHECK (duracion_minutos > 0)
) ENGINE=InnoDB;

CREATE TABLE horario_atencion (
    id_horario INT NOT NULL AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_sucursal INT NOT NULL,
    dia_semana TINYINT NOT NULL COMMENT '1 lunes ... 7 domingo',
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_horario),
    KEY idx_horario_profesional_sucursal (id_usuario,id_sucursal),
    CONSTRAINT fk_horario_odontologo FOREIGN KEY (id_usuario) REFERENCES odontologo(id_usuario),
    CONSTRAINT fk_horario_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal),
    CONSTRAINT fk_horario_odontologo_sucursal
      FOREIGN KEY (id_usuario,id_sucursal)
      REFERENCES odontologo_sucursal(id_usuario,id_sucursal),
    CONSTRAINT chk_horario_dia CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT chk_horario_rango CHECK (hora_inicio < hora_fin)
) ENGINE=InnoDB;

CREATE TABLE bloqueo_agenda (
    id_bloqueo INT NOT NULL AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_sucursal INT NOT NULL,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NOT NULL,
    motivo VARCHAR(200) NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_bloqueo),
    KEY idx_bloqueo_profesional_sucursal_fecha
      (id_usuario,id_sucursal,estado,fecha_hora_inicio,fecha_hora_fin),
    CONSTRAINT fk_bloqueo_odontologo FOREIGN KEY (id_usuario) REFERENCES odontologo(id_usuario),
    CONSTRAINT fk_bloqueo_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal),
    CONSTRAINT fk_bloqueo_odontologo_sucursal
      FOREIGN KEY (id_usuario,id_sucursal)
      REFERENCES odontologo_sucursal(id_usuario,id_sucursal),
    CONSTRAINT chk_bloqueo_rango CHECK (fecha_hora_inicio < fecha_hora_fin)
) ENGINE=InnoDB;

CREATE TABLE cita (
    id_cita INT NOT NULL AUTO_INCREMENT,
    fecha_hora DATETIME NOT NULL COMMENT 'Inicio de la cita',
    fecha_hora_fin DATETIME NOT NULL,
    motivo VARCHAR(255) NULL,
    id_motivo INT NULL,
    estado ENUM('RESERVADA','CONFIRMADA','COMPLETADA','CANCELADA','NO_ASISTIO')
      NOT NULL DEFAULT 'RESERVADA',
    ocupa_horario TINYINT
      GENERATED ALWAYS AS (IF(estado = 'CANCELADA', NULL, 1)) STORED,
    id_paciente INT NOT NULL,
    id_odontologo INT NOT NULL,
    id_sucursal INT NOT NULL,
    id_usuario_creador INT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_cita),
    UNIQUE KEY uk_cita_horario_inicio (id_odontologo,fecha_hora,ocupa_horario),
    KEY idx_cita_paciente (id_paciente),
    KEY idx_cita_agenda (id_odontologo,id_sucursal,estado,fecha_hora,fecha_hora_fin),
    KEY idx_cita_sucursal (id_sucursal),
    KEY idx_cita_motivo (id_motivo),
    KEY idx_cita_usuario_creador (id_usuario_creador),
    CONSTRAINT fk_cita_odontologo FOREIGN KEY (id_odontologo) REFERENCES odontologo(id_usuario),
    CONSTRAINT fk_cita_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    CONSTRAINT fk_cita_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal),
    CONSTRAINT fk_cita_odontologo_sucursal
      FOREIGN KEY (id_odontologo,id_sucursal)
      REFERENCES odontologo_sucursal(id_usuario,id_sucursal),
    CONSTRAINT fk_cita_motivo FOREIGN KEY (id_motivo) REFERENCES motivo_cita(id_motivo),
    CONSTRAINT fk_cita_usuario_creador FOREIGN KEY (id_usuario_creador)
      REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_cita_rango CHECK (fecha_hora < fecha_hora_fin)
) ENGINE=InnoDB;

CREATE TABLE historial_cita (
    id_historial INT NOT NULL AUTO_INCREMENT,
    id_cita INT NOT NULL,
    id_usuario INT NULL,
    estado_anterior VARCHAR(20) NULL,
    estado_nuevo VARCHAR(20) NOT NULL,
    fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacion VARCHAR(250) NULL,
    PRIMARY KEY (id_historial),
    KEY idx_historial_cita_fecha (id_cita,fecha_cambio),
    CONSTRAINT fk_historial_cita_cita FOREIGN KEY (id_cita) REFERENCES cita(id_cita),
    CONSTRAINT fk_historial_cita_usuario FOREIGN KEY (id_usuario)
      REFERENCES usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. TRATAMIENTOS Y ATENCIONES
CREATE TABLE tratamiento (
    id_tratamiento INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    costo_base DECIMAL(10,2) NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_tratamiento),
    CONSTRAINT chk_tratamiento_costo CHECK (costo_base >= 0)
) ENGINE=InnoDB;

CREATE TABLE atencion (
    id_atencion INT NOT NULL AUTO_INCREMENT,
    fecha_hora DATETIME NOT NULL,
    estado ENUM('BORRADOR','CERRADA') NOT NULL DEFAULT 'BORRADOR',
    diagnostico TEXT NULL,
    observaciones TEXT NULL,
    indicaciones TEXT NULL,
    id_cita INT NULL,
    id_ficha INT NOT NULL,
    id_odontologo INT NOT NULL,
    id_sucursal INT NOT NULL,
    PRIMARY KEY (id_atencion),
    UNIQUE KEY uk_atencion_cita (id_cita),
    KEY idx_atencion_ficha (id_ficha),
    KEY idx_atencion_odontologo (id_odontologo),
    KEY idx_atencion_sucursal (id_sucursal),
    CONSTRAINT fk_atencion_cita FOREIGN KEY (id_cita) REFERENCES cita(id_cita),
    CONSTRAINT fk_atencion_ficha FOREIGN KEY (id_ficha) REFERENCES ficha_clinica(id_ficha),
    CONSTRAINT fk_atencion_odontologo FOREIGN KEY (id_odontologo) REFERENCES odontologo(id_usuario),
    CONSTRAINT fk_atencion_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal),
    CONSTRAINT fk_atencion_odontologo_sucursal
      FOREIGN KEY (id_odontologo,id_sucursal)
      REFERENCES odontologo_sucursal(id_usuario,id_sucursal)
) ENGINE=InnoDB;

CREATE TABLE atencion_tratamiento (
    id_atencion INT NOT NULL,
    id_tratamiento INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    costo_aplicado DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_atencion,id_tratamiento),
    KEY idx_atencion_tratamiento_tratamiento (id_tratamiento),
    CONSTRAINT fk_atentrat_atencion FOREIGN KEY (id_atencion) REFERENCES atencion(id_atencion),
    CONSTRAINT fk_atentrat_tratamiento FOREIGN KEY (id_tratamiento) REFERENCES tratamiento(id_tratamiento),
    CONSTRAINT chk_atentrat_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_atentrat_costo CHECK (costo_aplicado >= 0)
) ENGINE=InnoDB;

CREATE TABLE atencion_tratamiento_pieza (
    id_atencion INT NOT NULL,
    id_tratamiento INT NOT NULL,
    pieza_dental VARCHAR(2) NOT NULL COMMENT 'Codigo FDI: 11-48 permanente, 51-85 temporal',
    superficies VARCHAR(50) NULL COMMENT 'Ej.: O, M, D, V, P/L',
    observacion VARCHAR(250) NULL,
    PRIMARY KEY (id_atencion,id_tratamiento,pieza_dental),
    CONSTRAINT fk_atp_atencion_tratamiento
      FOREIGN KEY (id_atencion,id_tratamiento)
      REFERENCES atencion_tratamiento(id_atencion,id_tratamiento),
    CONSTRAINT chk_atp_pieza CHECK (
      pieza_dental REGEXP '^[1-4][1-8]$|^[5-8][1-5]$'
    )
) ENGINE=InnoDB;

-- 6. DOCUMENTOS CLINICOS
CREATE TABLE documento_clinico (
    id_documento INT NOT NULL AUTO_INCREMENT,
    tipo_documento ENUM('RECETA','EXAMEN','CONSENTIMIENTO') NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_storage VARCHAR(500) NOT NULL,
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_paciente INT NOT NULL,
    id_atencion INT NULL,
    PRIMARY KEY (id_documento),
    KEY idx_docclinico_paciente (id_paciente),
    KEY idx_docclinico_atencion (id_atencion),
    CONSTRAINT fk_docclinico_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    CONSTRAINT fk_docclinico_atencion FOREIGN KEY (id_atencion) REFERENCES atencion(id_atencion)
) ENGINE=InnoDB;

-- 7. PRESUPUESTOS Y SUS PIEZAS OPCIONALES
CREATE TABLE presupuesto (
    id_presupuesto INT NOT NULL AUTO_INCREMENT,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado ENUM('PENDIENTE','ACEPTADO','RECHAZADO','VENCIDO','ANULADO')
      NOT NULL DEFAULT 'PENDIENTE',
    monto_total DECIMAL(10,2) NOT NULL,
    id_paciente INT NOT NULL,
    id_odontologo INT NOT NULL,
    id_sucursal INT NOT NULL,
    PRIMARY KEY (id_presupuesto),
    UNIQUE KEY uk_presupuesto_paciente (id_presupuesto,id_paciente),
    KEY idx_presupuesto_paciente (id_paciente),
    KEY idx_presupuesto_odontologo (id_odontologo),
    KEY idx_presupuesto_sucursal (id_sucursal),
    CONSTRAINT fk_presupuesto_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    CONSTRAINT fk_presupuesto_odontologo FOREIGN KEY (id_odontologo) REFERENCES odontologo(id_usuario),
    CONSTRAINT fk_presupuesto_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal),
    CONSTRAINT fk_presupuesto_odontologo_sucursal
      FOREIGN KEY (id_odontologo,id_sucursal)
      REFERENCES odontologo_sucursal(id_usuario,id_sucursal),
    CONSTRAINT chk_presupuesto_monto CHECK (monto_total >= 0),
    CONSTRAINT chk_presupuesto_fechas CHECK (fecha_vencimiento >= fecha_emision)
) ENGINE=InnoDB;

CREATE TABLE presupuesto_tratamiento (
    id_presupuesto INT NOT NULL,
    id_tratamiento INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    costo_aplicado DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_presupuesto,id_tratamiento),
    KEY idx_prestrat_tratamiento (id_tratamiento),
    CONSTRAINT fk_prestrat_presupuesto FOREIGN KEY (id_presupuesto) REFERENCES presupuesto(id_presupuesto),
    CONSTRAINT fk_prestrat_tratamiento FOREIGN KEY (id_tratamiento) REFERENCES tratamiento(id_tratamiento),
    CONSTRAINT chk_prestrat_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_prestrat_costo CHECK (costo_aplicado >= 0)
) ENGINE=InnoDB;

CREATE TABLE presupuesto_tratamiento_pieza (
    id_presupuesto INT NOT NULL,
    id_tratamiento INT NOT NULL,
    pieza_dental VARCHAR(2) NOT NULL COMMENT 'Codigo FDI',
    superficies VARCHAR(50) NULL,
    observacion VARCHAR(250) NULL,
    PRIMARY KEY (id_presupuesto,id_tratamiento,pieza_dental),
    CONSTRAINT fk_ptp_presupuesto_tratamiento
      FOREIGN KEY (id_presupuesto,id_tratamiento)
      REFERENCES presupuesto_tratamiento(id_presupuesto,id_tratamiento),
    CONSTRAINT chk_ptp_pieza CHECK (
      pieza_dental REGEXP '^[1-4][1-8]$|^[5-8][1-5]$'
    )
) ENGINE=InnoDB;

-- 8. PAGOS, ABONOS Y COMPROBANTES
-- Cada pago representa dinero recibido. Para corregir un movimiento,
-- se anula con responsable/motivo y se registra un nuevo pago correcto.
CREATE TABLE pago (
    id_pago INT NOT NULL AUTO_INCREMENT,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto DECIMAL(10,2) NOT NULL,
    medio_pago ENUM('EFECTIVO','TARJETA','TRANSFERENCIA') NOT NULL,
    estado ENUM('PAGADO','ANULADO') NOT NULL DEFAULT 'PAGADO',
    id_paciente INT NOT NULL,
    id_atencion INT NULL,
    id_presupuesto INT NULL,
    id_usuario_registra INT NULL,
    id_usuario_anula INT NULL,
    observacion VARCHAR(250) NULL,
    fecha_anulacion DATETIME NULL,
    motivo_anulacion VARCHAR(250) NULL,
    PRIMARY KEY (id_pago),
    KEY idx_pago_paciente (id_paciente),
    KEY idx_pago_atencion (id_atencion),
    KEY idx_pago_presupuesto (id_presupuesto),
    KEY idx_pago_presupuesto_paciente (id_presupuesto,id_paciente),
    KEY idx_pago_usuario_registra (id_usuario_registra),
    KEY idx_pago_usuario_anula (id_usuario_anula),
    CONSTRAINT fk_pago_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    CONSTRAINT fk_pago_atencion FOREIGN KEY (id_atencion) REFERENCES atencion(id_atencion),
    CONSTRAINT fk_pago_presupuesto FOREIGN KEY (id_presupuesto) REFERENCES presupuesto(id_presupuesto),
    CONSTRAINT fk_pago_presupuesto_paciente
      FOREIGN KEY (id_presupuesto,id_paciente)
      REFERENCES presupuesto(id_presupuesto,id_paciente),
    CONSTRAINT fk_pago_usuario_registra FOREIGN KEY (id_usuario_registra) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_pago_usuario_anula FOREIGN KEY (id_usuario_anula) REFERENCES usuario(id_usuario),
    CONSTRAINT chk_pago_monto CHECK (monto > 0),
    CONSTRAINT chk_pago_un_solo_destino CHECK (
      (id_atencion IS NOT NULL AND id_presupuesto IS NULL)
      OR (id_atencion IS NULL AND id_presupuesto IS NOT NULL)
    ),
    CONSTRAINT chk_pago_anulacion CHECK (
      (estado = 'ANULADO' AND fecha_anulacion IS NOT NULL
        AND id_usuario_anula IS NOT NULL AND motivo_anulacion IS NOT NULL)
      OR
      (estado = 'PAGADO' AND fecha_anulacion IS NULL
        AND id_usuario_anula IS NULL AND motivo_anulacion IS NULL)
    )
) ENGINE=InnoDB;

CREATE TABLE comprobante_pago (
    id_comprobante INT NOT NULL AUTO_INCREMENT,
    id_pago INT NOT NULL,
    folio VARCHAR(40) NOT NULL,
    ruta_pdf VARCHAR(500) NULL,
    fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('GENERADO','ANULADO') NOT NULL DEFAULT 'GENERADO',
    PRIMARY KEY (id_comprobante),
    UNIQUE KEY uk_comprobante_pago (id_pago),
    UNIQUE KEY uk_comprobante_folio (folio),
    CONSTRAINT fk_comprobante_pago_pago FOREIGN KEY (id_pago) REFERENCES pago(id_pago)
) ENGINE=InnoDB;

-- 9. NOTIFICACIONES Y TRAZABILIDAD DE ENVIO
CREATE TABLE notificacion (
    id_notificacion BIGINT NOT NULL AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_cita INT NULL,
    id_pago INT NULL,
    id_presupuesto INT NULL,
    id_comprobante INT NULL,
    tipo_evento ENUM(
      'CITA_RESERVADA','CITA_CONFIRMADA','CITA_CANCELADA','CITA_MODIFICADA',
      'RECORDATORIO_CITA','PAGO_REGISTRADO','PAGO_ANULADO','COMPROBANTE_PAGO',
      'PRESUPUESTO_EMITIDO','PRESUPUESTO_ACEPTADO','PRESUPUESTO_RECHAZADO'
    ) NOT NULL,
    canal ENUM('EMAIL','WHATSAPP') NOT NULL,
    destinatario VARCHAR(190) NOT NULL,
    asunto VARCHAR(200) NULL,
    contenido TEXT NOT NULL,
    estado ENUM('PENDIENTE','ENVIADA','ENTREGADA','ERROR') NOT NULL DEFAULT 'PENDIENTE',
    proveedor VARCHAR(80) NULL,
    id_mensaje_proveedor VARCHAR(190) NULL,
    mensaje_error VARCHAR(500) NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_envio DATETIME NULL,
    fecha_entrega DATETIME NULL,
    PRIMARY KEY (id_notificacion),
    KEY idx_notificacion_paciente_fecha (id_paciente,fecha_creacion),
    KEY idx_notificacion_estado (estado,fecha_creacion),
    KEY idx_notificacion_cita (id_cita),
    KEY idx_notificacion_pago (id_pago),
    KEY idx_notificacion_presupuesto (id_presupuesto),
    CONSTRAINT fk_notificacion_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    CONSTRAINT fk_notificacion_cita FOREIGN KEY (id_cita) REFERENCES cita(id_cita),
    CONSTRAINT fk_notificacion_pago FOREIGN KEY (id_pago) REFERENCES pago(id_pago),
    CONSTRAINT fk_notificacion_presupuesto FOREIGN KEY (id_presupuesto) REFERENCES presupuesto(id_presupuesto),
    CONSTRAINT fk_notificacion_comprobante FOREIGN KEY (id_comprobante) REFERENCES comprobante_pago(id_comprobante)
) ENGINE=InnoDB;

-- 10. VISTA DE SALDOS POR PRESUPUESTO
-- El saldo se calcula; no se almacena duplicado.
CREATE OR REPLACE VIEW vw_saldo_presupuesto AS
SELECT
    pr.id_presupuesto,
    pr.id_paciente,
    pr.estado AS estado_presupuesto,
    pr.monto_total,
    COALESCE(SUM(CASE WHEN pa.estado = 'PAGADO' THEN pa.monto ELSE 0 END),0) AS total_abonado,
    pr.monto_total
      - COALESCE(SUM(CASE WHEN pa.estado = 'PAGADO' THEN pa.monto ELSE 0 END),0)
      AS saldo_pendiente
FROM presupuesto pr
LEFT JOIN pago pa ON pa.id_presupuesto = pr.id_presupuesto
GROUP BY pr.id_presupuesto,pr.id_paciente,pr.estado,pr.monto_total;

-- ============================================================
-- NOTAS IMPORTANTES PARA BACKEND
-- ============================================================
-- 1. La FK compuesta valida que el odontologo trabaje en esa sucursal.
-- 2. UNIQUE de cita evita misma hora de inicio para citas no canceladas,
--    pero NO evita solapamientos con horas de inicio distintas.
--    Validar intervalos en Spring Boot con transaccion/bloqueo.
-- 3. Las piezas dentales son opcionales: si no hay pieza, no insertar
--    filas en atencion_tratamiento_pieza/presupuesto_tratamiento_pieza.
-- 4. El saldo se consulta desde vw_saldo_presupuesto. No almacenar saldo.
--    Validar abonos concurrentes y que no superen el saldo en backend.
-- 5. Cada pago tiene un comprobante. No sobrescribir comprobantes ya
--    emitidos: al anular un pago, anular su comprobante en la MISMA
--    transaccion de Spring Boot; luego registrar el movimiento correcto.
-- 6. Antes de registrar un pago asociado a presupuesto, validar en backend
--    que el presupuesto este ACEPTADO (regla funcional por confirmar).
--    La FK compuesta tambien impide asociar el pago a otro paciente.
-- 7. Preferencias y consentimiento de notificacion deben verificarse
--    antes de enviar email/WhatsApp. WhatsApp requiere proveedor/API.
--    Los CHECK de esta tabla mantienen coherentes canal, habilitacion
--    y fecha de consentimiento.
-- 8. Registrar eventos de cita/pago y enviar notificacion despues del
--    commit. Usar cola/reintentos en backend; el SQL solo guarda historial.
-- 9. Al crear una atencion desde una cita, validar en backend que el
--    paciente de la cita sea el mismo paciente de la ficha/atencion.
-- 10. Doble rol requiere adaptar autenticacion/autorizacion/JWT en Java.
-- 11. Las atenciones cerradas y los datos clinicos deben protegerse en backend.
-- 12. MySQL 8.0.16+ para CHECK constraints.
