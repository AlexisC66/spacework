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
    nombreTipo: string;
}

export interface Ubicacion {
    id: number;
    nombreUbicacion: string;
    direccion: string;
    ciudad: string;
    pais: string;
    tasaIgv: number;
    exoneradoIgv: boolean;
    estado: boolean;
}

export interface SlotDTO {
    reservaId: number;
    codigoReserva: string;
    inicio: string;
    fin: string;
}

export interface DisponibilidadResponse {
    espacioId: number;
    nombreEspacio: string;
    horaApertura: string;
    horaCierre: string;
    ocupaciones: SlotDTO[];
}

export interface FotoEspacio {
    id?: number;
    urlFoto: string;
    esPrincipal: boolean;
}

export interface Caracteristica {
    id: number;
    nombreCaracteristica: string;
    icono?: string;
    tipo?: string;
    estado?: boolean;
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
    fotos?: FotoEspacio[];
    caracteristicas?: Caracteristica[];
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

export interface ServicioAdicionalReserva {
    id: number;
    cantidad: number;
    subtotal: number;
    servicioAdicional: {
        id: number;
        nombre: string;
        precioBase: number;
    };
}

export interface Reserva {
    id: number;
    codigoReserva: string;
    fechaReserva?: string;
    fechaInicioReserva: string;
    fechaFinReserva: string;
    montoTotal: number;
    impuestos?: number;
    descuentoAplicado: number;
    estadoReserva: { id: number; nombreEstado: string };
    observaciones: string;
    tipoComprobante: string;
    documentoIdentidad: string;
    razonSocial: string;
    direccion: string;
    estado: boolean;
    usuario: Usuario;
    espacio: Espacio;
    reservaServicios?: ServicioAdicionalReserva[];
}

export interface FormaPago {
    id: number;
    nombreForma: string;
    estado?: boolean;
}

export interface Pago {
    id: number;
    montoPago: number;
    fechaPago: string;
    referenciaTransaccion: string;
    reserva: Reserva;
    formaPago: FormaPago;
    estadoPago: string;
    estado: boolean;
}

export interface ApiError {
    error: string;
    codigo?: number;
    timestamp?: string;
}

export function extractApiError(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response: { data?: ApiError } }).response;
        if (resp?.data?.error) return resp.data.error;
        if (resp?.data && typeof resp.data === 'string') return resp.data;
    }
    if (err instanceof Error) return err.message;
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
}
