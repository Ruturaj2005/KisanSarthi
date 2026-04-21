const { Farmer, Scheme, SchemeNotification } = require('../models');
const { sendSchemeNotification } = require('./whatsapp.service');
const logger = require('../utils/logger');

const AAPLE_SARKAR_URLS = [
  'https://aaplesarkar.mahaonline.gov.in/en',
  'https://aaplesarkar.mahaonline.gov.in/mr',
];

const dedupeBy = (items, keySelector) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keySelector(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const normalizeAbsoluteUrl = (href) => {
  if (!href || typeof href !== 'string') return '';
  const trimmed = href.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `https://aaplesarkar.mahaonline.gov.in${trimmed}`;
  return `https://aaplesarkar.mahaonline.gov.in/${trimmed.replace(/^\/+/, '')}`;
};

const stripTags = (input) => {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

const toExternalId = (url, title) => {
  const base = `${url || ''}|${title || ''}`.toLowerCase().trim();
  return base.replace(/[^a-z0-9|:/._-]+/g, '-').slice(0, 250);
};

const inferCategory = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('loan') || text.includes('credit')) return 'loan';
  if (text.includes('subsidy')) return 'subsidy';
  if (text.includes('insurance')) return 'insurance';
  if (text.includes('seed') || text.includes('fertilizer') || text.includes('input')) return 'input';
  if (text.includes('technology') || text.includes('drone') || text.includes('machine')) return 'tech';
  return 'other';
};

const parseSchemesFromHtml = (html) => {
  if (!html || typeof html !== 'string') return [];

  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const schemes = [];
  let match;

  while ((match = anchorPattern.exec(html)) !== null) {
    const rawHref = match[1] || '';
    const anchorText = stripTags(match[2] || '');
    const href = normalizeAbsoluteUrl(rawHref);

    // Keep likely scheme links only.
    const isLikelySchemeLink = /scheme|yojana|service|apply|application/i.test(`${href} ${anchorText}`);
    if (!isLikelySchemeLink || !anchorText || anchorText.length < 8) {
      continue;
    }

    schemes.push({
      title: anchorText.slice(0, 500),
      description: '',
      benefits: `Visit portal for details: ${anchorText}`,
      eligibility: 'Please check official scheme page on Aaple Sarkar.',
      applicationUrl: href,
      portal: 'aapla_sarkar',
      category: inferCategory(anchorText),
      state: 'Maharashtra',
      scrapedAt: new Date(),
      externalId: toExternalId(href, anchorText),
      isActive: true,
    });
  }

  return dedupeBy(schemes, (s) => s.externalId);
};

const fetchPortalHtml = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'KisanSaathi/1.0 (scheme-sync)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url} (status ${response.status})`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

const fetchSchemesFromAapleSarkar = async () => {
  const all = [];

  for (const url of AAPLE_SARKAR_URLS) {
    try {
      const html = await fetchPortalHtml(url);
      const parsed = parseSchemesFromHtml(html);
      all.push(...parsed);
    } catch (error) {
      logger.error('Failed to fetch schemes from portal URL', {
        service: 'scheme',
        meta: { url, error: error.message },
      });
    }
  }

  return dedupeBy(all, (s) => s.externalId);
};

const upsertPortalSchemes = async () => {
  const schemes = await fetchSchemesFromAapleSarkar();

  let inserted = 0;
  let updated = 0;
  const changedSchemeIds = [];

  for (const schemeData of schemes) {
    if (!schemeData.externalId) continue;

    const existing = await Scheme.findOne({ externalId: schemeData.externalId });
    if (!existing) {
      const created = await Scheme.create(schemeData);
      inserted++;
      changedSchemeIds.push(created._id);
      continue;
    }

    existing.title = schemeData.title;
    existing.description = schemeData.description;
    existing.benefits = schemeData.benefits;
    existing.eligibility = schemeData.eligibility;
    existing.applicationUrl = schemeData.applicationUrl;
    existing.category = schemeData.category;
    existing.state = schemeData.state;
    existing.portal = schemeData.portal;
    existing.scrapedAt = new Date();
    existing.isActive = true;
    await existing.save();
    updated++;
    changedSchemeIds.push(existing._id);
  }

  return {
    fetched: schemes.length,
    inserted,
    updated,
    changedSchemeIds,
  };
};

const getLoggedInFarmersForNotifications = async () => Farmer.find({
  refreshToken: { $exists: true, $ne: null },
  whatsappNumber: { $exists: true, $ne: '' },
  notificationsEnabled: { $ne: false },
  isVerified: true,
})
  .select('_id whatsappNumber preferredLang refreshToken notificationsEnabled')
  .lean();

const upsertNotificationRecord = async ({ farmer, scheme, sendResult }) => {
  const status = sendResult.status === 'sent' ? 'sent' : 'failed';
  await SchemeNotification.updateOne(
    { farmerId: farmer._id, schemeId: scheme._id },
    {
      $set: {
        whatsappNumber: farmer.whatsappNumber,
        status,
        messageId: sendResult.messageId || null,
        errorMessage: sendResult.error || null,
        sentAt: sendResult.status === 'sent' ? new Date() : null,
      },
      $setOnInsert: {
        retryCount: 0,
      },
    },
    { upsert: true }
  );
};

const notifyFarmerForSchemes = async (farmer, schemes) => {
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const scheme of schemes) {
    const existing = await SchemeNotification.findOne({
      farmerId: farmer._id,
      schemeId: scheme._id,
      status: 'sent',
    }).select('_id');

    if (existing) {
      skipped++;
      continue;
    }

    const result = await sendSchemeNotification(
      farmer.whatsappNumber,
      scheme,
      farmer.preferredLang || 'hi'
    );

    await upsertNotificationRecord({ farmer, scheme, sendResult: result });

    if (result.status === 'sent') {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, skipped, failed };
};

const notifyLoggedInFarmersForSchemes = async (schemeIds = []) => {
  if (!schemeIds.length) {
    return { farmers: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const farmers = await getLoggedInFarmersForNotifications();
  if (!farmers.length) {
    return { farmers: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const schemes = await Scheme.find({ _id: { $in: schemeIds }, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  if (!schemes.length) {
    return { farmers: farmers.length, sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const farmer of farmers) {
    const result = await notifyFarmerForSchemes(farmer, schemes);
    sent += result.sent;
    skipped += result.skipped;
    failed += result.failed;
  }

  return { farmers: farmers.length, sent, skipped, failed };
};

const notifySingleLoggedInFarmerForAllSchemes = async (farmerId) => {
  const farmer = await Farmer.findOne({
    _id: farmerId,
    refreshToken: { $exists: true, $ne: null },
    whatsappNumber: { $exists: true, $ne: '' },
    notificationsEnabled: { $ne: false },
    isVerified: true,
  })
    .select('_id whatsappNumber preferredLang')
    .lean();

  if (!farmer) {
    return { sent: 0, skipped: 0, failed: 0, reason: 'No active logged-in farmer with WhatsApp settings' };
  }

  const schemes = await Scheme.find({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  return notifyFarmerForSchemes(farmer, schemes);
};

const syncPortalSchemesAndNotifyLoggedInFarmers = async () => {
  const syncResult = await upsertPortalSchemes();
  const notifyResult = await notifyLoggedInFarmersForSchemes(syncResult.changedSchemeIds);

  logger.info('Portal scheme sync and WhatsApp notification complete', {
    service: 'scheme',
    meta: {
      fetched: syncResult.fetched,
      inserted: syncResult.inserted,
      updated: syncResult.updated,
      farmersNotified: notifyResult.farmers,
      sent: notifyResult.sent,
      skipped: notifyResult.skipped,
      failed: notifyResult.failed,
    },
  });

  return {
    sync: syncResult,
    notifications: notifyResult,
  };
};

module.exports = {
  syncPortalSchemesAndNotifyLoggedInFarmers,
  notifySingleLoggedInFarmerForAllSchemes,
};
