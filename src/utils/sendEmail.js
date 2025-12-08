const nodemailer = require("nodemailer");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"FrostKontroll" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments: [
            {
                filename: "logo.png",
                path: path.join(__dirname, "../assets/logo.png"), 
                cid: "companyLogo", 
            },
        ],
    });
};

module.exports = sendEmail;
