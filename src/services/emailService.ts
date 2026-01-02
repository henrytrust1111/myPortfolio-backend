import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    // Timeouts to fail faster on network issues (ms)
    connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || "10000"),
    greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || "10000"),
    socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || "10000"),
    auth: {
      user: process.env.SMTP_USER || "henrytrust1111@gmail.com",
      pass: process.env.SMTP_PASSWORD || "dyyaijpjfwuyapam",
    },
  });
}

export async function sendContactNotification(
  senderEmail: string,
  senderName: string,
  subject: string,
  message: string
) {
  try {
    const transporter = getTransporter();
    // helper to attempt send with retries
    const attemptSend = async (opts: nodemailer.SendMailOptions) => {
      const maxAttempts = parseInt(process.env.SMTP_MAX_RETRIES || "3");
      let attempt = 0;
      const baseDelay = 500; // ms
      while (attempt < maxAttempts) {
        try {
          attempt++;
          return await transporter.sendMail(opts);
        } catch (err: any) {
          const isLast = attempt >= maxAttempts;
          console.error(`Email send attempt ${attempt} failed:`, err && err.message ? err.message : err);
          if (isLast) throw err;
          // exponential backoff
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    };

    // Email to you (admin)
    await attemptSend({
      from: process.env.SENDER_EMAIL || "henrytrust1111@gmail.com",
      to: process.env.SENDER_EMAIL || "henrytrust1111@gmail.com",
      subject: `New Contact: ${subject}`,
      html: `
        <h2>New Message from ${senderName}</h2>
        <p><strong>Email:</strong> ${senderEmail}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    // Confirmation email to sender
    await attemptSend({
      from: process.env.SENDER_EMAIL || "henrytrust1111@gmail.com",
      to: senderEmail,
      subject: "We received your message",
      html: `
        <h2>Hi ${senderName},</h2>
        <p>Thank you for reaching out! I've received your message and will get back to you soon.</p>
        <p>Best regards,<br>Henry Trust</p>
      `,
    });
  } catch (error) {
    console.error("Email error:", error);
    throw new Error("Failed to send email");
  }
}
