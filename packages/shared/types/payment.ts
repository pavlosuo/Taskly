export type PaymentState = "held" | "released" | "refunded";

export type PaymentStatus = "held" | "released" | "refunded";

export type PaymentItem = {
  _id: string;
  taskId: string;
  clientId: string;
  taskerId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentHistory = {
  items: PaymentItem[];
  totals: Record<PaymentStatus, number>;
};
