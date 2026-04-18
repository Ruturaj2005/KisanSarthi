const twilio = require('twilio');
const env = require('../config/env');
const logger = require('../utils/logger');
const { SchemeNotification } = require('../models');

let twilioClient = null;

// Validate Twilio credentials format
const isValidTwilioSid = (sid) => sid && typeof sid === 'string' && sid.startsWith('AC') && sid.length === 34;

const initializeTwilio = () => {
  if (twilioClient) return twilioClient;
  
  if (!env.WHATSAPP_ENABLED) {
    logger.warn('⚠️  WhatsApp notifications disabled (WHATSAPP_ENABLED=false)', { service: 'whatsapp' });
    return null;
  }

  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE) {
    logger.warn('⚠️  WhatsApp notifications disabled (missing credentials)', {
      service: 'whatsapp',
      meta: {
        hasSid: !!env.TWILIO_ACCOUNT_SID,
        hasToken: !!env.TWILIO_AUTH_TOKEN,
        hasPhone: !!env.TWILIO_PHONE,
      },
    });
    return null;
  }

  if (!isValidTwilioSid(env.TWILIO_ACCOUNT_SID)) {
    logger.warn('⚠️  WhatsApp disabled (invalid Account SID format - must start with AC)', {
      service: 'whatsapp',
      meta: { sidFormat: env.TWILIO_ACCOUNT_SID?.substring(0, 10) },
    });
    return null;
  }

  try {
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    logger.info('✅ Twilio WhatsApp client initialized', { service: 'whatsapp' });
    return twilioClient;
  } catch (error) {
    logger.error('❌ Failed to initialize Twilio', {
      service: 'whatsapp',
      meta: { error: error.message },
    });
    return null;
  }
};

/**
 * Send scheme notification via WhatsApp
 * @param {string} whatsappNumber - 10-digit Indian number
 * @param {Object} scheme - Scheme object
 * @param {string} lang - Language (hi, en)
 * @returns {Promise<{status: string, messageId?: string, error?: string}>}
 */
const sendSchemeNotification = async (whatsappNumber, scheme, lang = 'hi') => {
  const client = initializeTwilio();
  
  if (!client) {
    logger.warn('WhatsApp disabled, notification not sent', { service: 'whatsapp', meta: { whatsappNumber } });
    return { status: 'skipped', reason: 'WhatsApp disabled' };
  }

  const formattedNumber = `+91${whatsappNumber}`;
  
  // Message in Hindi
  const messageHi = `📢 नई सरकारी योजना

🎯 ${scheme.title}

लाभ: ${scheme.benefits}

🔗 आवेदन करें:
${scheme.applicationUrl}

Aapla Sarkar पोर्टल से
KisanSaathi द्वारा`;

  // Message in English
  const messageEn = `📢 New Government Scheme

🎯 ${scheme.title}

Benefits: ${scheme.benefits}

🔗 Apply:
${scheme.applicationUrl}

From Aapla Sarkar Portal
By KisanSaathi`;

  const message = lang === 'hi' ? messageHi : messageEn;

  try {
    const result = await client.messages.create({
      from: `whatsapp:${env.TWILIO_PHONE}`,
      to: `whatsapp:${formattedNumber}`,
      body: message,
    });

    logger.info('✅ WhatsApp notification sent', {
      service: 'whatsapp',
      meta: { 
        to: whatsappNumber,
        scheme: scheme.title,
        messageId: result.sid,
      },
    });

    return {
      status: 'sent',
      messageId: result.sid,
    };
  } catch (error) {
    logger.error('❌ Failed to send WhatsApp notification', {
      service: 'whatsapp',
      meta: {
        to: whatsappNumber,
        scheme: scheme.title,
        error: error.message,
      },
    });

    return {
      status: 'failed',
      error: error.message,
    };
  }
};

/**
 * Send scheme to all farmers with WhatsApp number
 * @param {Array} farmers - Array of farmer objects
 * @param {Object} scheme - Scheme object
 */
const broadcastScheme = async (farmers, scheme) => {
  logger.info('🔄 Broadcasting scheme to farmers', {
    service: 'whatsapp',
    meta: { scheme: scheme.title, farmerCount: farmers.length },
  });

  let successCount = 0;
  let failureCount = 0;

  for (const farmer of farmers) {
    if (!farmer.whatsappNumber || !farmer.notificationsEnabled) {
      continue;
    }

    try {
      const result = await sendSchemeNotification(
        farmer.whatsappNumber,
        scheme,
        farmer.preferredLang || 'hi'
      );

      // Create notification record
      const notification = await SchemeNotification.create({
        farmerId: farmer._id,
        schemeId: scheme._id,
        whatsappNumber: farmer.whatsappNumber,
        status: result.status === 'sent' ? 'sent' : 'failed',
        messageId: result.messageId || null,
        errorMessage: result.error || null,
        sentAt: result.status === 'sent' ? new Date() : null,
      });

      if (result.status === 'sent') {
        successCount++;
      } else {
        failureCount++;
      }

      // Rate limiting: 1 message per second to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error('Error processing farmer notification', {
        service: 'whatsapp',
        meta: { farmerId: farmer._id, error: error.message },
      });
      failureCount++;
    }
  }

  logger.info('✅ Broadcast complete', {
    service: 'whatsapp',
    meta: { successCount, failureCount, total: farmers.length },
  });

  return { successCount, failureCount, total: farmers.length };
};

module.exports = {
  sendSchemeNotification,
  broadcastScheme,
  isTwilioConfigured: () => !!initializeTwilio(),
};
