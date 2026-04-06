const transporter = require('../config/mailer');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Send OTP email with a professional, branded HTML template.
 * Forest green header, white body, OTP in amber box.
 *
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} name - Farmer's name
 * @returns {Promise<void>}
 *
 * @example
 * await sendOtpEmail('farmer@example.com', '482917', 'Ramesh');
 */
const sendOtpEmail = async (to, otp, name = 'Farmer') => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background:#f4f7f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <div style="max-width:480px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(45,106,79,0.1);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">🌾 KisanSaathi</h1>
        <p style="color:#74C69D;margin:4px 0 0;font-size:14px;">Farmer's Companion</p>
      </div>
      <!-- Body -->
      <div style="padding:32px 24px;text-align:center;">
        <p style="color:#1B1F1E;font-size:16px;margin:0 0 8px;">नमस्ते / Hello, <strong>${name}</strong>!</p>
        <p style="color:#555;font-size:14px;margin:0 0 24px;">Your verification code is:</p>
        <div style="background:linear-gradient(135deg,#F4A261,#E76F51);display:inline-block;padding:16px 40px;border-radius:12px;margin:0 0 24px;">
          <span style="color:#ffffff;font-size:36px;font-weight:bold;letter-spacing:8px;">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px;margin:0;">⏱ Valid for <strong>10 minutes</strong> only</p>
      </div>
      <!-- Footer -->
      <div style="background:#f8faf9;padding:16px 24px;border-top:1px solid #e8ebe9;">
        <p style="color:#888;font-size:11px;text-align:center;margin:0;">
          यदि आपने यह अनुरोध नहीं किया, तो कृपया इस ईमेल को अनदेखा करें।<br>
          If you didn't request this, please ignore this email.<br>
          ही विनंती तुम्ही केली नसल्यास, कृपया हा ईमेल दुर्लक्षित करा.
        </p>
      </div>
    </div>
  </body>
  </html>`;

  try {
    await transporter.sendMail({
      from: `KisanSaathi <${env.EMAIL_USER}>`,
      to,
      subject: `आपका KisanSaathi OTP: ${otp} | Your OTP: ${otp}`,
      html,
    });
    logger.info('OTP email sent', { service: 'mailer', meta: { to } });
  } catch (error) {
    logger.error('Failed to send OTP email', {
      service: 'mailer',
      meta: { to, error: error.message },
    });
    // Don't throw — email failure shouldn't break registration flow in dev
    if (env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

module.exports = { sendOtpEmail };
