import { Router, Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await reportService.getDashboard();
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
});

router.get('/strength-trends', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'weekly' | 'monthly') || 'monthly';
    const months = parseInt(req.query.months as string) || 6;
    const trends = await reportService.getStrengthScoreTrends(period, months);
    res.json(trends);
  } catch (err) {
    next(err);
  }
});

router.get('/export/jsas', authenticate, authorize('SUPERVISOR', 'HSE', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as 'json' | 'csv') || 'json';
    const result = await reportService.exportJSAs(format, {
      status: req.query.status as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=jsas-export.csv');
      res.send(result);
    } else {
      res.json(result);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
