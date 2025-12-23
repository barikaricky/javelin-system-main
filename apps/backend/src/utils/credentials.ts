import crypto from 'crypto';

export function generateCredentials(prefix: string) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const employeeId = `${prefix}-${timestamp}-${random}`;
  
  const password = crypto.randomBytes(8).toString('base64').slice(0, 12);
  
  return { employeeId, password };
}

export function generateMeetingId(): string {
  return crypto.randomBytes(16).toString('hex');
}
