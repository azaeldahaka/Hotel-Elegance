CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('usuario',
    'operador',
    'administrador')),
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);