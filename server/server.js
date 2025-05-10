require('dotenv').config();            // ← load .env into process.env
const express   = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();

// Parse incoming form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// (Optional) Serve your static front-end, if you want Express to host it:
app.use(express.static(__dirname + '/../public'));

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

// Your POST endpoint to receive the form
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  // Build the email
  const mailOptions = {
    from: `"Website Contact" <${process.env.SMTP_USER}>`,
    to: [
      process.env.BUSINESS_EMAIL,
      process.env.OWNER_EMAIL
    ].join(','),
    subject: `New Contact‐Us message from ${name}`,
    text:
      `You’ve got a new message from your website’s Contact Us form.\n\n` +
      `— Name: ${name}\n` +
      `— Email: ${email}\n\n` +
      `— Message:\n${message}`
  };

  try {
    // Send to _both_ recipients at once
    await transporter.sendMail(mailOptions);
    res.json({ success: true, msg: 'Message sent. Thank you!' });
  } catch (err) {
    console.error('Mail send error:', err);
    res.status(500).json({ success: false, msg: 'Failed to send message.' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Contact‐form API listening on port ${PORT}`);
});
