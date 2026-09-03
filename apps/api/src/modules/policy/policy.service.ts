import { IServer } from "@/types";
import { PolicyData } from "@shared/types";

export class PolicyService {
  constructor(private server: IServer) {}

  async getPolicy(): Promise<PolicyData> {
    const db = await this.server.getDb();
    const doc = await db.collection("settings").findOne({ key: "policy" });
    return doc?.data;
  }

  async updatePolicy(data: PolicyData): Promise<void> {
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
  }
}
