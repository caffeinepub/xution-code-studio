import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface User {
    id: Principal;
    username: string;
    createdAt: Time;
    role: UserRole;
}
export interface Version {
    files: Array<ProjectFile>;
    versionId: string;
    createdAt: Time;
    prompt: string;
}
export interface ProjectFile {
    content: string;
    filename: string;
}
export interface Project {
    id: string;
    isGlobal: boolean;
    files: Array<ProjectFile>;
    title: string;
    ownerId: Principal;
    createdAt: Time;
    language: Language;
    updatedAt: Time;
}
export enum Language {
    cpp = "cpp",
    html_single = "html_single",
    javascript = "javascript",
    html_css_js = "html_css_js"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAIPreferenceRule(rule: string): Promise<void>;
    addMember(userId: Principal, username: string): Promise<void>;
    addVersion(projectId: string, prompt: string, files: Array<ProjectFile>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProject(title: string, language: Language, files: Array<ProjectFile>, isGlobal: boolean): Promise<string>;
    deleteProject(projectId: string): Promise<void>;
    getAIPreferenceRules(): Promise<Array<string>>;  
    getAllGlobalProjects(): Promise<Array<Project>>;
    getCallerProjects(): Promise<Array<Project>>;
    getCallerUserProfile(): Promise<User | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLogo(): Promise<string>;
    getProject(projectId: string): Promise<Project>;
    getProjectVersions(projectId: string): Promise<Array<Version>>;
    getUser(): Promise<User>;
    getUserProfile(userId: Principal): Promise<User | null>;
    isCallerAdmin(): Promise<boolean>;
    removeAIPreferenceRule(index: bigint): Promise<void>;
    removeMember(userId: Principal): Promise<void>;
    revertToVersion(projectId: string, versionId: string): Promise<void>;
    saveCallerUserProfile(username: string): Promise<void>;
    seedDefaultClass6Users(): Promise<void>;
    setLogo(data: string): Promise<void>;
    updateProject(projectId: string, title: string, language: Language, files: Array<ProjectFile>, isGlobal: boolean): Promise<void>;
    updateUserRole(userId: Principal, newRole: UserRole): Promise<void>;
    updateUsername(newUsername: string): Promise<void>;
}
