import { Request, Response, NextFunction } from 'express';
import { AIAnalysis } from '../models/AIAnalysis';
import { AppError } from '../utils/AppError';
import { generateAIInsights } from '../services/ai.service';

export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileData } = req.body;
    
    if (!profileData) {
      return next(new AppError('Profile data is required', 400));
    }

    const prompt = `
      You are an expert technical interviewer and career coach.
      Analyze the following LeetCode profile data and provide a strictly formatted JSON response.
      Do not include markdown blocks, just return raw JSON matching this exact structure:
      {
        "summary": {
          "profileScore": number (0-100),
          "growthScore": number (0-100),
          "consistencyScore": number (0-100),
          "accuracyScore": number (0-100)
        },
        "aiInsights": {
          "overallAssessment": "string (2-3 sentences)",
          "profileSummary": "string (2-3 sentences)",
          "learningRoadmap": {
            "week1": ["string", "string"],
            "week2": ["string", "string"],
            "week3": ["string", "string"],
            "week4": ["string", "string"]
          },
          "dailyGoals": ["string", "string", "string"],
          "resumeReadiness": "string (1-2 sentences)",
          "interviewReadiness": "string (1-2 sentences)",
          "strengthAnalysis": "string (2-3 sentences)",
          "weaknessAnalysis": "string (2-3 sentences)",
          "topicExpertise": "string (2-3 sentences analyzing their topic distribution)",
          "contestAdvice": ["string", "string"],
          "futurePrediction": "string (1 sentence)"
        }
      }

      Profile Data:
      ${JSON.stringify(profileData, null, 2)}
    `;

    const responseText = await generateAIInsights(prompt);
    
    let parsedData;
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      parsedData = JSON.parse(match[0]);
    } else {
      parsedData = JSON.parse(responseText.trim());
    }

    res.status(200).json({ status: 'success', data: parsedData });
  } catch (error: any) {
    // Return a graceful fallback instead of crashing or throwing 500
    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          profileScore: 50,
          growthScore: 50,
          consistencyScore: 50,
          accuracyScore: 50
        },
        aiInsights: {
          overallAssessment: `Could not fetch AI insights: ${error.message}`,
          profileSummary: "Please check your OpenRouter API key and model configuration in the server environment variables.",
          learningRoadmap: {
            week1: ["Practice Easy problems"],
            week2: ["Move to Medium problems"],
            week3: ["Learn Graph Algorithms"],
            week4: ["Participate in Contests"]
          },
          dailyGoals: ["Solve 1 problem a day"],
          resumeReadiness: "Not available",
          interviewReadiness: "Not available",
          strengthAnalysis: "Not available",
          weaknessAnalysis: "Not available",
          topicExpertise: "Not available",
          contestAdvice: ["Keep participating!"],
          futurePrediction: "You'll do great!"
        }
      }
    });
  }
};

export const saveAIReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { summary, promptVersion, geminiResponse, profileScore } = req.body;

    const newReport = await AIAnalysis.create({
      user: req.user.id,
      summary,
      promptVersion,
      geminiResponse,
      profileScore
    });

    res.status(201).json({ status: 'success', data: newReport });
  } catch (error) {
    next(error);
  }
};

export const getAIReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await AIAnalysis.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ status: 'success', count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
};

export const getLatestAIReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await AIAnalysis.findOne({ user: req.user.id }).sort('-createdAt');
    
    if (!report) {
      return res.status(200).json({ status: 'success', data: null });
    }

    res.status(200).json({ status: 'success', data: report });
  } catch (error) {
    next(error);
  }
};
