import { Router } from 'express';
import { usersController, updateProfileValidation } from './controllers';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserRole } from '../../shared/constants';

const router = Router();

router.get('/profile', authenticate, usersController.getProfile.bind(usersController));
router.patch('/profile', authenticate, updateProfileValidation, usersController.updateProfile.bind(usersController));
router.get('/', authenticate, authorize(UserRole.admin), usersController.getAllUsers.bind(usersController));

export default router;