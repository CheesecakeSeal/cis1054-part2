require('dotenv').config();            // ← load .env into process.env
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const helmet = require('helmet');

const app = express();

// Security headers
app.use(helmet());

// Parse incoming form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve contact.html on GET /contact.html
app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'contact.html'));
});

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper to sanitize inputs against XSS
function sanitizeInput(str) {
  return xss(str.trim());
}

// POST endpoint to receive the form with validation and sanitization
app.post(
  '/api/contact',
  [
    // Validate and sanitize fields
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 chars)')
      .matches(/^[A-Za-z0-9 _.'-]+$/).withMessage('Invalid characters in name'),

    body('email')
      .trim()
      .isEmail().withMessage('Must be a valid email')
      .normalizeEmail(),

    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 }).withMessage('Message is required (max 1000 chars)'),
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Sanitize inputs
    const name    = sanitizeInput(req.body.name);
    const email   = sanitizeInput(req.body.email);
    const message = sanitizeInput(req.body.message);

    // Build the email
    const mailOptions = {
      from: `"Website Contact" <${process.env.SMTP_USER}>`,
      to: [
        process.env.BUSINESS_EMAIL,
        process.env.OWNER_EMAIL
      ].join(','),
      subject: `New Contact-Us message from ${name}`,
      text:
        `You’ve got a new message from your website’s Contact Us form.\n\n` +
        `— Name: ${name}\n` +
        `— Email: ${email}\n\n` +
        `— Message:\n${message}`
    };

    try {
      // Send to both recipients at once
      await transporter.sendMail(mailOptions);
      res.json({ success: true, msg: 'Message sent. Thank you!' });
    } catch (err) {
      console.error('Mail send error:', err);
      res.status(500).json({ success: false, msg: 'Failed to send message.' });
    }
  }
);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
