const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Testing Gmail SMTP with different ports...\n');

// Test 1: Port 587 (TLS) - current failing method
async function testPort587() {
  console.log('Test 1: Port 587 (TLS)...');
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

  return new Promise((resolve) => {
    transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Port 587 failed:', error.code);
        resolve(false);
      } else {
        console.log('✅ Port 587 works!');
        resolve(true);
      }
    });
  });
}

// Test 2: Port 465 (SSL) - alternative
async function testPort465() {
  console.log('\nTest 2: Port 465 (SSL)...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: true, // SSL
    port: 465,
  });

  return new Promise((resolve) => {
    transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Port 465 failed:', error.code);
        resolve(false);
      } else {
        console.log('✅ Port 465 works!');
        resolve(true);
      }
    });
  });
}

async function runTests() {
  const test587 = await testPort587();
  const test465 = await testPort465();

  console.log('\n' + '='.repeat(50));
  if (test587) {
    console.log('Use: Port 587 (current config)');
  } else if (test465) {
    console.log('Use: Port 465 (need to update config)');
  } else {
    console.log('Both failed - possible ISP/Firewall block or wrong password');
  }
}

runTests();
