import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetMemberQR } from "@/hooks/useQueries";
import {
  CheckCircle2,
  Code2,
  ImageIcon,
  Loader2,
  QrCode,
  Shield,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type LoginTab = "password" | "qr";

const CLASS6_CREDENTIALS: Record<string, string> = {
  Unity: "Bacon",
  Syndelious: "StarCode",
};

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const getMemberQR = useGetMemberQR();

  const [activeTab, setActiveTab] = useState<LoginTab>("password");
  const [username, setUsername] = useState("Unity");
  const [password, setPassword] = useState("");
  const [isCheckingCreds, setIsCheckingCreds] = useState(false);

  // QR login state
  const [qrUsername, setQrUsername] = useState("");
  const [qrFileName, setQrFileName] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrSuccess, setQrSuccess] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setIsCheckingCreds(true);
    try {
      const class6Secret = CLASS6_CREDENTIALS[username];
      if (class6Secret !== undefined) {
        if (password !== class6Secret) {
          toast.error("Invalid username or password");
          return;
        }
        toast.success(`Signed in as ${username}`);
        onLogin(username);
        return;
      }
      // For regular members, verify against backend-stored QR data
      // Since we can't verify password without backend, show error
      toast.error("No account found. Contact a Class 6 member.");
    } catch {
      toast.error("Login failed");
    } finally {
      setIsCheckingCreds(false);
    }
  };

  const handleQRFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrError(null);
    setQrSuccess(false);
    try {
      const dataUrl = await fileToDataURL(file);
      setQrDataUrl(dataUrl);
      setQrFileName(file.name);
    } catch {
      setQrError("Failed to read image file.");
    }
    if (qrFileRef.current) qrFileRef.current.value = "";
  };

  const handleQRLogin = async () => {
    if (!qrUsername.trim()) {
      setQrError("Please enter your username.");
      return;
    }
    if (!qrDataUrl) {
      setQrError("Please upload your QR card image.");
      return;
    }
    setIsProcessingQR(true);
    setQrError(null);
    setQrSuccess(false);
    try {
      const storedQR = await getMemberQR.mutateAsync(qrUsername.trim());
      if (storedQR && storedQR === qrDataUrl) {
        setQrSuccess(true);
        toast.success(`Signed in as ${qrUsername.trim()}`);
        setTimeout(() => onLogin(qrUsername.trim()), 600);
      } else if (storedQR) {
        setQrError("QR card does not match. Try again or contact Class 6.");
      } else {
        // Backend may be offline — allow login if username matches
        setQrError(
          "Could not verify QR (backend may be offline). Try password login.",
        );
      }
    } catch {
      setQrError("Verification failed. Check your connection and try again.");
    } finally {
      setIsProcessingQR(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.78 0.15 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.15 85) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-4 shadow-[0_0_32px_oklch(0.78_0.15_85/0.15)]">
            <Code2 className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-yellow-400 tracking-tight">
            Xution Code Studio
          </h1>
          <p className="text-sm text-yellow-400/40 mt-1">
            AI-powered development environment
          </p>
        </div>

        {/* Card */}
        <div className="bg-black border border-yellow-500/25 rounded-2xl overflow-hidden shadow-[0_0_40px_oklch(0.78_0.15_85/0.08)]">
          {/* Tabs */}
          <div className="flex border-b border-yellow-500/20">
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                activeTab === "password"
                  ? "text-yellow-400 border-b-2 border-yellow-400 bg-yellow-500/5"
                  : "text-yellow-400/40 hover:text-yellow-400/70"
              }`}
              data-ocid="login.password_tab"
            >
              <Shield className="w-3.5 h-3.5" /> Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                activeTab === "qr"
                  ? "text-yellow-400 border-b-2 border-yellow-400 bg-yellow-500/5"
                  : "text-yellow-400/40 hover:text-yellow-400/70"
              }`}
              data-ocid="login.qr_tab"
            >
              <QrCode className="w-3.5 h-3.5" /> QR Card
            </button>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "password" ? (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handlePasswordLogin}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-yellow-400/70 text-xs font-medium">
                      Username
                    </Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-black border-yellow-500/30 text-yellow-100 placeholder:text-yellow-400/20 focus-visible:ring-yellow-500/50 focus-visible:border-yellow-500/60 h-10"
                      placeholder="Username"
                      autoComplete="username"
                      data-ocid="login.username_input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-yellow-400/70 text-xs font-medium">
                      Secret Password
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black border-yellow-500/30 text-yellow-100 placeholder:text-yellow-400/20 focus-visible:ring-yellow-500/50 focus-visible:border-yellow-500/60 h-10"
                      placeholder="Secret password"
                      autoComplete="current-password"
                      data-ocid="login.password_input"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      isCheckingCreds || !username.trim() || !password.trim()
                    }
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-10 disabled:opacity-40"
                    data-ocid="login.submit_button"
                  >
                    {isCheckingCreds ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" /> Sign In
                      </>
                    )}
                  </Button>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { icon: Shield, label: "Secure" },
                      { icon: Users, label: "Class 6" },
                      { icon: Zap, label: "Real-time" },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-yellow-500/5 border border-yellow-500/15"
                      >
                        <Icon className="w-4 h-4 text-yellow-400/60" />
                        <span className="text-[10px] text-yellow-400/40">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-yellow-400/70 text-xs font-medium">
                      Username
                    </Label>
                    <Input
                      value={qrUsername}
                      onChange={(e) => setQrUsername(e.target.value)}
                      className="bg-black border-yellow-500/30 text-yellow-100 placeholder:text-yellow-400/20 focus-visible:ring-yellow-500/50 h-10"
                      placeholder="Your username"
                      data-ocid="login.qr_username_input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-yellow-400/70 text-xs font-medium">
                      QR Card Image
                    </Label>
                    <button
                      type="button"
                      onClick={() => qrFileRef.current?.click()}
                      className="w-full h-24 border border-dashed border-yellow-500/25 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-colors"
                      data-ocid="login.qr_upload_button"
                    >
                      {qrDataUrl ? (
                        <>
                          <img
                            src={qrDataUrl}
                            alt="QR card"
                            className="h-16 object-contain rounded"
                          />
                          <span className="text-[10px] text-yellow-400/50">
                            {qrFileName}
                          </span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-yellow-400/30" />
                          <span className="text-xs text-yellow-400/40">
                            Upload your QR card image
                          </span>
                        </>
                      )}
                    </button>
                    <input
                      ref={qrFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQRFileChange}
                      className="hidden"
                    />
                  </div>

                  {qrError && (
                    <div
                      className="flex items-start gap-2 text-xs text-red-400/80 bg-red-400/10 border border-red-400/20 rounded-lg p-3"
                      data-ocid="login.error_state"
                    >
                      <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {qrError}
                    </div>
                  )}

                  {qrSuccess && (
                    <div
                      className="flex items-center gap-2 text-xs text-green-400/80 bg-green-400/10 border border-green-400/20 rounded-lg p-3"
                      data-ocid="login.success_state"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Identity verified — signing in…
                    </div>
                  )}

                  <Button
                    onClick={handleQRLogin}
                    disabled={
                      isProcessingQR || !qrUsername.trim() || !qrDataUrl
                    }
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-10 disabled:opacity-40"
                    data-ocid="login.qr_submit_button"
                  >
                    {isProcessingQR ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" /> Verify & Sign In
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-[10px] text-yellow-400/20 mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-yellow-400/40 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
