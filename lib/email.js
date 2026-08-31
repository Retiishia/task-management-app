import nodemailer from 'nodemailer';

/**
 * Sends a 6-digit account verification email using Nodemailer (SMTP).
 * Auto-detects Gmail vs Yahoo SMTP servers based on the sender email domain.
 * Includes a terminal fallback logger if SMTP credentials are missing or failing.
 */
export async function sendVerificationEmail({ to, name, code }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // Fallback: If credentials are not set, log the verification code to the console
  if (!user || !pass) {
    console.log('\n===========================================================');
    console.log('✉️  [SIMULATION MODE] Verification Email Triggered');
    console.log(`To: ${name} <${to}>`);
    console.log(`🔑 6-Digit OTP Verification Code: ${code}`);
    console.log('-----------------------------------------------------------');
    console.log('To send REAL emails via Gmail/Yahoo, add EMAIL_USER and EMAIL_PASS to .env.local');
    console.log('===========================================================\n');
    return { success: true, simulated: true };
  }

  // Auto-detect SMTP Host based on email domain if SMTP_HOST is generic
  let host = process.env.SMTP_HOST;
  if (!host || host === 'smtp.mail.yahoo.com') {
    if (user.toLowerCase().endsWith('@gmail.com')) {
      host = 'smtp.gmail.com';
    } else {
      host = 'smtp.mail.yahoo.com';
    }
  }

  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 40px 20px; border-radius: 16px; max-width: 500px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #818cf8; margin: 0; font-size: 24px;">Retiishia Tasks Project</h1>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 4px;">Account Verification</p>
        </div>
        
        <div style="background-color: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="font-size: 18px; margin-top: 0; color: #ffffff;">Hello ${name},</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
            Thank you for registering with Retiishia Tasks Project! Use the 6-digit verification code below to complete your account setup:
          </p>

          <div style="background-color: #1e1b4b; border: 1px solid #6366f1; border-radius: 8px; padding: 16px; margin: 20px 0; letter-spacing: 8px; font-size: 28px; font-weight: bold; color: #c7d2fe;">
            ${code}
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
            This verification code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
          &copy; ${new Date().getFullYear()} Retiishia Tasks Project. All rights reserved.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Retiishia Tasks Project" <${user}>`,
      to,
      subject: `🔑 Your Retiishia Tasks Project Verification Code: ${code}`,
      html: htmlContent,
    });

    console.log(`✅ [REAL EMAIL SENT] Verification code successfully sent to ${to} via ${host}`);
    return { success: true, simulated: false };
  } catch (error) {
    console.error('❌ Failed to send verification email via SMTP:', error);
    console.log(`🔑 [FALLBACK TERMINAL CODE] Verification Code for ${to}: ${code}`);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a 6-digit password reset OTP email using Nodemailer (SMTP).
 */
export async function sendPasswordResetEmail({ to, name, code }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.log('\n===========================================================');
    console.log('🔒 [SIMULATION MODE] Password Reset Email Triggered');
    console.log(`To: ${name || 'User'} <${to}>`);
    console.log(`🔑 6-Digit Password Reset Code: ${code}`);
    console.log('-----------------------------------------------------------');
    console.log('To send REAL emails via Gmail/Yahoo, add EMAIL_USER and EMAIL_PASS to .env.local');
    console.log('===========================================================\n');
    return { success: true, simulated: true };
  }

  let host = process.env.SMTP_HOST;
  if (!host || host === 'smtp.mail.yahoo.com') {
    if (user.toLowerCase().endsWith('@gmail.com')) {
      host = 'smtp.gmail.com';
    } else {
      host = 'smtp.mail.yahoo.com';
    }
  }

  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 40px 20px; border-radius: 16px; max-width: 500px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #818cf8; margin: 0; font-size: 24px;">TaskFlow Pro</h1>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 4px;">Password Reset Request</p>
        </div>
        
        <div style="background-color: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="font-size: 18px; margin-top: 0; color: #ffffff;">Hello ${name || 'there'},</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
            We received a request to reset your password. Use the 6-digit code below to set a new password:
          </p>

          <div style="background-color: #1e1b4b; border: 1px solid #6366f1; border-radius: 8px; padding: 16px; margin: 20px 0; letter-spacing: 8px; font-size: 28px; font-weight: bold; color: #c7d2fe;">
            ${code}
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
            This reset code will expire in <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email and your account remains secure.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
          &copy; ${new Date().getFullYear()} TaskFlow Pro. All rights reserved.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"TaskFlow Pro" <${user}>`,
      to,
      subject: `🔒 Your TaskFlow Pro Password Reset Code: ${code}`,
      html: htmlContent,
    });

    console.log(`✅ [PASSWORD RESET EMAIL SENT] Reset code successfully sent to ${to}`);
    return { success: true, simulated: false };
  } catch (error) {
    console.error('❌ Failed to send reset email via SMTP:', error);
    console.log(`🔑 [FALLBACK TERMINAL CODE] Reset Code for ${to}: ${code}`);
    return { success: false, error: error.message };
  }
}
