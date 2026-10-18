import type { AppRole } from "@/lib/auth";

/** Home workspace for each role. /dashboard redirects here. */
export const ROLE_HOME: Record<AppRole, string> = {
  farmer: "/farmer",
  vet: "/vet",
  admin: "/admin",
  content_editor: "/content",
  super_admin: "/admin",
};

/** Roles allowed to enter each workspace. DB RLS remains the real boundary. */
export const WORKSPACE_ACCESS = {
  farmer: ["farmer"],
  vet: ["vet"],
  admin: ["admin", "super_admin"],
  content: ["content_editor", "super_admin"],
} as const satisfies Record<string, readonly AppRole[]>;

export type WorkspaceKey = keyof typeof WORKSPACE_ACCESS;

export function homeForRole(role: AppRole | null): string {
  return role ? ROLE_HOME[role] : "/dashboard";
}
