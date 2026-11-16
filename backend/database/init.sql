DROP DATABASE IF EXISTS skinker_nube_db;
CREATE DATABASE skinker_nube_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skinker_nube_db;
 
-- --------------------------------------------------------
-- 1. CATEGORIAS
-- --------------------------------------------------------
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
 
-- --------------------------------------------------------
-- 2. USUARIOS (cuentas con login: administrador, vendedor, cliente)
-- --------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena_cifrada VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'vendedor', 'cliente') NOT NULL DEFAULT 'cliente',
    activo BOOLEAN DEFAULT TRUE,
    reset_token_hash VARCHAR(64) NULL,
    reset_expira DATETIME NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
 
-- --------------------------------------------------------
-- 3. PRODUCTOS (precio de venta y costo de compra)
-- --------------------------------------------------------
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    ingredientes TEXT NULL,
    modo_uso TEXT NULL,
    etiqueta VARCHAR(30) NULL,
    imagen VARCHAR(500),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    costo DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (costo >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    activo BOOLEAN DEFAULT TRUE,
    id_categoria INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL
) ENGINE=InnoDB;
 
-- --------------------------------------------------------
-- 4. CLIENTES (datos de quien compra; el carnet es opcional)
-- --------------------------------------------------------
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    carnet VARCHAR(20) NULL UNIQUE,
    telefono VARCHAR(50),
    correo VARCHAR(150),
    direccion VARCHAR(255) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
 
-- --------------------------------------------------------
-- 5. VENTAS
--   id_usuario  = cuenta del cliente que compro por la plataforma
--   id_vendedor = vendedor (o admin) que registro la venta en tienda
--   id_cliente  = datos del cliente (ventas en tienda)
--   estado         = registrada / anulada
--   estado_pedido  = pendiente -> pagado -> enviado -> entregado
-- --------------------------------------------------------
CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    envio DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (envio >= 0),
    estado ENUM('registrada', 'anulada') DEFAULT 'registrada',
    estado_pedido ENUM('pendiente', 'pagado', 'enviado', 'entregado') NOT NULL DEFAULT 'pendiente',
    direccion_entrega VARCHAR(255) NULL,
    ubicacion_lat DECIMAL(10, 7) NULL CHECK (ubicacion_lat BETWEEN -90 AND 90),
    ubicacion_lng DECIMAL(10, 7) NULL CHECK (ubicacion_lng BETWEEN -180 AND 180),
    imagen_entrega VARCHAR(500) NULL,
    fecha_entrega DATETIME NULL,
    id_cliente INT NULL,
    id_usuario INT NULL,
    id_vendedor INT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE SET NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    FOREIGN KEY (id_vendedor) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_ventas_fecha (fecha),
    INDEX idx_ventas_estado_pedido (estado_pedido)
) ENGINE=InnoDB;
 
-- --------------------------------------------------------
-- 6. DETALLE_VENTAS (precio y costo guardados al momento de la venta)
--   El producto no se puede borrar si tiene ventas (RESTRICT):
--   para retirarlo se usa productos.activo = FALSE.
-- --------------------------------------------------------
CREATE TABLE detalle_ventas (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    costo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT
) ENGINE=InnoDB;
 
-- --------------------------------------------------------
-- 7. PAGOS (quien confirmo el pago, metodo y monto)
-- --------------------------------------------------------
CREATE TABLE pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    metodo ENUM('efectivo', 'qr', 'transferencia') NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_venta INT NOT NULL,
    id_usuario INT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;
 
-- --------------------------------------------------------
-- 8. MOVIMIENTOS_INVENTARIO (auditoria del stock)
-- --------------------------------------------------------
CREATE TABLE movimientos_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    cantidad INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_producto INT NOT NULL,
    id_usuario INT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;
 
-- --------------------------------------------------------
-- 9. NOTIFICACIONES (avisos al administrador; se usa en el Paso 5)
-- --------------------------------------------------------
CREATE TABLE notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    id_venta INT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    INDEX idx_notificaciones_leida (leida)
) ENGINE=InnoDB;
 
-- ========================================================
-- DATOS DE EJEMPLO (los costos son de prueba: ajustalos a los reales)
-- ========================================================
INSERT INTO categorias (nombre, descripcion) VALUES
('Sérums', 'Concentrados faciales con principios activos para necesidades específicas de la piel.'),
('Protectores Solares', 'Cremas y geles de alta protección contra rayos UV UVA y UVB.'),
('Limpiadores', 'Geles y espumas limpiadoras para eliminar impurezas sin resecar el rostro.'),
('Hidratantes', 'Cremas y geles para mantener la barrera cutánea hidratada.');
 
INSERT INTO productos (nombre, descripcion, precio, costo, stock, stock_minimo, id_categoria) VALUES
('Sérum Facial con Vitamina C 30ml', 'Ilumina y unifica el tono de la piel, antioxidante potente.', 120.00, 70.00, 15, 4, 1),
('Sérum Ácido Hialurónico', 'Hidratación profunda y efecto relleno de líneas de expresión.', 135.00, 80.00, 20, 5, 1),
('Protector Solar Toque Seco SPF 50+', 'Protección solar avanzada sin sensación grasosa, ideal para piel mixta/grasa.', 95.00, 55.00, 30, 8, 2),
('Limpiador Facial Suave con Ceramidas', 'Limpia profundamente respetando la barrera natural de la piel.', 80.00, 45.00, 12, 3, 3),
('Crema Hidratante Reparadora', 'Nutrición intensiva para pieles secas o deshidratadas.', 110.00, 65.00, 18, 5, 4);
 
-- Ana tiene carnet (sirve para probar el autorrelleno); Luis no.
INSERT INTO clientes (nombre, carnet, telefono, correo, direccion) VALUES
('Ana Gomez', '4567890', '+591 71234567', 'ana.gomez@gmail.com', 'Av. América 123, Cochabamba'),
('Luis Perez', NULL, '+591 79876543', 'luis.perez@hotmail.com', NULL);

ALTER TABLE ventas
  ADD COLUMN comprobante_pago VARCHAR(500) NULL AFTER imagen_entrega,
  ADD COLUMN mensaje_pago VARCHAR(255) NULL AFTER comprobante_pago;
-- ========================================================
-- USUARIOS: no se insertan aqui a proposito (un hash de ejemplo no
-- permite iniciar sesion). Despues de ejecutar este archivo, desde
-- la carpeta backend/ ejecuta:
--     node scripts/crearAdmin.js
--     node scripts/crearVendedor.js
-- Los clientes se crean desde la pantalla de registro.
-- ========================================================