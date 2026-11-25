import { User } from "@/types";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
    namespace Multer {
      interface File {
        width?: number;
        height?: number;
      }
    }
  }
}
