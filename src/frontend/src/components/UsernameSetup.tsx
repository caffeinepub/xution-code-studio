import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveProfile } from "@/hooks/useQueries";
import { Code2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function UsernameSetup() {
  const [username, setUsername] = useState("");
  const saveProfile = useSaveProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    saveProfile.mutate(username.trim(), {
      onSuccess: () =>
        toast.success("Profile created! Welcome to AI Code Studio."),
      onError: () => toast.error("Failed to save profile. Please try again."),
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
            <Code2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold gold-gradient mb-2">
            Welcome
          </h1>
          <p className="text-muted-foreground">
            Set your username to get started
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username..."
                className="bg-muted/50 border-border focus:border-primary"
                autoFocus
                data-ocid="username.input"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={!username.trim() || saveProfile.isPending}
              data-ocid="username.submit_button"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating
                  profile...
                </>
              ) : (
                "Continue →"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
