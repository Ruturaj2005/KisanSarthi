const nodemailer = require('nodemailer');
const env = require('./src/config/env');

(async () => {
  console.log('🧪 Testing Email Configuration...\n');
  console.log('EMAIL_USER:', env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', env.EMAIL_PASSWORD ? '✅ (set)' : '❌ (missing)');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASSWORD,
    },
  });

  try {
    console.log('\n📡 Verifying transporter...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    console.log('\n📧 Sending test email...');
    const result = await transporter.sendMail({
      from: `KisanSaathi <${env.EMAIL_USER}>`,
      to: env.EMAIL_USER,
      subject: 'KisanSaathi Email Test - OTP: 123456',
      html: `
        <div style="max-width:480px;margin:20px auto;background:#ffffff;border-radius:12px;">
          <div style="background:#1B4332;padding:24px;text-align:center;color:#fff;">
            <h1>🌾 KisanSaathi - Email Test</h1>
          </div>
          <div style="padding:32px 24px;text-align:center;">
            <p>If you see this, email is working! ✅</p>
            <p style="font-size:24px;color:#F4A261;">123456</p>
          </div>
        </div>
      `,
    });
    console.log('✅ Email sent successfully!');
    console.log('Response:', result.response);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Code:', error.code);
    console.error('\n💡 Common fixes:');
    console.error('1. Make sure EMAIL_PASSWORD is the 16-char App Password (with spaces)');
    console.error('2. Verify 2-Step Verification is enabled on Gmail account');
    console.error('3. Check EMAIL_USER is correct Gmail address');
    process.exit(1);
  }
})();
