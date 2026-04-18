import { Router } from 'express';
import {
  usersController,
  updateProfileValidation,
  changePasswordValidation,
  inviteUserValidation,
} from './controllers';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserRole } from '../../shared/constants';

const router = Router();

router.get(
  '/profile',
  authenticate,
  usersController.getProfile.bind(usersController)
);

router.patch(
  '/profile',
  authenticate,
  updateProfileValidation,
  usersController.updateProfile.bind(usersController)
);

router.post(
  '/change-password',
  authenticate,
  changePasswordValidation,
  usersController.changePassword.bind(usersController)
);

/** List all users within the caller's tenant (admin only) */
router.get(
  '/',
  authenticate,
  authorize(UserRole.admin),
  usersController.getAllUsers.bind(usersController)
);

/** Invite a scorer into the caller's tenant (admin only) */
router.post(
  '/invite',
  authenticate,
  authorize(UserRole.admin),
  inviteUserValidation,
  usersController.inviteUser.bind(usersController)
);

export default router;