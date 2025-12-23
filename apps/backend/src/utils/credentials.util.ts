import crypto from 'crypto';

export const generateUsername = (firstName: string, lastName: string): string => {
  const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const randomSuffix = crypto.randomInt(100, 999);
  return `${baseUsername}${randomSuffix}`;
};

export const generatePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];
  
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Alias for generatePassword
export const generateTemporaryPassword = (length: number = 12): string => {
  return generatePassword(length);
};

// Generate employee ID with prefix
export const generateEmployeeId = (prefix: string = 'EMP'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomInt(1000, 9999);
  return `${prefix}-${timestamp}-${random}`;
};
