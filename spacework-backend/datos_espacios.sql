USE SpaceWork;
GO

-- Solo datos de espacios (los usuarios, roles y tipos de documento
-- ya los crea el backend solo al arrancar). Se puede correr varias veces.

-- 1. Tipos de espacio
IF NOT EXISTS (SELECT 1 FROM Espacios.TiposEspacio WHERE NombreTipo = 'Coworking')
    INSERT INTO Espacios.TiposEspacio (NombreTipo, Descripcion, Estado) VALUES ('Coworking', 'Espacio de trabajo compartido', 1);
IF NOT EXISTS (SELECT 1 FROM Espacios.TiposEspacio WHERE NombreTipo = 'Oficina Privada')
    INSERT INTO Espacios.TiposEspacio (NombreTipo, Descripcion, Estado) VALUES ('Oficina Privada', 'Oficina cerrada para equipos', 1);
IF NOT EXISTS (SELECT 1 FROM Espacios.TiposEspacio WHERE NombreTipo = 'Sala de Reuniones')
    INSERT INTO Espacios.TiposEspacio (NombreTipo, Descripcion, Estado) VALUES ('Sala de Reuniones', 'Sala equipada para reuniones de equipo', 1);
GO

-- 2. Ubicaciones
IF NOT EXISTS (SELECT 1 FROM Espacios.Ubicaciones WHERE NombreUbicacion = 'Sede Miraflores')
    INSERT INTO Espacios.Ubicaciones (NombreUbicacion, Direccion, Ciudad, Pais, Estado) VALUES ('Sede Miraflores', 'Av. Larco 123', 'Lima', 'Peru', 1);
IF NOT EXISTS (SELECT 1 FROM Espacios.Ubicaciones WHERE NombreUbicacion = 'Sede San Isidro')
    INSERT INTO Espacios.Ubicaciones (NombreUbicacion, Direccion, Ciudad, Pais, Estado) VALUES ('Sede San Isidro', 'Av. Javier Prado 456', 'Lima', 'Peru', 1);
GO

-- 3. Espacios (se buscan los IDs por nombre, no se asume que sean 1, 2, 3)
IF NOT EXISTS (SELECT 1 FROM Espacios.Espacios WHERE CodigoEspacio = 'CW-MIR-001')
    INSERT INTO Espacios.Espacios (CodigoEspacio, NombreEspacio, TipoEspacioID, UbicacionID, Capacidad, Descripcion, EstadoEspacio, HoraApertura, HoraCierre, Estado)
    VALUES ('CW-MIR-001', 'Escritorio Coworking 1',
            (SELECT TipoEspacioID FROM Espacios.TiposEspacio WHERE NombreTipo = 'Coworking'),
            (SELECT UbicacionID FROM Espacios.Ubicaciones WHERE NombreUbicacion = 'Sede Miraflores'),
            1, 'Escritorio individual en zona compartida con luz natural.', 'DISPONIBLE', '08:00', '20:00', 1);

IF NOT EXISTS (SELECT 1 FROM Espacios.Espacios WHERE CodigoEspacio = 'OF-ISI-001')
    INSERT INTO Espacios.Espacios (CodigoEspacio, NombreEspacio, TipoEspacioID, UbicacionID, Capacidad, Descripcion, EstadoEspacio, HoraApertura, HoraCierre, Estado)
    VALUES ('OF-ISI-001', 'Oficina Privada A',
            (SELECT TipoEspacioID FROM Espacios.TiposEspacio WHERE NombreTipo = 'Oficina Privada'),
            (SELECT UbicacionID FROM Espacios.Ubicaciones WHERE NombreUbicacion = 'Sede San Isidro'),
            5, 'Oficina para 5 personas con aire acondicionado y vista a la calle.', 'DISPONIBLE', '08:00', '20:00', 1);

IF NOT EXISTS (SELECT 1 FROM Espacios.Espacios WHERE CodigoEspacio = 'SR-MIR-001')
    INSERT INTO Espacios.Espacios (CodigoEspacio, NombreEspacio, TipoEspacioID, UbicacionID, Capacidad, Descripcion, EstadoEspacio, HoraApertura, HoraCierre, Estado)
    VALUES ('SR-MIR-001', 'Sala Creativa',
            (SELECT TipoEspacioID FROM Espacios.TiposEspacio WHERE NombreTipo = 'Sala de Reuniones'),
            (SELECT UbicacionID FROM Espacios.Ubicaciones WHERE NombreUbicacion = 'Sede Miraflores'),
            10, 'Sala de reuniones con pizarra de cristal y proyector 4K.', 'DISPONIBLE', '08:00', '20:00', 1);
GO

-- 4. Precios
IF NOT EXISTS (SELECT 1 FROM Espacios.Precios WHERE EspacioID = (SELECT EspacioID FROM Espacios.Espacios WHERE CodigoEspacio = 'CW-MIR-001'))
    INSERT INTO Espacios.Precios (EspacioID, TipoTarifa, Monto, Moneda, Descuento, FechaInicioVigencia, Estado)
    VALUES ((SELECT EspacioID FROM Espacios.Espacios WHERE CodigoEspacio = 'CW-MIR-001'), 'HORA', 15.00, 'PEN', 0, GETDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Espacios.Precios WHERE EspacioID = (SELECT EspacioID FROM Espacios.Espacios WHERE CodigoEspacio = 'OF-ISI-001'))
    INSERT INTO Espacios.Precios (EspacioID, TipoTarifa, Monto, Moneda, Descuento, FechaInicioVigencia, Estado)
    VALUES ((SELECT EspacioID FROM Espacios.Espacios WHERE CodigoEspacio = 'OF-ISI-001'), 'MES', 1500.00, 'PEN', 10.0, GETDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Espacios.Precios WHERE EspacioID = (SELECT EspacioID FROM Espacios.Espacios WHERE CodigoEspacio = 'SR-MIR-001'))
    INSERT INTO Espacios.Precios (EspacioID, TipoTarifa, Monto, Moneda, Descuento, FechaInicioVigencia, Estado)
    VALUES ((SELECT EspacioID FROM Espacios.Espacios WHERE CodigoEspacio = 'SR-MIR-001'), 'DIA', 200.00, 'PEN', 0, GETDATE(), 1);
GO

-- 5. Características
IF NOT EXISTS (SELECT 1 FROM Espacios.Caracteristicas WHERE NombreCaracteristica = 'Wi-Fi Alta Velocidad')
    INSERT INTO Espacios.Caracteristicas (NombreCaracteristica, Descripcion, Tipo, Estado) VALUES ('Wi-Fi Alta Velocidad', 'Internet por fibra óptica 500 Mbps', 'INTERNET', 1);
IF NOT EXISTS (SELECT 1 FROM Espacios.Caracteristicas WHERE NombreCaracteristica = 'Aire Acondicionado')
    INSERT INTO Espacios.Caracteristicas (NombreCaracteristica, Descripcion, Tipo, Estado) VALUES ('Aire Acondicionado', 'Climatización individual', 'COMFORT', 1);
IF NOT EXISTS (SELECT 1 FROM Espacios.Caracteristicas WHERE NombreCaracteristica = 'Proyector 4K')
    INSERT INTO Espacios.Caracteristicas (NombreCaracteristica, Descripcion, Tipo, Estado) VALUES ('Proyector 4K', 'Proyector de alta definición', 'EQUIPAMIENTO', 1);
GO

-- 6. Vincular características a espacios
INSERT INTO Espacios.Espacios_Caracteristicas (EspacioID, CaracteristicaID)
SELECT e.EspacioID, c.CaracteristicaID
FROM (VALUES
        ('CW-MIR-001', 'Wi-Fi Alta Velocidad'),
        ('OF-ISI-001', 'Wi-Fi Alta Velocidad'),
        ('OF-ISI-001', 'Aire Acondicionado'),
        ('SR-MIR-001', 'Wi-Fi Alta Velocidad'),
        ('SR-MIR-001', 'Aire Acondicionado'),
        ('SR-MIR-001', 'Proyector 4K')
     ) AS v(Codigo, Caracteristica)
JOIN Espacios.Espacios e ON e.CodigoEspacio = v.Codigo
JOIN Espacios.Caracteristicas c ON c.NombreCaracteristica = v.Caracteristica
WHERE NOT EXISTS (
    SELECT 1 FROM Espacios.Espacios_Caracteristicas ec
    WHERE ec.EspacioID = e.EspacioID AND ec.CaracteristicaID = c.CaracteristicaID
);
GO

PRINT 'Datos de espacios insertados correctamente.';
GO
