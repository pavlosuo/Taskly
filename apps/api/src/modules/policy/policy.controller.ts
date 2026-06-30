import { Request, Response } from "express";
import { IServer } from "@shared/types";

export class PolicyController {
  constructor(private server: IServer) {}

  getPolicy = async (_: Request, res: Response) => {
    try {
      const db = await this.server.getDb();
      const doc = await db.collection("settings").findOne({ key: "policy" });
      return res.json({
        success: true,
        data: doc?.data ?? { policyTitle: "", policyContent: "" },
      });
    } catch (e) {
      console.error("getPolicy error:", e);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  };

  updatePolicy = async (req: Request, res: Response) => {
    try {
      const { policyTitle, policyContent } = req.body;
      if (typeof policyTitle !== "string" || typeof policyContent !== "string")
        return res
          .status(400)
          .json({ success: false, message: "Invalid data." });
      const db = await this.server.getDb();
      await db.collection("settings").updateOne(
        { key: "policy" },
        {
          $set: {
            data: { policyTitle, policyContent },
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
      return res.json({ success: true, message: "Policy updated." });
    } catch (e) {
      console.error("updatePolicy error:", e);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  };
}
