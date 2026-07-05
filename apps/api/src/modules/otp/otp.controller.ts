import { Request, Response } from "express";
import { IServer, AuthRequest } from "@shared/types";
import { OtpService } from "@/modules/otp/otp.service";

export class OtpController {
  private service: OtpService;

  constructor(server: IServer) {
    this.service = new OtpService(server);
  }

  send = async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user;
    const result = await this.service.dispatch(user, req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, message: "Code sent." });
  };
}
