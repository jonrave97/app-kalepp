import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

console.log('[mailer] Configurado con host:', process.env.SMTP_HOST, 'port:', process.env.SMTP_PORT);
// ─── HTML template ────────────────────────────────────────────────────────────
function buildHtml({ request, employeeName, positionName, warehouseName, eppItems, inlineCount }) {
    const eppRows = eppItems.map(e => `
        <tr>
            <td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">
                <strong style="font-family:monospace;color:#6b7280;">${e.code}</strong>&nbsp;&nbsp;${e.name}
            </td>
            <td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center;">
                ${e.quantity}
            </td>
        </tr>`).join('');

    const inlineImgSection = inlineCount > 0 ? `
        <tr>
            <td style="padding:24px 0 0;">
                <p style="margin:0 0 12px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    Evidencia fotográfica
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${Array.from({ length: inlineCount }, (_, i) => `
                    <tr>
                        <td align="center" style="padding:6px 0;">
                            <img src="cid:photo${i + 1}"
                                 style="max-width:420px;width:100%;border-radius:8px;border:1px solid #e5e7eb;display:block;" />
                        </td>
                    </tr>`).join('')}
                </table>
            </td>
        </tr>` : '';

    const fecha = new Date(request.date).toLocaleDateString('es-CL', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:rgb(255 105 0);font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f3f4f6">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px;">

        <!-- Header -->
        <tr>
          <td style="background:rgb(255 105 0);padding:28px 32px;">
            <p style="margin:0;color:#bfdbfe;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;">
              Nueva solicitud de EPP
            </p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:26px;font-weight:700;">
              Solicitud N° ${request.code}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">

              <!-- Info rows -->
              <tr>
                <td style="padding-bottom:20px;">
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
                    <tr style="background:#f9fafb;">
                      <td width="38%" style="padding:10px 16px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid #f0f0f0;">Trabajador</td>
                      <td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #f0f0f0;">${employeeName}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 16px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid #f0f0f0;background:#f9fafb;">Cargo</td>
                      <td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #f0f0f0;">${positionName || '—'}</td>
                    </tr>
                    <tr style="background:#f9fafb;">
                      <td style="padding:10px 16px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid #f0f0f0;">Bodega</td>
                      <td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #f0f0f0;">${warehouseName}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 16px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid #f0f0f0;background:#f9fafb;">Motivo</td>
                      <td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #f0f0f0;">${request.reason}</td>
                    </tr>
                    <tr style="background:#f9fafb;">
                      <td style="padding:10px 16px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Fecha</td>
                      <td style="padding:10px 16px;font-size:14px;color:#111827;">${fecha}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- EPP table -->
              <tr>
                <td style="padding-bottom:0;">
                  <p style="margin:0 0 10px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    EPPs solicitados
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
                    <thead>
                      <tr style="background:#f9fafb;">
                        <th style="padding:10px 14px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;text-align:left;letter-spacing:0.4px;border-bottom:1px solid #e5e7eb;">
                          Descripción
                        </th>
                        <th style="padding:10px 14px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;text-align:center;letter-spacing:0.4px;border-bottom:1px solid #e5e7eb;width:70px;">
                          Cant.
                        </th>
                      </tr>
                    </thead>
                    <tbody>${eppRows}</tbody>
                  </table>
                </td>
              </tr>

              <!-- Button -->
              <tr>
                <td style="padding-top:26px;text-align:center;">
                  <a href="${process.env.FRONTEND_URL}/warehousemanager"
                     style="
                       display:inline-block;
                       background:rgb(255 105 0);
                       color:#ffffff;
                       padding:12px 22px;
                       border-radius:6px;
                       text-decoration:none;
                       font-weight:bold;
                       font-size:14px;
                       letter-spacing:0.3px;
                     ">
                    Ver solicitud en el sistema
                  </a>
                </td>
              </tr>

              <!-- Inline images -->
              ${inlineImgSection}

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
              Este correo fue generado automáticamente. Por favor no respondas a este mensaje.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─── Send ─────────────────────────────────────────────────────────────────────
export const sendRequestEmail = async ({
    request,
    employeeName,
    positionName,
    warehouseName,
    eppItems,
    approvers,
    images,
}) => {
    const to = approvers.map(a => a.email).filter(Boolean).join(', ');
    if (!to) {
        console.warn('[mailer] Sin aprobadores con email, correo no enviado');
        return;
    }

    const inlineImages = images.slice(0, 3);
    const extraImages  = images.slice(3);

    const attachments = [];

    inlineImages.forEach((file, i) => {
        attachments.push({
            filename:    `foto${i + 1}.jpg`,
            content:     file.buffer,
            cid:         `photo${i + 1}`,
            contentType: 'image/jpeg',
        });
    });

    extraImages.forEach((file, i) => {
        attachments.push({
            filename:    `adjunto_${i + 4}.jpg`,
            content:     file.buffer,
            contentType: file.mimetype || 'image/jpeg',
        });
    });

    const html = buildHtml({
        request,
        employeeName,
        positionName,
        warehouseName,
        eppItems,
        inlineCount: inlineImages.length,
    });

    await transporter.sendMail({
        from:        `"Sistema Kalepp" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject:     `Solicitud EPP N° ${request.code} — ${employeeName}`,
        html,
        attachments,
    });

    console.log(`[mailer] Correo enviado a: ${to}`);
};
