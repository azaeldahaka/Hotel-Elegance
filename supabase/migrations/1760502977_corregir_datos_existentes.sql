-- Migration: corregir_datos_existentes
-- Created at: 1760502977

-- Corregir roles en usuarios
UPDATE usuarios SET rol = 'administrador' WHERE rol = 'admin';
UPDATE usuarios SET rol = 'usuario' WHERE rol NOT IN ('usuario', 'operador', 'administrador');

-- Corregir estados en habitaciones
UPDATE habitaciones SET estado = 'mantenimiento' WHERE estado NOT IN ('disponible', 'ocupada', 'mantenimiento');
UPDATE habitaciones SET estado = 'disponible' WHERE estado = 'cerrada';;