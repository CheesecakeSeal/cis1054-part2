require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5500;

// strip CRLFs from header fields
const sanitizeHeaderField = (str = '') => str.replace(/[\r\n]/g, ' ').trim();

// Serve static files (e.g. contact.html, support.html)
app.use(express.static('public'));

// Parse form data
app.use(bodyParser.urlencoded({ extended: false }));

// Create a reusable transporter object using SMTP transport
let transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: parseInt(process.env.MAILTRAP_PORT, 10),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

app.post('/send-email', async (req, res) => {
  const { name, email, subject, message, formType } = req.body;
  const type = formType || 'Contact';

  // Sanitize header‐sensitive fields
  const safeType    = sanitizeHeaderField(type);
  const safeSubject = sanitizeHeaderField(subject);
  const safeName    = sanitizeHeaderField(name);    
  const safeEmail   = sanitizeHeaderField(email);   

  // choose recipients based on form type
  const toField = (safeType === 'Favourites')
    ? `${safeName} <${safeEmail}>`
    : process.env.EMAIL_TO.split(',').map(addr => addr.trim());  

  const mailOptions = {
    from:    process.env.EMAIL_FROM,
    to:      toField,                         
    subject: `[${safeType} Form] ${safeSubject}`,
    text:    `
You’ve received a new ${safeType.toLowerCase()} message via your ${safeType} form from Kura Udo Sushi:

Name: ${safeName}
Email: ${safeEmail}
Subject: ${safeSubject}

Message:
${message}
    `,
    replyTo: safeEmail
  };

  try {
    await transporter.sendMail(mailOptions);
    // redirect to a confirmation page instead of inline response
    res.redirect('/email-sent');
  } catch (err) {
    console.error('Error sending mail:', err);
    res.status(500).send('Oops! Something went wrong, please try again later.');
  }
});

// email-sent confirmation page
app.get('/email-sent', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'email-sent.html'));
});

app.listen(PORT, () => {
  console.log(`Mail service listening on port ${PORT}`);
});

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});
