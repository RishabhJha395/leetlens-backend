import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { User } from '../models/User';
import { AIAnalysis } from '../models/AIAnalysis';
import { Snapshot } from '../models/Snapshot';

export class ReportService {
  static async generatePDFReport(userId: string, res: Response) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const latestAI = await AIAnalysis.findOne({ user: userId }).sort('-createdAt');
    const latestSnapshot = await Snapshot.findOne({ user: userId }).sort('-createdAt');

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=LeetLens-Report-${user.leetcodeUsername}.pdf`);

    doc.pipe(res);

    // Title
    doc.fontSize(24).fillColor('#3b82f6').text('LeetLens Performance Report', { align: 'center' });
    doc.moveDown();

    // Profile Info
    doc.fontSize(16).fillColor('#1e293b').text('User Profile');
    doc.fontSize(12).fillColor('#475569')
      .text(`Name: ${user.name}`)
      .text(`LeetCode Username: ${user.leetcodeUsername}`)
      .text(`Generated On: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Snapshot Info
    if (latestSnapshot) {
      doc.fontSize(16).fillColor('#1e293b').text('Current Statistics');
      doc.fontSize(12).fillColor('#475569')
        .text(`Contest Rating: ${latestSnapshot.contestRating}`)
        .text(`Total Solved: ${latestSnapshot.problemsSolved.total}`)
        .text(`Hard Problems: ${latestSnapshot.problemsSolved.hard}`);
      doc.moveDown();
    }

    // AI Summary
    if (latestAI) {
      doc.fontSize(16).fillColor('#1e293b').text('AI Assessment Summary');
      doc.fontSize(12).fillColor('#475569').text(latestAI.summary);
      doc.moveDown();
    }

    // Footer
    doc.fontSize(10).fillColor('#94a3b8').text('Generated automatically by LeetLens AI Pipeline.', {
      align: 'center',
      lineBreak: false
    });

    doc.end();
  }
}
