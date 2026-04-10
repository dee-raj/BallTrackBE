import { SafeUser } from '../user';

declare global {
  module Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export { };
