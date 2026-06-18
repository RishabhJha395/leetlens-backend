import mongoose, { Schema, Document } from 'mongoose';

export interface ISnapshot extends Document {
  user: mongoose.Types.ObjectId;
  date: Date;
  contestRating: number;
  problemsSolved: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
  };
  acceptanceRate: number;
  currentStreak: number;
  longestStreak: number;
  topicStatistics: {
    topic: string;
    solved: number;
  }[];
  aiProfileScore: number;
  growthScore: number;
  consistencyScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const SnapshotSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    contestRating: { type: Number, default: 0 },
    problemsSolved: {
      total: { type: Number, default: 0 },
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    acceptanceRate: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    topicStatistics: [
      {
        topic: String,
        solved: Number,
      }
    ],
    aiProfileScore: { type: Number, default: 0 },
    growthScore: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure we only have one snapshot per user per day
SnapshotSchema.index({ user: 1, date: 1 }, { unique: true });

export const Snapshot = mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);
