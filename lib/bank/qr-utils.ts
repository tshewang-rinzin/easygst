// ============================================================
// QR Code Generation Utility
// ============================================================

import QRCode from 'qrcode';

/**
 * Generate a QR code as a base64 data URL (PNG).
 * Suitable for embedding in invoice PDFs and receipts.
 */
export async function generateQRDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
  });
}
