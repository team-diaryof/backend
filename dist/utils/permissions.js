"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = void 0;
const client_1 = require("@prisma/client");
const rolePermissions = {
    [client_1.Role.ADMIN]: ["readContent", "writeContent", "manageUsers"],
    [client_1.Role.USER]: ["readContent", "writeContent"],
    [client_1.Role.GUEST]: ["readContent"],
};
const hasPermission = (role, permission) => {
    return rolePermissions[role].includes(permission);
};
exports.hasPermission = hasPermission;
