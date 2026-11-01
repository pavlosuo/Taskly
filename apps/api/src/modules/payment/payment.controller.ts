import { Request, Response } from "express";
import { PaymentService } from "@/modules/payment/payment.service";
import { IServer } from "@/types";

export class PaymentController {
  private service: PaymentService;

  constructor(server: IServer) {
    this.service = new PaymentService(server);
    this.history = this.history.bind(this);
  }

  async history(req: Request, res: Response) {
    try {
      const result = await this.service.history(req.user);
      return res.json({
        success: true,
        ...(result.data ?? {}),
      });
    } catch (e) {
      console.error("Payment history error:", e);
      return res.status(500).json({
        success: false,
        message: "general.unknown",
      });
    }
  }
}
