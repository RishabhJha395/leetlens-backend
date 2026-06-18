import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  user: mongoose.Types.ObjectId;
  type: 'daily' | 'weekly' | 'monthly';
  targetProblems: number;
  completedProblems: number;
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    targetProblems: {
      type: Number,
      required: true,
      min: 1,
    },
    completedProblems: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to check if completed
GoalSchema.pre<IGoal>('save', async function () {
  if (this.completedProblems >= this.targetProblems) {
    this.isCompleted = true;
  }
});

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
