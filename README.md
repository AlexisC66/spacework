# Proyecto: Sistema de Reserva de Espacios (SpaceWork)

Este es el repositorio oficial de mi proyecto integrador. SpaceWork es un sistema completo para gestionar y reservar espacios de trabajo (coworking, oficinas privadas y salas de reuniones).

## Tecnologías que usé

- **Backend:** Java con Spring Boot (MVC, Spring Data JPA, Spring Security).
- **Frontend:** React con TypeScript, vite y Bootstrap.
- **Base de Datos:** SQL Server (con encriptación TDE para seguridad).
- **Librerías extras:** Google Guava, Apache Commons, Apache POI y Logback para reportes y logs.

## Estructura del proyecto

El proyecto está dividido en tres partes principales para mantener el orden (principios SOLID y Clean Code):
- `/spacework-backend`: Todo el código del servidor (APIs, seguridad, acceso a BD).
- `/spacework-react`: La interfaz de usuario donde los clientes y administradores interactúan.
- `scrip_espacios_completo.sql`: El script maestro de la base de datos que crea todo desde cero y lo llena de datos de prueba.

## Cómo levantar el proyecto localmente

Si vas a probar el proyecto en tu máquina, sigue estos pasos:

1. **Base de Datos:** 
   Abre SQL Server y corre el archivo `scrip_espacios_completo.sql`. Esto te va a generar la BD `Sistema_Reserva_Espacios` completa con datos.
   
2. **Backend:**
   Entra a la carpeta `spacework-backend`, asegúrate de tener bien tus credenciales de SQL Server en `src/main/resources/application.properties` y corre:
   `mvnw spring-boot:run`
   
3. **Frontend:**
   Abre otra terminal, entra a `spacework-react`, instala los paquetes y levanta el servidor:
   `npm install`
   `npm run dev`

## Notas adicionales

- El sistema tiene implementado control de intentos fallidos (te bloquea a los 3 intentos para evitar ataques).
- Las contraseñas en la base de datos están hasheadas con BCrypt.
- Si encuentras algún bug en la reserva de fechas, revisa que no estés intentando reservar en el pasado (hay validaciones estrictas para eso).

¡Cualquier duda me avisan!
