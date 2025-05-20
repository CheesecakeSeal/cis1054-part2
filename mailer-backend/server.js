require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5500;

// Serve your static files (e.g. contact.html, support.html)
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

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO.split(','),
    subject: `[${type} Form] ${subject}`,
    text: `
You’ve received a new ${type.toLowerCase()} message via your ${type} form from Kura Udo Sushi:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `,
    replyTo: email
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send(`Thank you! Your ${type.toLowerCase()} request has been sent.`);
  } catch (err) {
    console.error('Error sending mail:', err);
    res.status(500).send('Oops! Something went wrong, please try again later.');
  }
});

app.listen(PORT, () => {
  console.log(`Mail service listening on port ${PORT}`);
});

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});