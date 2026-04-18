import { Router } from 'express';
import {
    authController,
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
} from './controllers';
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

router.post(
    '/forgot-password',
    forgotPasswordValidation,
    authController.forgotPassword.bind(authController)
);

router.post(
    '/reset-password',
    resetPasswordValidation,
    authController.resetPassword.bind(authController)
);

export default router;