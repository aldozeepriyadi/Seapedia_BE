import { Request } from "express";
import { Role } from "../constants/roles";

export type AuthPayload = {
  userId: string;
  activeRole: Role | null;
};

export type AuthedRequest = Request & {
  auth?: AuthPayload;
};
