import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

export const sendMail = async ({ to, subject, html }) => {
  if (!to) {
    throw new Error('Email recipient is required');
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async (to, resetUrl) => {
  const subject = 'Ichgram password reset';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener">Reset password</a></p>
      <p>This link is valid for 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>— Ichgram team</p>
    </div>
  `;

  try {
    await sendMail({ to, subject, html });
  } catch (error) {
    logger.error('Failed to send password reset email', error);
    throw error;
  }
};
