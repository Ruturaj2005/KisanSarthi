const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const { Farmer, Advisory, SoilTest, MarketPrice, PestDetection, CropHistory, Feedback, UsageEvent } = require('../models');
const logger = require('../utils/logger');

const CROPS = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Tomato', 'Onion', 'Potato', 'Mustard', 'Chickpea'];
const STATES = ['Maharashtra', 'Punjab', 'UP', 'MP', 'Rajasthan', 'AP', 'Karnataka', 'Gujarat'];
const SOIL_TYPES = ['loamy', 'sandy', 'clay', 'silt', 'alluvial'];
const IRRIGATION = ['rain', 'canal', 'borewell', 'drip', 'none'];
const LANGS = ['hi', 'en', 'mr', 'pa', 'te', 'ta'];
const DISTRICTS = {
  Maharashtra: ['Pune', 'Mumbai', 'Nashik', 'Nagpur'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  UP: ['Lucknow', 'Agra', 'Kanpur', 'Varanasi'],
  MP: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur'],
  AP: ['Hyderabad', 'Vijayawada', 'Guntur', 'Tirupati'],
  Karnataka: ['Bangalore', 'Hubli', 'Mysore', 'Belgaum'],
  Gujarat: ['Ahmedabad', 'Surat', 'Rajkot', 'Vadodara'],
};

const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  try {
    await connectDB();
    logger.info('🌱 Starting seed...', { service: 'seed' });

    // Clear existing data
    await Promise.all([
      Farmer.deleteMany({}), Advisory.deleteMany({}), SoilTest.deleteMany({}),
      MarketPrice.deleteMany({}), PestDetection.deleteMany({}), CropHistory.deleteMany({}),
      Feedback.deleteMany({}), UsageEvent.deleteMany({}),
    ]);

    // Create admin
    const adminPass = await bcrypt.hash('admin123', 10);
    const admin = await Farmer.create({
      name: 'Admin User', email: 'admin@kisansaathi.in', passwordHash: adminPass,
      role: 'admin', isVerified: true, preferredLang: 'en',
      location: { state: 'Maharashtra', district: 'Pune', lat: 18.52, lng: 73.85 },
    });
    logger.info('✅ Admin created: admin@kisansaathi.in / admin123', { service: 'seed' });

    // Create 50 farmers
    const farmers = [];
    for (let i = 1; i <= 50; i++) {
      const state = randomPick(STATES);
      const district = randomPick(DISTRICTS[state]);
      const pass = await bcrypt.hash('farmer123', 10);
      const farmer = await Farmer.create({
        name: `Farmer ${i}`,
        email: `farmer${i}@test.com`,
        passwordHash: pass,
        isVerified: true,
        preferredLang: randomPick(LANGS),
        location: { state, district, lat: 15 + Math.random() * 15, lng: 72 + Math.random() * 12 },
        landSize: randomNum(1, 20),
        soilType: randomPick(SOIL_TYPES),
        irrigationSrc: randomPick(IRRIGATION),
        primaryCrops: [randomPick(CROPS), randomPick(CROPS)].filter((v, i, a) => a.indexOf(v) === i),
      });
      farmers.push(farmer);
    }
    logger.info('✅ 50 farmers created (farmer1@test.com ... farmer50@test.com / farmer123)', { service: 'seed' });

    // Create 200 market records
    const mandis = {
      Maharashtra: ['Mumbai APMC', 'Pune Market Yard'],
      Punjab: ['Ludhiana Grain Market', 'Amritsar Mandi'],
      UP: ['Lucknow Mandi', 'Agra Market'],
      MP: ['Indore Mandi', 'Bhopal Market'],
      Rajasthan: ['Jaipur Mandi', 'Jodhpur Market'],
      AP: ['Hyderabad APMC', 'Vijayawada Market'],
      Karnataka: ['Bangalore APMC', 'Hubli Market'],
      Gujarat: ['Ahmedabad APMC', 'Surat Market'],
    };  
    const mspData = { Rice: 2300, Wheat: 2275, Maize: 2090, Cotton: 7121, Soybean: 4892,
      Onion: 0, Tomato: 0, Potato: 0, Mustard: 5650, Chickpea: 5440 };

    let marketCount = 0;
    for (const [state, mandiList] of Object.entries(mandis)) {
      for (const mandi of mandiList) {
        for (const commodity of CROPS) {
          const base = mspData[commodity] || randomNum(1500, 5000);
          const modal = base + randomNum(-500, 500);
          await MarketPrice.create({
            commodity, state, district: mandi.split(' ')[0], mandi,
            minPrice: Math.round(modal * 0.85), maxPrice: Math.round(modal * 1.15),
            modalPrice: modal, msp: mspData[commodity] || null,
            date: new Date(), source: 'seed',
          });
          marketCount++;
          if (marketCount >= 200) break;
        }
        if (marketCount >= 200) break;
      }
      if (marketCount >= 200) break;
    }
    logger.info(`✅ ${marketCount} market records created`, { service: 'seed' });

    // Create 100 advisories
    const advisoryTypes = ['crop', 'pest', 'weather', 'soil', 'market', 'general'];
    for (let i = 0; i < 100; i++) {
      const farmer = randomPick(farmers);
      await Advisory.create({
        farmerId: farmer._id,
        type: randomPick(advisoryTypes),
        queryText: `Sample question ${i + 1}`,
        aiResponse: `AI response for question ${i + 1}`,
        steps: ['Step 1', 'Step 2'],
        urgency: randomPick(['low', 'medium', 'high']),
        confidence: Math.random() * 0.5 + 0.5,
        language: farmer.preferredLang,
        rating: Math.random() > 0.5 ? randomNum(3, 5) : null,
      });
    }
    logger.info('✅ 100 advisories created', { service: 'seed' });

    logger.info('🎉 Seed complete!', { service: 'seed' });
    logger.info('  Demo credentials:', { service: 'seed' });
    logger.info('  Admin: admin@kisansaathi.in / admin123', { service: 'seed' });
    logger.info('  Farmer: farmer1@test.com / farmer123', { service: 'seed' });

    process.exit(0);
  } catch (error) {
    logger.error('Seed failed', { service: 'seed', meta: { error: error.message } });
    process.exit(1);
  }
}

seed();
