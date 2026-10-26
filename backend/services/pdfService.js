const PDFDocument = require('pdfkit');

/**
 * Genera un Buffer en PDF con la factura de la venta.
 * @param {Object} ventaData - Objeto con datos de la venta, usuario y productos.
 * @returns {Promise<Buffer>}
 */
function generarFacturaPDF(ventaData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // --- CABECERA ---
            doc.fillColor('#68c3b7')
               .fontSize(22)
               .text('SKINCARE NUBE', 50, 50, { bold: true });

            doc.fillColor('#333333')
               .fontSize(10)
               .text('Comprobante de Venta / Factura', 50, 75)
               .text(`N° Pedido: #${ventaData.id_venta}`, 50, 90)
               .text(`Fecha: ${new Date(ventaData.fecha || Date.now()).toLocaleDateString('es-BO')}`, 50, 105);

            // --- DATOS DEL CLIENTE ---
            doc.moveTo(50, 125).lineTo(550, 125).strokeColor('#e0e0e0').stroke();

            doc.fontSize(11).fillColor('#68c3b7').text('Datos del Cliente:', 50, 135);
            doc.fontSize(10).fillColor('#333333')
               .text(`Nombre: ${ventaData.usuario.nombre}`, 50, 150)
               .text(`Correo: ${ventaData.usuario.correo}`, 50, 165);

            // --- TABLA DE PRODUCTOS ---
            doc.moveTo(50, 185).lineTo(550, 185).strokeColor('#e0e0e0').stroke();

            let y = 200;
            doc.fontSize(10).fillColor('#68c3b7');
            doc.text('Producto', 50, y);
            doc.text('Cant.', 280, y, { width: 50, align: 'center' });
            doc.text('P. Unit.', 350, y, { width: 80, align: 'right' });
            doc.text('Subtotal', 450, y, { width: 100, align: 'right' });

            doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#cccccc').stroke();
            y += 25;

            doc.fillColor('#333333');
            let subtotalProductos = 0;

            ventaData.detalles.forEach((det) => {
                const precio = Number(det.precio_unitario);
                const sub = Number(det.subtotal);
                subtotalProductos += sub;

                doc.text(det.Producto ? det.Producto.nombre : 'Producto', 50, y, { width: 220 });
                doc.text(det.cantidad.toString(), 280, y, { width: 50, align: 'center' });
                doc.text(`$${precio.toFixed(2)}`, 350, y, { width: 80, align: 'right' });
                doc.text(`$${sub.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

                y += 20;
            });

            // --- RESUMEN Y TOTALES ---
            doc.moveTo(50, y + 10).lineTo(550, y + 10).strokeColor('#e0e0e0').stroke();
            y += 25;

            doc.text('Subtotal:', 350, y, { width: 80, align: 'right' });
            doc.text(`$${subtotalProductos.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
            y += 18;

            const costoEnvio = Number(ventaData.envio || 0);
            doc.text('Envío:', 350, y, { width: 80, align: 'right' });
            doc.text(costoEnvio === 0 ? 'Gratis' : `$${costoEnvio.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
            y += 20;

            doc.fontSize(12).fillColor('#68c3b7');
            doc.text('Total a Pagar:', 350, y, { width: 80, align: 'right' });
            doc.text(`$${Number(ventaData.total).toFixed(2)}`, 450, y, { width: 100, align: 'right' });

            // --- PIE DE PÁGINA ---
            doc.fontSize(9).fillColor('#888888')
               .text('Modalidad de pago: Contra entrega (Pago al recibir)', 50, 680, { align: 'center' })
               .text('¡Gracias por tu compra en Skincare Nube!', 50, 695, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generarFacturaPDF
};