import { RequestHandler, Response } from "express";
import { AuthRequest } from "@shared/types";

export function asAuth(
  handler: (req: AuthRequest, res: Response) => unknown,
): RequestHandler {
  return (req, res) => handler(req as AuthRequest, res);
}
