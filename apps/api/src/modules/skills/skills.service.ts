import {
  publicProfileSkillSchema,
  ServiceResult,
  upperSign,
} from "shared/index";
import { IServer } from "@/types";
import { escapeRegex } from "@/utils";

export class SkillsService {
  constructor(private server: IServer) {}

  async search(q: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const items = await db
        .collection("skills")
        .find(
          q.trim() ? { label: { $regex: escapeRegex(q), $options: "i" } } : {},
        )
        .sort({ count: -1 })
        .limit(10)
        .toArray();
      return { success: true, status: 200, data: { items } };
    } catch (e) {
      console.error("Search skills error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async upsert(label: string): Promise<ServiceResult> {
    try {
      const parsed = publicProfileSkillSchema.safeParse({
        label,
        value: label.toLowerCase(),
      });
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };
      const db = await this.server.getDb();
      const normalized = label.trim();
      const final = upperSign(normalized);
      const result = await db.collection("skills").findOneAndUpdate(
        { label: { $regex: `^${final}$`, $options: "i" } },
        {
          $inc: { count: 1 },
          $setOnInsert: { label: final, createdAt: new Date() },
        },
        { upsert: true, returnDocument: "after" },
      );
      return { success: true, status: 200, data: result };
    } catch (e) {
      console.error("Upsert skill error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }
}
