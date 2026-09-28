import { Request, Response } from "express";
import { PolicyService } from "@/modules/policy/policy.service";
import { IServer } from "@/types";

export class PolicyController {
  private policyService: PolicyService;
  constructor(server: IServer) {
    this.policyService = new PolicyService(server);
  }

  getPolicy = async (_: Request, res: Response) => {
    try {
      const data = await this.policyService.getPolicy();
      return res.json({ success: true, data });
    } catch (e) {
      console.error("getPolicy error:", e);
      return res.status(500).json({ success: false, message: "errors.server" });
    }
  };

  updatePolicy = async (req: Request, res: Response) => {
    try {
      const { policyTitle, policyContent } = req.body;
      if (
        typeof policyTitle !== "string" ||
        typeof policyContent !== "string"
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid data." });
      }
      await this.policyService.updatePolicy({ policyTitle, policyContent });
      return res.json({ success: true });
    } catch (e) {
      console.error("updatePolicy error:", e);
      return res.status(500).json({ success: false, message: "errors.server" });
    }
  };
}
