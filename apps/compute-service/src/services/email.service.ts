import { sendPlainEmailSchema } from "@zerocancer/shared";
import nodemailer from "nodemailer";
import { z } from "zod";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: z.infer<typeof sendPlainEmailSchema>) {
  // Convert array to comma-separated string if needed
  const toAddress = Array.isArray(to) ? to.join(", ") : to;

  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to: toAddress,
    subject,
    html,
    text,
  });
}
