import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { parseQRFromFile } from "@/utils/qrUtils";
import { Code2, Loader2, QrCode, Shield, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type LoginTab = "password" | "qr";

const CLASS6_CREDENTIALS: Record<string, string> = {
  Unity: "Bacon",
  Syndelious: "StarCode",
};

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState<LoginTab>("password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingCreds, setIsCheckingCreds] = useState(false);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setIsCheckingCreds(true);
    try {
      // Check hardcoded Class 6 credentials first
      const class6Secret = CLASS6_CREDENTIALS[username];
      if (class6Secret !== undefined) {
        if (password !== class6Secret) {
          toast.error("Invalid username or password");
          return;
        }
        localStorage.setItem("xution_class6_pending", username);
        toast.success("Class 6 credentials verified — connecting...");
        await login();
        return;
      }

      // Fall through to stored credentials for regular members
      const stored = localStorage.getItem("xution_credentials");
      if (stored) {
        const creds = JSON.parse(stored);
        if (creds.username === username && creds.password === password) {
          toast.success("Credentials verified — connecting...");
          await login();
          return;
        }
        toast.error("Invalid username or password");
      } else {
        toast.info(
          "No local credentials found. Connecting via Internet Identity...",
        );
        await login();
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setIsCheckingCreds(false);
    }
  };

  const handleQRLogin = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseQRFromFile(file);
    if (!result) {
      toast.error("Could not read QR code. Try a valid Xution QR image.");
      return;
    }
    const storedSecret = localStorage.getItem(`xution_qr_${result.principal}`);
    if (storedSecret && storedSecret !== result.secret) {
      toast.error("QR code secret does not match. Access denied.");
      return;
    }
    if (!storedSecret) {
      localStorage.setItem(`xution_qr_${result.principal}`, result.secret);
    }
    setUsername(result.username);
    toast.success(`QR verified for ${result.username} — connecting...`);
    await login();
    if (qrFileRef.current) qrFileRef.current.value = "";
  };

  const isLoading = isLoggingIn || isCheckingCreds;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/3 blur-3xl" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, oklch(0.78 0.15 85 / 0.04) 0%, transparent 70%)",
          }}
        />
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
              QR Code
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
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button
                type="button"
                onClick={login}
                disabled={isLoading}
                variant="outline"
                className="w-full h-9 text-sm border-border/70 text-muted-foreground hover:text-foreground"
                data-ocid="auth.login_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Connecting...
                  </>
                ) : (
                  "Connect via Internet Identity"
                )}
              </Button>
            </form>
          )}

          {activeTab === "qr" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 gap-4 border-2 border-dashed border-border/50 rounded-xl">
                <QrCode className="w-12 h-12 text-primary/50" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Import your QR Code
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload the QR code image exported from your profile
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => qrFileRef.current?.click()}
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  data-ocid="login.qr_upload_button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Select QR Image
                    </>
                  )}
                </Button>
                <input
                  ref={qrFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQRLogin}
                />
              </div>
              <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">How it works:</strong> A
                  Class 6 member or you can export a QR code from your profile.
                  Import it here to authenticate instantly.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Feature highlights */}
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
