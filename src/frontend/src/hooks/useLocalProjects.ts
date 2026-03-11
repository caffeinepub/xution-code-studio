import type { Language } from "@/backend";
import type { ProjectFile } from "@/backend";
import { useEffect, useState } from "react";

export interface LocalProject {
  id: string;
  title: string;
  language: Language;
  files: ProjectFile[];
  isGlobal: boolean;
  owner: string;
  createdAt: number;
}

export interface LocalVersion {
  versionId: string;
  prompt: string;
  files: ProjectFile[];
  createdAt: number; // ms * 1_000_000 to match backend nanoseconds display
}

const PROJECTS_KEY = "xution_local_projects";
const VERSIONS_KEY = "xution_local_versions";

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalProjects() {
  const [projects, setProjects] = useState<LocalProject[]>(() =>
    load<LocalProject[]>(PROJECTS_KEY, []),
  );
  const [versions, setVersions] = useState<Record<string, LocalVersion[]>>(() =>
    load<Record<string, LocalVersion[]>>(VERSIONS_KEY, {}),
  );

  useEffect(() => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
  }, [versions]);

  const createProject = (
    title: string,
    language: Language,
    files: ProjectFile[],
    isGlobal: boolean,
  ): string => {
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setProjects((prev) => [
      ...prev,
      {
        id,
        title,
        language,
        files,
        isGlobal,
        owner: "local",
        createdAt: Date.now(),
      },
    ]);
    return id;
  };

  const updateProject = (
    projectId: string,
    updates: Partial<
      Pick<LocalProject, "title" | "language" | "files" | "isGlobal">
    >,
  ) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
    );
  };

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setVersions((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  };

  const addVersion = (
    projectId: string,
    prompt: string,
    files: ProjectFile[],
  ) => {
    const version: LocalVersion = {
      versionId: `v-${Date.now()}`,
      prompt,
      files,
      createdAt: Date.now() * 1_000_000,
    };
    setVersions((prev) => ({
      ...prev,
      [projectId]: [version, ...(prev[projectId] || [])],
    }));
  };

  const revertVersion = (projectId: string, versionId: string) => {
    const versionList = versions[projectId] || [];
    const version = versionList.find((v) => v.versionId === versionId);
    if (version) {
      updateProject(projectId, { files: version.files });
    }
  };

  return {
    projects,
    versions,
    createProject,
    updateProject,
    deleteProject,
    addVersion,
    revertVersion,
  };
}
