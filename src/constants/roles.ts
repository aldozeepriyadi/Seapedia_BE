export const Role = {
  ADMIN: "ADMIN",
  BUYER: "BUYER",
  SELLER: "SELLER",
  DRIVER: "DRIVER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const nonAdminRoles = [Role.BUYER, Role.SELLER, Role.DRIVER] as const;
export const allowedRoles = [Role.ADMIN, Role.BUYER, Role.SELLER, Role.DRIVER] as const;
