-- ============================================================
-- BASE DE DATOS: SKINKER NUBE
-- Sistema Web de Ventas e Inventario
-- Motor: MySQL
-- ============================================================


-- ============================================================
-- 1. CREAR BASE DE DATOS
-- ============================================================

DROP DATABASE IF EXISTS skinker_nube_db;

CREATE DATABASE skinker_nube_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE skinker_nube_db;


-- ============================================================
-- 2. TABLA: CATEGORIAS
-- Cumple con RF05
-- ============================================================

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. TABLA: USUARIOS
-- Administradores y clientes
-- Cumple con RF10 / HU15
-- ============================================================

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,

    correo VARCHAR(150) NOT NULL UNIQUE,

    contrasena_cifrada VARCHAR(255) NOT NULL,

    rol ENUM(
        'administrador',
        'cliente'
    ) NOT NULL DEFAULT 'cliente',

    activo BOOLEAN DEFAULT TRUE,

    -- Recuperación de contraseña
    reset_token_hash VARCHAR(64) NULL,
    reset_expira DATETIME NULL,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 4. TABLA: PRODUCTOS
-- Inventario y catálogo
-- Cumple con RF04, RF06 / HU03, HU06
-- ============================================================

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,

    descripcion TEXT,

    ingredientes TEXT NULL,

    modo_uso TEXT NULL,

    etiqueta VARCHAR(30) NULL,

    imagen VARCHAR(500) NULL,

    precio DECIMAL(10,2) NOT NULL,

    stock INT NOT NULL DEFAULT 0,

    stock_minimo INT NOT NULL DEFAULT 5,

    activo BOOLEAN DEFAULT TRUE,

    id_categoria INT,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria)
        ON DELETE SET NULL,

    CONSTRAINT chk_producto_precio
        CHECK (precio >= 0),

    CONSTRAINT chk_producto_stock
        CHECK (stock >= 0),

    CONSTRAINT chk_producto_stock_min
        CHECK (stock_minimo >= 0)
);


-- ============================================================
-- 5. TABLA: CLIENTES
-- Gestión de compradores
-- Cumple con RF09 / HU12
-- ============================================================

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,

    telefono VARCHAR(50),

    correo VARCHAR(150),

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,

    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    total DECIMAL(10,2) NOT NULL,

    envio DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    estado ENUM(
        'registrada',
        'anulada'
    ) DEFAULT 'registrada',

    id_cliente INT,

    id_usuario INT,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_venta_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente)
        ON DELETE SET NULL,

    CONSTRAINT fk_venta_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
);



CREATE TABLE detalle_ventas (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,

    cantidad INT NOT NULL,

    precio_unitario DECIMAL(10,2) NOT NULL,

    subtotal DECIMAL(10,2) NOT NULL,

    id_venta INT NOT NULL,

    id_producto INT NOT NULL,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_detalle_venta
        FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta)
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON DELETE CASCADE,

    CONSTRAINT chk_detalle_cantidad
        CHECK (cantidad > 0)
);



CREATE TABLE movimientos_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,

    tipo ENUM(
        'entrada',
        'salida',
        'ajuste'
    ) NOT NULL,

    cantidad INT NOT NULL,

    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    id_producto INT NOT NULL,

    id_usuario INT,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_movimiento_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON DELETE CASCADE,

    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
);


INSERT INTO categorias (
    nombre,
    descripcion
) VALUES

(
    'Sérums',
    'Concentrados faciales con principios activos para necesidades específicas de la piel.'
),

(
    'Protectores Solares',
    'Cremas y geles de alta protección contra rayos UV, UVA y UVB.'
),

(
    'Limpiadores',
    'Geles y espumas limpiadoras para eliminar impurezas sin resecar el rostro.'
),

(
    'Hidratantes',
    'Cremas y geles para mantener la barrera cutánea hidratada.'
);




INSERT INTO usuarios (
    nombre,
    correo,
    contrasena_cifrada,
    rol
) VALUES

(
    'Nicole Velasquez',
    'nicole@skinkernube.com',
    '$2b$10$EjemploHashContrasenaAdmin123',
    'administrador'
);




INSERT INTO productos (
    nombre,
    descripcion,
    ingredientes,
    modo_uso,
    etiqueta,
    imagen,
    precio,
    stock,
    stock_minimo,
    id_categoria
) VALUES

(
    'Sérum Facial con Vitamina C 30ml',

    'Ilumina y unifica el tono de la piel, antioxidante potente.',

    'Vitamina C, ácido ascórbico y antioxidantes.',

    'Aplicar unas gotas sobre el rostro limpio por la mañana y noche.',

    'DESTACADO',

    NULL,

    120.00,
    15,
    4,
    1
),

(
    'Sérum Ácido Hialurónico',

    'Hidratación profunda y efecto relleno de líneas de expresión.',

    'Ácido hialurónico y agentes hidratantes.',

    'Aplicar sobre el rostro limpio antes de la crema hidratante.',

    'NUEVO',

    NULL,

    135.00,
    20,
    5,
    1
),

(
    'Protector Solar Toque Seco SPF 50+',

    'Protección solar avanzada sin sensación grasosa, ideal para piel mixta/grasa.',

    'Filtros solares UVA y UVB.',

    'Aplicar generosamente sobre el rostro 15 minutos antes de la exposición solar.',

    'POPULAR',

    NULL,

    95.00,
    30,
    8,
    2
),

(
    'Limpiador Facial Suave con Ceramidas',

    'Limpia profundamente respetando la barrera natural de la piel.',

    'Ceramidas, agentes limpiadores suaves y humectantes.',

    'Aplicar sobre el rostro húmedo, masajear suavemente y enjuagar.',

    NULL,

    NULL,

    80.00,
    12,
    3,
    3
),

(
    'Crema Hidratante Reparadora',

    'Nutrición intensiva para pieles secas o deshidratadas.',

    'Ceramidas, ácido hialurónico y agentes emolientes.',

    'Aplicar una cantidad adecuada sobre el rostro limpio.',

    'RECOMENDADO',

    NULL,

    110.00,
    18,
    5,
    4
);



INSERT INTO clientes (
    nombre,
    telefono,
    correo
) VALUES

(
    'Ana Gomez',
    '+591 71234567',
    'ana.gomez@gmail.com'
),

(
    'Luis Perez',
    '+591 79876543',
    'luis.perez@hotmail.com'
);




INSERT INTO ventas (
    total,
    envio,
    estado,
    id_cliente,
    id_usuario
) VALUES
(
    215.00,
    0.00,
    'registrada',
    1,
    1
);



INSERT INTO detalle_ventas (
    cantidad,
    precio_unitario,
    subtotal,
    id_venta,
    id_producto
) VALUES

(
    1,
    120.00,
    120.00,
    1,
    1
),

(
    1,
    95.00,
    95.00,
    1,
    3
);



INSERT INTO movimientos_inventario (
    tipo,
    cantidad,
    id_producto,
    id_usuario
) VALUES

(
    'entrada',
    15,
    1,
    1
),

(
    'entrada',
    20,
    2,
    1
),

(
    'entrada',
    30,
    3,
    1
),

(
    'entrada',
    12,
    4,
    1
),

(
    'entrada',
    18,
    5,
    1
),

(
    'salida',
    1,
    1,
    1
),

(
    'salida',
    1,
    3,
    1
);






SELECT
    id_producto,
    nombre,
    precio,
    stock,
    stock_minimo
FROM productos
WHERE precio <= 0
   OR precio > 5000;



SELECT
    id_producto,
    nombre,
    stock,
    stock_minimo
FROM productos
WHERE stock <= stock_minimo;




SELECT
    p.id_producto,
    p.nombre AS producto,
    c.nombre AS categoria,
    p.precio,
    p.stock,
    p.etiqueta
FROM productos p
LEFT JOIN categorias c
    ON p.id_categoria = c.id_categoria;




SELECT
    v.id_venta,
    v.fecha,
    c.nombre AS cliente,
    u.nombre AS vendedor,
    v.total,
    v.envio,
    v.estado
FROM ventas v
LEFT JOIN clientes c
    ON v.id_cliente = c.id_cliente
LEFT JOIN usuarios u
    ON v.id_usuario = u.id_usuario;



SELECT
    v.id_venta,
    v.fecha,
    c.nombre AS cliente,
    p.nombre AS producto,
    dv.cantidad,
    dv.precio_unitario,
    dv.subtotal
FROM detalle_ventas dv
INNER JOIN ventas v
    ON dv.id_venta = v.id_venta
INNER JOIN productos p
    ON dv.id_producto = p.id_producto
LEFT JOIN clientes c
    ON v.id_cliente = c.id_cliente;


