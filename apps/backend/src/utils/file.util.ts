import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/profiles');

// Ensure upload directory exists
export const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

export const uploadProfilePicture = async (file: Express.Multer.File): Promise<string> => {
  await ensureUploadDir();

  // Generate unique filename
  const fileExt = path.extname(file.originalname);
  const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExt}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  // Save file
  await fs.writeFile(filePath, file.buffer);

  // Return public URL
  return `/uploads/profiles/${fileName}`;
};

export const deleteProfilePicture = async (fileUrl: string): Promise<void> => {
  try {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(UPLOAD_DIR, fileName);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
