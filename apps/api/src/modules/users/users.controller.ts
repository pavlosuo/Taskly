import { Response, Request } from "express";
import { IServer } from "@/types";
import { UsersService } from "@/modules/users/users.service";
import { clearCookieOptions } from "@/utils";

export class UsersController {
  private service: UsersService;

  constructor(server: IServer) {
    this.service = new UsersService(server);
  }

  updateProfile = async (req: Request, res: Response) => {
    const result = await this.service.updateProfile(req, res);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  };

  deactivateAccount = async (req: Request, res: Response) => {
    const password = req.body.password;
    const result = await this.service.deactivateAccount(req.user, password);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    res.clearCookie("token", clearCookieOptions);
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  };

  verifyPhoneOtp = async (req: Request, res: Response) => {
    const result = await this.service.verifyPhoneOtp(req.user, req.body);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  };

  verifyEmailOtp = async (req: Request, res: Response) => {
    const result = await this.service.verifyEmailOtp(req.user, req.body);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  };

  changePassword = async (req: Request, res: Response) => {
    const result = await this.service.changePassword(req, res);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  };

  getUserForProfilePage = async (req: Request, res: Response) => {
    const username = Array.isArray(req.params.username)
      ? req.params.username[0]
      : req.params.username;
    const result = await this.service.getUserForProfilePage(req.user, username);
    res.setHeader("Cache-Control", "private, no-store");
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  };

  search = async (req: Request, res: Response) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const result = await this.service.search(req.user, q);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  };
}
