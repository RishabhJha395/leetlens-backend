import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSnapshot extends Document {
  user: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  problemsSolved: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
  };
  contestRating: number;
  globalRanking: number;
  reputation: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSnapshotSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    problemsSolved: {
      total: { type: Number, default: 0 },
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    contestRating: {
      type: Number,
      default: 0,
    },
    globalRanking: {
      type: Number,
      default: 0,
    },
    reputation: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user only has one snapshot per day
UserSnapshotSchema.index({ user: 1, date: 1 }, { unique: true });

export const UserSnapshot = mongoose.model<IUserSnapshot>('UserSnapshot', UserSnapshotSchema);
