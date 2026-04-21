const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
  secure: false,
  port: 587,
});

console.log('Testing Gmail SMTP connection...');
console.log(`User: ${process.env.EMAIL_USER}`);
console.log(`Password length: ${process.env.EMAIL_PASSWORD?.length}`);

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:', error.message);
    console.error('Code:', error.code);
    console.error('\n⚠️  SOLUTIONS:');
    console.error('1. Make sure 2FA is ENABLED on Google Account');
    console.error('2. Regenerate App Password at: https://myaccount.google.com/apppasswords');
    console.error('3. Select "Mail" + "Windows Computer"');
    console.error('4. Copy the 16-char password WITHOUT spaces');
    console.error('5. Update EMAIL_PASSWORD in .env and restart');
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!');
    console.log('Email is ready to send OTPs');
    process.exit(0);
  }
});
