import { Request } from "express";
import { Role } from "../constants/roles";

export type AuthPayload = {
  userId: string;
  activeRole: Role | null;
  jti?: string;
  exp?: number;
};

export type AuthedRequest = Request & {
  auth?: AuthPayload;
};
