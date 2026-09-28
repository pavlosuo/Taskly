import { IServer } from "@/types";
import { PolicyData } from "@shared/types";

export class PolicyService {
  constructor(private server: IServer) {}

  async getPolicy(): Promise<PolicyData> {
    try {
      const db = await this.server.getDb();
      const doc = await db.collection("settings").findOne({ key: "policy" });
      return doc?.data;
    } catch (e) {
      console.error("Get policy error:", e);
      return {
        policyContent: "",
        policyTitle: "",
        updatedAt: new Date(),
      };
    }
  }

  async updatePolicy(data: PolicyData): Promise<void> {
    try {
      const db = await this.server.getDb();
      await db.collection("settings").updateOne(
        { key: "policy" },
        {
          $set: {
            data: {
              ...data,
              updatedAt: new Date(),
            },
          },
        },
        { upsert: true },
      );
    } catch (e) {
      console.error("Update policy error:", e);
    }
  }
}
