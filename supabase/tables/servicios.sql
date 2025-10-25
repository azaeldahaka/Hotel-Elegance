CREATE TABLE servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    imagen_url TEXT,
    disponible BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);