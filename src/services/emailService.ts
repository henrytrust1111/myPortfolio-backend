import nodemailer from 'nodemailer';

async function createTransporter() {
  if (process.env.SMTP_HOST) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10) || 587;
    const secure = port === 465;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }

  // No SMTP configured — create a test account (Ethereal) for local development
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

export async function sendContactNotification(
  senderEmail: string,
  senderName: string,
  subject: string,
  message: string
) {
  const transporter = await createTransporter();
  try {
    // Email to admin
    const infoAdmin = await transporter.sendMail({
      from: process.env.SENDER_EMAIL || 'no-reply@example.com',
      to: process.env.SENDER_EMAIL || process.env.SMTP_USER,
      subject: `New Contact: ${subject}`,
      html: `
        <h2>New Message from ${senderName}</h2>
        <p><strong>Email:</strong> ${senderEmail}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    const infoSender = await transporter.sendMail({
      from: process.env.SENDER_EMAIL || 'no-reply@example.com',
      to: senderEmail,
      subject: 'We received your message',
      html: `
        <h2>Hi ${senderName},</h2>
        <p>Thank you for reaching out! I've received your message and will get back to you soon.</p>
        <p>Best regards,<br>Henry Trust</p>
      `,
    });

    // If using Ethereal, log preview URLs for debugging
    const previewAdmin = nodemailer.getTestMessageUrl(infoAdmin);
    const previewSender = nodemailer.getTestMessageUrl(infoSender);
    if (previewAdmin) console.log('Preview admin email:', previewAdmin);
    if (previewSender) console.log('Preview sender email:', previewSender);

    return { infoAdmin, infoSender };
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Failed to send email');
  }
}