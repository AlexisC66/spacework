package com.spacework;

import com.spacework.crm.model.Usuario;
import com.spacework.crm.model.Rol;
import com.spacework.crm.model.TipoDocumento;
import com.spacework.crm.repository.UsuarioRepository;
import com.spacework.crm.repository.RolRepository;
import com.spacework.crm.repository.TipoDocumentoRepository;
import com.spacework.reservations.model.EstadoReserva;
import com.spacework.reservations.repository.EstadoReservaRepository;
import com.spacework.reservations.model.Espacio;
import com.spacework.reservations.repository.EspacioRepository;
import com.spacework.reservations.model.FotoEspacio;
import com.spacework.reservations.repository.FotoEspacioRepository;
import com.spacework.billing.model.FormaPago;
import com.spacework.billing.repository.FormaPagoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class ResetPasswordRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ResetPasswordRunner.class);
    private boolean yaEjecutado = false;

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final TipoDocumentoRepository tipoDocumentoRepository;
    private final EstadoReservaRepository estadoReservaRepository;
    private final FormaPagoRepository formaPagoRepository;
    private final EspacioRepository espacioRepository;
    private final FotoEspacioRepository fotoEspacioRepository;
    private final PasswordEncoder passwordEncoder;

    public ResetPasswordRunner(UsuarioRepository usuarioRepository, 
                               RolRepository rolRepository, 
                               TipoDocumentoRepository tipoDocumentoRepository, 
                               EstadoReservaRepository estadoReservaRepository,
                               FormaPagoRepository formaPagoRepository,
                               EspacioRepository espacioRepository,
                               FotoEspacioRepository fotoEspacioRepository,
                               PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.tipoDocumentoRepository = tipoDocumentoRepository;
        this.estadoReservaRepository = estadoReservaRepository;
        this.formaPagoRepository = formaPagoRepository;
        this.espacioRepository = espacioRepository;
        this.fotoEspacioRepository = fotoEspacioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (yaEjecutado) return;
        yaEjecutado = true;
        
        logger.info("--- VERIFICANDO Y CREANDO USUARIOS DE PRUEBA ---");
        
        Rol rolAdmin = asegurarRol("ADMIN", "Administrador normal");
        Rol rolSuperAdmin = asegurarRol("SUPERADMIN", "Super Administrador");
        Rol rolCliente = asegurarRol("CLIENTE", "Cliente regular");

        // En una BD nueva la tabla TiposDocumento está vacía: la sembramos aquí
        TipoDocumento dni = asegurarTipoDocumento("Documento Nacional de Identidad", "DNI");
        asegurarTipoDocumento("Registro Único de Contribuyentes", "RUC");
        asegurarTipoDocumento("Carnet de Extranjería", "CE");

        asegurarUsuario("admin@spacework.com", "Admin", "Space", "123456", rolAdmin, "12345678", dni);
        asegurarUsuario("superadmin@spacework.com", "Super", "Admin", "123456", rolSuperAdmin, "99999999", dni);
        asegurarUsuario("cliente@spacework.com", "Juan", "Cliente", "123456", rolCliente, "44444444", dni);

        logger.info("--- TODOS LOS USUARIOS LISTOS (Contraseña: 123456) ---");

        logger.info("--- CONFIGURANDO ESTADOS DE RESERVA Y PAGOS ---");
        asegurarEstadoReserva("PENDIENTE", "Reserva creada pero pendiente de confirmación/pago");
        asegurarEstadoReserva("CONFIRMADA", "Reserva pagada y confirmada");
        asegurarEstadoReserva("FINALIZADA", "La reserva ha concluido exitosamente");
        asegurarEstadoReserva("CANCELADA", "La reserva ha sido cancelada");

        asegurarFormaPago("TARJETA", "Pago con Tarjeta de Crédito/Débito");
        asegurarFormaPago("EFECTIVO", "Pago en Efectivo");
        asegurarFormaPago("TRANSFERENCIA", "Transferencia Bancaria");
        logger.info("--- ESTADOS CONFIGURADOS ---");

        logger.info("--- CONFIGURANDO FOTOS DE ESPACIOS ---");
        asegurarFotosEspacios();
        logger.info("--- FOTOS CONFIGURADAS ---");
    }

    private void asegurarFotosEspacios() {
        for (Espacio esp : espacioRepository.findAll()) {
            if (fotoEspacioRepository.findByEspacioId(esp.getId()).isEmpty()) {
                // Agregar 3 fotos predeterminadas por espacio basadas en su tipo
                String fotoPrincipal = esp.getFotoUrl();
                if (fotoPrincipal == null) {
                    if (esp.getTipoEspacio().getId() == 1) fotoPrincipal = "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800&h=500";
                    else if (esp.getTipoEspacio().getId() == 2) fotoPrincipal = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800&h=500";
                    else fotoPrincipal = "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800&h=500";
                }
                
                String foto2 = "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=800&h=500";
                String foto3 = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800&h=500";

                fotoEspacioRepository.save(new FotoEspacio(esp, fotoPrincipal, true));
                fotoEspacioRepository.save(new FotoEspacio(esp, foto2, false));
                fotoEspacioRepository.save(new FotoEspacio(esp, foto3, false));
            }
        }
    }

    private void asegurarEstadoReserva(String nombre, String desc) {
        if (estadoReservaRepository.findByNombreEstado(nombre).isEmpty()) {
            EstadoReserva er = new EstadoReserva();
            er.setNombreEstado(nombre);
            er.setDescripcion(desc);
            er.setEstado(true);
            estadoReservaRepository.save(er);
        }
    }

    private void asegurarFormaPago(String nombre, String desc) {
        if (formaPagoRepository.findByNombreForma(nombre).isEmpty()) {
            FormaPago fp = new FormaPago();
            fp.setNombreForma(nombre);
            fp.setDescripcion(desc);
            fp.setEstado(true);
            formaPagoRepository.save(fp);
        }
    }

    private TipoDocumento asegurarTipoDocumento(String nombre, String abreviatura) {
        return tipoDocumentoRepository.findByAbreviatura(abreviatura).orElseGet(() -> {
            TipoDocumento td = new TipoDocumento();
            td.setNombreTipo(nombre);
            td.setAbreviatura(abreviatura);
            td.setEstado(true);
            return tipoDocumentoRepository.save(td);
        });
    }

    private Rol asegurarRol(String nombre, String desc) {
        Optional<Rol> rolOpt = rolRepository.findByNombreRol(nombre);
        if (rolOpt.isPresent()) {
            return rolOpt.get();
        }
        Rol r = new Rol();
        r.setNombreRol(nombre);
        r.setDescripcion(desc);
        r.setEstado(true);
        return rolRepository.save(r);
    }

    private void asegurarUsuario(String correo, String nombre, String apellido, String pass, Rol rol, String doc, TipoDocumento tipoDoc) {
        Optional<Usuario> uOpt = usuarioRepository.findByCorreoElectronico(correo);
        Usuario u;
        if (uOpt.isPresent()) {
            u = uOpt.get();
        } else {
            u = new Usuario();
            u.setCorreoElectronico(correo);
        }
        
        u.setTipoDocumento(tipoDoc);
        u.setNombre(nombre);
        u.setApellidoPaterno(apellido);
        u.setApellidoMaterno("Prueba");
        u.setNumeroDocumento(doc);
        u.setTelefono("999999999");
        u.setContrasena(passwordEncoder.encode(pass));
        u.setRol(rol);
        u.setFechaRegistro(LocalDateTime.now());
        u.setEstado(true);
        u.setBloqueado(false);
        u.setIntentosFallidos(0);
        
        usuarioRepository.save(u);
        logger.info("OK: {}", correo);
    }
}
