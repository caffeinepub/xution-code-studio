// QR code utilities
// QR data format: JSON { principal: string, username: string, xutNumber?: string, secret: string }
// Store per-user QR secret in localStorage: xution_qr_{principalText} = secret

export interface QRPayload {
  principal: string;
  username: string;
  xutNumber?: string;
  secret: string;
}

export function getOrCreateQRSecret(principalText: string): string {
  const key = `xution_qr_${principalText}`;
  let secret = localStorage.getItem(key);
  if (!secret) {
    secret = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, secret);
  }
  return secret;
}

/**
 * Generate a QR code image URL using an external API (no npm package needed).
 */
export async function generateQRDataURL(
  principalText: string,
  username: string,
  xutNumber?: string,
): Promise<string> {
  const secret = getOrCreateQRSecret(principalText);
  const payload: QRPayload = { principal: principalText, username, secret };
  if (xutNumber) payload.xutNumber = xutNumber;
  const data = JSON.stringify(payload);
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encoded}&color=000000&bgcolor=FFD700`;
}

/**
 * Store QR payload for a user so it can be verified on login.
 */
export function storeQRPayload(
  principalText: string,
  payload: QRPayload,
): void {
  localStorage.setItem(
    `xution_qr_payload_${principalText}`,
    JSON.stringify(payload),
  );
  localStorage.setItem(`xution_qr_${principalText}`, payload.secret);
  if (payload.xutNumber) {
    localStorage.setItem(`xution_xut_${principalText}`, payload.xutNumber);
  }
}

export function getQRPayload(principalText: string): QRPayload | null {
  const raw = localStorage.getItem(`xution_qr_payload_${principalText}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Export QR data as a JSON file download.
 */
export function exportQRData(
  principalText: string,
  username: string,
  xutNumber?: string,
): void {
  const secret = getOrCreateQRSecret(principalText);
  const payload: QRPayload = { principal: principalText, username, secret };
  if (xutNumber) payload.xutNumber = xutNumber;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `xution-qr-${username}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import QR data from a JSON file.
 */
export async function importQRData(file: File): Promise<QRPayload | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string);
        if (payload?.principal && payload?.username && payload?.secret) {
          storeQRPayload(payload.principal, payload);
          resolve(payload as QRPayload);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

/**
 * Parse QR payload from a file.
 * Supports JSON exports. Image QR scanning requires uploading the exported JSON.
 */
export async function parseQRFromFile(file: File): Promise<QRPayload | null> {
  // Support JSON exports (primary flow)
  if (file.type === "application/json" || file.name.endsWith(".json")) {
    return importQRData(file);
  }
  // For image files, try to read as text in case it's misnamed JSON
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const payload = JSON.parse(text);
        if (payload?.principal && payload?.username && payload?.secret) {
          storeQRPayload(payload.principal, payload);
          resolve(payload as QRPayload);
          return;
        }
      } catch {
        // not JSON
      }
      // Cannot decode QR image without jsqr — resolve null
      resolve(null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

/**
 * Verify a QR login attempt.
 */
export function verifyQRSecret(principalText: string, secret: string): boolean {
  const stored = localStorage.getItem(`xution_qr_${principalText}`);
  return stored === secret;
}

export function verifyXUTNumber(
  principalText: string,
  xutNumber: string,
): boolean {
  const stored = localStorage.getItem(`xution_xut_${principalText}`);
  return stored === xutNumber;
}

export function storeXUTForUsername(username: string, xutNumber: string): void {
  localStorage.setItem(`xution_xut_user_${username}`, xutNumber);
}

export function getXUTForUsername(username: string): string | null {
  return localStorage.getItem(`xution_xut_user_${username}`);
}
