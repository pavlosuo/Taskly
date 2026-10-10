import { IServer } from "@/types";
import { PolicyData } from "shared/types";

export class PolicyService {
  constructor(private server: IServer) {}

  async getPolicy(): Promise<PolicyData> {
    const db = await this.server.getDb();
    const doc = await db.collection("settings").findOne({ key: "policy" });
    const data = doc?.data;
    if (!data) return { translations: {} };
    if (data.translations) return data;
    const { policyTitle = "", policyContent = "", updatedAt } = data;
    return {
      translations: { en: { policyTitle, policyContent } },
      updatedAt,
    };
  }

  async updatePolicy(data: Pick<PolicyData, "translations">): Promise<void> {
    const db = await this.server.getDb();
    await db.collection("settings").updateOne(
      { key: "policy" },
      {
        $set: {
          data: {
            translations: data.translations,
            updatedAt: new Date(),
          },
        },
      },
      { upsert: true },
    );
  }
}
