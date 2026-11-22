# DentalSys

Sistema web de gestión odontológica desarrollado como Proyecto APT / CAPSTONE 2026 de Duoc UC, para la Clínica **Más Dent** (Puente Alto, dos sucursales).

DentalSys centraliza en una sola plataforma la información que la clínica gestionaba en fichas de papel y cuadernos separados por sede: pacientes, agenda, ficha clínica, atenciones, presupuestos y pagos. Incluye un Portal del Paciente y un asistente virtual de apoyo administrativo.

---

## Estado del proyecto

**MVP terminado (Fase 2).**

| Indicador | Valor |
|---|---|
| Historias de usuario implementadas | 20 de 21 |
| Endpoints REST | 76, en 18 controladores |
| Vistas del frontend | 19 |
| Tablas de la base de datos | 25 + 1 vista |
| Perfiles de acceso | Administración, recepción, odontólogo y paciente |

La historia pendiente es la **HU-21 (asistente virtual)**. Está implementada, pero su validación de punta a punta depende de una clave de Google Gemini habilitada. Sin esa clave, el asistente queda desactivado y el resto del sistema funciona con normalidad.

---

## Equipo

| Integrante | Rol |
|---|---|
| Johanna Martínez Sanhueza | Desarrolladora Full Stack |
| Cristian Muñoz Cortes | Desarrollador Full Stack |

Ambos integrantes compartieron los roles de Product Owner y Scrum Master. La planificación y el seguimiento se gestionaron en Jira (proyecto DENTAL).

---

## Funcionalidades por perfil

| Perfil | Qué puede hacer |
|---|---|
| **Visitante (sin cuenta)** | Ver la clínica, consultar disponibilidad, reservar una hora y crear su cuenta de paciente. |
| **Paciente** | Ver y cancelar sus citas, reservar horas, revisar sus atenciones, responder presupuestos, ver sus pagos y comprobantes y actualizar su perfil y sus preferencias de notificación. |
| **Recepcionista** | Gestionar pacientes (incluido apoderado para menores), agenda por sucursal, horarios y bloqueos de los odontólogos, pagos con comprobante y estado de los presupuestos. |
| **Odontólogo** | Ver su jornada, registrar la ficha clínica con odontograma, registrar y cerrar atenciones, y crear presupuestos con tratamientos y piezas dentales. |
| **Administrador** | Todo lo de recepción, además de la gestión de usuarios del personal, el catálogo de tratamientos y los indicadores de la clínica. |

El asistente virtual está disponible para el personal de la clínica (administración, recepción y odontólogos). Responde dudas administrativas usando solo datos agregados: **no envía a Gemini nombres, RUT ni datos clínicos de pacientes**, y no realiza diagnósticos ni recomendaciones clínicas.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19, TypeScript, Vite, Material UI 9, React Router |
| Backend | Java 21, Spring Boot 4.1, Spring Security 7, JWT (jjwt 0.13), Spring Data JPA (Hibernate 7), JdbcTemplate, Bean Validation |
| Base de datos | MySQL 8 |
| Inteligencia artificial | Google Gemini (API REST de Google AI Studio) |
| Contenedores | Docker Compose (base de datos) |
| Gestión del proyecto | Scrum, Jira |
| Control de versiones | Git y GitHub (flujo con ramas `main`, `develop` y `feature/*`) |

---

## Arquitectura

Monolito modular con separación por capas:

```text
Frontend (React + Vite)  ──HTTP/JSON + JWT──▶  API REST (Spring Boot)
                                                  │
                                    controller → service → repository
                                                  │
                                               MySQL 8
                                                  │
                         service/AsistenteService ──▶ Google Gemini (opcional)
```

### Estructura del repositorio

```text
DentalSys/
├── backend/                 API REST en Spring Boot
│   └── src/main/java/cl/dentalsys/
│       ├── controller/      Endpoints REST y manejo de errores
│       ├── service/         Reglas de negocio
│       ├── repository/      Acceso a datos (JPA)
│       ├── model/           Entidades
│       ├── dto/             Objetos de entrada y salida de la API
│       ├── security/        JWT y filtro de autenticación
│       └── SecurityConfig.java   Permisos por rol y CORS
├── frontend/                Aplicación web en React
│   └── src/
│       ├── pages/           Vistas (gestión y portal del paciente)
│       ├── components/      Layout, asistente IA y componentes comunes
│       └── services/        Cliente de la API y utilidades
├── database/
│   └── schema.sql           Script oficial de la base (dentalsys_v2)
├── docs/                    Evidencias por fase (grupales e individuales)
├── scripts/
│   └── load-env.ps1         Carga las variables del .env en PowerShell
├── docker-compose.yml       Contenedor de MySQL
└── .env.example             Plantilla de variables de entorno
```

---

## Seguridad

- Autenticación con **JWT** (expira en 1 hora). Inicio de sesión con usuario, correo o RUT.
- Contraseñas guardadas con **BCrypt**.
- **Control de acceso por rol** en el backend (`SecurityConfig.java`). Además, cada servicio verifica la propiedad de los datos: un paciente solo accede a su información y un odontólogo solo modifica las atenciones que él registró, y una atención cerrada ya no se puede editar.
- Datos clínicos (fichas y atenciones) restringidos al rol odontólogo.
- CORS limitado a los orígenes locales del frontend.
- Las claves (base de datos, JWT y Gemini) se leen desde variables de entorno y nunca se versionan.

---

## Base de datos

El script oficial es [`database/schema.sql`](database/schema.sql). Crea la base `dentalsys_v2` con 25 tablas, la vista `vw_saldo_presupuesto` y los 4 roles del sistema. Reemplaza al modelo inicial de la Fase 1, que se conserva en el historial de Git.

| Área | Tablas |
|---|---|
| Usuarios y roles | `usuario`, `rol`, `usuario_rol` |
| Sucursales | `sucursal`, `odontologo`, `odontologo_sucursal` |
| Pacientes | `paciente`, `ficha_clinica`, `preferencia_notificacion` |
| Agenda | `motivo_cita`, `horario_atencion`, `bloqueo_agenda`, `cita`, `historial_cita` |
| Clínica | `tratamiento`, `atencion`, `atencion_tratamiento`, `atencion_tratamiento_pieza`, `documento_clinico` |
| Presupuestos | `presupuesto`, `presupuesto_tratamiento`, `presupuesto_tratamiento_pieza` |
| Pagos | `pago`, `comprobante_pago` |
| Notificaciones | `notificacion` |

El saldo de cada presupuesto no se almacena: se calcula en la vista `vw_saldo_presupuesto`.

---

## Instalación y ejecución local

### Requisitos

- Java 21
- Node.js 20.19 o superior (recomendado 22 LTS)
- MySQL 8.0.16 o superior, o Docker Desktop

### 1. Variables de entorno

Copia `.env.example` como `.env` en la raíz del proyecto y completa los valores. El archivo `.env` está en `.gitignore` y no se sube al repositorio.

### 2. Base de datos

**Opción A: MySQL local**

```bash
mysql -u root -p < database/schema.sql
```

Luego crea el usuario de la aplicación y dale permisos sobre `dentalsys_v2`.

**Opción B: Docker**

```bash
docker compose up -d
```

El contenedor crea la base con `schema.sql` la primera vez que se levanta y queda en el puerto **3307**. En este caso, define `DB_PORT=3307` en el `.env`.

### 3. Datos iniciales

El script solo inserta los roles. Antes de usar el sistema hay que cargar:

1. **El primer administrador.** Se inserta directamente en `usuario` con `rol = 'ADMIN'` y la contraseña cifrada con BCrypt. El resto del personal se crea desde la vista *Usuarios*.
2. **Sucursales y motivos de cita** (`sucursal`, `motivo_cita`). El MVP no tiene una pantalla para administrarlos, así que se cargan por SQL.
3. **Tratamientos.** Se pueden crear desde la vista *Tratamientos*.

Los pacientes crean su propia cuenta desde la página de registro, o la recepción los registra desde *Pacientes*.

### 4. Backend (puerto 8080)

En PowerShell, desde la raíz del proyecto:

```powershell
. .\scripts\load-env.ps1
cd backend
.\mvnw spring-boot:run
```

Para comprobar que funciona: `GET http://localhost:8080/api/health`.

### 5. Frontend (puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El frontend se conecta al backend en `http://localhost:8080`.

---

## API REST

Todas las rutas comienzan con `/api`. Las rutas públicas no requieren sesión; el resto requiere el encabezado `Authorization: Bearer <token>`.

| Recurso | Ruta base | Acceso |
|---|---|---|
| Salud del servicio | `/api/health` | Público |
| Autenticación y registro | `/api/auth/login`, `/api/auth/registro` | Público |
| Catálogos públicos | `/api/sucursales`, `/api/odontologos`, `/api/motivos-cita` | Público |
| Disponibilidad y reserva pública | `/api/citas/disponibilidad`, `/api/citas/reserva-publica` | Público |
| Portal del paciente | `/api/portal/**`, `/api/citas/mis-citas`, `/api/citas/reservar`, `/api/presupuestos/mis-presupuestos`, `/api/pagos/mis-pagos` | Paciente |
| Pacientes | `/api/pacientes` | Personal (recepción y administración modifican) |
| Citas y agenda | `/api/citas` | Personal (recepción y administración crean y reprograman) |
| Horarios y bloqueos | `/api/horarios`, `/api/horarios/bloqueos` | Personal (recepción y administración modifican) |
| Ficha clínica | `/api/fichas/paciente/{id}` | Odontólogo |
| Atenciones | `/api/atenciones` | Odontólogo |
| Presupuestos | `/api/presupuestos` | Personal (solo el odontólogo crea y edita) |
| Pagos y comprobantes | `/api/pagos` | Recepción y administración |
| Tratamientos | `/api/tratamientos` | Personal (administración y odontólogo modifican) |
| Usuarios | `/api/usuarios` | Administración |
| Indicadores | `/api/dashboard/resumen` | Personal |
| Asistente IA | `/api/asistente/estado`, `/api/asistente/preguntar` | Personal |

---

## Documentación del proyecto

Las evidencias de cada fase (análisis, épicas, historias de usuario, backlog, diagramas UML, modelo relacional, plan de pruebas, informe final y presentación) están en la carpeta [`docs/`](docs/), separadas en evidencias grupales e individuales.

---

## Trabajo futuro

- Documentación interactiva de la API (Swagger/OpenAPI) y colección de Postman.
- Pruebas automatizadas de integración, rendimiento y seguridad.
- Contenedores para el backend y el frontend (hoy Docker solo levanta la base de datos).
- Envío de correos de confirmación y gestión de sucursales y motivos desde la interfaz.

---

Proyecto académico — **CAPSTONE 2026, Duoc UC**.
