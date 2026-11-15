import { Request, Response } from "express";
import { PublicUser } from "shared/index";
import { AuthService } from "@/modules/auth/auth.service";
import { toPublicUser, clearCookieOptions } from "@/utils";
import { IServer, User } from "@/types";

export class AuthController {
  private service: AuthService;

  constructor(private server: IServer) {
    this.service = new AuthService(server);
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.me = this.me.bind(this);
    this.verifyPasswordResetOtp = this.verifyPasswordResetOtp.bind(this);
    this.sendPasswordResetLink = this.sendPasswordResetLink.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.verifyPasswordResetToken = this.verifyPasswordResetToken.bind(this);
  }

  async register(req: Request, res: Response) {
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
  }

  async login(req: Request, res: Response) {
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
  }

  async logout(req: Request, res: Response) {
    const user = req.user;
    if (user) await this.server.revokeSessions(user._id);
    res.clearCookie("token", clearCookieOptions);
    return res.json({ success: true });
  }

  async me(req: Request, res: Response) {
    const user = req.user;
    if (!user) {
      return res.json({
        success: true,
        user: null,
        settings: {
          lang: req.cookies.lang ?? "fi-FI",
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
  }

  async verifyPasswordResetOtp(req: Request, res: Response) {
    const result = await this.service.verifyPasswordResetOtp(req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({
      success: true,
      resetToken: (result.data as { resetToken: string }).resetToken,
    });
  }

  async sendPasswordResetLink(req: Request, res: Response) {
    const result = await this.service.sendPasswordResetLink(req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true });
  }

  async resetPassword(req: Request, res: Response) {
    const result = await this.service.resetPassword(req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true });
  }

  async verifyPasswordResetToken(req: Request, res: Response) {
    const result = await this.service.verifyPasswordResetToken(req.body.token);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.data ?? {}),
      });
    return res.json({ success: true });
  }
}
