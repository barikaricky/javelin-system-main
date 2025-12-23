import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface CredentialsEmailData {
  email: string;
  firstName: string;
  username: string;
  password: string;
}

export const sendCredentialsEmail = async (data: CredentialsEmailData): Promise<void> => {
  const { email, firstName, username, password } = data;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@jevelin.com',
    to: email,
    subject: 'Welcome to jevelin Management System',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1E88E5 0%, #1565C0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
            .credentials { background: #FFF8E1; border-left: 4px solid #FFC107; padding: 20px; margin: 20px 0; }
            .credential-item { margin: 10px 0; }
            .label { font-weight: bold; color: #1E88E5; }
            .value { font-family: monospace; background: white; padding: 8px; border-radius: 4px; display: inline-block; }
            .warning { background: #FFF3E0; border-left: 4px solid #FB8C00; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #757575; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to jevelin!</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p>Your manager account has been successfully created. Below are your login credentials:</p>
              
              <div class="credentials">
                <div class="credential-item">
                  <span class="label">Username:</span><br>
                  <span class="value">${username}</span>
                </div>
                <div class="credential-item">
                  <span class="label">Password:</span><br>
                  <span class="value">${password}</span>
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong><br>
                Please change your password immediately after your first login for security purposes.
              </div>
              
              <p>You can access the system at: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a></p>
              
              <p>If you have any questions, please contact your director.</p>
              
              <p>Best regards,<br>jevelin Management Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Credentials email sent to ${email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send credentials email');
  }
};
