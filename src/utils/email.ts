import nodemailer, { TransportOptions } from "nodemailer";

export default class Email {
  to: string;
  firstName: string;
  url: string;
  from: string;

  constructor(user: { email: string; username: string }, url: string) {
    this.to = user.email;
    this.firstName = user.username.split(" ")[0];
    this.url = url;
    this.from = `{Name} <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME!,
          pass: process.env.SENDGRID_PASSWORD!,
        },
      });
    }

    const transporterOptions: TransportOptions = {
      // @ts-ignore
      host: process.env.EMAIL_HOST!,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME!,
        pass: process.env.EMAIL_PASSWORD!,
      },
    };

    return nodemailer.createTransport(transporterOptions);
  }

  // Send the actual email
  async send(subject: string, html: string) {
    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };

    // Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    const subject = "Welcome to the Natours Family!";
    const html = `<p>Hello ${this.firstName},</p>
                  <p>Welcome to the Natours Family! Click <a href="${this.url}">here</a> to get started.</p>`;
    await this.send(subject, html);
  }

  async sendPasswordReset() {
    const subject = "Your password reset token (valid for only 10 minutes)";
    const html = `<p>Hello ${this.firstName},</p>
                  <p>You requested a password reset. Use this <a href="${this.url}">link</a> to reset your password.</p>`;
    await this.send(subject, html);
  }
}
