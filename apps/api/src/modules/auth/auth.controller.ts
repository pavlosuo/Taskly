import { Request, Response } from "express";
import { PublicUser } from "@shared/types";
import { AuthService } from "@/modules/auth/auth.service";
import { toPublicUser } from "@/utils";
import { IServer, User } from "@/types";

export class AuthController {
  private service: AuthService;

  constructor(private server: IServer) {
    this.service = new AuthService(server);
  }

  register = async (req: Request, res: Response) => {
    const result = await this.service.register(req.body);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.data ? result.data : {}),
      });
    const { user, fullUser } = result.data as {
      user: PublicUser;
      fullUser: User;
    };
    this.server.issueToken(res, fullUser);
    return res.json({
      success: true,
      message: "User registered successfully.",
      user: toPublicUser(user),
    });
  };

  login = async (req: Request, res: Response) => {
    const result = await this.service.login(req.body);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    const { user } = result.data as { user: User };
    this.server.issueToken(res, user);
    return res.json({
      success: true,
      message: "Login successful.",
      user: toPublicUser(user),
    });
  };

  logout = (_: Request, res: Response) => {
    res.clearCookie("token", { path: "/" });
    return res.json({ success: true });
  };

  me = (req: Request, res: Response) => {
    if (!req.user) {
      return res.json({
        success: true,
        user: null,
        settings: {
          lang: req.cookies.lang ?? "en",
          theme: req.cookies.theme ?? "light",
        },
      });
    }
    return res.json({
      success: true,
      user: toPublicUser(req.user),
      settings: req.user.settings,
    });
  };

  verifyPasswordResetOtp = async (req: Request, res: Response) => {
    const result = await this.service.verifyPasswordResetOtp(req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({
      success: true,
      resetToken: (result.data as any).resetToken,
    });
  };

  sendPasswordResetLink = async (req: Request, res: Response) => {
    const result = await this.service.sendPasswordResetLink(req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const result = await this.service.resetPassword(req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, message: "Password reset successfully." });
  };

  verifyPasswordResetToken = async (req: Request, res: Response) => {
    const result = await this.service.verifyPasswordResetToken(req.body.token);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.data ?? {}),
      });
    return res.json({ success: true });
  };
}
