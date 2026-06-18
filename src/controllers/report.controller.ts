import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ReportService.generatePDFReport(req.user.id, res);
  } catch (error) {
    next(error);
  }
};
