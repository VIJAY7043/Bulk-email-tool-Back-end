const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password',
  },
});

// API endpoint for sending bulk emails
app.post('/send-emails', async (req, res) => {
  const { subject, message, recipients } = req.body;

  const mailOptions = {
    from: 'your-email@gmail.com',
    subject,
    html: message,
  };

  // Send emails to each recipient
  for (const recipient of recipients) {
    mailOptions.to = recipient;
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${recipient}`);
    } catch (error) {
      console.error(`Error sending email to ${recipient}: ${error.message}`);
    }
  }

  res.json({ success: true, message: 'Emails sent successfully' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
