const { Op } = require("sequelize");
const { Venta, DetalleVenta, Producto, Categoria, Usuario } = require("../models");

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const r2 = (n) => Math.round(n * 100) / 100;

const aFecha = (texto, finDelDia) => {
    if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        throw errorHttp(400, "Las fechas deben tener el formato AAAA-MM-DD.");
    }
    const fechaUTC = new Date(`${texto}T00:00:00.000Z`);
    if (Number.isNaN(fechaUTC.getTime()) || fechaUTC.toISOString().slice(0, 10) !== texto) {
        throw errorHttp(400, "La fecha no es válida.");
    }
    return new Date(`${texto}T${finDelDia ? "23:59:59.999" : "00:00:00"}`);
};

const claveFecha = (fecha, agrupar) => {
    const d = new Date(fecha);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return agrupar === "mes" ? mes : `${mes}-${String(d.getDate()).padStart(2, "0")}`;
};

// Solo ventas con pago confirmado: ni anuladas ni pendientes
const obtenerVentasConfirmadas = async (desde, hasta) => {
    const inicio = aFecha(desde, false);
    const fin = aFecha(hasta, true);
    if (inicio > fin) throw errorHttp(400, "La fecha inicial no puede ser posterior a la final.");
    return await Venta.findAll({
        where: {
            fecha: { [Op.between]: [inicio, fin] },
            estado: { [Op.ne]: "anulada" },
            estado_pedido: { [Op.ne]: "pendiente" }
        },
        include: [
            { model: DetalleVenta, as: "detalles", include: [{ model: Producto, attributes: ["nombre"] }] },
            { model: Usuario, as: "vendedor", attributes: ["nombre"] }
        ],
        order: [["fecha", "ASC"]]
    });
};

const costoYGanancia = (detalles) => detalles.reduce((acc, d) => {
    const costo = Number(d.costo_unitario) * Number(d.cantidad);
    acc.costo += costo;
    acc.ganancia += Number(d.subtotal) - costo;
    return acc;
}, { costo: 0, ganancia: 0 });

const reporteVentasService = async (desde, hasta, agrupar) => {
    const agrupacion = agrupar === "mes" ? "mes" : "dia";
    const ventas = await obtenerVentasConfirmadas(desde, hasta);
    const periodos = new Map();
    const vendedores = new Map();

    for (const venta of ventas) {
        const { costo, ganancia } = costoYGanancia(venta.detalles);
        const sumar = (mapa, clave) => {
            const fila = mapa.get(clave) || { clave, ventas: 0, ingresos: 0, costo: 0, ganancia: 0 };
            fila.ventas += 1;
            fila.ingresos += Number(venta.total);
            fila.costo += costo;
            fila.ganancia += ganancia;
            mapa.set(clave, fila);
        };
        sumar(periodos, claveFecha(venta.fecha, agrupacion));
        sumar(vendedores, venta.vendedor?.nombre || "Sin vendedor");
    }

    const redondear = (fila) => ({ ...fila, ingresos: r2(fila.ingresos), costo: r2(fila.costo), ganancia: r2(fila.ganancia) });
    const filas = [...periodos.values()].map(redondear);
    const porVendedor = [...vendedores.values()].map(redondear);
    const totales = redondear(filas.reduce(
        (t, f) => ({ clave: "Total", ventas: t.ventas + f.ventas, ingresos: t.ingresos + f.ingresos, costo: t.costo + f.costo, ganancia: t.ganancia + f.ganancia }),
        { clave: "Total", ventas: 0, ingresos: 0, costo: 0, ganancia: 0 }
    ));
    return { desde, hasta, agrupar: agrupacion, filas, por_vendedor: porVendedor, totales };
};

const reporteGananciasService = async (desde, hasta) => {
    const ventas = await obtenerVentasConfirmadas(desde, hasta);
    const productos = new Map();
    for (const venta of ventas) {
        for (const d of venta.detalles) {
            const fila = productos.get(d.id_producto) || {
                producto: d.Producto?.nombre ?? `Producto ${d.id_producto}`, unidades: 0, ingresos: 0, costo: 0, ganancia: 0
            };
            const costo = Number(d.costo_unitario) * Number(d.cantidad);
            fila.unidades += Number(d.cantidad);
            fila.ingresos += Number(d.subtotal);
            fila.costo += costo;
            fila.ganancia += Number(d.subtotal) - costo;
            productos.set(d.id_producto, fila);
        }
    }
    const filas = [...productos.values()]
        .map(f => ({ ...f, ingresos: r2(f.ingresos), costo: r2(f.costo), ganancia: r2(f.ganancia) }))
        .sort((a, b) => b.ganancia - a.ganancia);
    const totales = {
        unidades: filas.reduce((s, f) => s + f.unidades, 0),
        ingresos: r2(filas.reduce((s, f) => s + f.ingresos, 0)),
        costo: r2(filas.reduce((s, f) => s + f.costo, 0)),
        ganancia: r2(filas.reduce((s, f) => s + f.ganancia, 0))
    };
    return { desde, hasta, filas, totales };
};

const reporteInventarioService = async () => {
    const productos = await Producto.findAll({
        where: { activo: true },
        include: [{ model: Categoria, as: "Categoria", attributes: ["nombre"] }],
        order: [["nombre", "ASC"]]
    });
    const filas = productos.map(p => ({
        producto: p.nombre,
        categoria: p.Categorium?.nombre ?? p.Categoria?.nombre ?? "Sin categoría",
        stock: Number(p.stock),
        stock_minimo: Number(p.stock_minimo),
        costo: Number(p.costo),
        valor_costo: r2(Number(p.stock) * Number(p.costo)),
        bajo_minimo: Number(p.stock) <= Number(p.stock_minimo)
    }));
    const totales = {
        productos: filas.length,
        unidades: filas.reduce((s, f) => s + f.stock, 0),
        valor_costo: r2(filas.reduce((s, f) => s + f.valor_costo, 0)),
        bajo_minimo: filas.filter(f => f.bajo_minimo).length
    };
    return { filas, totales };
};

module.exports = { reporteVentasService, reporteGananciasService, reporteInventarioService };
