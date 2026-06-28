"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedRoles = exports.nonAdminRoles = exports.Role = void 0;
exports.Role = {
    ADMIN: "ADMIN",
    BUYER: "BUYER",
    SELLER: "SELLER",
    DRIVER: "DRIVER",
};
exports.nonAdminRoles = [exports.Role.BUYER, exports.Role.SELLER, exports.Role.DRIVER];
exports.allowedRoles = [exports.Role.ADMIN, exports.Role.BUYER, exports.Role.SELLER, exports.Role.DRIVER];
