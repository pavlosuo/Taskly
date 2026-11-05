import { Request, Response } from "express";
import { PublicUser } from "shared/index";
import { AuthService } from "@/modules/auth/auth.service";
import { toPublicUser, clearCookieOptions } from "@/utils";
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
      });
    const { user, fullUser } = result.data as {
      user: PublicUser;
      fullUser: User;
    };
    this.server.issueToken(res, fullUser);
    return res.json({
      success: true,
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
      user: toPublicUser(user),
    });
  };

  logout = (_: Request, res: Response) => {
    res.clearCookie("token", clearCookieOptions);
    return res.json({ success: true });
  };

  me = (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
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
      user: toPublicUser(user),
      settings: {
        lang: user.settings.lang,
        theme: user.settings.theme,
      },
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
    return res.json({ success: true });
  };

  resetPassword = async (req: Request, res: Response) => {
    const result = await this.service.resetPassword(req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true });
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
