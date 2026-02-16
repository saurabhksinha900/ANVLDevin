import { Router, Request, Response } from 'express';
import { HAZARD_CATALOG, PPE_CATALOG, JOB_TYPES, BUSINESS_UNITS } from '../rules/hazardConfig';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/hazards', authenticate, (_req: Request, res: Response) => {
  res.json(HAZARD_CATALOG);
});

router.get('/ppe', authenticate, (_req: Request, res: Response) => {
  res.json(PPE_CATALOG);
});

router.get('/job-types', authenticate, (_req: Request, res: Response) => {
  res.json(JOB_TYPES);
});

router.get('/business-units', authenticate, (_req: Request, res: Response) => {
  res.json(BUSINESS_UNITS);
});

export default router;
