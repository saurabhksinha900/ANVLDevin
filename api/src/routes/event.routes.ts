import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { eventService } from '../services/event.service';
import { authenticate, authorize } from '../middleware/auth';
import { EventType, EventStatus } from '@prisma/client';
import { getParam } from '../utils/params';

const router = Router();

const flagSchema = z.object({
  jsaId: z.string().uuid(),
  flagType: z.enum(['ASSISTANCE', 'CONCERN', 'INFORMATION']),
  reason: z.string().min(1),
  severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).optional(),
});

const stopJobSchema = z.object({
  jsaId: z.string().uuid(),
  reason: z.string().min(1),
  severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']),
});

const resolveSchema = z.object({
  resolutionNotes: z.string().min(1),
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await eventService.listAll({
      page,
      limit,
      eventType: req.query.eventType as EventType | undefined,
      status: req.query.status as EventStatus | undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/jsa/:jsaId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await eventService.listByJSA(getParam(req.params, 'jsaId'));
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.post('/flag', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = flagSchema.parse(req.body);
    const event = await eventService.createFlag({
      ...data,
      userId: req.user!.userId,
      ipAddress: req.ip,
    });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

router.post('/stop-job', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = stopJobSchema.parse(req.body);
    const result = await eventService.createStopJob({
      ...data,
      userId: req.user!.userId,
      ipAddress: req.ip,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/resolve', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = resolveSchema.parse(req.body);
    const event = await eventService.resolveEvent(getParam(req.params, 'id'), {
      ...data,
      userId: req.user!.userId,
      ipAddress: req.ip,
    });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

export default router;
