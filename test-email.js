// Test Email Configuration
// Run this with: node test-email.js

const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  console.log('🔍 Testing email configuration...\n');

  console.log('Environment variables:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials are missing in .env file!');
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log('📧 Attempting to send test email...\n');

    // Send test email
    const info = await transporter.sendMail({
      from: `"Futura Homes Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email - Futura Homes',
      html: `
        <h2>✅ Email Configuration Success!</h2>
        <p>Your Nodemailer setup is working correctly.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Futura Homes - Email Test</p>
      `,
    });

    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Check your inbox at:', process.env.EMAIL_USER);
    console.log('\n🎉 Email configuration is working correctly!');
  } catch (error) {
    console.error('\n❌ EMAIL SENDING FAILED!\n');
    console.error('Error details:');
    console.error('Message:', error.message);

    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication Error!');
      console.error('Possible causes:');
      console.error('1. Wrong email or app password');
      console.error('2. App password has spaces (should be removed)');
      console.error('3. 2FA not enabled on Gmail account');
      console.error('4. App password expired or revoked');
      console.error('\n💡 Solution:');
      console.error('- Go to https://myaccount.google.com/apppasswords');
      console.error('- Generate a NEW app password');
      console.error('- Update EMAIL_PASSWORD in .env (without spaces)');
      console.error('- Make sure 2-Factor Auth is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🌐 Connection Error!');
      console.error('Possible causes:');
      console.error('1. No internet connection');
      console.error('2. Firewall blocking port 587/465');
      console.error('3. Gmail SMTP servers down');
    } else {
      console.error('Full error:', error);
    }
  }
};

testEmail();
