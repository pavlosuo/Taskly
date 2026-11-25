import { ClientSession, ObjectId } from "mongodb";
import { IServer, User } from "@/types";
import { PaymentStatus } from "shared/index";

export class PaymentService {
  constructor(private server: IServer) {}

  async hold(
    session: ClientSession,
    payment: {
      taskId: ObjectId;
      clientId: ObjectId;
      taskerId: ObjectId;
      amount: number;
    },
  ) {
    const now = new Date();
    const db = await this.server.getDb();
    await db.collection("payments").insertOne(
      {
        ...payment,
        status: "held",
        createdAt: now,
        updatedAt: now,
      },
      { session },
    );
  }

  async release(session: ClientSession, taskId: ObjectId) {
    const now = new Date();
    const db = await this.server.getDb();
    await db
      .collection("payments")
      .updateOne(
        { taskId, status: "held" },
        { $set: { status: "released", updatedAt: now, releasedAt: now } },
        { session },
      );
  }

  async refund(session: ClientSession, taskId: ObjectId) {
    const now = new Date();
    const db = await this.server.getDb();
    await db
      .collection("payments")
      .updateOne(
        { taskId, status: "held" },
        { $set: { status: "refunded", updatedAt: now, refundedAt: now } },
        { session },
      );
  }

  async history(user: User) {
    const db = await this.server.getDb();
    const filter =
      user.role === "client" ? { clientId: user._id } : { taskerId: user._id };
    const [items, grouped] = await Promise.all([
      db
        .collection("payments")
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),
      db
        .collection("payments")
        .aggregate([
          { $match: filter },
          { $group: { _id: "$status", amount: { $sum: "$amount" } } },
        ])
        .toArray(),
    ]);
    const totals: Record<PaymentStatus, number> = {
      held: 0,
      released: 0,
      refunded: 0,
    };
    grouped.forEach((g) => {
      totals[g._id as PaymentStatus] = g.amount;
    });
    return { success: true, status: 200, data: { items, totals } };
  }
}
