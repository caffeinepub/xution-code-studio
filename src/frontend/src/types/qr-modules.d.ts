declare module "jsqr" {
  interface QRCode {
    data: string;
  }
  function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): QRCode | null;
  export = jsQR;
}

declare module "qrcode" {
  interface QRCodeOptions {
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
  }
  function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
  export { toDataURL };
  export default { toDataURL };
}
