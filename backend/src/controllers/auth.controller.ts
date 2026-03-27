import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { registerUser, loginUser, getUserById } from "../services/auth.service";
import { registerSchema, loginSchema } from "../utils/validation";
import { BadRequestError } from "../utils/errors";
import { env } from "../config/env";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0]?.message || "Invalid input");
  }

  const { user, token } = await registerUser(parsed.data);

  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0]?.message || "Invalid input");
  }

  const { user, token } = await loginUser(parsed.data);

  res.cookie("token", token, COOKIE_OPTIONS);
  res.json({ user });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", { path: "/" });
  res.json({ message: "Logged out" });
}

// Returns a short-lived token for WebSocket authentication
export async function getWsToken(req: Request, res: Response) {
  const wsToken = jwt.sign(
    { userId: req.user!.userId, email: req.user!.email },
    env.JWT_SECRET,
    { expiresIn: "30s" }
  );
  res.json({ token: wsToken });
}

export async function getMe(req: Request, res: Response) {
  const user = await getUserById(req.user!.userId);
  if (!user) {
    res.clearCookie("token", { path: "/" });
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ user });
}
