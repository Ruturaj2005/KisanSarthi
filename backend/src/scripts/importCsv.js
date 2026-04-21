/**
 * Import Agmarknet CSV data into MarketPrice collection.
 * Usage: node src/scripts/importCsv.js [path-to-csv]
 * Default CSV: ../data_new.csv (relative to project root)
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MarketPrice = require('../models/MarketPrice.model');
const logger = require('../utils/logger');

const CSV_PATH = process.argv[2] || path.resolve(__dirname, '../../data_new.csv');

function parseDate(dateStr) {
  // Format: DD/MM/YYYY
  const [day, month, year] = dateStr.split('/');
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

async function importCsv() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kisansaathi';
  await mongoose.connect(mongoUri);
  logger.info(`Connected to MongoDB`, { service: 'importCsv' });

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  logger.info(`Parsed ${records.length} records from CSV`, { service: 'importCsv' });

  let upserted = 0;
  let errors = 0;

  for (const row of records) {
    try {
      const commodity = row['Commodity'] || '';
      const state = row['State'] || '';
      const district = row['District'] || '';
      const mandi = row['Market'] || '';
      const variety = row['Variety'] || '';
      const grade = row['Grade'] || '';
      const dateStr = row['Arrival_Date'] || '';
      const minPrice = parseFloat(row['Min_x0020_Price']) || 0;
      const maxPrice = parseFloat(row['Max_x0020_Price']) || 0;
      const modalPrice = parseFloat(row['Modal_x0020_Price']) || 0;

      if (!commodity || !mandi || !dateStr) {
        errors++;
        continue;
      }

      const date = parseDate(dateStr);

      await MarketPrice.findOneAndUpdate(
        { commodity, mandi, date, variety },
        {
          $set: {
            commodity,
            state,
            district,
            mandi,
            variety,
            grade,
            minPrice,
            maxPrice,
            modalPrice,
            date,
            source: 'agmarknet-csv',
          },
        },
        { upsert: true, new: true }
      );

      upserted++;

      if (upserted % 500 === 0) {
        logger.info(`Imported ${upserted} records...`, { service: 'importCsv' });
      }
    } catch (err) {
      errors++;
      if (errors <= 5) {
        logger.error(`Error importing row: ${err.message}`, { service: 'importCsv' });
      }
    }
  }

  logger.info(`Import complete: ${upserted} upserted, ${errors} errors`, { service: 'importCsv' });
  await mongoose.disconnect();
  process.exit(0);
}

importCsv().catch((err) => {
  logger.error(`Import failed: ${err.message}`, { service: 'importCsv' });
  process.exit(1);
});
