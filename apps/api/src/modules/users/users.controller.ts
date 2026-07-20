import { Response } from "express";
import { IServer, AuthRequest } from "@/types";
import { UsersService } from "@/modules/users/users.service";

export class UsersController {
  private service: UsersService;

  constructor(server: IServer) {
    this.service = new UsersService(server);
  }

  updateProfile = async (req: AuthRequest, res: Response) => {
    const result = await this.service.updateProfile(req.user, req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({
      success: true,
      message: "Profile updated.",
      ...(result.data ?? {}),
    });
  };

  deactivateAccount = async (req: AuthRequest, res: Response) => {
    const result = await this.service.deactivateAccount(req.user);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    res.clearCookie("token", { path: "/" });
    return res.json({ success: true, message: "Account deactivated." });
  };

  verifyPhoneOtp = async (req: AuthRequest, res: Response) => {
    const result = await this.service.verifyPhoneOtp(req.user, req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({
      success: true,
      message: "Phone verified.",
      ...(result.data ? result.data : {}),
    });
  };

  verifyEmailOtp = async (req: AuthRequest, res: Response) => {
    const result = await this.service.verifyEmailOtp(req.user, req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({
      success: true,
      message: "Email verified.",
      ...(result.data ?? {}),
    });
  };

  changePassword = async (req: AuthRequest, res: Response) => {
    const result = await this.service.changePassword(req.user, req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({
      success: true,
      message: "Password changed.",
      ...(result.data ?? {}),
    });
  };
}
