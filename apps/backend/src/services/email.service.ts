import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Create SMTP transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('Email service not configured - missing SMTP credentials');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates for cPanel
    },
  });
};

interface CredentialsEmailData {
  email: string;
  firstName: string;
  username: string;
  password: string;
}

interface OperatorWelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  locationName: string;
  temporaryPassword: string;
}

export const sendCredentialsEmail = async (data: CredentialsEmailData): Promise<void> => {
  const { email, firstName, username, password } = data;
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn('Email not sent - SMTP not configured');
    return;
  }

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'Javelin Associates'} <${process.env.FROM_EMAIL || 'noreply@javelinassociates.org'}>`,
    to: email,
    subject: 'Welcome to Javelin Management System',
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
    logger.info(`✅ Credentials email sent to ${email}`);
  } catch (error) {
    logger.error('❌ Email sending error:', error);
    throw new Error('Failed to send credentials email');
  }
};

export const sendOperatorWelcomeEmail = async (data: OperatorWelcomeEmailData): Promise<void> => {
  const { email, firstName, lastName, employeeId, locationName, temporaryPassword } = data;
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn('Email not sent - SMTP not configured');
    return;
  }

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'Javelin Associates'} <${process.env.FROM_EMAIL || 'noreply@javelinassociates.org'}>`,
    to: email,
    subject: '🛡️ Welcome to Javelin Associate - Your Security Career Begins!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.6; 
              color: #1e293b; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }
            
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 50px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: pulse 3s ease-in-out infinite;
            }
            
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            
            .logo-container {
              position: relative;
              z-index: 1;
              margin-bottom: 20px;
            }
            
            .shield-icon {
              font-size: 72px;
              display: inline-block;
              animation: float 3s ease-in-out infinite;
              filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
            }
            
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            
            .header h1 {
              position: relative;
              z-index: 1;
              margin: 0;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: -0.5px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .header p {
              position: relative;
              z-index: 1;
              margin: 12px 0 0 0;
              opacity: 0.95;
              font-size: 16px;
              font-weight: 500;
            }
            
            .content {
              padding: 45px 35px;
              background: white;
            }
            
            .greeting {
              font-size: 20px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 20px;
            }
            
            .welcome-text {
              font-size: 16px;
              color: #475569;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            
            .credentials-box {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #3b82f6;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
              animation: slideIn 0.5s ease-out;
            }
            
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            .credentials-title {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 25px;
              font-size: 18px;
              font-weight: 700;
              color: #1e40af;
            }
            
            .credential-item {
              margin-bottom: 20px;
              animation: fadeIn 0.5s ease-out backwards;
            }
            
            .credential-item:nth-child(2) { animation-delay: 0.1s; }
            .credential-item:nth-child(3) { animation-delay: 0.2s; }
            .credential-item:nth-child(4) { animation-delay: 0.3s; }
            .credential-item:nth-child(5) { animation-delay: 0.4s; }
            
            @keyframes fadeIn {
              from { opacity: 0; transform: translateX(-10px); }
              to { opacity: 1; transform: translateX(0); }
            }
            
            .label {
              display: block;
              font-weight: 600;
              color: #475569;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            
            .value {
              font-family: 'Courier New', monospace;
              background: white;
              padding: 14px 18px;
              border-radius: 8px;
              display: block;
              font-size: 16px;
              font-weight: 600;
              border: 2px solid #bfdbfe;
              color: #1e40af;
              transition: all 0.3s ease;
              cursor: default;
            }
            
            .value:hover {
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              transform: translateY(-1px);
            }
            
            .alert-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-left: 4px solid #f59e0b;
              border-radius: 8px;
              padding: 20px 24px;
              margin: 30px 0;
              display: flex;
              align-items: start;
              gap: 12px;
              animation: slideIn 0.5s ease-out 0.5s backwards;
            }
            
            .alert-icon {
              font-size: 24px;
              flex-shrink: 0;
            }
            
            .alert-content strong {
              color: #92400e;
              display: block;
              margin-bottom: 6px;
              font-size: 15px;
            }
            
            .alert-content {
              color: #78350f;
              font-size: 14px;
              line-height: 1.6;
            }
            
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            
            .login-button {
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 700;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
              transition: all 0.3s ease;
              animation: bounce 2s ease-in-out infinite;
            }
            
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            
            .login-button:hover {
              background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
              box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
              transform: translateY(-2px);
              animation: none;
            }
            
            .divider {
              height: 2px;
              background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
              margin: 30px 0;
            }
            
            .support-text {
              color: #64748b;
              font-size: 14px;
              line-height: 1.7;
              margin: 25px 0;
            }
            
            .signature {
              margin-top: 30px;
              font-size: 15px;
              color: #475569;
            }
            
            .signature strong {
              color: #1e293b;
              font-size: 16px;
            }
            
            .footer {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 30px;
              text-align: center;
              border-top: 2px solid #e2e8f0;
            }
            
            .footer-text {
              color: #64748b;
              font-size: 13px;
              margin: 8px 0;
            }
            
            .company-name {
              font-weight: 700;
              color: #475569;
              font-size: 14px;
              margin-top: 12px;
            }
            
            @media only screen and (max-width: 600px) {
              body { padding: 10px; }
              .header { padding: 40px 20px; }
              .content { padding: 30px 20px; }
              .credentials-box { padding: 20px; }
              .header h1 { font-size: 26px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo-container">
                <div class="shield-icon">🛡️</div>
              </div>
              <h1>Welcome to Javelin Associate!</h1>
              <p>Your Security Career Begins Today</p>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${firstName} ${lastName},</div>
              
              <div class="welcome-text">
                Congratulations and welcome to Javelin Associate! We're thrilled to have you join our elite team of security professionals. Your operator account has been successfully created and you're ready to begin your journey with us.
              </div>
              
              <div class="credentials-box">
                <div class="credentials-title">
                  <span>📋</span>
                  <span>Your Account Credentials</span>
                </div>
                
                <div class="credential-item">
                  <div class="label">👤 Employee ID</div>
                  <div class="value">${employeeId}</div>
                </div>
                
                <div class="credential-item">
                  <div class="label">📧 Email Address</div>
                  <div class="value">${email}</div>
                </div>
                
                <div class="credential-item">
                  <div class="label">📍 Assigned Location</div>
                  <div class="value">${locationName}</div>
                </div>
                
                <div class="credential-item">
                  <div class="label">🔑 Temporary Password</div>
                  <div class="value">${temporaryPassword}</div>
                </div>
              </div>
              
              <div class="alert-box">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                  <strong>Important Security Notice</strong>
                  For your security, please change your password immediately after your first login. Never share your password with anyone, including supervisors or management.
                </div>
              </div>
              
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}" class="login-button">
                  🔐 Login to Your Account
                </a>
              </div>
              
              <div class="divider"></div>
              
              <div class="support-text">
                If you have any questions or need assistance getting started, please don't hesitate to contact your supervisor or reach out to our management team. We're here to support your success every step of the way.
              </div>
              
              <div class="signature">
                Best regards,<br>
                <strong>Javelin Associate Management Team</strong>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                This is an automated message. Please do not reply to this email.
              </div>
              <div class="company-name">
                © ${new Date().getFullYear()} Javelin Associate. All rights reserved.
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    logger.error('❌ Email sending error:', error);
    throw error;
  }
};
