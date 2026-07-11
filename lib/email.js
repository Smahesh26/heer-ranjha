import nodemailer from "nodemailer";

const OTP_TTL_MINUTES = 5;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
  };
}

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) return null;

  transporter = nodemailer.createTransport(smtpConfig);
  return transporter;
}

export async function sendLoginOtpEmail({ to, name, otp }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@heerranjha.local";
  const subject = "Your Heer Ranjha login OTP";
  const greeting = name ? `Hi ${name},` : "Hi,";

  const text = [
    greeting,
    "",
    `Your one-time login code is: ${otp}`,
    `This code expires in ${OTP_TTL_MINUTES} minutes.`,
    "",
    "If you did not request this, please ignore this email.",
    "- Heer Ranjha",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>${greeting}</p>
      <p>Your one-time login code is:</p>
      <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; margin: 16px 0;">${otp}</p>
      <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>- Heer Ranjha</p>
    </div>
  `;

  const mailer = getTransporter();
  if (!mailer) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[OTP-DEV] Login OTP for ${to}: ${otp}`);
      return { delivered: false, mode: "dev-log" };
    }
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM in Render.");
  }

  try {
    await mailer.sendMail({ from, to, subject, text, html, replyTo: from });
  } catch (error) {
    throw new Error(`OTP email failed to send: ${error?.message || "unknown SMTP error"}`);
  }
  return { delivered: true, mode: "smtp" };
}
