CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    asunto TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    respuesta TEXT,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente',
    'respondida')),
    fecha_consulta TIMESTAMPTZ DEFAULT NOW(),
    fecha_respuesta TIMESTAMPTZ
);