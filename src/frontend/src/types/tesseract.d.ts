declare module "tesseract.js" {
  export function createWorker(
    lang?: string,
    oem?: number,
    options?: Record<string, unknown>,
  ): Promise<{
    recognize(image: string | File | Blob): Promise<{ data: { text: string } }>;
    terminate(): Promise<void>;
  }>;
}
