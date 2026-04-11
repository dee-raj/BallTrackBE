import { Router } from 'express';
import { uploadController } from './controllers';
import { authenticate } from '../../middlewares/authenticate';
import { upload } from '../../middlewares/multer';

const router = Router();

// Only authenticated users can upload images
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  uploadController.uploadImage.bind(uploadController)
);

export default router;
