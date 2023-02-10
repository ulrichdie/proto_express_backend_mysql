const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Créer un transporteur
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // Définir les options de mail
  const mailOptions = {
    from: "ulrich DIE <ulrich.die@qwatrix.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //Envoyer le mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
