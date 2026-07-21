package com.spacework.crm.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO para actualización de perfil de usuario.
 * Solo contiene los campos editables por el propio usuario,
 * evitando mass assignment de rol, estado, empresa, etc.
 */
public class UsuarioActualizacionDTO {

    @Size(max = 50, message = "El nombre no debe exceder 50 caracteres")
    private String nombre;

    @Size(max = 50, message = "El apellido paterno no debe exceder 50 caracteres")
    private String apellidoPaterno;

    @Size(max = 50, message = "El apellido materno no debe exceder 50 caracteres")
    private String apellidoMaterno;

    @Pattern(regexp = "^[\\d\\s\\+\\-\\(\\)]+$", message = "Formato de teléfono inválido")
    @Size(min = 6, max = 20, message = "El teléfono debe tener entre 6 y 20 caracteres")
    private String telefono;

    public UsuarioActualizacionDTO() {}

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellidoPaterno() { return apellidoPaterno; }
    public void setApellidoPaterno(String apellidoPaterno) { this.apellidoPaterno = apellidoPaterno; }

    public String getApellidoMaterno() { return apellidoMaterno; }
    public void setApellidoMaterno(String apellidoMaterno) { this.apellidoMaterno = apellidoMaterno; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
}
