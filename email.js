const nodemailer = require("nodemailer");
const path = require("path");
const hbs = require("nodemailer-express-handlebars");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sitelabs.uz@gmail.com",
    pass: "zkkhztrfkrsqwjgx",
  },
});

const handlebarOptions = {
  viewEngine: {
    extName: ".handlebars",
    partialsDir: path.resolve("./views"),
    defaultLayout: false,
  },
  viewPath: path.resolve("./views"),
  extName: ".handlebars",
};

transporter.use("compile", hbs(handlebarOptions));
const sendMessageEmail = (email, name, code) => {
  let mailOptions = {
    from: "youremail@gmail.com",
    to: email,
    subject: "Verify your email",
    template: "email",
    context: {
      name: name,
      code,
    },
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

const sendContactMessageToEmail = (email, name, message) => {
  let mailOptions = {
    from: "youremail@gmail.com",
    to: email,
    subject: "Your message has been received",
    template: "sendEmail",
    context: {
      name,
      message,
    },
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = {
  sendMessageEmail,
  sendContactMessageToEmail,
};
