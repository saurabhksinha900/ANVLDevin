import { Router, Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { authenticate, authorize } from '../middleware/auth';
import { AuditAction } from '@prisma/client';

const router = Router();

router.get('/', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await auditService.getEntries({
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId as string | undefined,
      actorId: req.query.actorId as string | undefined,
      action: req.query.action as AuditAction | undefined,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
      page,
      limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
