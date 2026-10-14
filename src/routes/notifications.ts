import { Hono } from 'hono';
import { sendWhatsAppTemplate, dispatchEmailGateway } from '../services/notificationService.js';

export const notificationsRouter = new Hono();

// POST /api/v1/notifications/whatsapp - Standard WhatsApp Template Dispatch
notificationsRouter.post('/whatsapp', async (c) => {
  try {
    const body = await c.req.json();
    const { contact, template, params, name, fileUrl, pdfName } = body;

    if (!contact || !template) {
      return c.json(
        {
          success: false,
          error: 'Contact number and template name are required',
        },
        400
      );
    }

    const result = await sendWhatsAppTemplate({
      contact,
      template,
      params,
      name,
      fileUrl,
      pdfName,
    });

    return c.json({
      success: result.success,
      httpStatus: result.httpStatus,
      sid: result.sid,
      details: result.details,
      providerResponse: result.providerResponse,
    });
  } catch (err: any) {
    return c.json(
      {
        success: false,
        error: err.message || 'Failed to dispatch WhatsApp notification',
      },
      502
    );
  }
});

// POST /api/v1/notifications/email - Resend Official Email Dispatch
notificationsRouter.post('/email', async (c) => {
  try {
    const body = await c.req.json();
    const { toEmail, subject, htmlContent } = body;

    if (!toEmail || !subject) {
      return c.json(
        {
          success: false,
          error: 'Recipient email and subject are required',
        },
        400
      );
    }

    const result = await dispatchEmailGateway(
      toEmail,
      subject,
      htmlContent || `<p>${subject}</p>`
    );

    return c.json({
      success: result.success,
      messageId: result.messageId,
      details: result.details,
    });
  } catch (err: any) {
    return c.json(
      {
        success: false,
        error: err.message || 'Failed to dispatch email notification',
      },
      502
    );
  }
});
