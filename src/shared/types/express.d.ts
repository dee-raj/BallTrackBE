import { User } from '@prisma/client';

declare global {
  module Express {
    interface Request {
      user?: User;
    }
  }
}

export { };