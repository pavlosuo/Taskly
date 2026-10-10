import { Request, Response } from "express";
import { PolicyService } from "@/modules/policy/policy.service";
import { IServer } from "@/types";
import { LANGS } from "shared/data";

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
      return res
        .status(500)
        .json({ success: false, message: "general.unknown" });
    }
  };

  updatePolicy = async (req: Request, res: Response) => {
    try {
      const { translations } = req.body;
      if (
        !translations ||
        typeof translations !== "object" ||
        Array.isArray(translations)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "policy.invalid" });
      }
      if (
        !Object.entries(translations).every(([lang, texts]) => {
          if (!LANGS.find((l) => l.value === lang)) return false;
          if (!texts || typeof texts !== "object") return false;
          const { policyTitle, policyContent } = texts as Record<
            string,
            unknown
          >;
          return (
            typeof policyTitle === "string" && typeof policyContent === "string"
          );
        })
      ) {
        return res
          .status(400)
          .json({ success: false, message: "policy.invalid" });
      }
      await this.policyService.updatePolicy({ translations });
      return res.json({ success: true });
    } catch (e) {
      console.error("updatePolicy error:", e);
      return res
        .status(500)
        .json({ success: false, message: "general.unknown" });
    }
  };
}
