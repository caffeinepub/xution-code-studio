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
  open: boolean;
  onClose: () => void;
}

export default function QRCodeModal({
  principalText,
  username,
  open,
  onClose,
}: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && principalText && username) {
      setIsGenerating(true);
      generateQRDataURL(principalText, username)
        .then(setQrDataUrl)
        .catch(() => toast.error("Failed to generate QR code"))
        .finally(() => setIsGenerating(false));
    }
  }, [open, principalText, username]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `xution-qr-${username}.png`;
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
    localStorage.setItem(`xution_qr_${principalText}`, result.secret);
    toast.success("QR code imported successfully");
    // Regenerate display
    const newUrl = await generateQRDataURL(principalText, username);
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
          {isGenerating ? (
            <div className="w-48 h-48 bg-muted/30 rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                Generating...
              </span>
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-48 h-48 rounded-lg border border-primary/30"
            />
          ) : null}
          <p className="text-xs text-muted-foreground text-center">
            Scan or share this QR code to authenticate as{" "}
            <strong>{username}</strong>.
          </p>
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              data-ocid="qr.download_button"
            >
              <Download className="w-4 h-4" />
              Download QR
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 gap-2"
              data-ocid="qr.upload_button"
            >
              <Upload className="w-4 h-4" />
              Import QR
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
