// QR code generation uses the `qrcode` npm package
// QR code scanning uses jsqr
// QR data format: JSON { principal: string, username: string, secret: string }
// Store per-user QR secret in localStorage: xution_qr_{principalText} = secret

import jsQR from "jsqr";
import QRCode from "qrcode";

export function getOrCreateQRSecret(principalText: string): string {
  const key = `xution_qr_${principalText}`;
  let secret = localStorage.getItem(key);
  if (!secret) {
    secret = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, secret);
  }
  return secret;
}

export async function generateQRDataURL(
  principalText: string,
  username: string,
): Promise<string> {
  const secret = getOrCreateQRSecret(principalText);
  const data = JSON.stringify({ principal: principalText, username, secret });
  return QRCode.toDataURL(data, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#FFD700" },
  });
}

export function parseQRFromImageData(
  imageData: ImageData,
): { principal: string; username: string; secret: string } | null {
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (!code) return null;
  try {
    return JSON.parse(code.data);
  } catch {
    return null;
  }
}

export async function parseQRFromFile(
  file: File,
): Promise<{ principal: string; username: string; secret: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(parseQRFromImageData(imageData));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
