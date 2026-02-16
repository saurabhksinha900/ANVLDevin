import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { EntityType } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { getParam } from '../utils/params';
import path from 'path';

const router = Router();

router.post('/', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: { message: 'No file uploaded' } });
      return;
    }

    const { entityType, entityId, category } = req.body;
    if (!entityType || !entityId) {
      res.status(400).json({ error: { message: 'entityType and entityId are required' } });
      return;
    }

    const attachment = await prisma.attachment.create({
      data: {
        entityType: entityType as EntityType,
        entityId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category,
        uploadedById: req.user!.userId,
      },
    });

    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParam(req.params, 'id');
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundError('Attachment', id);
    res.json(attachment);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/download', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParam(req.params, 'id');
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundError('Attachment', id);
    res.download(path.resolve(attachment.filePath), attachment.fileName);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParam(req.params, 'id');
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundError('Attachment', id);
    if (attachment.uploadedById !== req.user!.userId) {
      res.status(403).json({ error: { message: 'Can only delete own attachments' } });
      return;
    }
    await prisma.attachment.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
