package com.spacework.crm.service;

import com.spacework.crm.model.Rol;
import com.spacework.crm.model.TipoDocumento;
import com.spacework.crm.model.Usuario;
import com.spacework.crm.dto.request.UsuarioActualizacionDTO;
import com.spacework.crm.repository.RolRepository;
import com.spacework.crm.repository.TipoDocumentoRepository;
import com.spacework.crm.repository.UsuarioRepository;
import com.spacework.crm.repository.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.commons.lang3.StringUtils;
import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final TipoDocumentoRepository tipoDocumentoRepository;
    private final EmpresaRepository empresaRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UsuarioService(UsuarioRepository usuarioRepository, 
                          RolRepository rolRepository, 
                          TipoDocumentoRepository tipoDocumentoRepository, 
                          EmpresaRepository empresaRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.tipoDocumentoRepository = tipoDocumentoRepository;
        this.empresaRepository = empresaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Usuario registrarUsuario(Usuario usuario, String nombreRol, String abreviaturaDocumento) {
        // validamos usando apache commons lang3 para mayor robustez
        if (StringUtils.isBlank(usuario.getCorreoElectronico())) {
            throw new IllegalArgumentException("El correo no puede estar vacío.");
        }
        validarContrasenaFuerte(usuario.getContrasena());

        // Validación estricta de documentos
        if ("DNI".equalsIgnoreCase(abreviaturaDocumento) && (usuario.getNumeroDocumento() == null || !usuario.getNumeroDocumento().matches("^[0-9]{8}$"))) {
            throw new IllegalArgumentException("El DNI debe tener exactamente 8 dígitos numéricos.");
        }

        if (usuarioRepository.existsByCorreoElectronico(usuario.getCorreoElectronico())) {
            throw new IllegalArgumentException("El correo electrónico ya está registrado.");
        }
        if (usuarioRepository.existsByNumeroDocumento(usuario.getNumeroDocumento())) {
            throw new IllegalArgumentException("El número de documento ya está registrado.");
        }

        // obtenemos Rol por defecto (normalmente USUARIO si es registro web)
        Rol rol = rolRepository.findByNombreRol(nombreRol)
                .orElseThrow(() -> new IllegalArgumentException("El rol '" + nombreRol + "' no existe."));
        usuario.setRol(rol);

        // obtenemos Tipo Documento
        TipoDocumento tipoDoc = tipoDocumentoRepository.findByAbreviatura(abreviaturaDocumento)
                .orElseThrow(() -> new IllegalArgumentException("El tipo de documento '" + abreviaturaDocumento + "' no existe."));
        usuario.setTipoDocumento(tipoDoc);

        // encriptar contraseña con BCrypt (Security Aspect)
        usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));

        // Manejo de Empresa si viene en el JSON
        if (usuario.getEmpresa() != null && usuario.getEmpresa().getDocumentoFiscal() != null) {
            String ruc = usuario.getEmpresa().getDocumentoFiscal();
            if (!ruc.matches("^[0-9]{11}$")) {
                throw new IllegalArgumentException("El RUC debe tener exactamente 11 dígitos numéricos.");
            }
            if (StringUtils.isBlank(usuario.getEmpresa().getRazonSocial())) {
                throw new IllegalArgumentException("La Razón Social es obligatoria para empresas.");
            }
            if (StringUtils.isBlank(usuario.getEmpresa().getDireccion())) {
                throw new IllegalArgumentException("La Dirección Fiscal es obligatoria para empresas.");
            }

            Optional<com.spacework.crm.model.Empresa> empOpt = empresaRepository.findByDocumentoFiscalAndEstadoTrue(ruc);
            com.spacework.crm.model.Empresa empToSave;
            if (empOpt.isPresent()) {
                empToSave = empOpt.get();
            } else {
                empToSave = new com.spacework.crm.model.Empresa();
                empToSave.setDocumentoFiscal(usuario.getEmpresa().getDocumentoFiscal());
                empToSave.setRazonSocial(usuario.getEmpresa().getRazonSocial());
                empToSave.setDireccion(usuario.getEmpresa().getDireccion());
                empToSave = empresaRepository.save(empToSave);
            }
            usuario.setEmpresa(empToSave);
        }

        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Optional<Usuario> login(String correo, String contrasenia) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreoElectronico(correo);
        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (usuario.isBloqueado()) {
                throw new IllegalArgumentException("Cuenta bloqueada por seguridad. Contacte al administrador.");
            }
            if (passwordEncoder.matches(contrasenia, usuario.getContrasena()) && usuario.isEstado()) {
                usuario.setUltimoAcceso(java.time.LocalDateTime.now());
                usuarioRepository.save(usuario);
                return Optional.of(usuario);
            }
        }
        return Optional.empty();
    }

    public java.util.List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }

    @Transactional
    public Usuario actualizarPerfil(Integer id, UsuarioActualizacionDTO datosActualizacion) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (datosActualizacion.getNombre() != null) {
            usuario.setNombre(datosActualizacion.getNombre());
        }
        if (datosActualizacion.getApellidoPaterno() != null) {
            usuario.setApellidoPaterno(datosActualizacion.getApellidoPaterno());
        }
        if (datosActualizacion.getApellidoMaterno() != null) {
            usuario.setApellidoMaterno(datosActualizacion.getApellidoMaterno());
        }
        if (datosActualizacion.getTelefono() != null) {
            usuario.setTelefono(datosActualizacion.getTelefono());
        }
        
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void cambiarContrasena(Integer id, String contrasenaActual, String nuevaContrasena) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
                
        if (!passwordEncoder.matches(contrasenaActual, usuario.getContrasena())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta");
        }
        
        validarContrasenaFuerte(nuevaContrasena);
        
        usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario actualizarPorAdmin(Integer id, Usuario datosAdmin, String nombreRol) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        usuario.setNombre(datosAdmin.getNombre());
        usuario.setApellidoPaterno(datosAdmin.getApellidoPaterno());
        usuario.setApellidoMaterno(datosAdmin.getApellidoMaterno());
        usuario.setTelefono(datosAdmin.getTelefono());
        usuario.setEstado(datosAdmin.isEstado());
        usuario.setEmpresa(datosAdmin.getEmpresa());
        
        // Si el administrador lo habilita, también le quitamos el bloqueo por intentos fallidos
        if (datosAdmin.isEstado()) {
            usuario.setBloqueado(false);
            usuario.setIntentosFallidos(0);
        }
        
        if (nombreRol != null && !nombreRol.isEmpty()) {
            Rol rol = rolRepository.findByNombreRol(nombreRol)
                    .orElseThrow(() -> new IllegalArgumentException("El rol '" + nombreRol + "' no existe."));
            usuario.setRol(rol);
        }

        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void cambiarEstado(Integer id, boolean estado) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuario.setEstado(estado);
        
        // Si el administrador lo habilita, también le quitamos el bloqueo por intentos fallidos
        if (estado) {
            usuario.setBloqueado(false);
            usuario.setIntentosFallidos(0);
        }
        
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void incrementarIntentosFallidos(String correo) {
        usuarioRepository.findByCorreoElectronico(correo).ifPresent(usuario -> {
            if (!usuario.isBloqueado()) {
                int intentos = usuario.getIntentosFallidos() + 1;
                usuario.setIntentosFallidos(intentos);
                if (intentos >= 3) {
                    usuario.setBloqueado(true);
                }
                usuarioRepository.save(usuario);
            }
        });
    }

    @Transactional
    public void resetearIntentos(String correo) {
        usuarioRepository.findByCorreoElectronico(correo).ifPresent(usuario -> {
            if (usuario.getIntentosFallidos() > 0) {
                usuario.setIntentosFallidos(0);
                usuarioRepository.save(usuario);
            }
        });
    }

    @Transactional
    public void desbloquearCuenta(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuario.setBloqueado(false);
        usuario.setIntentosFallidos(0);
        usuarioRepository.save(usuario);
    }

    private void validarContrasenaFuerte(String contrasena) {
        if (StringUtils.isBlank(contrasena)) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía.");
        }
        if (contrasena.length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres.");
        }
        if (!contrasena.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("La contraseña debe contener al menos una letra mayúscula.");
        }
        if (!contrasena.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("La contraseña debe contener al menos un número.");
        }
        if (!contrasena.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new IllegalArgumentException("La contraseña debe contener al menos un símbolo especial.");
        }
    }
}
