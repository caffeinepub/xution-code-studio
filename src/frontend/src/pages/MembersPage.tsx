import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useAddMember,
  useGetMembers,
  useRemoveMember,
} from "@/hooks/useQueries";
import jsQR from "jsqr";
import { ImageIcon, Loader2, UserMinus, UserPlus, Users } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function scanQRFromCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): string | null {
  const imageData = ctx.getImageData(0, 0, w, h);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code?.data ?? null;
}

function extractXUTFromCardImage(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const attempt = (scale: number): string | null => {
        try {
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          if (w === 0 || h === 0) return null;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0, w, h);
          return scanQRFromCanvas(ctx, w, h);
        } catch {
          return null;
        }
      };

      const rawData = attempt(1) ?? attempt(2) ?? attempt(0.5) ?? attempt(3);
      if (!rawData) return resolve(null);

      // Try JSON payload
      try {
        const payload = JSON.parse(rawData);
        const xut =
          payload.xut ??
          payload.xutNumber ??
          payload.XUT ??
          payload.xut_number ??
          payload.XUTNumber ??
          null;
        if (xut) return resolve(String(xut));
      } catch {
        /* not JSON */
      }

      // Plain string patterns
      const patternMatch = rawData.match(/XUT[-_]?\d+/i);
      if (patternMatch) return resolve(patternMatch[0]);

      // Short alphanumeric — treat as XUT
      const trimmed = rawData.trim();
      if (/^[A-Z0-9]{4,20}$/i.test(trimmed)) return resolve(trimmed);

      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export default function MembersPage() {
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const { data: members = [], isLoading: membersLoading } = useGetMembers();

  const [username, setUsername] = useState("");
  const [xutNumber, setXutNumber] = useState("");
  const [qrCardData, setQrCardData] = useState<string | null>(null);
  const [qrFileName, setQrFileName] = useState<string | null>(null);
  const [extractingXUT, setExtractingXUT] = useState(false);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const handleQRFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataURL(file);
      setQrCardData(dataUrl);
      setQrFileName(file.name);
      setExtractingXUT(true);
      const xut = await extractXUTFromCardImage(dataUrl);
      setExtractingXUT(false);
      if (xut) {
        setXutNumber(xut);
        toast.success(`XUT detected: ${xut}`);
      } else {
        toast.info("No XUT code found in image — enter manually if needed");
      }
    } catch {
      setExtractingXUT(false);
      toast.error("Failed to read image file");
    }
    if (qrFileRef.current) qrFileRef.current.value = "";
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (!qrCardData) return toast.error("QR card image is required");
    try {
      await addMember.mutateAsync({
        username: username.trim(),
        qrCardData,
        xutNumber: xutNumber.trim(),
      });
      toast.success(`Member "${username.trim()}" added!`);
      setUsername("");
      setXutNumber("");
      setQrCardData(null);
      setQrFileName(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to add member — check backend connection",
      );
    }
  };

  const handleRemoveMember = async (uname: string) => {
    try {
      await removeMember.mutateAsync(uname);
      toast.success(`Member "${uname}" removed`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Member Management</h1>
          <Badge className="bg-primary/20 text-primary border-primary/40">
            Class 6
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Add members with a username and QR card image. XUT number is
          auto-detected from the card when possible.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Add New Member</h2>
          </div>

          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Username *</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="text-sm"
                data-ocid="members.username_input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">QR Card Image *</Label>
              <button
                type="button"
                onClick={() => qrFileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 py-5 border-2 border-dashed border-border/60 rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
                data-ocid="members.qr_dropzone"
              >
                {qrCardData ? (
                  <img
                    src={qrCardData}
                    alt="QR Card preview"
                    className="h-32 w-auto object-contain rounded-lg border border-border"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {extractingXUT
                      ? "Scanning for XUT code…"
                      : (qrFileName ?? "Upload QR Card Image")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PNG, JPG — XUT auto-detected from embedded QR
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 pointer-events-none"
                  data-ocid="members.qr_upload_button"
                >
                  {extractingXUT ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                  {qrCardData ? "Replace Image" : "Select Image"}
                </Button>
              </button>
              <input
                ref={qrFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQRFileChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                XUT Number{" "}
                <span className="text-muted-foreground font-normal">
                  (auto-detected from card, or enter manually)
                </span>
              </Label>
              <div className="relative">
                <Input
                  value={xutNumber}
                  onChange={(e) => setXutNumber(e.target.value)}
                  placeholder="XUT-0001"
                  className={`text-xs font-mono tracking-widest w-48 ${xutNumber ? "border-primary/50 text-primary" : ""}`}
                  data-ocid="members.xut_input"
                />
                {extractingXUT && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary/50" />
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={addMember.isPending || !username.trim() || !qrCardData}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              data-ocid="members.add_button"
            >
              {addMember.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Add Member
                </>
              )}
            </Button>
          </form>
        </div>

        <Separator className="bg-border/50" />

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Members</h2>
            {members.length > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/40 text-xs">
                {members.length}
              </Badge>
            )}
          </div>

          {membersLoading ? (
            <div
              className="flex items-center gap-2 text-muted-foreground py-6 justify-center"
              data-ocid="members.loading_state"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading members...</span>
            </div>
          ) : members.length === 0 ? (
            <div
              className="text-center py-10 text-muted-foreground"
              data-ocid="members.empty_state"
            >
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No members yet</p>
              <p className="text-xs mt-1">
                Add your first member using the form above.
              </p>
            </div>
          ) : (
            <ul className="space-y-3" data-ocid="members.list">
              {members.map((member, idx) => (
                <li
                  key={member.username}
                  className="flex items-center gap-3 p-3 bg-background/50 border border-border/50 rounded-lg"
                  data-ocid={`members.item.${idx + 1}`}
                >
                  {member.qrCardData ? (
                    <img
                      src={member.qrCardData}
                      alt={`${member.username} QR`}
                      className="w-12 h-12 object-contain rounded border border-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded border border-border/50 bg-muted/30 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {member.username}
                    </p>
                    {member.xutNumber && (
                      <p className="text-xs font-mono text-primary/70 mt-0.5">
                        {member.xutNumber}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={removeMember.isPending}
                    onClick={() => handleRemoveMember(member.username)}
                    className="gap-1.5 text-xs flex-shrink-0"
                    data-ocid={`members.delete_button.${idx + 1}`}
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
