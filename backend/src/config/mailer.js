const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

if (env.NODE_ENV !== 'test') {
  transporter.verify()
    .then(() => {
      logger.info('✅ SMTP transporter ready (Gmail App Password)', { service: 'mailer' });
    })
    .catch((err) => {
      logger.error('❌ SMTP transporter verification failed', {
        service: 'mailer',
        meta: { 
          error: err.message,
          code: err.code,
          suggestion: 'This is normal in development. Email will be attempted when needed. Check logs when you actually send an email.'
        },
      });
    });
}

module.exports = transporter;
