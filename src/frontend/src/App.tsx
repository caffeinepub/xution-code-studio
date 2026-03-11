import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  isCanisterStopped,
  useCallerProfile,
  useIsAdmin,
  useSaveProfile,
  useSeedDefaultUsers,
} from "@/hooks/useQueries";
import DashboardPage from "@/pages/DashboardPage";
import EditorPage from "@/pages/EditorPage";
import LoginPage from "@/pages/LoginPage";
import MembersPage from "@/pages/MembersPage";
import PreviewPage from "@/pages/PreviewPage";
import TrainingPage from "@/pages/TrainingPage";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Loader2,
  LogOut,
  RefreshCw,
  ServerCrash,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CLASS6_USERNAMES = new Set(["Unity", "Syndelious"]);

type Page = "dashboard" | "editor" | "members" | "training";

function getPreviewId(): string | null {
  const hash = window.location.hash;
  if (hash.startsWith("#/preview/")) {
    const id = hash.slice("#/preview/".length).trim();
    return id || null;
  }
  return null;
}

export default function App() {
  const previewId = getPreviewId();
  if (previewId) {
    return (
      <>
        <PreviewPage projectId={previewId} />
        <Toaster />
      </>
    );
  }
  return <MainApp />;
}

// Session is stored ONLY in React state — no localStorage, no cookies.
// Lost on page refresh, but updates are real-time via backend canister.
function MainApp() {
  const [session, setSession] = useState<string | null>(null);

  if (!session) {
    return (
      <>
        <LoginPage onLogin={(username) => setSession(username)} />
        <Toaster />
      </>
    );
  }

  return <BackendApp username={session} onSignOut={() => setSession(null)} />;
}

function BackendApp({
  username,
  onSignOut,
}: {
  username: string;
  onSignOut: () => void;
}) {
  const { isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  // Class 6 status is determined purely from username — no backend check needed.
  const isClass6 = CLASS6_USERNAMES.has(username);

  const [actorTimedOut, setActorTimedOut] = useState(false);
  useEffect(() => {
    if (!actorFetching && !actor) {
      const t = setTimeout(() => setActorTimedOut(true), 5000);
      return () => clearTimeout(t);
    }
    if (actor) setActorTimedOut(false);
  }, [actorFetching, actor]);

  const {
    data: profile,
    isLoading: profileLoading,
    isFetching: profileFetching,
    isError: profileError,
    error: profileErrorObj,
    refetch: refetchProfile,
  } = useCallerProfile();

  const { data: isAdminFromCanister, refetch: refetchIsAdmin } = useIsAdmin();
  const isAdmin = isClass6 || !!isAdminFromCanister;

  const seedUsers = useSeedDefaultUsers();
  const saveProfile = useSaveProfile();

  const [page, setPage] = useState<Page>("dashboard");
  const [openProjectIds, setOpenProjectIds] = useState<string[]>([]);
  const bootstrapDoneRef = useRef(false);
  const seededRef = useRef(false);

  // IC0508 banner state — shown at top but never blocks UI
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Seed default users once backend is available
  useEffect(() => {
    if (!seededRef.current && actor && !actorFetching) {
      seededRef.current = true;
      seedUsers.mutate(undefined, { onError: () => {} });
    }
  }, [actor, actorFetching, seedUsers]);

  // Save profile to backend when connected
  useEffect(() => {
    if (!actor || actorFetching || bootstrapDoneRef.current) return;
    if (profileLoading || profileFetching) return;

    if (profile) {
      bootstrapDoneRef.current = true;
      refetchIsAdmin();
      return;
    }

    bootstrapDoneRef.current = true;
    saveProfile.mutate(username, {
      onSuccess: () => {
        refetchProfile();
        refetchIsAdmin();
      },
      onError: (err) => {
        if (isCanisterStopped(err)) setShowOfflineBanner(true);
        refetchIsAdmin();
      },
    });
  }, [
    actor,
    actorFetching,
    profile,
    profileLoading,
    profileFetching,
    username,
    saveProfile,
    refetchProfile,
    refetchIsAdmin,
  ]);

  // Show banner if profile errors with IC0508
  useEffect(() => {
    if (profileError && isCanisterStopped(profileErrorObj)) {
      setShowOfflineBanner(true);
    }
  }, [profileError, profileErrorObj]);

  const handleOpenProject = (projectId: string) => {
    setOpenProjectIds((prev) =>
      prev.includes(projectId) ? prev : [...prev, projectId],
    );
    setPage("editor");
  };

  const handleCloseProject = (projectId: string) => {
    setOpenProjectIds((prev) => prev.filter((id) => id !== projectId));
  };

  const handleNavigate = (targetPage: Page) => {
    if ((targetPage === "members" || targetPage === "training") && !isAdmin)
      return;
    setPage(targetPage);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // Class 6 users skip all blocking loading screens — they go straight to the app.
  // Non-Class 6 users see a brief spinner while actor connects, then proceed.
  // We NEVER block the UI for backend errors — only show banners.
  const isConnecting = !isClass6 && actorFetching && !actor && !actorTimedOut;

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Connecting to backend…
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-muted-foreground hover:text-foreground gap-2 text-xs"
            data-ocid="backend.signout_button"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* IC0508 / backend offline banner — floats at top, never blocks */}
      {showOfflineBanner && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30"
          data-ocid="app.error_state"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-400">
              <span className="font-semibold">
                Service temporarily offline.
              </span>{" "}
              Backend is restarting. Your session continues — saves will retry
              when it comes back.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-yellow-400 hover:text-yellow-300 h-6 text-xs px-2"
              onClick={() => {
                setShowOfflineBanner(false);
                queryClient.resetQueries({ queryKey: ["callerProfile"] });
                refetchProfile();
              }}
              data-ocid="app.retry_button"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
            <button
              type="button"
              onClick={() => setShowOfflineBanner(false)}
              className="text-yellow-400/50 hover:text-yellow-400 text-xs"
              aria-label="Dismiss"
              data-ocid="app.close_button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={showOfflineBanner ? "pt-9" : ""}>
        <Layout
          currentPage={page}
          onNavigate={handleNavigate}
          localOverrides={{ username, isAdmin, onSignOut }}
        >
          {page === "dashboard" && (
            <DashboardPage
              onOpenProject={handleOpenProject}
              onNavigate={(p) => handleNavigate(p as Page)}
            />
          )}
          {page === "editor" && (
            <EditorPage
              openProjectIds={openProjectIds}
              onAddProject={() => setPage("dashboard")}
              onCloseProject={handleCloseProject}
              onBackToProjects={() => setPage("dashboard")}
            />
          )}
          {page === "members" && isAdmin && <MembersPage />}
          {page === "training" && isAdmin && <TrainingPage />}
        </Layout>
      </div>

      {/* Show ServerCrash indicator for non-class6 if actor fails completely after timeout */}
      {actorTimedOut && !actor && !isClass6 && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-black border border-yellow-500/30 rounded-xl px-3 py-2">
          <ServerCrash className="w-4 h-4 text-yellow-400/70" />
          <p className="text-xs text-yellow-400/70">Backend unreachable</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActorTimedOut(false);
              queryClient.resetQueries({ queryKey: ["actor"] });
            }}
            className="text-yellow-400/70 hover:text-yellow-400 h-6 text-xs px-2"
            data-ocid="app.retry_button"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      )}

      <Toaster />
    </>
  );
}
