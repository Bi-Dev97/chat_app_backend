const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');

const sendMail = asyncHandler(async (emailOptions, req, res) => {
  console.log(emailOptions)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.APP_PASS,
    },
  });

  const mailOptions = {
    from: `'"Hey 👻" <monkolanibimab@gmail.com>'`,
    to: emailOptions?.to,
    subject: emailOptions?.subject,
    text: emailOptions?.text,
    html:emailOptions?.html
  };

  try {
    await transporter.sendMail(mailOptions);
   // console.log('Email sent');
  } catch (error) {
    console.error(error);
    //console.log('Failed to send email');
  }
});

module.exports = sendMail;


