const { reporteVentasService, reporteGananciasService, reporteInventarioService } = require("../services/reportService");
const { excelVentas, excelGanancias, excelInventario } = require("../services/excelService");
const { pdfVentas, pdfGanancias, pdfInventario } = require("../services/pdfReportService");

const responder = (res, error) => {
    const interno = error instanceof TypeError || error.name?.startsWith("Sequelize");
    if (interno) console.error("Error interno en reportes:", error);
    const mensaje = interno ? "No se pudo generar el reporte por un problema del servidor." : error.message;
    return res.status(error.status || (interno ? 500 : 400)).json({ success: false, mensaje, error: mensaje });
};

const enviarArchivo = (res, buffer, nombre, formato) => {
    const tipos = {
        excel: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
        pdf: ["application/pdf", "pdf"]
    };
    const [contentType, extension] = tipos[formato];
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename=${nombre}.${extension}`);
    return res.send(Buffer.from(buffer));
};

const reporteVentas = async (req, res) => {
    try {
        const data = await reporteVentasService(req.query.desde, req.query.hasta, req.query.agrupar);
        const nombre = `Reporte_ventas_${data.desde}_${data.hasta}`;
        if (req.query.formato === "excel") return enviarArchivo(res, await excelVentas(data), nombre, "excel");
        if (req.query.formato === "pdf") return enviarArchivo(res, await pdfVentas(data), nombre, "pdf");
        return res.status(200).json({ success: true, data });
    } catch (error) { return responder(res, error); }
};

const reporteGanancias = async (req, res) => {
    try {
        const data = await reporteGananciasService(req.query.desde, req.query.hasta);
        const nombre = `Reporte_ganancias_${data.desde}_${data.hasta}`;
        if (req.query.formato === "excel") return enviarArchivo(res, await excelGanancias(data), nombre, "excel");
        if (req.query.formato === "pdf") return enviarArchivo(res, await pdfGanancias(data), nombre, "pdf");
        return res.status(200).json({ success: true, data });
    } catch (error) { return responder(res, error); }
};

const reporteInventario = async (req, res) => {
    try {
        const data = await reporteInventarioService();
        if (req.query.formato === "excel") return enviarArchivo(res, await excelInventario(data), "Reporte_inventario", "excel");
        if (req.query.formato === "pdf") return enviarArchivo(res, await pdfInventario(data), "Reporte_inventario", "pdf");
        return res.status(200).json({ success: true, data });
    } catch (error) { return responder(res, error); }
};

module.exports = { reporteVentas, reporteGanancias, reporteInventario };
