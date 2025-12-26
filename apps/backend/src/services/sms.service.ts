import { logger } from '../utils/logger';

interface SendSMSParams {
  to: string;
  message: string;
}

interface OperatorWelcomeSMSParams {
  phoneNumber: string;
  fullName: string;
  employeeId: string;
  locationName: string;
  temporaryPassword: string;
}

class SMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private enabled: boolean;
  private twilioClient: any;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.enabled = !!(this.accountSid && this.authToken && this.fromNumber);

    if (!this.enabled) {
      logger.warn('⚠️ SMS Service disabled - Twilio credentials not configured');
      logger.info('📝 Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
    } else {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(this.accountSid, this.authToken);
        logger.info('✅ SMS Service enabled (Twilio)');
        logger.info('📱 From number:', this.fromNumber);
      } catch (error) {
        logger.error('❌ Failed to initialize Twilio client:', error);
        this.enabled = false;
      }
    }
  }

  /**
   * Send a generic SMS using Twilio
   */
  async sendSMS({ to, message }: SendSMSParams): Promise<boolean> {
    if (!this.enabled) {
      logger.warn('SMS not sent - service disabled');
      console.log('📱 SMS would be sent to:', to);
      console.log('📝 Message:', message);
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      
      logger.info('📱 Sending SMS via Twilio');
      logger.info('📞 From:', this.fromNumber);
      logger.info('📞 To:', formattedPhone);
      logger.info('📝 Message length:', message.length);

      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedPhone,
      });

      logger.info('✅ SMS sent successfully!');
      logger.info('📋 Message SID:', result.sid);
      logger.info('📊 Status:', result.status);
      
      return true;
    } catch (error: any) {
      logger.error('❌ Error sending SMS via Twilio:', {
        message: error.message,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo,
      });
      return false;
    }
  }

  /**
   * Send welcome SMS to newly registered operator
   */
  async sendOperatorWelcomeSMS({
    phoneNumber,
    fullName,
    employeeId,
    locationName,
    temporaryPassword,
  }: OperatorWelcomeSMSParams): Promise<boolean> {
    const message = `Welcome to Javelin Security, ${fullName}!

Employee ID: ${employeeId}
Location: ${locationName}
Temporary Password: ${temporaryPassword}

Please login to change your password. Contact your supervisor for any questions.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  }

  /**
   * Format phone number to E.164 format for Twilio
   * Accepts: +2348012345678, 2348012345678, 08012345678, 8012345678
   * Returns: +2348012345678 (E.164 format)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If already starts with 234, add +
    if (cleaned.startsWith('234')) {
      return '+' + cleaned;
    }

    // If starts with 0, replace with +234
    if (cleaned.startsWith('0')) {
      return '+234' + cleaned.substring(1);
    }

    // If starts with 8, 7, or 9 (Nigerian mobile prefixes), add +234
    if (['7', '8', '9'].includes(cleaned.charAt(0)) && cleaned.length === 10) {
      return '+234' + cleaned;
    }

    // If phone already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }

    // Default: add + if not present
    return '+' + cleaned;
  }

  /**
   * Test if SMS service is configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

export const smsService = new SMSService();
