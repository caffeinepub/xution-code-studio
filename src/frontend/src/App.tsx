import Layout from "@/components/Layout";
import UsernameSetup from "@/components/UsernameSetup";
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
import { Loader2, LogOut, RefreshCw, ServerCrash, WifiOff } from "lucide-react";
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

function MainApp() {
  const { identity, isInitializing, clear } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const [actorError, setActorError] = useState(false);
  useEffect(() => {
    if (!actorFetching && !actor && isLoggedIn) {
      const t = setTimeout(() => setActorError(true), 500);
      return () => clearTimeout(t);
    }
    if (actor) setActorError(false);
  }, [actorFetching, actor, isLoggedIn]);

  const {
    data: profile,
    isLoading: profileLoading,
    isFetching: profileFetching,
    isError: profileError,
    error: profileErrorObj,
    isSuccess: profileSuccess,
    refetch: refetchProfile,
  } = useCallerProfile();
  const { data: isAdmin, refetch: refetchIsAdmin } = useIsAdmin();
  const seedUsers = useSeedDefaultUsers();
  const saveProfile = useSaveProfile();

  const [page, setPage] = useState<Page>("dashboard");
  const [openProjectIds, setOpenProjectIds] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);
  const bootstrapDoneRef = useRef(false);

  useEffect(() => {
    if (isLoggedIn && !seeded && actor && !actorFetching) {
      setSeeded(true);
      seedUsers.mutate(undefined, { onError: () => {} });
    }
  }, [isLoggedIn, seeded, actor, actorFetching, seedUsers]);

  useEffect(() => {
    if (!isLoggedIn || !actor || actorFetching || bootstrapDoneRef.current)
      return;
    if (profileLoading || profileFetching) return;

    const pendingUsername = localStorage.getItem("xution_class6_pending");

    if (profile && CLASS6_USERNAMES.has(profile.username)) {
      localStorage.setItem("xution_is_class6", "true");
      localStorage.removeItem("xution_class6_pending");
      bootstrapDoneRef.current = true;
      refetchIsAdmin();
      return;
    }

    if (pendingUsername && !profile) {
      bootstrapDoneRef.current = true;
      saveProfile.mutate(pendingUsername, {
        onSuccess: () => {
          localStorage.setItem("xution_is_class6", "true");
          localStorage.removeItem("xution_class6_pending");
          refetchProfile();
          refetchIsAdmin();
        },
        onError: (err) => {
          // Even if save failed, let the user in so they're not stuck
          if (!isCanisterStopped(err)) {
            localStorage.setItem("xution_is_class6", "true");
          }
          localStorage.removeItem("xution_class6_pending");
          queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
        },
      });
    }
  }, [
    isLoggedIn,
    actor,
    actorFetching,
    profile,
    profileLoading,
    profileFetching,
    saveProfile,
    refetchProfile,
    refetchIsAdmin,
    queryClient,
  ]);

  const handleSignOut = () => {
    localStorage.removeItem("xution_is_class6");
    localStorage.removeItem("xution_class6_pending");
    queryClient.clear();
    clear();
  };

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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Loading Xution Code Studio...
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (actorFetching && !actor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Connecting to backend...
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground gap-2"
            data-ocid="backend.signout_button"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (actorError && !actor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <WifiOff className="w-10 h-10 text-primary" />
          <p className="text-primary font-semibold text-lg">
            Connection failed
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Could not reach the backend. Please check your connection and try
            again.
          </p>
          <div className="flex gap-3">
            <Button
              data-ocid="backend.retry_button"
              onClick={() => {
                setActorError(false);
                queryClient.resetQueries({ queryKey: ["actor"] });
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2"
              data-ocid="backend.signout_button"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Canister stopped (IC0508) -- show friendly offline screen
  if (profileError && isCanisterStopped(profileErrorObj)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <ServerCrash className="w-10 h-10 text-primary" />
          <p className="text-primary font-semibold text-lg">
            Service temporarily offline
          </p>
          <p className="text-sm text-muted-foreground">
            The backend canister is restarting. This usually takes less than a
            minute. Please try again shortly.
          </p>
          <div className="flex gap-3">
            <Button
              data-ocid="profile.retry_button"
              onClick={() => {
                queryClient.resetQueries({ queryKey: ["callerProfile"] });
                refetchProfile();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2"
              data-ocid="profile.signout_button"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Only show the profile loading spinner while the query is actively in flight.
  const profileStillLoading =
    profileLoading || (profileFetching && !profileSuccess && !profileError);

  if (profileStillLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground gap-2"
            data-ocid="profile.signout_button"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const pendingClass6 = localStorage.getItem("xution_class6_pending");
  if (!profile && !pendingClass6) {
    return (
      <>
        <UsernameSetup />
        <Toaster />
      </>
    );
  }

  if (!profile && pendingClass6) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Setting up your Class 6 account...
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground gap-2"
            data-ocid="setup.signout_button"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout currentPage={page} onNavigate={handleNavigate}>
        {page === "dashboard" && (
          <DashboardPage
            onOpenProject={handleOpenProject}
            onNavigate={(p) => handleNavigate(p)}
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
      <Toaster />
    </>
  );
}
