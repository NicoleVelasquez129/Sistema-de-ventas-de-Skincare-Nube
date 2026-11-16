const PDFDocument = require("pdfkit");

const COLOR = "#68c3b7";
const COLOR_OSCURO = "#0f766e";
const MARGEN = 40;
const ALTO_FILA = 20;

const dinero = (n) =>
    `Bs ${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const textoCelda = (columna, valor) => {
    if (valor === undefined || valor === null || valor === "") return "";
    return columna.dinero ? dinero(valor) : String(valor);
};

const generarReportePDF = ({ titulo, subtitulo, secciones }) => new Promise((resolve, reject) => {
    try {
        const doc = new PDFDocument({ size: "A4", margin: MARGEN, bufferPages: true });
        const buffers = [];
        doc.on("data", (b) => buffers.push(b));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        const ancho = doc.page.width - MARGEN * 2;
        const limite = () => doc.page.height - 60;

        const calcularAnchos = (columnas) => {
            const suma = columnas.reduce((s, c) => s + c.peso, 0);
            return columnas.map((c) => (c.peso / suma) * ancho);
        };

        const recortar = (texto, maxAncho) => {
            if (doc.widthOfString(texto) <= maxAncho) return texto;
            let corto = texto;
            while (corto.length > 1 && doc.widthOfString(`${corto}…`) > maxAncho) corto = corto.slice(0, -1);
            return `${corto}…`;
        };

        const dibujarFila = (columnas, anchos, datos, y, estilo) => {
            if (estilo === "encabezado") doc.rect(MARGEN, y, ancho, ALTO_FILA).fill(COLOR);
            else if (estilo === "total") doc.rect(MARGEN, y, ancho, ALTO_FILA).fill("#e6f5f3");
            else if (estilo === "zebra") doc.rect(MARGEN, y, ancho, ALTO_FILA).fill("#f5faf9");

            doc.fillColor(estilo === "encabezado" ? "#ffffff" : "#222222")
                .font(estilo === "encabezado" || estilo === "total" ? "Helvetica-Bold" : "Helvetica")
                .fontSize(9);
            let x = MARGEN;
            columnas.forEach((c, i) => {
                const texto = estilo === "encabezado" ? c.header : textoCelda(c, datos[c.key]);
                doc.text(recortar(texto, anchos[i] - 8), x + 4, y + 6, {
                    width: anchos[i] - 8,
                    align: c.dinero || c.numero ? "right" : "left",
                    lineBreak: false
                });
                x += anchos[i];
            });
            return y + ALTO_FILA;
        };

        doc.fillColor(COLOR).font("Helvetica-Bold").fontSize(20).text("SKINCARE NUBE", MARGEN, MARGEN);
        doc.fillColor("#333333").fontSize(14).text(titulo, MARGEN, doc.y + 4);
        doc.font("Helvetica").fontSize(9).fillColor("#666666").text(subtitulo, MARGEN, doc.y + 2);
        doc.text(`Generado el ${new Date().toLocaleString("es-BO")}`, MARGEN, doc.y + 2);
        let y = doc.y + 16;

        for (const seccion of secciones) {
            const anchos = calcularAnchos(seccion.columnas);

            if (seccion.titulo) {
                if (y + 70 > limite()) { doc.addPage(); y = MARGEN; }
                doc.fillColor(COLOR_OSCURO).font("Helvetica-Bold").fontSize(12).text(seccion.titulo, MARGEN, y);
                y += 22;
            }
            if (y + ALTO_FILA * 3 > limite()) { doc.addPage(); y = MARGEN; }
            y = dibujarFila(seccion.columnas, anchos, {}, y, "encabezado");

            if (seccion.filas.length === 0) {
                doc.fillColor("#666666").font("Helvetica-Oblique").fontSize(9)
                    .text("No hay datos en este período.", MARGEN + 4, y + 6, { lineBreak: false });
                y += ALTO_FILA;
            }
            seccion.filas.forEach((fila, i) => {
                if (y + ALTO_FILA > limite()) {
                    doc.addPage();
                    y = dibujarFila(seccion.columnas, anchos, {}, MARGEN, "encabezado");
                }
                y = dibujarFila(seccion.columnas, anchos, fila, y, i % 2 === 1 ? "zebra" : "normal");
            });

            if (y + ALTO_FILA > limite()) {
                doc.addPage();
                y = dibujarFila(seccion.columnas, anchos, {}, MARGEN, "encabezado");
            }
            y = dibujarFila(seccion.columnas, anchos, seccion.totales, y, "total");
            y += 24;
        }

        const paginas = doc.bufferedPageRange();
        for (let i = 0; i < paginas.count; i++) {
            doc.switchToPage(i);
            doc.page.margins.bottom = 0;
            doc.fillColor("#888888").font("Helvetica").fontSize(8)
                .text(`Página ${i + 1} de ${paginas.count}`, MARGEN, doc.page.height - 30, {
                    width: ancho, align: "center", lineBreak: false
                });
        }
        doc.end();
    } catch (error) {
        reject(error);
    }
});

const rango = (r) => `Del ${r.desde} al ${r.hasta} · solo ventas con pago confirmado`;

const pdfVentas = (r) => {
    const columnas = (primera) => [
        { header: primera, key: "clave", peso: 28 },
        { header: "Ventas", key: "ventas", peso: 12, numero: true },
        { header: "Ingresos", key: "ingresos", peso: 20, dinero: true },
        { header: "Costo", key: "costo", peso: 20, dinero: true },
        { header: "Ganancia", key: "ganancia", peso: 20, dinero: true }
    ];
    return generarReportePDF({
        titulo: `Reporte de ventas por ${r.agrupar === "mes" ? "mes" : "día"}`,
        subtitulo: rango(r),
        secciones: [
            { columnas: columnas(r.agrupar === "mes" ? "Mes" : "Día"), filas: r.filas, totales: r.totales },
            { titulo: "Ventas por vendedor", columnas: columnas("Vendedor"), filas: r.por_vendedor, totales: r.totales }
        ]
    });
};

const pdfGanancias = (r) => generarReportePDF({
    titulo: "Ganancias por producto",
    subtitulo: rango(r),
    secciones: [{
        columnas: [
            { header: "Producto", key: "producto", peso: 34 },
            { header: "Unidades", key: "unidades", peso: 12, numero: true },
            { header: "Ingresos", key: "ingresos", peso: 18, dinero: true },
            { header: "Costo", key: "costo", peso: 18, dinero: true },
            { header: "Ganancia", key: "ganancia", peso: 18, dinero: true }
        ],
        filas: r.filas,
        totales: { producto: "Total", ...r.totales }
    }]
});

const pdfInventario = (r) => generarReportePDF({
    titulo: "Reporte de inventario",
    subtitulo: "Productos activos",
    secciones: [{
        columnas: [
            { header: "Producto", key: "producto", peso: 28 },
            { header: "Categoría", key: "categoria", peso: 17 },
            { header: "Stock", key: "stock", peso: 8, numero: true },
            { header: "Mínimo", key: "stock_minimo", peso: 9, numero: true },
            { header: "Costo", key: "costo", peso: 13, dinero: true },
            { header: "Valor costo", key: "valor_costo", peso: 15, dinero: true },
            { header: "Bajo mín.", key: "bajo", peso: 10 }
        ],
        filas: r.filas.map((f) => ({ ...f, bajo: f.bajo_minimo ? "Sí" : "No" })),
        totales: {
            producto: "Total",
            categoria: `${r.totales.productos} ${r.totales.productos === 1 ? "producto" : "productos"}`,
            stock: r.totales.unidades,
            valor_costo: r.totales.valor_costo,
            bajo: `${r.totales.bajo_minimo} bajo`
        }
    }]
});

module.exports = { pdfVentas, pdfGanancias, pdfInventario };
