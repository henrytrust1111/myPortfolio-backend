import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "henrytrust1111@gmail.com",
      pass: process.env.SMTP_PASSWORD || "aczjynglscskmuie",
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

    // Email to you (admin)
    await transporter.sendMail({
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
    await transporter.sendMail({
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
