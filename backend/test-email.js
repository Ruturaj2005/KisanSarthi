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
    tls: {
      rejectUnauthorized: false,
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
        <div style="max-width:480px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(45,106,79,0.1);">
          <div style="background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">🌾 KisanSaathi</h1>
            <p style="color:#74C69D;margin:4px 0 0;font-size:14px;">Email Test</p>
          </div>
          <div style="padding:32px 24px;text-align:center;">
            <p style="color:#1B1F1E;font-size:16px;">✅ If you see this, email is working!</p>
            <p style="font-size:24px;color:#F4A261;font-weight:bold;">123456</p>
            <p style="color:#888;font-size:13px;">Test OTP Code</p>
          </div>
        </div>
      `,
    });
    console.log('✅ Email sent successfully!');
    console.log('\n📬 Check your Gmail inbox for the test email');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Code:', error.code);
    console.error('\n💡 Common fixes:');
    console.error('1. Make sure EMAIL_PASSWORD is the 16-char App Password (with spaces)');
    console.error('2. Verify 2-Step Verification is enabled on Gmail account');
    console.error('3. Check EMAIL_USER is correct Gmail address');
    console.error('4. Restart backend after changing .env');
    process.exit(1);
  }
})();
