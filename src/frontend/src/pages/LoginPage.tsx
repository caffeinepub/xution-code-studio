import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
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
  onLocalLogin?: (username: string) => void;
}

export default function LoginPage({ onLocalLogin }: LoginPageProps) {
  const { isLoggingIn } = useInternetIdentity();
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

  const doLocalLogin = (uname: string) => {
    localStorage.setItem("xution_local_session", uname);
    if (CLASS6_CREDENTIALS[uname] !== undefined) {
      localStorage.setItem("xution_is_class6", "true");
    }
    toast.success(`Signed in as ${uname}`);
    onLocalLogin?.(uname);
  };

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
        doLocalLogin(username);
        return;
      }
      // Regular member stored locally
      const stored = localStorage.getItem("xution_credentials");
      if (stored) {
        const creds = JSON.parse(stored) as {
          username: string;
          password: string;
        };
        if (creds.username === username && creds.password === password) {
          doLocalLogin(username);
          return;
        }
        toast.error("Invalid username or password");
      } else {
        toast.error(
          "No account found for this username. Contact a Class 6 member.",
        );
      }
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
      if (storedQR === null) {
        setQrError("No member found with that username.");
        return;
      }
      if (storedQR !== qrDataUrl) {
        setQrError("QR card does not match stored credentials.");
        return;
      }
      setQrSuccess(true);
      doLocalLogin(qrUsername.trim());
    } catch {
      setQrError("Verification failed. Please try again.");
    } finally {
      setIsProcessingQR(false);
    }
  };

  const isLoading = isLoggingIn || isCheckingCreds;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/15 border-2 border-primary/40 flex items-center justify-center animate-glow-pulse">
              <Code2 className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-black gold-gradient mb-3 tracking-tight">
            Xution Code Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            Build real projects from plain language — powered by AI
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-6 mb-6"
        >
          {/* Tab switcher */}
          <div className="flex mb-5 bg-muted/30 rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`flex-1 h-8 rounded-md text-sm font-medium transition-all ${
                activeTab === "password"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="login.password_tab"
            >
              Secret Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`flex-1 h-8 rounded-md text-sm font-medium transition-all ${
                activeTab === "qr"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="login.qr_tab"
            >
              QR Card Login
            </button>
          </div>

          {activeTab === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  data-ocid="login.username_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Secret Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secret password"
                  autoComplete="current-password"
                  data-ocid="login.password_input"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className="w-full h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
                data-ocid="login.password_submit_button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                    In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Account access is restricted to Class 6 members. Contact an
                  admin for access.
                </p>
              </div>
            </form>
          )}

          {activeTab === "qr" && (
            <div className="space-y-4">
              {/* Username field for QR login */}
              <div className="space-y-1.5">
                <Label className="text-xs">Username</Label>
                <Input
                  value={qrUsername}
                  onChange={(e) => {
                    setQrUsername(e.target.value);
                    setQrError(null);
                    setQrSuccess(false);
                  }}
                  placeholder="Enter your username"
                  data-ocid="login.qr_username_input"
                />
              </div>

              {/* QR card upload */}
              <div className="space-y-1.5">
                <Label className="text-xs">QR Card Image</Label>
                <button
                  type="button"
                  className="w-full flex flex-col items-center justify-center py-5 gap-3 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => qrFileRef.current?.click()}
                  data-ocid="login.qr_dropzone"
                >
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Card"
                      className="h-24 w-auto object-contain rounded-lg border border-border"
                    />
                  ) : (
                    <QrCode className="w-10 h-10 text-primary/50" />
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {qrFileName ?? "Upload Your QR Card"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload the QR card image given to you by a Class 6 admin
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled={isProcessingQR}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 pointer-events-none"
                    data-ocid="login.qr_upload_button"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {qrDataUrl ? "Replace Image" : "Select Image"}
                  </Button>
                  <input
                    ref={qrFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQRFileChange}
                  />
                </button>
              </div>

              {/* Error state */}
              <AnimatePresence>
                {qrError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
                    data-ocid="login.qr.error_state"
                  >
                    <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-xs text-destructive">{qrError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success state */}
              <AnimatePresence>
                {qrSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg"
                    data-ocid="login.qr.success_state"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-xs text-primary font-semibold">
                      QR verified — signing in...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="button"
                onClick={handleQRLogin}
                disabled={isProcessingQR || !qrUsername.trim() || !qrDataUrl}
                className="w-full h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
                data-ocid="login.qr_submit_button"
              >
                {isProcessingQR ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Sign In with QR Card"
                )}
              </Button>

              <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">How it works:</strong>{" "}
                  Enter your username and upload the QR card image assigned to
                  you by a Class 6 admin. Your card is verified against the
                  stored record.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            {
              icon: Zap,
              label: "Live Preview",
              desc: "See changes in real-time",
            },
            {
              icon: Shield,
              label: "Class 6 Roles",
              desc: "Admin & member access",
            },
            {
              icon: Users,
              label: "Team Projects",
              desc: "Collaborate globally",
            },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-card/50 border border-border/50 rounded-xl p-3 text-center"
            >
              <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
