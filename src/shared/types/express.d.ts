import { SafeUser } from '../user';

declare module 'express-serve-static-core' {
  interface Request {
    user?: SafeUser;
  }
}


export { };
