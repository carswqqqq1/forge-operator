/**
 * Express Middleware
 * Common middleware for authentication and request handling
 */

import type { Request, Response, NextFunction } from "express";
import { sdk } from "./sdk";
import { ForbiddenError } from "@shared/_core/errors";

/**
 * Authenticate request and attach user to request object
 */
export async function authenticateRequest(req: Request): Promise<any> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      throw ForbiddenError("Invalid session");
    }
    return user;
  } catch (error) {
    throw error;
  }
}

/**
 * Express middleware for authentication
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authenticateRequest(req);
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * Express middleware for optional authentication
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authenticateRequest(req);
    (req as any).user = user;
  } catch {
    // User is not authenticated, but that's okay
  }
  next();
}
