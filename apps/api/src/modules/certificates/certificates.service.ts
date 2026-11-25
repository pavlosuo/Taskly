import { IServer } from "@/types";
import {
  publicProfileCertificateSchema,
  upperSign,
  ServiceResult,
} from "shared/index";
import { MESSAGE_MAX_LENGTH } from "shared/data";
import { escapeRegex, normalizeLabel } from "@/utils";
import { MongoServerError } from "mongodb";

export class CertificatesService {
  constructor(private server: IServer) {}

  async search(q: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const query =
        typeof q === "string" ? normalizeLabel(q).slice(0, 100) : "";
      const items = await db
        .collection("certificates")
        .find(
          query ? { label: { $regex: escapeRegex(query), $options: "i" } } : {},
        )
        .sort({ count: -1 })
        .limit(10)
        .toArray();
      return { success: true, status: 200, data: { items } };
    } catch (e) {
      console.error("Search certificates error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async upsert(label: string, description: string): Promise<ServiceResult> {
    try {
      if (typeof label !== "string")
        return {
          success: false,
          status: 400,
          message: "certificate.label.required",
        };
      if (description != null && typeof description !== "string")
        return {
          success: false,
          status: 400,
          message: "certificate.description.invalid",
        };
      const desc = (description ?? "").trim();
      if (desc.length > MESSAGE_MAX_LENGTH)
        return {
          success: false,
          status: 400,
          message: "certificate.description.tooLong",
        };
      const normalized = normalizeLabel(label);
      const parsed = publicProfileCertificateSchema.safeParse({
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
      const certificates = db.collection("certificates");
      const run = () =>
        certificates.findOneAndUpdate(
          { label: final },
          {
            $setOnInsert: {
              description: desc,
              count: 0,
              createdAt: new Date(),
            },
          },
          {
            upsert: true,
            returnDocument: "after",
            collation: { locale: "en", strength: 2 },
          },
        );
      let result;
      try {
        result = await run();
      } catch (e: unknown) {
        if (e instanceof MongoServerError && e.code === 11000) throw e;
        result = await certificates.findOne(
          { label: final },
          { collation: { locale: "en", strength: 2 } },
        );
      }
      return { success: true, status: 200, data: result };
    } catch (e) {
      console.error("Upsert certificate error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }
}
