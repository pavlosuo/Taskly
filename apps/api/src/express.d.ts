import { User } from "@/types";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
    namespace Multer {
      interface File {
        width?: number;
        height?: number;
      }
    }
  }
}
