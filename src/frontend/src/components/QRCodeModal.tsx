import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateQRDataURL, parseQRFromFile } from "@/utils/qrUtils";
import { Download, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface QRCodeModalProps {
  principalText: string;
  username: string;
  xutNumber?: string;
  open: boolean;
  onClose: () => void;
}

export default function QRCodeModal({
  principalText,
  username,
  xutNumber,
  open,
  onClose,
}: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && principalText && username) {
      setIsGenerating(true);
      generateQRDataURL(principalText, username, xutNumber)
        .then(setQrDataUrl)
        .catch(() => toast.error("Failed to generate QR code"))
        .finally(() => setIsGenerating(false));
    }
  }, [open, principalText, username, xutNumber]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `xution-qr-${username}${xutNumber ? `-${xutNumber}` : ""}.png`;
    a.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseQRFromFile(file);
    if (!result) {
      toast.error("Could not read QR code from image");
      return;
    }
    if (result.principal !== principalText) {
      toast.error("QR code belongs to a different user");
      return;
    }
    toast.success("QR code imported successfully");
    const newUrl = await generateQRDataURL(principalText, username, xutNumber);
    setQrDataUrl(newUrl);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" data-ocid="qr.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>QR Code — {username}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7"
              data-ocid="qr.close_button"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <MemberIDCard
            username={username}
            xutNumber={xutNumber}
            qrDataUrl={qrDataUrl}
            isGenerating={isGenerating}
          />

          <div className="flex gap-2 w-full">
            <Button
              type="button"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              data-ocid="qr.download_button"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 gap-2 border-primary/40 text-primary hover:bg-primary/10"
              data-ocid="qr.upload_button"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MemberIDCard({
  username,
  xutNumber,
  qrDataUrl,
  isGenerating,
}: {
  username: string;
  xutNumber?: string;
  qrDataUrl: string | null;
  isGenerating: boolean;
}) {
  return (
    <div
      className="w-full rounded-xl border-2 border-primary/50 bg-black overflow-hidden"
      style={{
        boxShadow:
          "0 0 20px oklch(var(--primary) / 0.15), inset 0 0 30px oklch(var(--primary) / 0.04)",
      }}
    >
      <div className="bg-primary/15 border-b border-primary/30 px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-[0.2em] text-primary/70 uppercase">
          Xution Code Studio
        </span>
        <span className="text-[10px] font-mono text-primary/50">Member ID</span>
      </div>

      <div className="flex items-center gap-4 p-4">
        <div className="shrink-0">
          {isGenerating ? (
            <div className="w-24 h-24 bg-primary/10 rounded-lg border border-primary/30 flex items-center justify-center">
              <span className="text-[10px] text-primary/50">Generating…</span>
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-24 h-24 rounded-lg border border-primary/40"
            />
          ) : (
            <div className="w-24 h-24 bg-primary/10 rounded-lg border border-primary/30" />
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[10px] text-primary/50 uppercase tracking-widest font-mono">
            Username
          </p>
          <p className="text-base font-bold text-primary leading-tight truncate">
            {username || "—"}
          </p>

          {xutNumber && (
            <>
              <p className="text-[10px] text-primary/50 uppercase tracking-widest font-mono mt-1">
                XUT ID
              </p>
              <p
                className="text-xl font-black tracking-wider"
                style={{
                  color: "oklch(var(--primary))",
                  textShadow: "0 0 12px oklch(var(--primary) / 0.4)",
                }}
              >
                {xutNumber}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-primary/20 bg-primary/5 px-4 py-1.5">
        <p className="text-[9px] font-mono text-primary/30 tracking-wider text-center">
          SCAN TO AUTHENTICATE · XUTION VERIFIED
        </p>
      </div>
    </div>
  );
}
