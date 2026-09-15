import { IServer } from "@/types";
import { ServiceResult } from "@shared/types";
import { publicProfileCertificateSchema } from "@shared/schemas";
import { bigFirstLetter } from "@shared/utils";

export class CertificatesService {
  constructor(private server: IServer) {}

  async search(q: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const items = await db
        .collection("certificates")
        .find(q.trim() ? { label: { $regex: q, $options: "i" } } : {})
        .sort({ count: -1 })
        .limit(10)
        .toArray();
      return { success: true, status: 200, data: { items } };
    } catch (e) {
      console.error("Search certificates error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async upsert(label: string, description: string): Promise<ServiceResult> {
    try {
      const parsed = publicProfileCertificateSchema.safeParse({
        label,
        description,
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
      const final = bigFirstLetter(normalized);
      const result = await db.collection("certificates").findOneAndUpdate(
        { label: { $regex: `^${final}$`, $options: "i" } },
        {
          $inc: { count: 1 },
          $setOnInsert: {
            label: final,
            description,
            createdAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      return { success: true, status: 200, data: { certificate: result } };
    } catch (e) {
      console.error("Upsert certificate error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }
}
