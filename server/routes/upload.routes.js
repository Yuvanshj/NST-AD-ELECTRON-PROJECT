import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { optionalAuthenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadRouter = express.Router();

const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/upload
 * Securely store base64 or binary uploaded files with validation
 */
uploadRouter.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const { base64Data, mimeType, fileName = 'document' } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({
        success: false,
        message: 'base64Data and mimeType are required for file upload.',
      });
    }

    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return res.status(400).json({
        success: false,
        message: `Disallowed MIME type: ${mimeType}. Allowed types: JPEG, PNG, WebP, PDF.`,
      });
    }

    // Strip prefix if present (e.g., data:image/png;base64,...)
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the 5MB maximum limit (${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
      });
    }

    // Generate random secure filename to prevent path traversal and execution
    const randomHex = crypto.randomBytes(16).toString('hex');
    const ext = ALLOWED_MIME_TYPES[mimeType];
    const safeFilename = `${Date.now()}_${randomHex}${ext}`;
    const destinationPath = path.join(UPLOAD_DIR, safeFilename);

    // Verify destination stays strictly within UPLOAD_DIR (path traversal protection)
    if (!destinationPath.startsWith(UPLOAD_DIR)) {
      return res.status(400).json({ success: false, message: 'Invalid file destination path.' });
    }

    await fs.promises.writeFile(destinationPath, buffer);

    const fileUrl = `/api/upload/file/${safeFilename}`;

    res.status(201).json({
      success: true,
      filename: safeFilename,
      url: fileUrl,
      size: buffer.length,
      mimeType,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/upload/file/:filename
 * Safely serve uploaded documents/images
 */
uploadRouter.get('/file/:filename', (req, res) => {
  try {
    const rawFilename = req.params.filename;
    // Strict alphanumeric + underscore + period validation to prevent path traversal
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(rawFilename)) {
      return res.status(400).json({ success: false, message: 'Invalid file name' });
    }

    const filePath = path.join(UPLOAD_DIR, rawFilename);
    if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default uploadRouter;
