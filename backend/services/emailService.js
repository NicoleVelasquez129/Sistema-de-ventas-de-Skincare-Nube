const nodemailer = require("nodemailer");

let transporter = null;

const smtpConfigurado = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const obtenerTransporter = () => {
    if (!transporter) {
        const puerto = Number(process.env.SMTP_PORT || 587);
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: puerto,
            secure: puerto === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
    }
    return transporter;
};

// Envía un correo. Si no hay SMTP configurado en .env, lo muestra en la consola (modo desarrollo).
const enviarCorreo = async ({ para, asunto, texto, html, adjuntos }) => {
    if (!smtpConfigurado()) {
        console.log(`\n[CORREO SIMULADO: falta configurar SMTP en .env]\nPara: ${para}\nAsunto: ${asunto}\n${texto || ""}\n`);
        return { simulado: true };
    }
    await obtenerTransporter().sendMail({
        from: process.env.MAIL_FROM || `"Skincare Nube" <${process.env.SMTP_USER}>`,
        to: para,
        subject: asunto,
        text: texto,
        html,
        attachments: adjuntos
    });
    return { simulado: false };
};

async function enviarFacturaPorCorreo(destinatario, datosVenta, pdfBuffer) {
    const mailOptions = {
        from: '"Skincare Nube" <no-reply@skinkernube.com>',
        to: destinatario,
        subject: `Confirmación de compra #${datosVenta.id_venta} - Skincare Nube`,
        html: `
            <div style="font-family: sans-serif; color: #333;">
                <h2 style="color: #68c3b7;">¡Gracias por tu compra en Skincare Nube!</h2>
                <p>Tu pedido <strong>#${datosVenta.id_venta}</strong> ha sido registrado correctamente.</p>
                <p><strong>Total a pagar:</strong> $${Number(datosVenta.total).toFixed(2)} (Pago al recibir)</p>
                <p>Adjunto a este correo encontrarás la factura en formato PDF con el detalle de tu pedido.</p>
            </div>
        `,
        attachments: [
            {
                filename: `Factura_SkincareNube_${datosVenta.id_venta}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };
    return await transporter.sendMail(mailOptions);
}

module.exports = { enviarCorreo,
    enviarFacturaPorCorreo
 };