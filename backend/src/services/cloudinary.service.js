const cloudinary = require('cloudinary').v2;
const env = require('../config/env');
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image buffer to Cloudinary.
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Cloudinary folder ('pest-scans', etc.)
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadImage = async (buffer, folder = 'pest-scans') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `kisansaathi/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { format: 'webp' },
        ],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed', { service: 'cloudinary', meta: { error: error.message } });
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete image from Cloudinary.
 */
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info('Image deleted from Cloudinary', { service: 'cloudinary', meta: { publicId } });
  } catch (error) {
    logger.error('Cloudinary delete failed', { service: 'cloudinary', meta: { publicId, error: error.message } });
  }
};

module.exports = { uploadImage, deleteImage };
