import { Request, Response } from "express";
import { IServer, User, PublicUser, AuthRequest } from "@shared/types";
import { AuthService } from "@/modules/auth/auth.service";

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
      user,
    });
  };

  login = async (req: Request, res: Response) => {
    const result = await this.service.login(req.body);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    const { user, fullUser } = result.data as {
      user: PublicUser;
      fullUser: User;
    };
    this.server.issueToken(res, fullUser);
    return res.json({
      success: true,
      message: "Login successful.",
      user,
    });
  };

  logout = (_: Request, res: Response) => {
    res.clearCookie("token", { path: "/" });
    return res.json({ success: true });
  };

  me = (req: Request, res: Response) => {
    return res.json({ success: true, user: req.user });
  };

  verifyEmailOtp = async (req: AuthRequest, res: Response) => {
    const result = await this.service.verifyEmailOtp(req.user, req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({
      success: true,
      message: "OTP verified.",
      ...(result.data ?? {}),
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
