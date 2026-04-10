import { Router } from 'express';
import { authController, registerValidation, loginValidation } from './controllers';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.post(
    '/register',
    registerValidation,
    authController.register.bind(authController)
);
router.post(
    '/login',
    loginValidation,
    authController.login.bind(authController)
);
router.get(
    '/me',
    authenticate,
    authController.getMe.bind(authController)
);

export default router;