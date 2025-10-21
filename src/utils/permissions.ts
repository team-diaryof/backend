import { Role } from "@prisma/client";

type Permission = "readContent" | "writeContent" | "manageUsers";

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: ["readContent", "writeContent", "manageUsers"],
  [Role.USER]: ["readContent", "writeContent"],
  [Role.GUEST]: ["readContent"],
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
  return rolePermissions[role].includes(permission);
};
