import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { jsoService } from '../services/jso.service';
import { authenticate, authorize } from '../middleware/auth';
import { JSOStatus } from '@prisma/client';
import { getParam } from '../utils/params';

const router = Router();

const completeSchema = z.object({
  rootCause: z.string().min(1),
  correctiveActions: z.string().min(1),
  preventiveActions: z.string().optional(),
  resolutionNotes: z.string().optional(),
  observerSignature: z.string().optional(),
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await jsoService.list({
      page,
      limit,
      status: req.query.status as JSOStatus | undefined,
      assignedTo: req.query.assignedTo as string | undefined,
      jsaId: req.query.jsaId as string | undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jso = await jsoService.getById(getParam(req.params, 'id'));
    res.json(jso);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/start', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jso = await jsoService.startWork(getParam(req.params, 'id'), req.user!.userId, req.ip);
    res.json(jso);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/complete', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = completeSchema.parse(req.body);
    const jso = await jsoService.complete(getParam(req.params, 'id'), {
      ...data,
      userId: req.user!.userId,
      ipAddress: req.ip,
    });
    res.json(jso);
  } catch (err) {
    next(err);
  }
});

export default router;
