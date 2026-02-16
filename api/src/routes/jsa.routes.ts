import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { jsaService } from '../services/jsa.service';
import { authenticate, authorize } from '../middleware/auth';
import { JSAStatus } from '@prisma/client';
import { getParam } from '../utils/params';

const router = Router();

const createJSASchema = z.object({
  jobType: z.string().min(1),
  location: z.string().min(1),
  businessUnit: z.string().min(1),
  dateOfWork: z.string(),
  workOrder: z.string().optional(),
  crewMembers: z.array(z.string()).default([]),
  jobDescription: z.string().min(1),
  additionalNotes: z.string().optional(),
  hazards: z.array(z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    details: z.string().optional(),
    lotoRequired: z.boolean().optional(),
    lotoVerified: z.boolean().optional(),
    lotoNumber: z.string().optional(),
    mitigations: z.array(z.object({
      description: z.string().min(1),
      notes: z.string().optional(),
      isCustom: z.boolean().optional(),
    })).optional(),
  })).optional(),
  ppeChecklist: z.array(z.object({
    ppeType: z.string().min(1),
    label: z.string().min(1),
    isChecked: z.boolean(),
    isRequired: z.boolean(),
    notes: z.string().optional(),
  })).optional(),
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await jsaService.list({
      page,
      limit,
      status: req.query.status as JSAStatus | undefined,
      jobType: req.query.jobType as string | undefined,
      businessUnit: req.query.businessUnit as string | undefined,
      createdBy: req.query.createdBy as string | undefined,
      strengthScoreMin: req.query.strengthScoreMin ? parseInt(req.query.strengthScoreMin as string) : undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      sort: req.query.sort as string | undefined,
      order: (req.query.order as 'asc' | 'desc') || 'desc',
      userId: req.user!.userId,
      userRole: req.user!.role,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jsa = await jsaService.getById(getParam(req.params, 'id'));
    res.json(jsa);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createJSASchema.parse(req.body);
    const jsa = await jsaService.create({
      ...data,
      userId: req.user!.userId,
      ipAddress: req.ip,
    });
    res.status(201).json(jsa);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jsa = await jsaService.update(getParam(req.params, 'id'), req.body, req.user!.userId, req.ip);
    res.json(jsa);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/submit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jsa = await jsaService.submit(getParam(req.params, 'id'), req.user!.userId, req.ip);
    res.json(jsa);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { comments } = req.body;
    const jsa = await jsaService.approve(getParam(req.params, 'id'), req.user!.userId, comments, req.ip);
    res.json(jsa);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reject', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { comments } = req.body;
    const jsa = await jsaService.reject(getParam(req.params, 'id'), req.user!.userId, comments, req.ip);
    res.json(jsa);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/close', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jsa = await jsaService.close(getParam(req.params, 'id'), req.user!.userId, req.ip);
    res.json(jsa);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/signature', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { signatureData } = req.body;
    if (!signatureData) {
      res.status(400).json({ error: { message: 'signatureData required' } });
      return;
    }
    const jsa = await jsaService.addSignature(getParam(req.params, 'id'), signatureData, req.user!.userId);
    res.json(jsa);
  } catch (err) {
    next(err);
  }
});

export default router;
