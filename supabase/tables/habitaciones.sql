CREATE TABLE habitaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL,
    precio_noche DECIMAL(10,2) NOT NULL,
    capacidad INTEGER NOT NULL,
    amenidades TEXT[],
    estado TEXT NOT NULL CHECK (estado IN ('disponible',
    'ocupada',
    'mantenimiento')),
    imagen_url TEXT,
    descripcion TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);