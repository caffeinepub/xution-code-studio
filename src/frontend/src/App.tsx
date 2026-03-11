import Layout from "@/components/Layout";
import UsernameSetup from "@/components/UsernameSetup";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
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
import { Loader2, RefreshCw, WifiOff } from "lucide-react";
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
  const { identity, isInitializing } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading: profileLoading,
    isFetching: profileFetching,
    isError: profileError,
    refetch: refetchProfile,
  } = useCallerProfile();
  const { data: isAdmin, refetch: refetchIsAdmin } = useIsAdmin();
  const seedUsers = useSeedDefaultUsers();
  const saveProfile = useSaveProfile();

  const [page, setPage] = useState<Page>("dashboard");
  const [openProjectIds, setOpenProjectIds] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);
  const bootstrapDoneRef = useRef(false);

  // Seed default users once on login
  useEffect(() => {
    if (isLoggedIn && !seeded && actor && !actorFetching) {
      setSeeded(true);
      seedUsers.mutate(undefined, { onError: () => {} });
    }
  }, [isLoggedIn, seeded, actor, actorFetching, seedUsers]);

  // Bootstrap Class 6 profile from localStorage pending flag
  useEffect(() => {
    if (!isLoggedIn || !actor || actorFetching || bootstrapDoneRef.current)
      return;
    if (profileLoading || profileFetching) return;

    const pendingUsername = localStorage.getItem("xution_class6_pending");

    // Mark existing Class 6 users as admin in localStorage when they log in
    if (profile && CLASS6_USERNAMES.has(profile.username)) {
      localStorage.setItem("xution_is_class6", "true");
      localStorage.removeItem("xution_class6_pending");
      bootstrapDoneRef.current = true;
      refetchIsAdmin();
      return;
    }

    // Create profile for pending Class 6 user
    if (pendingUsername && !profile) {
      bootstrapDoneRef.current = true;
      saveProfile.mutate(pendingUsername, {
        onSuccess: () => {
          localStorage.setItem("xution_is_class6", "true");
          localStorage.removeItem("xution_class6_pending");
          refetchProfile();
          refetchIsAdmin();
        },
        onError: () => {
          // Still set class6 flag so UI is accessible even if backend save fails
          localStorage.setItem("xution_is_class6", "true");
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

  // Show loading only during initial auth check
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

  // Show login page immediately without waiting for actor
  if (!isLoggedIn) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  // After login: show connecting screen while actor loads
  if (actorFetching && !actor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Connecting to backend...
          </p>
        </div>
      </div>
    );
  }

  // Actor not available — show retry
  if (!actorFetching && !actor) {
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
          <Button
            data-ocid="backend.retry_button"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["actor"] })
            }
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show profile loading spinner only while actively fetching and no error yet
  if (profileLoading || (!profile && profileFetching && !profileError)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // No profile found (new user, error, or null response) → prompt setup
  // But skip setup for pending Class 6 users (they'll get bootstrapped)
  const pendingClass6 = localStorage.getItem("xution_class6_pending");
  if (!profile && !pendingClass6) {
    return (
      <>
        <UsernameSetup />
        <Toaster />
      </>
    );
  }

  // If still bootstrapping Class 6, show a brief loading state
  if (!profile && pendingClass6) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Setting up your Class 6 account...
          </p>
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
