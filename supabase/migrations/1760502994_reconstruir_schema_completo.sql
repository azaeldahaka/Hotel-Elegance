-- Migration: reconstruir_schema_completo
-- Created at: 1760502994

-- Eliminar constraints existentes que puedan interferir
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE habitaciones DROP CONSTRAINT IF EXISTS habitaciones_estado_check;
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_estado_check;

-- Actualizar datos en usuarios
UPDATE usuarios SET rol = 'administrador' WHERE rol = 'admin';
UPDATE usuarios SET rol = 'usuario' WHERE rol NOT IN ('usuario', 'operador', 'administrador');

-- Agregar columnas faltantes a usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'temp_hash';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMPTZ DEFAULT NOW();

-- Agregar constraint de rol
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('usuario', 'operador', 'administrador'));

-- Actualizar datos en habitaciones
UPDATE habitaciones SET estado = 'mantenimiento' WHERE estado = 'cerrada';
UPDATE habitaciones SET estado = 'disponible' WHERE estado NOT IN ('disponible', 'ocupada', 'mantenimiento');

-- Agregar columnas faltantes a habitaciones
ALTER TABLE habitaciones ADD COLUMN IF NOT EXISTS capacidad INTEGER DEFAULT 2;
ALTER TABLE habitaciones ADD COLUMN IF NOT EXISTS amenidades TEXT[];
ALTER TABLE habitaciones ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE habitaciones ADD COLUMN IF NOT EXISTS precio_noche DECIMAL(10,2);
ALTER TABLE habitaciones ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW();

-- Copiar precio a precio_noche si existe
UPDATE habitaciones SET precio_noche = precio WHERE precio_noche IS NULL AND precio IS NOT NULL;

-- Convertir numero a TEXT
ALTER TABLE habitaciones ALTER COLUMN numero TYPE TEXT USING numero::TEXT;

-- Agregar constraint de estado
ALTER TABLE habitaciones ADD CONSTRAINT habitaciones_estado_check CHECK (estado IN ('disponible', 'ocupada', 'mantenimiento'));

-- Actualizar tabla reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS num_huespedes INTEGER DEFAULT 1;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_reserva TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_entrada DATE;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_salida DATE;

-- Copiar fechas si existen columnas antiguas
UPDATE reservas SET fecha_entrada = fecha_inicio WHERE fecha_entrada IS NULL;
UPDATE reservas SET fecha_salida = fecha_fin WHERE fecha_salida IS NULL;

-- Actualizar estados de reservas
UPDATE reservas SET estado = 'activa' WHERE estado = 'pendiente';
UPDATE reservas SET estado = 'activa' WHERE estado NOT IN ('activa', 'completada', 'cancelada');

-- Agregar constraint de estado para reservas
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