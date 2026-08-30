# DentalSys

Sistema web de gestión odontológica desarrollado como Proyecto APT / CAPSTONE 2026 de Duoc UC.

---

## Descripción

**DentalSys** es un sistema web de gestión odontológica desarrollado para la clínica **Más Dent**, ubicada en Puente Alto y conformada por dos sucursales.

La solución busca centralizar y digitalizar procesos administrativos y clínicos que actualmente pueden gestionarse mediante registros físicos, cuadernos y herramientas manuales.

---

## ¿A quién va dirigido?

DentalSys está orientado principalmente a los siguientes usuarios:

- **Administrador**
- **Recepcionista**
- **Odontólogo**
- **Paciente**

El sistema busca facilitar la gestión interna de la clínica y entregar mayor autonomía al paciente mediante un Portal del Paciente.

---

## ¿Qué problema aborda?

Actualmente, parte de los procesos clínicos y administrativos pueden gestionarse mediante registros físicos, cuadernos y herramientas manuales.

Esta situación dificulta:

- El acceso oportuno a la información.
- La organización de los datos.
- El seguimiento de pacientes.
- La gestión de horas de atención.
- El seguimiento de tratamientos.
- La gestión de presupuestos.
- La trazabilidad de la información.
- La autonomía del paciente.

**DentalSys** busca centralizar y digitalizar estos procesos mediante una plataforma web.

---

## Propuesta de solución

DentalSys propone una plataforma web que permita centralizar la información y apoyar los principales procesos administrativos y clínicos de la clínica.

La solución contempla:

- Gestión de usuarios, roles y permisos.
- Gestión de pacientes.
- Gestión de agenda y horas.
- Gestión de ficha clínica.
- Gestión de atenciones.
- Gestión de presupuestos.
- Portal del Paciente.
- Asistente virtual basado en Inteligencia Artificial.

---

## Módulos del MVP

El MVP de DentalSys contempla los siguientes módulos:

### Gestión de usuarios y seguridad

- Inicio de sesión.
- Gestión de usuarios.
- Gestión de roles.
- Gestión de permisos.
- Control de acceso según rol.

### Gestión de pacientes

- Registro de pacientes.
- Consulta de pacientes.
- Actualización de información.
- Consulta de pacientes autorizados.

### Agenda y gestión de horas

- Consulta de disponibilidad.
- Reserva de horas.
- Cancelación de horas.
- Reprogramación de horas.

### Ficha clínica y atención

- Consulta de ficha clínica.
- Registro y actualización de información clínica.
- Consulta del historial de atenciones.
- Registro de atenciones.
- Registro de atención con o sin cita previa.

### Presupuestos

- Creación de presupuestos.
- Consulta de presupuestos.
- Actualización de presupuestos.
- Asociación de tratamientos al presupuesto.

### Portal del Paciente

El paciente podrá:

- Reservar horas.
- Cancelar horas.
- Consultar próximas atenciones.
- Consultar atenciones anteriores.
- Visualizar sus presupuestos.

### Asistente virtual IA

DentalSys incorpora un asistente virtual basado en Inteligencia Artificial orientado al **apoyo administrativo**.

> El asistente virtual no realiza diagnósticos, prescripciones ni decisiones clínicas.

---

## Funcionalidades fuera del MVP

Las siguientes funcionalidades quedan fuera del alcance actual y podrán considerarse como trabajo futuro:

- Gestión de sucursales.
- Pagos avanzados.
- Reportes avanzados.
- Funcionalidades de laboratorio.

> La clínica Más Dent cuenta con dos sucursales como parte del contexto del caso. Sin embargo, la gestión de sucursales no forma parte del modelo de datos ni del MVP actual de DentalSys.

---

# Tecnologías utilizadas

| Categoría | Tecnología |
|---|---|
| Frontend | React + Vite, Material UI |
| Backend | Java 21, Spring Boot, Spring Security, JWT, Maven |
| Base de datos | MySQL |
| Contenedores | Docker, Docker Compose |
| Control de versiones | Git, GitHub |
| Gestión del proyecto | Jira |
| Metodología | Scrum |
| Pruebas de API | Postman |
| Rendimiento | Apache JMeter |
| Inteligencia Artificial | Google AI Studio / Gemini |

---

## Arquitectura de la solución

DentalSys utiliza una arquitectura **monolítica modular**, seleccionada de acuerdo con el alcance y las necesidades del MVP.

La aplicación contempla una separación de responsabilidades mediante capas:

```text
Frontend
React + Vite
   │
   ▼
API REST
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
Repository
   │
   ▼
MySQL
```



## Innovación

### ¿Qué problema aborda?

La desorganización y falta de centralización de información clínica y administrativa asociada a procesos que actualmente se gestionan mediante registros físicos y herramientas manuales.

### ¿Qué hace diferente a la solución?

DentalSys incorpora un asistente virtual basado en Inteligencia Artificial para funciones de apoyo administrativo, considerando mecanismos de protección de información sensible.

### ¿Qué valor agrega?

Busca mejorar la organización de la información, facilitar la gestión de horas y presupuestos y entregar mayor autonomía al paciente mediante un Portal del Paciente.

## Estado del proyecto

**En desarrollo**

Proyecto académico desarrollado en equipo — **CAPSTONE 2026, Duoc UC**.

## Equipo de trabajo

- **Johanna Martínez Sanhueza** — Desarrolladora Full Stack
- **Cristian Muñoz** — Desarrollador Full Stack
