import mongoose, { Schema, Document } from 'mongoose';

export interface IAIAnalysis extends Document {
  user: mongoose.Types.ObjectId;
  summary: string;
  promptVersion: string;
  geminiResponse: any; // Raw JSON response from Gemini
  profileScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const AIAnalysisSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
    },
    promptVersion: {
      type: String,
      required: true,
    },
    geminiResponse: {
      type: Schema.Types.Mixed,
      required: true,
    },
    profileScore: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const AIAnalysis = mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema);
