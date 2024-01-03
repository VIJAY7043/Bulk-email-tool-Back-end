const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

//  the following lines to exit on MongoDB connection error
process.on('SIGINT', () => {
  db.close(() => {
    console.log('MongoDB connection disconnected through app termination');
    process.exit(0);
  });
});

// Define a Mongoose schema and model for storing email data
const emailSchema = new mongoose.Schema({
  subject: String,
  message: String,
  recipients: [String],
  sentAt: { type: Date, default: Date.now },
});

const Email = mongoose.model('Email', emailSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

app.post('/send-emails', async (req, res) => {
  try {
    const { subject, message, recipients } = req.body;

    if (!subject || !message || !recipients.length) {
      return res.status(400).json({ success: false, message: 'Invalid input.' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      subject,
      html: message,
    };

    for (const recipient of recipients) {
      mailOptions.to = recipient;
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${recipient}`);
    }

    // Save email data to MongoDB
    const emailData = new Email({ subject, message, recipients });
    await emailData.save();

    res.json({ success: true, message: 'Emails sent and data saved successfully' });
  } catch (error) {
    console.error(`Error sending emails: ${error.message}`);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
