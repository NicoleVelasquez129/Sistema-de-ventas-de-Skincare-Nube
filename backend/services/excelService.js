const ExcelJS = require("exceljs");

const COLOR_PRINCIPAL = "FF68C3B7";
const FORMATO_DINERO = '"Bs" #,##0.00';

const generarExcel = async (hojas) => {
    const libro = new ExcelJS.Workbook();
    libro.creator = "Skincare Nube";

    for (const h of hojas) {
        const hoja = libro.addWorksheet(h.nombre);
        const ultima = h.columnas.length;

        hoja.mergeCells(1, 1, 1, ultima);
        hoja.getCell(1, 1).value = h.titulo;
        hoja.getCell(1, 1).font = { bold: true, size: 14, color: { argb: COLOR_PRINCIPAL } };
        hoja.mergeCells(2, 1, 2, ultima);
        hoja.getCell(2, 1).value = h.subtitulo;
        hoja.getCell(2, 1).font = { italic: true, color: { argb: "FF555555" } };

        const encabezado = hoja.getRow(4);
        encabezado.values = h.columnas.map(c => c.header);
        encabezado.eachCell(celda => {
            celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
            celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRINCIPAL } };
            celda.alignment = { horizontal: "center" };
        });
        h.columnas.forEach((c, i) => { hoja.getColumn(i + 1).width = c.ancho || 16; });

        const agregarFila = (datos, negrita) => {
            const fila = hoja.addRow(h.columnas.map(c => datos[c.key]));
            h.columnas.forEach((c, i) => {
                if (c.dinero) fila.getCell(i + 1).numFmt = FORMATO_DINERO;
            });
            if (negrita) {
                fila.font = { bold: true };
                fila.eachCell(celda => {
                    celda.border = { top: { style: "thin", color: { argb: COLOR_PRINCIPAL } } };
                });
            }
        };

        h.filas.forEach(f => agregarFila(f, false));
        agregarFila(h.totales, true);
    }

    return await libro.xlsx.writeBuffer();
};

const rango = (r) => `Del ${r.desde} al ${r.hasta} · solo ventas con pago confirmado`;

const excelVentas = (r) => {
    const columnas = (primera) => [
        { header: primera, key: "clave", ancho: 24 },
        { header: "Ventas", key: "ventas", ancho: 10 },
        { header: "Ingresos", key: "ingresos", dinero: true },
        { header: "Costo", key: "costo", dinero: true },
        { header: "Ganancia", key: "ganancia", dinero: true }
    ];
    return generarExcel([
        {
            nombre: "Ventas",
            titulo: `Reporte de ventas por ${r.agrupar === "mes" ? "mes" : "día"}`,
            subtitulo: rango(r),
            columnas: columnas(r.agrupar === "mes" ? "Mes" : "Día"),
            filas: r.filas,
            totales: r.totales
        },
        {
            nombre: "Por vendedor",
            titulo: "Ventas por vendedor",
            subtitulo: rango(r),
            columnas: columnas("Vendedor"),
            filas: r.por_vendedor,
            totales: r.totales
        }
    ]);
};

const excelGanancias = (r) => generarExcel([{
    nombre: "Ganancias",
    titulo: "Ganancias por producto",
    subtitulo: rango(r),
    columnas: [
        { header: "Producto", key: "producto", ancho: 36 },
        { header: "Unidades", key: "unidades", ancho: 12 },
        { header: "Ingresos", key: "ingresos", dinero: true },
        { header: "Costo", key: "costo", dinero: true },
        { header: "Ganancia", key: "ganancia", dinero: true }
    ],
    filas: r.filas,
    totales: { producto: "Total", ...r.totales }
}]);

const excelInventario = (r) => generarExcel([{
    nombre: "Inventario",
    titulo: "Reporte de inventario",
    subtitulo: `Productos activos · generado el ${new Date().toLocaleDateString("es-BO")}`,
    columnas: [
        { header: "Producto", key: "producto", ancho: 36 },
        { header: "Categoría", key: "categoria", ancho: 22 },
        { header: "Stock", key: "stock", ancho: 10 },
        { header: "Stock mínimo", key: "stock_minimo", ancho: 14 },
        { header: "Costo unitario", key: "costo", dinero: true },
        { header: "Valor a costo", key: "valor_costo", dinero: true },
        { header: "Bajo mínimo", key: "bajo", ancho: 14 }
    ],
    filas: r.filas.map(f => ({ ...f, bajo: f.bajo_minimo ? "Sí" : "No" })),
    totales: {
        producto: "Total",
        categoria: `${r.totales.productos} ${r.totales.productos === 1 ? "producto" : "productos"}`,
        stock: r.totales.unidades,
        stock_minimo: "",
        costo: "",
        valor_costo: r.totales.valor_costo,
        bajo: `${r.totales.bajo_minimo} bajo mínimo`
    }
}]);

module.exports = { excelVentas, excelGanancias, excelInventario };
