CREATE TABLE reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    habitacion_id UUID NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    num_huespedes INTEGER NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('activa',
    'completada',
    'cancelada')),
    total DECIMAL(10,2) NOT NULL,
    fecha_reserva TIMESTAMPTZ DEFAULT NOW()
);