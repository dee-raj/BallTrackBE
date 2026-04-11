import { Request, Response, NextFunction } from 'express';
import { uploadBuffer } from '../../../middlewares/cloudinaryUploads';

export class UploadController {
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const folder = req.body.folder || 'balltrack';
      
      const result = await uploadBuffer(req.file.buffer, {
        folder: folder,
        resource_type: 'image',
      });

      res.status(200).json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
