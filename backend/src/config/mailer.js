const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: env.EMAIL_USER,
    clientId: env.CLIENT_ID,
    clientSecret: env.CLIENT_SECRET,
    refreshToken: env.REFRESH_TOKEN,
  },
});

if (env.NODE_ENV !== 'test') {
  transporter.verify()
    .then(() => logger.info('SMTP transporter ready (OAuth2)', { service: 'mailer' }))
    .catch((err) => logger.warn('SMTP transporter not ready — emails will fail', {
      service: 'mailer',
      meta: { error: err.message },
    }));
}

module.exports = transporter;
