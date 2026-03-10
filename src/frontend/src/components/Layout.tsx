import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useCallerProfile,
  useIsAdmin,
  useLogo,
  useSetLogo,
} from "@/hooks/useQueries";
import {
  Brain,
  Camera,
  ChevronDown,
  Code2,
  Home,
  Loader2,
  LogOut,
  Users,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

type Page = "dashboard" | "editor" | "members" | "training";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Layout({
  children,
  currentPage,
  onNavigate,
}: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: logoSrc } = useLogo();
  const setLogo = useSetLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal ? `${principal.slice(0, 8)}...` : "";

  const handleLogoClick = () => {
    if (isAdmin) {
      fileInputRef.current?.click();
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        await setLogo.mutateAsync(dataUrl);
        toast.success("Logo updated!");
      } catch {
        toast.error("Failed to update logo");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button
                type="button"
                className="relative group w-8 h-8 rounded-md border border-primary flex items-center justify-center overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={handleLogoClick}
                title="Click to change logo"
                aria-label="Change logo"
                data-ocid="logo.button"
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Xution logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Code2 className="w-4 h-4 text-primary" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {setLogo.isPending ? (
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3 text-primary" />
                  )}
                </div>
              </button>
            ) : (
              <div className="w-8 h-8 rounded-md border border-primary flex items-center justify-center overflow-hidden">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Xution logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Code2 className="w-4 h-4 text-primary" />
                )}
              </div>
            )}
            {/* Hidden file input for logo upload */}
            {isAdmin && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFileChange}
                data-ocid="logo.upload_button"
              />
            )}
            <span className="font-display font-bold text-lg gold-gradient">
              Xution Code Studio
            </span>
            {isAdmin && (
              <Badge className="bg-primary/20 text-primary border-primary/40 text-xs">
                Class 6
              </Badge>
            )}
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={currentPage === "dashboard" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onNavigate("dashboard")}
              data-ocid="nav.dashboard_link"
              className={
                currentPage === "dashboard"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              <Home className="w-4 h-4 mr-1" />
              Projects
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant={currentPage === "members" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate("members")}
                  data-ocid="nav.members_link"
                  className={
                    currentPage === "members"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <Users className="w-4 h-4 mr-1" />
                  Members
                </Button>
                <Button
                  variant={currentPage === "training" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate("training")}
                  data-ocid="nav.training_link"
                  className={
                    currentPage === "training"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <Brain className="w-4 h-4 mr-1" />
                  AI Training
                </Button>
              </>
            )}
          </nav>

          {/* Right side: admin quick-access buttons + user menu */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate("members")}
                  className="gap-1.5 border-primary text-primary hover:bg-primary/10 text-xs h-8"
                  data-ocid="nav.members_header_button"
                >
                  <Users className="w-3.5 h-3.5" />
                  Member Management
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate("training")}
                  className="gap-1.5 border-primary text-primary hover:bg-primary/10 text-xs h-8"
                  data-ocid="nav.training_header_button"
                >
                  <Brain className="w-3.5 h-3.5" />
                  AI Training
                </Button>
              </div>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  data-ocid="nav.user_menu_button"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center text-primary text-xs font-bold">
                    {profile?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="hidden md:inline text-sm">
                    {profile?.username ?? shortPrincipal}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  disabled
                  className="text-xs text-muted-foreground"
                >
                  {shortPrincipal}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onNavigate("dashboard")}
                  data-ocid="nav.back_to_projects_link"
                >
                  <Home className="w-4 h-4 mr-2" /> Back to Projects
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onNavigate("members")}
                      data-ocid="nav.members_dropdown_link"
                    >
                      <Users className="w-4 h-4 mr-2" /> Member Management
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onNavigate("training")}
                      data-ocid="nav.training_dropdown_link"
                    >
                      <Brain className="w-4 h-4 mr-2" /> AI Training
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clear}
                  className="text-destructive focus:text-destructive"
                  data-ocid="auth.logout_button"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-3 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with{" "}
          <span className="text-primary">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
