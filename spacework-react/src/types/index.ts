export interface Rol {
    id: number;
    nombreRol: string;
}

export interface Usuario {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correoElectronico: string;
    numeroDocumento: string;
    telefono: string;
    estado: boolean;
    rol: Rol;
}

export interface TipoEspacio {
    id: number;
    nombre: string;
}

export interface Ubicacion {
    id: number;
    nombreSede: string;
    direccion: string;
    ciudad: string;
    pais: string;
    tasaIgv: number;
    exoneradoIgv: boolean;
    estado: boolean;
}

export interface Espacio {
    id: number;
    codigoEspacio: string;
    nombreEspacio: string;
    capacidad: number;
    capacidadEquipos: number;
    descripcion: string;
    estadoEspacio: string;
    horaApertura: string;
    horaCierre: string;
    estado: boolean;
    precio: number;
    descuento: number;
    precioPersonaExtra: number;
    fotoUrl?: string;
    tipoEspacio: TipoEspacio;
    ubicacion: Ubicacion;
    fotos?: any[];
    caracteristicas?: any[];
}

export interface ServicioAdicional {
    id: number;
    nombre: string;
    descripcion: string;
    precioBase: number;
    estado: boolean;
    imagenUrl?: string;
    caracteristicasDetalle?: string;
    advertenciasDevolucion?: string;
}

export interface Reserva {
    id: number;
    codigoReserva: string;
    fechaInicioReserva: string;
    fechaFinReserva: string;
    montoTotal: number;
    descuentoAplicado: number;
    estadoReserva: { id: number; nombreEstado: string };
    observaciones: string;
    tipoComprobante: string;
    documentoIdentidad: string;
    razonSocial: string;
    direccion: string;
    usuario: Usuario;
    espacio: Espacio;
    reservaServicios?: any[];
}

export interface Pago {
    id: number;
    montoPago: number;
    fechaPago: string;
    referenciaTransaccion: string;
    reserva: Reserva;
    formaPago: { id: number; nombreForma: string };
    estadoPago: { id: number; nombreEstado: string };
}
