import { Router } from 'express';
import { teamsController, createTeamValidation, updateTeamValidation } from './controllers';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserRole } from '../../shared/constants';

const router = Router();

router.get('/', authenticate, teamsController.getAll.bind(teamsController));
router.get('/:id', authenticate, teamsController.getById.bind(teamsController));
router.post('/', authenticate, authorize(UserRole.scorer), createTeamValidation, teamsController.create.bind(teamsController));
router.patch('/:id', authenticate, authorize(UserRole.scorer), updateTeamValidation, teamsController.update.bind(teamsController));
router.delete('/:id', authenticate, authorize(UserRole.admin), teamsController.delete.bind(teamsController));

export default router;