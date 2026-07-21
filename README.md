# Proyecto: Sistema de Reserva de Espacios (SpaceWork)

Este es el repositorio oficial de mi proyecto integrador. SpaceWork es un sistema completo (ERP) para gestionar y reservar espacios de trabajo (coworking, oficinas privadas y salas de reuniones). 

Recientemente se ha escalado para incluir módulos de **CRM**, **Facturación (Billing)** y **Monitoreo/Respaldos automáticos**.

## Tecnologías Principales

- **Backend:** Java con Spring Boot (MVC, Spring Data JPA, Spring Security, JWT).
- **Frontend:** React con TypeScript, Vite, Bootstrap y componentes modulares.
- **Base de Datos:** SQL Server (con encriptación TDE para seguridad).
- **Librerías extras:** Google Guava, Apache Commons, Apache POI (para exportar reportes) y Logback para logs.

## Módulos del Sistema

El sistema está organizado bajo principios SOLID y Clean Code, dividido en los siguientes dominios:

1. **Reservas (Reservations):** Gestión de espacios, ubicaciones, disponibilidad mediante slots de tiempo, servicios adicionales y reseñas.
2. **CRM:** Administración de usuarios, roles y gestión de empresas.
3. **Facturación (Billing):** Control de facturas, pagos, impuestos, formas de pago y detalles de facturación.
4. **Seguridad (Security):** Autenticación JWT, control de intentos fallidos (bloqueo automático) y servicio de recuperación de contraseñas.
5. **Monitoreo (Core/Monitoring):** Métricas de negocio y tareas programadas (CronJobs) para respaldos de seguridad automáticos.

## Estructura del repositorio

- `/spacework-backend`: Todo el código del servidor (APIs, seguridad, jobs programados).
- `/spacework-react`: La interfaz de usuario donde los clientes interactúan y los administradores gestionan el ERP.
- `scrip_espacios_completo.sql`: El script maestro de la base de datos que crea todo desde cero y lo llena de datos de prueba.

## Cómo levantar el proyecto localmente

Si vas a probar el proyecto en tu máquina, sigue estos pasos:

1. **Base de Datos:** 
   Abre SQL Server y ejecuta el archivo `scrip_espacios_completo.sql`. Esto generará la BD `Sistema_Reserva_Espacios` completa con datos.
   
2. **Backend:**
   Entra a la carpeta `spacework-backend`, asegúrate de tener bien tus credenciales de SQL Server en `src/main/resources/application.properties` y corre:
   ```bash
   mvnw spring-boot:run
   ```
   *(También puedes utilizar el script de PowerShell `run.ps1` incluido).*
   
3. **Frontend:**
   Abre otra terminal, entra a `spacework-react`, instala los paquetes y levanta el servidor:
   ```bash
   npm install
   npm run dev
   ```

## Notas adicionales de Seguridad y Funcionalidad

- **Control de accesos:** El sistema bloquea cuentas tras 3 intentos fallidos de login.
- **Criptografía:** Las contraseñas en la base de datos están hasheadas usando BCrypt.
- **Validaciones:** Existen validaciones estrictas, por ejemplo, no se permiten reservas en fechas pasadas ni solapamiento de horarios.
- **Automatización:** Se incluyen cron jobs para reportes periódicos, limpieza de tokens expirados y generación de respaldos (backups) de la base de datos de manera automática.

¡Cualquier duda o contribución me avisan!
