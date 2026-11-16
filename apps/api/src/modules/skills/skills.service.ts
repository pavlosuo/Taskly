import {
  publicProfileSkillSchema,
  ServiceResult,
  upperSign,
} from "shared/index";
import { IServer } from "@/types";
import { escapeRegex, normalizeLabel } from "@/utils";

export class SkillsService {
  constructor(private server: IServer) {}

  async search(q: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const query =
        typeof q === "string" ? normalizeLabel(q).slice(0, 100) : "";
      const items = await db
        .collection("skills")
        .find(
          query ? { label: { $regex: escapeRegex(query), $options: "i" } } : {},
        )
        .sort({ count: -1 })
        .limit(10)
        .toArray();
      return { success: true, status: 200, data: { items } };
    } catch (e) {
      console.error("Search skills error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async upsert(label: string): Promise<ServiceResult> {
    try {
      if (typeof label !== "string")
        return { success: false, status: 400, message: "skill.label.required" };
      const normalized = normalizeLabel(label);
      const parsed = publicProfileSkillSchema.safeParse({
        label: normalized,
        value: normalized.toLowerCase(),
      });
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };
      const final = upperSign(normalized);
      const db = await this.server.getDb();
      const skills = db.collection("skills");
      const run = () =>
        skills.findOneAndUpdate(
          { label: final },
          { $setOnInsert: { count: 0, createdAt: new Date() } },
          {
            upsert: true,
            returnDocument: "after",
            collation: { locale: "en", strength: 2 },
          },
        );
      let result;
      try {
        result = await run();
      } catch (e: any) {
        if (e?.code !== 11000) throw e;
        result = await skills.findOne(
          { label: final },
          { collation: { locale: "en", strength: 2 } },
        );
      }
      return { success: true, status: 200, data: result };
    } catch (e) {
      console.error("Upsert skill error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }
}
