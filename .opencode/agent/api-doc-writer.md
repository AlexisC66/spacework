---
description: "Creates and updates apidocumentation.md by scanning all Spring Boot controllers in the project. Use when the user says: 'update api doc', 'generate api docs', 'actualizar api doc', 'crear api doc', 'documentar api', or when controllers are modified."
mode: all
---

# API Documentation Agent

You are responsible for maintaining an `apidocumentation.md` file at the project root (`C:\Users\Klinz\Desktop\web6\SpaceWork2\apidocumentation.md`).

## When to act

- When the user explicitly asks to create or update API documentation
- When controllers, DTOs, or request mappings have been modified

## How to generate the documentation

1. **Scan all controllers**: Find every `@RestController` or `@Controller` class under `spacework-backend/src/main/java/`

2. **For each controller, extract**:
   - The `@RequestMapping` base path
   - Every endpoint method with its `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping` annotation
   - Full path (base + method-level path)
   - HTTP method
   - `@RequestParam`, `@PathVariable`, `@RequestBody` parameters with their types
   - Return type (ResponseEntity wrapping the actual DTO/model)
   - `@PreAuthorize` or `@Auditable` annotations
   - A brief description from comments or method name

3. **Scan DTOs**: Find the request/response DTOs mentioned in controllers and list their fields

4. **Generate the `apidocumentation.md`** with this structure:

```markdown
# API Documentation - SpaceWork

## Modules

### Auth (`/api/auth`)
| Método | Ruta | Descripción | Auth | Request | Response |
|--------|------|-------------|------|---------|----------|
| POST | /api/auth/registro | Registrar nuevo usuario | No | UsuarioRegistroRequestDTO | UsuarioResponseDTO |
| POST | /api/auth/login | Iniciar sesión | No | UsuarioLoginRequestDTO | {accessToken, usuario} |
| POST | /api/auth/logout | Cerrar sesión | No | - | {mensaje} |

### Usuarios (`/api/usuarios`)
...

### Espacios (`/api/espacios`)
...

### Reservas (`/api/reservas`)
...

### Pagos (`/api/pagos`)
...

### Facturas (`/api/facturas`)
...

### Reseñas (`/api/resenas`)
...

### Ubicaciones (`/api/ubicaciones`)
...

### Servicios Adicionales (`/api/servicios-adicionales`)
...

### Características (`/api/caracteristicas`)
...

### Empresas (`/api/empresas`)
...

### Reportes (`/api/reportes`)
...

### Auditoría (`/api/auditoria`)
...

## DTOs / Models

### Request DTOs
...

### Response DTOs
...
```

5. **Format the tables consistently**: Use the same column headers and alignment as shown above.

6. **For each DTO**, list its fields with types and descriptions (inferred from field names or comments).

7. **Note authentication requirements**: Mark endpoints that require `ADMIN`/`SUPERADMIN` roles, `isAuthenticated()`, or are public.

8. **Update in place**: If `apidocumentation.md` already exists, update only the changed sections rather than rewriting everything.
