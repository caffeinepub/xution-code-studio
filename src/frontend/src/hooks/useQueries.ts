import type { ProjectFile } from "@/backend";
import { Language, UserRole } from "@/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function isCanisterStopped(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("IC0508") || msg.includes("is stopped");
}

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await withTimeout(actor.getCallerUserProfile(), 8000);
      } catch (err) {
        if (isCanisterStopped(err)) throw err;
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
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
      if (localStorage.getItem("xution_is_class6") === "true") return true;
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
      try {
        return await actor.getAIPreferenceRules();
      } catch {
        return [];
      }
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
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
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

// ─── Member management ─────────────────────────────────────────────────────────
// Stored as AI preference rules with "__MEMBER__:" prefix

const MEMBER_PREFIX = "__MEMBER__:";

export interface MemberRecord {
  username: string;
  xutNumber: string;
  qrCardData: string;
  createdAt: number;
}

function encodeMember(m: MemberRecord): string {
  return MEMBER_PREFIX + JSON.stringify(m);
}

function decodeMember(raw: string): MemberRecord | null {
  if (!raw.startsWith(MEMBER_PREFIX)) return null;
  try {
    return JSON.parse(raw.slice(MEMBER_PREFIX.length)) as MemberRecord;
  } catch {
    return null;
  }
}

export function useGetMembers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const rules = await actor.getAIPreferenceRules();
        return rules
          .map(decodeMember)
          .filter((m): m is MemberRecord => m !== null);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      username: string;
      qrCardData: string;
      xutNumber: string;
    }) => {
      if (!actor) throw new Error("Not connected to backend");
      const record: MemberRecord = {
        username: args.username.trim(),
        xutNumber: args.xutNumber.trim(),
        qrCardData: args.qrCardData,
        createdAt: Date.now(),
      };
      await actor.addAIPreferenceRule(encodeMember(record));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["aiPreferences"] });
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected to backend");
      const rules = await actor.getAIPreferenceRules();
      const idx = rules.findIndex((r) => {
        const m = decodeMember(r);
        return m?.username === username;
      });
      if (idx === -1) throw new Error(`Member "${username}" not found`);
      await actor.removeAIPreferenceRule(BigInt(idx));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["aiPreferences"] });
    },
  });
}

export function useGetMemberQR() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (username: string): Promise<string | null> => {
      if (!actor) return null;
      try {
        const rules = await actor.getAIPreferenceRules();
        const member = rules
          .map(decodeMember)
          .find((m) => m?.username === username);
        return member?.qrCardData ?? null;
      } catch {
        return null;
      }
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
        // silently fail
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logo"] });
    },
  });
}

export { Language, UserRole };
