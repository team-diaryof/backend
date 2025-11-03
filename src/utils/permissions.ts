import { Role } from "@prisma/client";

type Permission = "readContent" | "writeContent" | "manageUsers";

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: ["readContent", "writeContent", "manageUsers"],
  USER: ["readContent", "writeContent"],
  GUEST: ["readContent"],
  TEMP: [], // no permissions while registration is pending
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
  return rolePermissions[role].includes(permission);
};
