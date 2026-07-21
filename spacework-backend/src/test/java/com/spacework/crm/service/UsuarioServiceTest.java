package com.spacework.crm.service;

import com.spacework.crm.model.Rol;
import com.spacework.crm.model.TipoDocumento;
import com.spacework.crm.model.Usuario;
import com.spacework.crm.dto.request.UsuarioActualizacionDTO;
import com.spacework.crm.repository.RolRepository;
import com.spacework.crm.repository.TipoDocumentoRepository;
import com.spacework.crm.repository.UsuarioRepository;
import com.spacework.crm.repository.EmpresaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private RolRepository rolRepository;
    @Mock
    private TipoDocumentoRepository tipoDocumentoRepository;
    @Mock
    private EmpresaRepository empresaRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuario;
    private Rol rolCliente;
    private TipoDocumento tipoDNI;

    @BeforeEach
    void setUp() {
        rolCliente = new Rol();
        rolCliente.setId(1);
        rolCliente.setNombreRol("CLIENTE");

        tipoDNI = new TipoDocumento();
        tipoDNI.setId(1);
        tipoDNI.setAbreviatura("DNI");


        usuario = new Usuario();
        usuario.setId(1);
        usuario.setNombre("Juan");
        usuario.setApellidoPaterno("Perez");
        usuario.setCorreoElectronico("juan@example.com");
        usuario.setContrasena("Pass1234!");
        usuario.setNumeroDocumento("12345678");
        usuario.setEstado(true);
        usuario.setBloqueado(false);
        usuario.setIntentosFallidos(0);
    }

    @Test
    void registrarUsuarioDebeCrearUsuarioExitosamente() {
        when(usuarioRepository.existsByCorreoElectronico("juan@example.com")).thenReturn(false);
        when(usuarioRepository.existsByNumeroDocumento("12345678")).thenReturn(false);
        when(rolRepository.findByNombreRol("CLIENTE")).thenReturn(Optional.of(rolCliente));
        when(tipoDocumentoRepository.findByAbreviatura("DNI")).thenReturn(Optional.of(tipoDNI));
        when(passwordEncoder.encode("Pass1234!")).thenReturn("encodedPass");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        Usuario resultado = usuarioService.registrarUsuario(usuario, "CLIENTE", "DNI");

        assertNotNull(resultado);
        assertEquals("juan@example.com", resultado.getCorreoElectronico());
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    void registrarUsuarioDebeRechazarCorreoDuplicado() {
        when(usuarioRepository.existsByCorreoElectronico("juan@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> usuarioService.registrarUsuario(usuario, "CLIENTE", "DNI"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void registrarUsuarioDebeRechazarDocumentoDuplicado() {
        when(usuarioRepository.existsByCorreoElectronico("juan@example.com")).thenReturn(false);
        when(usuarioRepository.existsByNumeroDocumento("12345678")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> usuarioService.registrarUsuario(usuario, "CLIENTE", "DNI"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void registrarUsuarioDebeRechazarDNIInvalido() {
        usuario.setNumeroDocumento("1234");

        assertThrows(IllegalArgumentException.class,
                () -> usuarioService.registrarUsuario(usuario, "CLIENTE", "DNI"));
    }

    @Test
    void registrarUsuarioDebeRechazarCorreoVacio() {
        usuario.setCorreoElectronico("");

        assertThrows(IllegalArgumentException.class,
                () -> usuarioService.registrarUsuario(usuario, "CLIENTE", "DNI"));
    }

    @Test
    void loginDebeRetornarUsuarioCuandoCredencialesValidas() {
        when(usuarioRepository.findByCorreoElectronico("juan@example.com"))
                .thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("Pass1234!", usuario.getContrasena())).thenReturn(true);
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        Optional<Usuario> resultado = usuarioService.login("juan@example.com", "Pass1234!");

        assertTrue(resultado.isPresent());
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void loginDebeRetornarVacioCuandoCredencialesInvalidas() {
        when(usuarioRepository.findByCorreoElectronico("juan@example.com"))
                .thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("WrongPass1!", usuario.getContrasena())).thenReturn(false);

        Optional<Usuario> resultado = usuarioService.login("juan@example.com", "WrongPass1!");

        assertFalse(resultado.isPresent());
    }

    @Test
    void loginDebeBloquearCuandoCuentaBloqueada() {
        usuario.setBloqueado(true);
        when(usuarioRepository.findByCorreoElectronico("juan@example.com"))
                .thenReturn(Optional.of(usuario));

        assertThrows(IllegalArgumentException.class,
                () -> usuarioService.login("juan@example.com", "Pass1234!"));
    }

    @Test
    void actualizarPerfilDebeModificarDatos() {
        UsuarioActualizacionDTO dto = new UsuarioActualizacionDTO();
        dto.setNombre("Juan Actualizado");
        dto.setTelefono("999888777");

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        Usuario resultado = usuarioService.actualizarPerfil(1, dto);

        assertEquals("Juan Actualizado", resultado.getNombre());
        assertEquals("999888777", resultado.getTelefono());
    }

    @Test
    void actualizarPerfilDebeLanzarExcepcionCuandoNoExiste() {
        when(usuarioRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> usuarioService.actualizarPerfil(99, new UsuarioActualizacionDTO()));
    }

    @Test
    void cambiarContrasenaDebeActualizarCorrectamente() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("OldPass1!", usuario.getContrasena())).thenReturn(true);
        when(passwordEncoder.encode("NewPass1!")).thenReturn("encodedNewPass");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        usuarioService.cambiarContrasena(1, "OldPass1!", "NewPass1!");

        verify(usuarioRepository).save(usuario);
    }

    @Test
    void cambiarContrasenaDebeRechazarCuandoActualEsIncorrecta() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("WrongOld1!", usuario.getContrasena())).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> usuarioService.cambiarContrasena(1, "WrongOld1!", "NewPass1!"));
    }

    @Test
    void incrementarIntentosFallidosDebeBloquearAlTercerIntento() {
        usuario.setIntentosFallidos(2);
        when(usuarioRepository.findByCorreoElectronico("juan@example.com"))
                .thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        usuarioService.incrementarIntentosFallidos("juan@example.com");

        assertTrue(usuario.isBloqueado());
        assertEquals(3, usuario.getIntentosFallidos());
    }

    @Test
    void desbloquearCuentaDebeResetearIntentos() {
        usuario.setBloqueado(true);
        usuario.setIntentosFallidos(3);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        usuarioService.desbloquearCuenta(1);

        assertFalse(usuario.isBloqueado());
        assertEquals(0, usuario.getIntentosFallidos());
    }

    @Test
    void obtenerTodosDebeRetornarLista() {
        when(usuarioRepository.findAll()).thenReturn(List.of(usuario));

        List<Usuario> resultado = usuarioService.obtenerTodos();

        assertEquals(1, resultado.size());
    }

    @Test
    void cambiarEstadoDebeHabilitarYDesbloquear() {
        usuario.setEstado(false);
        usuario.setBloqueado(true);
        usuario.setIntentosFallidos(3);

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        usuarioService.cambiarEstado(1, true);

        assertTrue(usuario.isEstado());
        assertFalse(usuario.isBloqueado());
        assertEquals(0, usuario.getIntentosFallidos());
    }
}
