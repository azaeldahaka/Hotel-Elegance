-- Migration: actualizar_schema_completo
-- Created at: 1760502961

-- Actualizar tabla usuarios con columnas faltantes
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMPTZ DEFAULT NOW();

-- Hacer columnas obligatorias después de agregarlas
UPDATE usuarios SET password = 'temp_password' WHERE password IS NULL;
UPDATE usuarios SET nombre = 'Usuario' WHERE nombre IS NULL;
ALTER TABLE usuarios ALTER COLUMN password SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN nombre SET NOT NULL;

-- Asegurar que el rol sea válido
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('usuario', 'operador', 'administrador'));

-- Actualizar tabla habitaciones
ALTER TABLE habitaciones 
ADD COLUMN IF NOT EXISTS capacidad INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS amenidades TEXT[],
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS precio_noche DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW();

-- Actualizar valores por defecto
UPDATE habitaciones SET precio_noche = precio WHERE precio_noche IS NULL;
UPDATE habitaciones SET capacidad = 2 WHERE capacidad IS NULL;
ALTER TABLE habitaciones ALTER COLUMN capacidad SET NOT NULL;
ALTER TABLE habitaciones ALTER COLUMN precio_noche SET NOT NULL;

-- Convertir numero a TEXT si es necesario
ALTER TABLE habitaciones ALTER COLUMN numero TYPE TEXT;

-- Asegurar que el estado sea válido
ALTER TABLE habitaciones DROP CONSTRAINT IF EXISTS habitaciones_estado_check;
ALTER TABLE habitaciones ADD CONSTRAINT habitaciones_estado_check CHECK (estado IN ('disponible', 'ocupada', 'mantenimiento'));

-- Actualizar tabla reservas
ALTER TABLE reservas 
ADD COLUMN IF NOT EXISTS num_huespedes INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fecha_reserva TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS fecha_entrada DATE,
ADD COLUMN IF NOT EXISTS fecha_salida DATE;

-- Actualizar datos de fecha si existen las columnas antiguas
UPDATE reservas SET fecha_entrada = fecha_inicio WHERE fecha_entrada IS NULL AND fecha_inicio IS NOT NULL;
UPDATE reservas SET fecha_salida = fecha_fin WHERE fecha_salida IS NULL AND fecha_fin IS NOT NULL;

ALTER TABLE reservas ALTER COLUMN num_huespedes SET NOT NULL;
ALTER TABLE reservas ALTER COLUMN total SET NOT NULL;
ALTER TABLE reservas ALTER COLUMN fecha_entrada SET NOT NULL;
ALTER TABLE reservas ALTER COLUMN fecha_salida SET NOT NULL;

-- Renombrar estado si es necesario
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_estado_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_estado_check CHECK (estado IN ('activa', 'completada', 'cancelada'));

-- Crear tabla pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('tarjeta', 'efectivo', 'transferencia')),
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'completado', 'fallido')),
  fecha_pago TIMESTAMPTZ DEFAULT NOW()
);;