# DentalSys

Sistema web de gestión odontológica desarrollado como Proyecto APT / CAPSTONE 2026 (Duoc UC).

## Descripción

**DentalSys AI** es un sistema web de gestión odontológica desarrollado para la clínica **Más Dent**, ubicada en Puente Alto y conformada por dos sucursales.

### ¿A quién va dirigido?

Está orientado principalmente al personal administrativo, profesionales de la clínica y pacientes que participan en los procesos de gestión y atención odontológica.

### ¿Qué problema aborda?

Actualmente parte de los procesos clínicos y administrativos se gestionan mediante registros físicos, cuadernos y herramientas manuales, lo que dificulta el acceso oportuno a la información, puede generar duplicidad de datos y limita el seguimiento organizado de pacientes, tratamientos, presupuestos y horas de atención.

DentalSys AI busca centralizar y digitalizar estos procesos mediante una plataforma web.

## Módulos del MVP

- Gestión de pacientes.
- Agenda: disponibilidad y reserva de horas.
- Ficha clínica.
- Presupuestos.
- Portal del Paciente: tomar y cancelar horas, consultar próximas atenciones, revisar atenciones pasadas y visualizar presupuestos.
- Asistente virtual basado en Inteligencia Artificial: apoyo administrativo, sin diagnósticos ni decisiones clínicas.

> Las funcionalidades de laboratorio, pagos avanzados y reportes avanzados quedan como trabajo futuro y no forman parte del MVP actual.

## Tecnologías utilizadas

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
| Inteligencia Artificial | Google AI Studio / Gemini |

## Instrucciones para ejecutar el proyecto localmente

> ⚠️ **Sección en construcción.** Se completará durante la etapa de configuración técnica del proyecto, cuando el backend, frontend y Docker Compose estén inicializados.

Se documentará aquí:

- Requisitos previos (JDK 21, Node.js y Docker).
- Clonado del repositorio.
- Variables de entorno necesarias.
- Configuración de la base de datos.
- Comando para levantar el proyecto con Docker Compose.
- URLs locales del frontend y backend.

## Integrante del equipo

**Johanna Martínez Sanhueza**  
Desarrolladora Full Stack — Autora del proyecto (trabajo individual).

## Metodología de trabajo

El proyecto se desarrolla bajo el marco de trabajo **Scrum**, organizado en Sprints durante las 18 semanas académicas.

| Sprint | Semanas | Foco |
|---|---|---|
| Sprint 0 | S1–S2 | Definición, Product Vision y planificación |
| Sprint 1 | S3–S4 | Requerimientos, arquitectura, UML y modelo de datos |
| Sprint 2 | S5–S7 | Configuración base + módulo de pacientes |
| Sprint 3 | S8–S10 | Módulo de agenda + ficha clínica |
| Sprint 4 | S11–S13 | Módulo de presupuestos + Portal del Paciente |
| Sprint 5 | S14–S15 | Asistente IA + integración + seguridad + pruebas |
| Fase 3 | S16–S18 | Correcciones, documentación, presentación y defensa |

El avance de cada Sprint será monitoreado mediante **Burndown Chart**, utilizando Jira para la gestión y seguimiento de las tareas.

## Arquitectura de la solución

> ⚠️ **Sección en construcción.** Se completará durante la etapa de diseño (S3–S4), incorporando el diagrama de arquitectura y el detalle de los componentes de la solución.

### Decisiones arquitectónicas definidas

- Arquitectura **monolítica modular**, simplificada y adecuada al alcance del MVP.
- No se utilizará una arquitectura de microservicios.
- Separación de responsabilidades mediante capas `Controller`, `Service` y `Repository`.
- Organización del sistema por módulos funcionales.
- Uso de Spring Security y JWT para autenticación y autorización.
- El asistente de IA no tendrá acceso directo a la base de datos.
- Se contempla implementar mecanismos de protección y anonimización de información sensible antes de enviar información a servicios externos de IA.

## Innovación

### ¿Qué problema aborda?

La desorganización y falta de centralización de información clínica y administrativa asociada a procesos que actualmente se gestionan mediante registros físicos y herramientas manuales.

### ¿Qué hace diferente a la solución?

DentalSys AI incorpora un asistente virtual basado en Inteligencia Artificial para funciones de apoyo administrativo, considerando mecanismos de protección de información sensible.

### ¿Qué valor agrega?

Busca mejorar la organización de la información, facilitar la gestión de horas y presupuestos y entregar mayor autonomía al paciente mediante un Portal del Paciente.

## Estado del proyecto

🚧 **En desarrollo**

Proyecto académico individual — CAPSTONE 2026, Duoc UC.
