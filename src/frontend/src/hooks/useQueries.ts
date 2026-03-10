import type { ProjectFile } from "@/backend";
import { Language, UserRole } from "@/backend";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
    retryDelay: 1000,
  });
}

export function useCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerProjects() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProjects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGlobalProjects() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["globalProjects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGlobalProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProject(projectId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!actor || !projectId) return null;
      return actor.getProject(projectId);
    },
    enabled: !!actor && !isFetching && !!projectId,
  });
}

export function useProjectVersions(projectId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["versions", projectId],
    queryFn: async () => {
      if (!actor || !projectId) return [];
      return actor.getProjectVersions(projectId);
    },
    enabled: !!actor && !isFetching && !!projectId,
  });
}

export function useAIPreferenceRules() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["aiPreferences"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAIPreferenceRules();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(username);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
      qc.invalidateQueries({ queryKey: ["callerRole"] });
    },
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      title: string;
      language: Language;
      files: ProjectFile[];
      isGlobal: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createProject(
        args.title,
        args.language,
        args.files,
        args.isGlobal,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProjects"] });
      qc.invalidateQueries({ queryKey: ["globalProjects"] });
    },
  });
}

export function useUpdateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      projectId: string;
      title: string;
      language: Language;
      files: ProjectFile[];
      isGlobal: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateProject(
        args.projectId,
        args.title,
        args.language,
        args.files,
        args.isGlobal,
      );
    },
    onSuccess: (_, args) => {
      qc.invalidateQueries({ queryKey: ["project", args.projectId] });
      qc.invalidateQueries({ queryKey: ["callerProjects"] });
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteProject(projectId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProjects"] });
      qc.invalidateQueries({ queryKey: ["globalProjects"] });
    },
  });
}

export function useAddVersion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      projectId: string;
      prompt: string;
      files: ProjectFile[];
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.addVersion(args.projectId, args.prompt, args.files);
    },
    onSuccess: (_, args) => {
      qc.invalidateQueries({ queryKey: ["versions", args.projectId] });
    },
  });
}

export function useRevertVersion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { projectId: string; versionId: string }) => {
      if (!actor) throw new Error("Not connected");
      await actor.revertToVersion(args.projectId, args.versionId);
    },
    onSuccess: (_, args) => {
      qc.invalidateQueries({ queryKey: ["project", args.projectId] });
      qc.invalidateQueries({ queryKey: ["versions", args.projectId] });
    },
  });
}

export function useAddAIPreference() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.addAIPreferenceRule(rule);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aiPreferences"] });
    },
  });
}

export function useRemoveAIPreference() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (index: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.removeAIPreferenceRule(index);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aiPreferences"] });
    },
  });
}

export function useAddMember() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (args: { userId: Principal; username: string }) => {
      if (!actor) throw new Error("Not connected");
      await actor.addMember(args.userId, args.username);
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.removeMember(userId);
    },
  });
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (args: { userId: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateUserRole(args.userId, args.role);
    },
  });
}

export function useSeedDefaultUsers() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.seedDefaultClass6Users();
    },
  });
}

// Cast actor to any for getLogo/setLogo since these methods exist on the
// backend but aren't yet reflected in the auto-generated binding types.
export function useLogo() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["logo"],
    queryFn: async () => {
      if (!actor) return "";
      try {
        return (actor as any).getLogo() as Promise<string>;
      } catch {
        return "";
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetLogo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: string) => {
      if (!actor) throw new Error("Not connected");
      try {
        await (actor as any).setLogo(data);
      } catch {
        // silently fail if method doesn't exist on backend
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logo"] });
    },
  });
}

export { Language, UserRole };
