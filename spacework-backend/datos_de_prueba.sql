
USE SpaceWork;
GO

-- ==========================================
-- SCHEMA: Usuarios
-- ==========================================

-- 1. Insertar Tipos de Documento
INSERT INTO Usuarios.TiposDocumento (NombreTipo, Abreviatura, Estado) 
VALUES ('Documento Nacional de Identidad', 'DNI', 1),
       ('Carnet de Extranjería', 'CE', 1);
GO

-- 2. Insertar Roles
--INSERT INTO Usuarios.Roles (NombreRol, Descripcion, Estado) 
--VALUES ('ADMIN', 'Administrador del sistema', 1),
--       ('CLIENTE', 'Cliente regular del sistema', 1);
--GO

-- 3. Insertar Usuario de Prueba (Contraseña: 123456)
-- Nota: El hash usado a continuación es la versión encriptada con BCrypt de "123456"
DECLARE @AdminRolID INT = (SELECT TOP 1 RolID FROM Usuarios.Roles WHERE NombreRol = 'SUPERADMIN' OR NombreRol = 'ADMINISTRADOR');
IF @AdminRolID IS NULL SET @AdminRolID = 1;

DECLARE @TipoDocID INT = (SELECT TOP 1 TipoDocumentoID FROM Usuarios.TiposDocumento WHERE Abreviatura = 'DNI');
IF @TipoDocID IS NULL SET @TipoDocID = 1;

INSERT INTO Usuarios.Usuarios (TipoDocumentoID, NumeroDocumento, Nombre, Ap_Paterno, Ap_Materno, CorreoElectronico, Telefono, Contrasena, RolID, FechaRegistro, Estado, IntentosFallidos, Bloqueado) 
VALUES (@TipoDocID, '12345678', 'Admin', 'Space', 'Work', 'admin@spacework.com', '987654321', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', @AdminRolID, GETDATE(), 1, 0, 0);
GO


-- ==========================================
-- SCHEMA: Espacios
-- ==========================================

-- 4. Insertar Tipos de Espacio
INSERT INTO Espacios.TiposEspacio (NombreTipo, Descripcion, Estado) 
VALUES ('Coworking', 'Espacio de trabajo compartido', 1),
       ('Oficina Privada', 'Oficina cerrada para equipos', 1),
       ('Sala de Reuniones', 'Sala equipada para reuniones de equipo', 1);
GO

-- 5. Insertar Ubicaciones
INSERT INTO Espacios.Ubicaciones (NombreUbicacion, Direccion, Ciudad, Pais, Estado) 
VALUES ('Sede Miraflores', 'Av. Larco 123', 'Lima', 'Peru', 1),
       ('Sede San Isidro', 'Av. Javier Prado 456', 'Lima', 'Peru', 1);
GO

-- 6. Insertar Espacios
INSERT INTO Espacios.Espacios (CodigoEspacio, NombreEspacio, TipoEspacioID, UbicacionID, Capacidad, Descripcion, EstadoEspacio, HoraApertura, HoraCierre, Estado)
VALUES ('CW-MIR-001', 'Escritorio Coworking 1', 1, 1, 1, 'Escritorio individual en zona compartida con luz natural.', 'DISPONIBLE', '08:00', '20:00', 1),
       ('OF-ISI-001', 'Oficina Privada A', 2, 2, 5, 'Oficina para 5 personas con aire acondicionado y vista a la calle.', 'DISPONIBLE', '08:00', '20:00', 1),
       ('SR-MIR-001', 'Sala Creativa', 3, 1, 10, 'Sala de reuniones con pizarra de cristal y proyector 4K.', 'DISPONIBLE', '08:00', '20:00', 1);
GO

-- 7. Insertar Precios
-- Relacionados con los espacios insertados anteriormente
INSERT INTO Espacios.Precios (EspacioID, TipoTarifa, Monto, Moneda, Descuento, FechaInicioVigencia, Estado)
VALUES (1, 'HORA', 15.00, 'PEN', 0, GETDATE(), 1),
       (2, 'MES', 1500.00, 'PEN', 10.0, GETDATE(), 1),
       (3, 'DIA', 200.00, 'PEN', 0, GETDATE(), 1);
GO

-- 8. Insertar Características
INSERT INTO Espacios.Caracteristicas (NombreCaracteristica, Descripcion, Tipo, Estado) 
VALUES ('Wi-Fi Alta Velocidad', 'Internet por fibra óptica 500 Mbps', 'INTERNET', 1),
       ('Aire Acondicionado', 'Climatización individual', 'COMFORT', 1),
       ('Proyector 4K', 'Proyector de alta definición', 'EQUIPAMIENTO', 1);
GO

-- 9. Vincular Características a Espacios
-- Espacio 1 (Coworking) tiene Wi-Fi
INSERT INTO Espacios.Espacios_Caracteristicas (EspacioID, CaracteristicaID) VALUES (1, 1);
-- Espacio 2 (Oficina) tiene Wi-Fi y Aire Acondicionado
INSERT INTO Espacios.Espacios_Caracteristicas (EspacioID, CaracteristicaID) VALUES (2, 1), (2, 2);
-- Espacio 3 (Sala Reuniones) tiene Wi-Fi, Aire Acondicionado y Proyector
INSERT INTO Espacios.Espacios_Caracteristicas (EspacioID, CaracteristicaID) VALUES (3, 1), (3, 2), (3, 3);
GO

PRINT 'Datos de prueba insertados correctamente.';
