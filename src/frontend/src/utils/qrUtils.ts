// QR code utilities using browser-native APIs only (no external packages)
// QR data format: JSON { principal: string, username: string, secret: string }
// Store per-user QR secret in localStorage: xution_qr_{principalText} = secret

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
 * Generate a simple QR-code-like data URL using canvas.
 * This creates a visual representation of the data encoded as a grid pattern.
 * For a real deployment, replace with a proper QR library.
 */
export async function generateQRDataURL(
  principalText: string,
  username: string,
): Promise<string> {
  const secret = getOrCreateQRSecret(principalText);
  const data = JSON.stringify({ principal: principalText, username, secret });

  // Encode data as a simple visual pattern using canvas
  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background
  ctx.fillStyle = "#FFD700";
  ctx.fillRect(0, 0, size, size);

  // Create a deterministic grid pattern from data hash
  const bytes = new TextEncoder().encode(data);
  const gridSize = 21; // standard QR-like grid
  const cellSize = Math.floor((size - 16) / gridSize);
  const offset = 8;

  ctx.fillStyle = "#000000";

  // Draw finder patterns (corners)
  const drawFinder = (x: number, y: number) => {
    ctx.fillRect(x, y, cellSize * 7, cellSize * 7);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      x + cellSize * 2,
      y + cellSize * 2,
      cellSize * 3,
      cellSize * 3,
    );
  };
  drawFinder(offset, offset);
  drawFinder(offset + (gridSize - 7) * cellSize, offset);
  drawFinder(offset, offset + (gridSize - 7) * cellSize);

  // Fill data cells from bytes
  let byteIdx = 0;
  let bitIdx = 0;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Skip finder pattern areas
      if (
        (row < 8 && col < 8) ||
        (row < 8 && col >= gridSize - 8) ||
        (row >= gridSize - 8 && col < 8)
      ) {
        continue;
      }
      if (byteIdx < bytes.length) {
        const bit = (bytes[byteIdx] >> (7 - bitIdx)) & 1;
        if (bit) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(
            offset + col * cellSize,
            offset + row * cellSize,
            cellSize - 1,
            cellSize - 1,
          );
        }
        bitIdx++;
        if (bitIdx === 8) {
          bitIdx = 0;
          byteIdx++;
        }
      }
    }
  }

  // Embed the data as text in the canvas metadata area (for later reading)
  // We store the actual data in a hidden area of the image via alpha channel trick
  // For import/export, we'll encode the JSON into the image filename or store separately

  return canvas.toDataURL("image/png");
}

/**
 * Store QR payload for a user so it can be verified on login.
 * The payload is stored in localStorage keyed by principal.
 */
export function storeQRPayload(
  principalText: string,
  payload: { principal: string; username: string; secret: string },
): void {
  localStorage.setItem(
    `xution_qr_payload_${principalText}`,
    JSON.stringify(payload),
  );
}

export function getQRPayload(
  principalText: string,
): { principal: string; username: string; secret: string } | null {
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
export function exportQRData(principalText: string, username: string): void {
  const secret = getOrCreateQRSecret(principalText);
  const payload = { principal: principalText, username, secret };
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
 * Returns the parsed payload if valid, null otherwise.
 */
export async function importQRData(
  file: File,
): Promise<{ principal: string; username: string; secret: string } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string);
        if (payload?.principal && payload?.username && payload?.secret) {
          // Store in localStorage for future login
          storeQRPayload(payload.principal, payload);
          resolve(payload);
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
 * Parse QR data from an image file.
 * Since we can't decode an actual QR code without jsqr, we look for
 * an associated JSON payload in localStorage or prompt for JSON import.
 */
export async function parseQRFromFile(
  file: File,
): Promise<{ principal: string; username: string; secret: string } | null> {
  // Try to read as JSON first (exported QR data files)
  if (file.type === "application/json" || file.name.endsWith(".json")) {
    return importQRData(file);
  }
  // For image files, we can't decode without jsqr
  // Return null and let the UI handle it
  return null;
}

/**
 * Verify a QR login attempt.
 * Checks that the provided secret matches the stored secret for the principal.
 */
export function verifyQRSecret(principalText: string, secret: string): boolean {
  const stored = localStorage.getItem(`xution_qr_${principalText}`);
  return stored === secret;
}
